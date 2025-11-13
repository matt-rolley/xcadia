import { Container, Heading, Button, Input, Textarea, Label, Switch, Badge } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"

type EmailTemplate = {
  id: string
  name: string
  subject: string
  html_content: string
  text_content?: string
  variables?: Record<string, any>
  is_active: boolean
}

const EmailTemplateEditor = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === "new"

  const [template, setTemplate] = useState<EmailTemplate>({
    id: "",
    name: "",
    subject: "",
    html_content: "",
    text_content: "",
    variables: {},
    is_active: true,
  })

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [previewMode, setPreviewMode] = useState<"html" | "text">("html")

  useEffect(() => {
    if (isNew) return

    const fetchTemplate = async () => {
      try {
        const response = await fetch(`/admin/email-templates/${id}`, {
          credentials: "include",
        })
        const data = await response.json()
        setTemplate(data.email_template)
      } catch (error) {
        console.error("Failed to fetch template:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTemplate()
  }, [id, isNew])

  const handleSave = async () => {
    setSaving(true)
    try {
      const url = isNew
        ? "/admin/email-templates"
        : `/admin/email-templates/${id}`

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(template),
      })

      const data = await response.json()

      if (isNew) {
        navigate(`/app/settings/email-templates/${data.email_template.id}`)
      }

      alert("Template saved successfully!")
    } catch (error) {
      console.error("Failed to save template:", error)
      alert("Failed to save template. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleVariableAdd = () => {
    const varName = prompt("Enter variable name (e.g., customer_name):")
    if (!varName) return

    const varType = prompt(
      "Enter variable type (string, number, boolean, date):",
      "string"
    )
    if (!varType) return

    const varDescription = prompt("Enter variable description (optional):")

    setTemplate((prev) => ({
      ...prev,
      variables: {
        ...prev.variables,
        [varName]: {
          type: varType,
          description: varDescription || "",
        },
      },
    }))
  }

  const handleVariableRemove = (varName: string) => {
    setTemplate((prev) => {
      const newVars = { ...prev.variables }
      delete newVars[varName]
      return { ...prev, variables: newVars }
    })
  }

  const insertVariable = (varName: string) => {
    const variable = `{{${varName}}}`
    setTemplate((prev) => ({
      ...prev,
      html_content: prev.html_content + variable,
    }))
  }

  if (loading) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-center py-8">
          <p className="text-ui-fg-subtle">Loading template...</p>
        </div>
      </Container>
    )
  }

  return (
    <Container className="divide-y p-0">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">
            {isNew ? "Create Email Template" : "Edit Email Template"}
          </Heading>
          <p className="text-sm text-ui-fg-subtle mt-1">
            Design email templates with dynamic variables
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => navigate("/app/settings/email-templates")}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            isLoading={saving}
            disabled={!template.name || !template.subject}
          >
            Save Template
          </Button>
        </div>
      </div>

      {/* Template Details */}
      <div className="px-6 py-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Template Name</Label>
            <Input
              id="name"
              placeholder="e.g., portfolio-send, deal-quote"
              value={template.name}
              onChange={(e) =>
                setTemplate((prev) => ({ ...prev, name: e.target.value }))
              }
            />
          </div>
          <div>
            <Label htmlFor="subject">Email Subject</Label>
            <Input
              id="subject"
              placeholder="Enter email subject"
              value={template.subject}
              onChange={(e) =>
                setTemplate((prev) => ({ ...prev, subject: e.target.value }))
              }
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="is_active"
            checked={template.is_active}
            onCheckedChange={(checked) =>
              setTemplate((prev) => ({ ...prev, is_active: checked }))
            }
          />
          <Label htmlFor="is_active">Template is active</Label>
        </div>
      </div>

      {/* Variables Section */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <Heading level="h2">Template Variables</Heading>
            <p className="text-sm text-ui-fg-subtle mt-1">
              Define dynamic variables to use in your template (use{" "}
              <code className="bg-ui-bg-subtle px-1 rounded">
                {"{{variable_name}}"}
              </code>{" "}
              in content)
            </p>
          </div>
          <Button variant="secondary" size="small" onClick={handleVariableAdd}>
            Add Variable
          </Button>
        </div>

        {template.variables && Object.keys(template.variables).length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {Object.entries(template.variables).map(([key, value]: [string, any]) => (
              <div
                key={key}
                className="flex items-center gap-2 px-3 py-2 border border-ui-border-base rounded-lg"
              >
                <Badge
                  size="small"
                  color="blue"
                  className="cursor-pointer"
                  onClick={() => insertVariable(key)}
                  title="Click to insert into HTML content"
                >
                  {key}
                </Badge>
                <span className="text-sm text-ui-fg-subtle">
                  ({value.type})
                </span>
                {value.description && (
                  <span className="text-xs text-ui-fg-subtle">
                    - {value.description}
                  </span>
                )}
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => handleVariableRemove(key)}
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-ui-fg-subtle">
            No variables defined. Click "Add Variable" to create one.
          </p>
        )}
      </div>

      {/* Content Editor */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <Heading level="h2">Template Content</Heading>
          <div className="flex gap-2">
            <Button
              variant={previewMode === "html" ? "primary" : "secondary"}
              size="small"
              onClick={() => setPreviewMode("html")}
            >
              HTML
            </Button>
            <Button
              variant={previewMode === "text" ? "primary" : "secondary"}
              size="small"
              onClick={() => setPreviewMode("text")}
            >
              Plain Text
            </Button>
          </div>
        </div>

        {previewMode === "html" ? (
          <div>
            <Label htmlFor="html_content">HTML Content</Label>
            <Textarea
              id="html_content"
              placeholder="Enter HTML email content with {{variables}}"
              value={template.html_content}
              onChange={(e) =>
                setTemplate((prev) => ({
                  ...prev,
                  html_content: e.target.value,
                }))
              }
              rows={20}
              className="font-mono text-sm"
            />
          </div>
        ) : (
          <div>
            <Label htmlFor="text_content">Plain Text Content (Optional)</Label>
            <Textarea
              id="text_content"
              placeholder="Enter plain text fallback content"
              value={template.text_content || ""}
              onChange={(e) =>
                setTemplate((prev) => ({
                  ...prev,
                  text_content: e.target.value,
                }))
              }
              rows={20}
              className="font-mono text-sm"
            />
          </div>
        )}
      </div>

      {/* Preview Section */}
      <div className="px-6 py-4 bg-ui-bg-subtle">
        <Heading level="h2" className="mb-4">
          Preview
        </Heading>
        <div className="border border-ui-border-base rounded-lg bg-white p-4">
          <div className="mb-4 pb-4 border-b border-ui-border-base">
            <p className="text-sm text-ui-fg-subtle">Subject:</p>
            <p className="font-semibold">{template.subject || "(No subject)"}</p>
          </div>
          {previewMode === "html" ? (
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: template.html_content }}
            />
          ) : (
            <pre className="whitespace-pre-wrap font-sans text-sm">
              {template.text_content || "(No text content)"}
            </pre>
          )}
        </div>
      </div>
    </Container>
  )
}

export default EmailTemplateEditor
