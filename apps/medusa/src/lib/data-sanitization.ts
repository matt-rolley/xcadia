/**
 * Data Sanitization Utilities
 * Deep sanitization of sensitive data for GDPR exports and logging
 */

const SENSITIVE_FIELD_PATTERNS = [
  'password', 'password_hash', 'token', 'secret', 'api_key',
  'auth_config', 'auth_token', 'bearer_token', 'access_token',
  'refresh_token', 'session_token', 'verification_token',
  'webhook_secret', 'dkim_private_key', 'private_key',
  'secret_key', 'api_secret', 'client_secret',
]

/**
 * Recursively sanitizes sensitive data from objects
 * Handles nested objects and arrays
 */
export function sanitizeData(obj: any): any {
  if (!obj) return obj
  if (typeof obj !== 'object') return obj

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(sanitizeData)
  }

  // Handle objects
  const sanitized: any = {}

  for (const key of Object.keys(obj)) {
    const lowerKey = key.toLowerCase()

    // Check if key matches sensitive patterns
    if (SENSITIVE_FIELD_PATTERNS.some(pattern => lowerKey.includes(pattern))) {
      sanitized[key] = '***REDACTED***'
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      // Recursively sanitize nested objects/arrays
      sanitized[key] = sanitizeData(obj[key])
    } else {
      sanitized[key] = obj[key]
    }
  }

  return sanitized
}

/**
 * Sanitizes CSV values to prevent formula injection
 * Prefixes dangerous characters with single quote
 */
export function sanitizeCSVValue(value: string): string {
  if (!value) return value

  // Check if value starts with formula prefixes
  if (value.match(/^[=+\-@\t\r]/)) {
    return "'" + value  // Prefix with single quote to disable formula
  }

  return value
}
