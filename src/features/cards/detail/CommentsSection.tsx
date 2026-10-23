import { useState, type FormEvent } from 'react'
import { ErrorBanner } from '@/components/ErrorBanner'
import { Spinner } from '@/components/Spinner'
import { btnPrimaryClass, inputClass } from '@/components/ui'
import { t } from '@/lib/strings'
import { useComments } from '../cardMutations'
import type { MemberOption } from './AssigneesSection'
import { Section } from './Section'

interface Props {
  boardId: string
  cardId: string
  canEdit: boolean
  isOwner: boolean
  userId: string | undefined
  members: MemberOption[]
}

export function CommentsSection({ boardId, cardId, canEdit, isOwner, userId, members }: Props) {
  const { list, add, remove } = useComments(cardId)
  const [body, setBody] = useState('')
  const names = new Map(members.map((m) => [m.id, m.name]))

  function submit(e: FormEvent) {
    e.preventDefault()
    const text = body.trim()
    if (!text) return
    add.mutate({ boardId, body: text }, { onSuccess: () => setBody('') })
  }

  return (
    <Section title={t.detail.comments}>
      {list.isPending ? (
        <Spinner />
      ) : list.isError ? (
        <ErrorBanner message={t.detail.loadFailed} onRetry={() => void list.refetch()} />
      ) : list.data.length === 0 ? (
        <p className="text-xs text-slate-500">{t.detail.noComments}</p>
      ) : (
        <ul className="space-y-2">
          {list.data.map((c) => (
            <li key={c.id} className="rounded-md bg-slate-100 p-2 text-sm dark:bg-slate-700">
              <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                <span>{names.get(c.user_id) ?? t.detail.unknownUser} · {new Date(c.created_at).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                {(c.user_id === userId || isOwner) && (
                  <button type="button" aria-label={t.common.delete} className="hover:text-red-600" onClick={() => remove.mutate(c.id)}>✕</button>
                )}
              </div>
              <p className="whitespace-pre-wrap break-words">{c.body}</p>
            </li>
          ))}
        </ul>
      )}
      {add.isError && <ErrorBanner message={t.errorGeneric} />}
      {canEdit && (
        <form onSubmit={submit} className="space-y-2">
          <textarea className={`${inputClass} min-h-16`} value={body} maxLength={5000} placeholder={t.detail.commentPlaceholder} aria-label={t.detail.commentPlaceholder} onChange={(e) => setBody(e.target.value)} />
          <button type="submit" className={btnPrimaryClass} disabled={add.isPending || !body.trim()}>{t.detail.send}</button>
        </form>
      )}
    </Section>
  )
}
