/**
 * Webhook Security Utilities
 * Prevents SSRF attacks by validating webhook URLs
 */

/**
 * Validates webhook URL to prevent SSRF attacks
 * Blocks private IPs, localhost, and non-standard ports
 */
export function validateWebhookUrl(url: string): { valid: boolean; error?: string } {
  try {
    const parsed = new URL(url)

    // Only allow HTTP/HTTPS
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: "Only HTTP/HTTPS protocols are allowed" }
    }

    // Block private IP ranges
    const hostname = parsed.hostname
    const privateRanges = [
      /^127\./,                    // 127.0.0.0/8
      /^10\./,                     // 10.0.0.0/8
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
      /^192\.168\./,               // 192.168.0.0/16
      /^169\.254\./,               // 169.254.0.0/16 (AWS metadata)
      /^::1$/,                     // IPv6 localhost
      /^fc00:/,                    // IPv6 private
      /^fe80:/,                    // IPv6 link-local
    ]

    // Block localhost
    if (hostname === 'localhost' || hostname === '0.0.0.0' || hostname === '[::]') {
      return { valid: false, error: "Localhost addresses are not allowed" }
    }

    // Check against private ranges
    if (privateRanges.some(regex => regex.test(hostname))) {
      return { valid: false, error: "Private IP addresses are not allowed" }
    }

    // Block non-standard ports (allow 80, 443, 8080 only)
    const port = parsed.port ? parseInt(parsed.port) : (parsed.protocol === 'https:' ? 443 : 80)
    if (![80, 443, 8080].includes(port)) {
      return { valid: false, error: "Only ports 80, 443, and 8080 are allowed" }
    }

    return { valid: true }
  } catch (error) {
    return { valid: false, error: "Invalid URL format" }
  }
}
