with open('server/connectors/fadded.ts', 'r') as f:
    content = f.read()

marker = '// ─── Category Sync (inferred from products) ────────────────────────────────────'
idx = content.find(marker)
if idx == -1:
    print('ERROR: marker not found')
    exit(1)

extract_fn = '''/**
 * Extract delivery format from Fadded product description.
 * Fadded descriptions often contain pipe-separated format hints like:
 * "Account format | username | passwords | Mail | Mailpassword | Recovery mail"
 */
function extractDeliveryFormat(description: string | null | undefined): string | null {
  if (!description) return null;
  // Strip HTML tags
  const stripped = description.replace(/<[^>]+>/g, " ").replace(/\\s+/g, " ").trim();
  // Look for "Account format | ..." or "Format: ..." or "Number | password | 2FA | Cookies"
  const formatMatch = stripped.match(/(?:account\\s+format\\s*[|:]\\s*|format\\s*[|:]\\s*|delivery\\s+format\\s*[|:]\\s*)([^.\\n<]+)/i);
  if (formatMatch) {
    return formatMatch[1].trim().replace(/\\s*\\|\\s*/g, " : ");
  }
  // Look for pipe-separated credential patterns
  const pipeMatch = stripped.match(/\\b((?:(?:email|password|username|login|mail|2fa|cookie|number|phone|recovery|id|key|token|code)\\s*[|:]\\s*){2,}[a-z0-9 |:]+)/i);
  if (pipeMatch) {
    return pipeMatch[1].trim().replace(/\\s*\\|\\s*/g, " : ").replace(/\\s*:\\s*/g, " : ");
  }
  return null;
}
'''

new_content = content[:idx] + extract_fn + content[idx:]
with open('server/connectors/fadded.ts', 'w') as f:
    f.write(new_content)
print('SUCCESS: extractDeliveryFormat restored')
