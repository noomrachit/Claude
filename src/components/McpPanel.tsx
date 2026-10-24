import { useState } from 'react'
import { btnClass } from '@/components/ui'
import { useAuth } from '@/features/auth/useAuth'
import { t } from '@/lib/strings'

const endpoint = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mcp`

/** Collapsible help for connecting an MCP client to the `mcp` Edge Function with the current session token. */
export function McpPanel() {
  const { session } = useAuth()
  const [copied, setCopied] = useState(false)
  if (!session || !import.meta.env.VITE_SUPABASE_URL) return null

  const expires = session.expires_at
    ? new Date(session.expires_at * 1000).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    : null

  async function copy() {
    try {
      await navigator.clipboard.writeText(session!.access_token)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <details className="rounded-lg border border-slate-200 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-800">
      <summary className="cursor-pointer font-medium">{t.mcp.title}</summary>
      <div className="mt-3 space-y-2">
        <p className="text-slate-600 dark:text-slate-300">{t.mcp.intro}</p>
        <p>
          {t.mcp.endpoint}: <code className="break-all rounded bg-slate-100 px-1 dark:bg-slate-700">{endpoint}</code>
        </p>
        <p>{t.mcp.command}:</p>
        <pre className="overflow-x-auto rounded bg-slate-100 p-2 text-xs dark:bg-slate-900">
          {`claude mcp add --transport http kanban ${endpoint} \\\n  --header "Authorization: Bearer <access token>"`}
        </pre>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={btnClass} onClick={() => void copy()}>
            {copied ? t.mcp.copied : t.mcp.copyToken}
          </button>
          {expires && <span className="text-xs text-slate-500">{t.mcp.expires(expires)}</span>}
        </div>
        <p className="text-xs text-amber-700 dark:text-amber-400">{t.mcp.warning}</p>
      </div>
    </details>
  )
}
