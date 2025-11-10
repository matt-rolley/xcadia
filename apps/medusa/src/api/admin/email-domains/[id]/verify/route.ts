import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import dns from "dns"
import { promisify } from "util"

const resolveTxt = promisify(dns.resolveTxt)

/**
 * Verify DNS records for email domain
 */
async function verifyDNSRecords(domain: string, expectedRecords: any): Promise<any> {
  const results = {
    spf: { verified: false, found: null as string | null },
    dkim: { verified: false, found: null as string | null },
    dmarc: { verified: false, found: null as string | null },
    verification: { verified: false, found: null as string | null },
  }

  try {
    // Check SPF record (@)
    try {
      const spfRecords = await resolveTxt(domain)
      const spfRecord = spfRecords.flat().find((r) => r.startsWith("v=spf1"))
      if (spfRecord) {
        results.spf.found = spfRecord
        results.spf.verified = spfRecord.includes("xcadia.com")
      }
    } catch (error) {
      // Record not found
    }

    // Check DKIM record (xcadia._domainkey)
    try {
      const dkimRecords = await resolveTxt(`xcadia._domainkey.${domain}`)
      const dkimRecord = dkimRecords.flat().find((r) => r.startsWith("v=DKIM1"))
      if (dkimRecord) {
        results.dkim.found = dkimRecord
        results.dkim.verified = dkimRecord === expectedRecords.dkim.value
      }
    } catch (error) {
      // Record not found
    }

    // Check DMARC record (_dmarc)
    try {
      const dmarcRecords = await resolveTxt(`_dmarc.${domain}`)
      const dmarcRecord = dmarcRecords.flat().find((r) => r.startsWith("v=DMARC1"))
      if (dmarcRecord) {
        results.dmarc.found = dmarcRecord
        results.dmarc.verified = true // Any DMARC record is acceptable
      }
    } catch (error) {
      // Record not found
    }

    // Check verification record (_xcadia-verification)
    try {
      const verificationRecords = await resolveTxt(`_xcadia-verification.${domain}`)
      const verificationRecord = verificationRecords.flat()[0]
      if (verificationRecord) {
        results.verification.found = verificationRecord
        results.verification.verified = verificationRecord === expectedRecords.verification.value
      }
    } catch (error) {
      // Record not found
    }
  } catch (error) {
    console.error("DNS verification error:", error)
  }

  return results
}

/**
 * POST /admin/email-domains/[id]/verify
 * Verify DNS records for email domain
 */
export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const team_id = req.auth_context?.team_id
    const domain_id = req.params.id

    if (!team_id) {
      return res.status(403).json({
        message: "Team context required",
      })
    }

    const emailDomainModuleService = req.scope.resolve("emailDomainModuleService")

    // Verify team ownership
    const domain = await emailDomainModuleService.retrieveEmailDomain(domain_id)
    if (domain.team_id !== team_id) {
      return res.status(403).json({
        message: "Access denied",
      })
    }

    // Verify DNS records
    const verificationResults = await verifyDNSRecords(domain.domain, domain.dns_records)

    // Update DNS records verification status
    const updatedDnsRecords = {
      ...domain.dns_records,
      spf: { ...domain.dns_records.spf, verified: verificationResults.spf.verified },
      dkim: { ...domain.dns_records.dkim, verified: verificationResults.dkim.verified },
      dmarc: { ...domain.dns_records.dmarc, verified: verificationResults.dmarc.verified },
      verification: {
        ...domain.dns_records.verification,
        verified: verificationResults.verification.verified,
      },
    }

    // Check if all records are verified
    const allVerified =
      verificationResults.spf.verified &&
      verificationResults.dkim.verified &&
      verificationResults.dmarc.verified &&
      verificationResults.verification.verified

    // Update domain
    const updatedDomain = await emailDomainModuleService.updateEmailDomains({
      id: domain_id,
      dns_records: updatedDnsRecords,
      verified: allVerified,
      verified_at: allVerified ? new Date() : null,
    })

    // Emit analytics event
    if (allVerified && !domain.verified) {
      const eventBusService = req.scope.resolve("eventBusService")
      await eventBusService.emit("email_domain.verified", {
        team_id,
        domain_id,
        domain: domain.domain,
      })
    }

    return res.json({
      message: allVerified
        ? "Domain verified successfully!"
        : "Some DNS records are not configured correctly",
      domain: updatedDomain,
      verification_results: {
        spf: {
          verified: verificationResults.spf.verified,
          expected: domain.dns_records.spf.value,
          found: verificationResults.spf.found,
        },
        dkim: {
          verified: verificationResults.dkim.verified,
          expected: domain.dns_records.dkim.value,
          found: verificationResults.dkim.found,
        },
        dmarc: {
          verified: verificationResults.dmarc.verified,
          expected: domain.dns_records.dmarc.value,
          found: verificationResults.dmarc.found,
        },
        verification: {
          verified: verificationResults.verification.verified,
          expected: domain.dns_records.verification.value,
          found: verificationResults.verification.found,
        },
      },
      all_verified: allVerified,
    })
  } catch (error: any) {
    console.error("Verify email domain error:", error)
    return res.status(500).json({
      message: "Failed to verify email domain",
      error: error.message,
    })
  }
}
