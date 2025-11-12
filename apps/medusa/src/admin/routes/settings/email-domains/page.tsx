import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Button, Table, Badge, Label, Input, CodeBlock } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { Trash, CheckCircleSolid, XCircleSolid } from "@medusajs/icons"

type EmailDomain = {
  id: string
  domain: string
  is_verified: boolean
  is_default: boolean
  verification_token: string
  dns_records: {
    spf: { record: string; verified: boolean }
    dkim: { record: string; verified: boolean }
    dmarc: { record: string; verified: boolean }
  }
  created_at: string
}

const EmailDomainsPage = () => {
  const [domains, setDomains] = useState<EmailDomain[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ domain: "" })
  const [selectedDomain, setSelectedDomain] = useState<EmailDomain | null>(null)

  useEffect(() => {
    fetchDomains()
  }, [])

  const fetchDomains = async () => {
    try {
      const response = await fetch("/admin/email-domains", {
        credentials: "include",
      })
      const data = await response.json()
      setDomains(data.domains || [])
    } catch (error) {
      console.error("Failed to fetch domains:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      await fetch("/admin/email-domains", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })
      setShowForm(false)
      setFormData({ domain: "" })
      fetchDomains()
    } catch (error) {
      console.error("Failed to create domain:", error)
    }
  }

  const handleVerify = async (id: string) => {
    try {
      await fetch(`/admin/email-domains/${id}/verify`, {
        method: "POST",
        credentials: "include",
      })
      fetchDomains()
    } catch (error) {
      console.error("Failed to verify domain:", error)
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      await fetch(`/admin/email-domains/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_default: true }),
      })
      fetchDomains()
    } catch (error) {
      console.error("Failed to set default domain:", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this domain?")) return

    try {
      await fetch(`/admin/email-domains/${id}`, {
        method: "DELETE",
        credentials: "include",
      })
      fetchDomains()
    } catch (error) {
      console.error("Failed to delete domain:", error)
    }
  }

  return (
    <Container className="divide-y p-0">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">Email Domains</Heading>
          <p className="text-sm text-ui-fg-subtle mt-1">
            Configure custom email domains for sending emails
          </p>
        </div>
        <Button variant="secondary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Add Domain"}
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="px-6 py-4 bg-ui-bg-subtle">
          <Heading level="h2" className="mb-4">New Email Domain</Heading>
          <div className="space-y-4">
            <div>
              <Label>Domain Name</Label>
              <Input
                placeholder="mail.yourdomain.com"
                value={formData.domain}
                onChange={(e) => setFormData({ domain: e.target.value })}
              />
              <p className="text-xs text-ui-fg-subtle mt-1">
                Enter the domain you want to send emails from
              </p>
            </div>
            <Button onClick={handleCreate}>Add Domain</Button>
          </div>
        </div>
      )}

      {/* Domains List */}
      <div className="px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-ui-fg-subtle">Loading domains...</p>
          </div>
        ) : domains.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <p className="text-ui-fg-subtle mb-4">No email domains configured</p>
          </div>
        ) : (
          <div className="space-y-4">
            {domains.map((domain) => (
              <div
                key={domain.id}
                className="border border-ui-border-base rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Heading level="h3">{domain.domain}</Heading>
                      {domain.is_default && (
                        <Badge size="small" color="blue">Default</Badge>
                      )}
                      <Badge
                        size="small"
                        color={domain.is_verified ? "green" : "orange"}
                      >
                        {domain.is_verified ? "Verified" : "Pending Verification"}
                      </Badge>
                    </div>
                    <p className="text-xs text-ui-fg-subtle mt-1">
                      Added {new Date(domain.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {!domain.is_verified && (
                      <Button
                        size="small"
                        variant="secondary"
                        onClick={() => handleVerify(domain.id)}
                      >
                        Verify DNS
                      </Button>
                    )}
                    {!domain.is_default && domain.is_verified && (
                      <Button
                        size="small"
                        variant="secondary"
                        onClick={() => handleSetDefault(domain.id)}
                      >
                        Set Default
                      </Button>
                    )}
                    <Button
                      size="small"
                      variant="secondary"
                      onClick={() =>
                        setSelectedDomain(selectedDomain?.id === domain.id ? null : domain)
                      }
                    >
                      {selectedDomain?.id === domain.id ? "Hide" : "View"} DNS Records
                    </Button>
                    <Button
                      size="small"
                      variant="danger"
                      onClick={() => handleDelete(domain.id)}
                    >
                      <Trash />
                    </Button>
                  </div>
                </div>

                {/* DNS Records */}
                {selectedDomain?.id === domain.id && (
                  <div className="space-y-4 mt-4 pt-4 border-t border-ui-border-base">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Label>Verification TXT Record</Label>
                        {domain.is_verified ? (
                          <CheckCircleSolid className="text-green-600" />
                        ) : (
                          <XCircleSolid className="text-red-600" />
                        )}
                      </div>
                      <div className="bg-ui-bg-base p-3 rounded font-mono text-xs">
                        <p className="mb-1">Type: TXT</p>
                        <p className="mb-1">Host: _medusa-verify</p>
                        <p>Value: {domain.verification_token}</p>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Label>SPF Record</Label>
                        {domain.dns_records.spf.verified ? (
                          <CheckCircleSolid className="text-green-600" />
                        ) : (
                          <XCircleSolid className="text-red-600" />
                        )}
                      </div>
                      <div className="bg-ui-bg-base p-3 rounded font-mono text-xs">
                        <p className="mb-1">Type: TXT</p>
                        <p className="mb-1">Host: @</p>
                        <p className="break-all">{domain.dns_records.spf.record}</p>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Label>DKIM Record</Label>
                        {domain.dns_records.dkim.verified ? (
                          <CheckCircleSolid className="text-green-600" />
                        ) : (
                          <XCircleSolid className="text-red-600" />
                        )}
                      </div>
                      <div className="bg-ui-bg-base p-3 rounded font-mono text-xs">
                        <p className="mb-1">Type: TXT</p>
                        <p className="mb-1">Host: medusa._domainkey</p>
                        <p className="break-all">{domain.dns_records.dkim.record}</p>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Label>DMARC Record</Label>
                        {domain.dns_records.dmarc.verified ? (
                          <CheckCircleSolid className="text-green-600" />
                        ) : (
                          <XCircleSolid className="text-red-600" />
                        )}
                      </div>
                      <div className="bg-ui-bg-base p-3 rounded font-mono text-xs">
                        <p className="mb-1">Type: TXT</p>
                        <p className="mb-1">Host: _dmarc</p>
                        <p className="break-all">{domain.dns_records.dmarc.record}</p>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded p-3">
                      <p className="text-xs text-blue-800">
                        <strong>Note:</strong> DNS changes can take up to 48 hours to propagate. After
                        adding these records to your DNS provider, click "Verify DNS" to check if they're
                        properly configured.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Email Domains",
})

export default EmailDomainsPage
