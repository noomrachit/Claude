import { useState, type FormEvent } from 'react'
import { ErrorBanner } from '@/components/ErrorBanner'
import { Modal } from '@/components/Modal'
import { Spinner } from '@/components/Spinner'
import { btnClass, btnPrimaryClass, inputClass } from '@/components/ui'
import { useAuth } from '@/features/auth/useAuth'
import { t } from '@/lib/strings'
import type { BoardRole } from '@/types'
import { useInvitations, useMemberMutations, useMembers } from './hooks'
import { isOwner } from './permissions'

interface Props {
  boardId: string
  myRole: BoardRole
  onClose: () => void
  /** Called after the current user leaves the board. */
  onLeft: () => void
}

const assignableRoles: BoardRole[] = ['editor', 'viewer']

export function MembersDialog({ boardId, myRole, onClose, onLeft }: Props) {
  const { user } = useAuth()
  const owner = isOwner(myRole)
  const members = useMembers(boardId)
  const invitations = useInvitations(boardId, owner)
  const { invite, setRole, remove, cancelInvite } = useMemberMutations(boardId)
  const [email, setEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<BoardRole>('editor')
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null)

  function onInvite(e: FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setMessage(null)
    invite.mutate(
      { email, role: inviteRole },
      {
        onSuccess: (result) => {
          setMessage({ text: t.members.result[result], error: false })
          setEmail('')
        },
        onError: (err) => setMessage({ text: err instanceof Error && /invalid email/.test(err.message) ? t.auth.errors.emailInvalid : t.errorGeneric, error: true }),
      },
    )
  }

  const fail = (setRole.isError || remove.isError || cancelInvite.isError) && t.errorGeneric

  return (
    <Modal title={t.members.title} onClose={onClose}>
      {owner && (
        <form onSubmit={onInvite} className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <input
              type="email"
              className={`${inputClass} min-w-0 flex-1`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.members.inviteEmail}
              aria-label={t.members.inviteEmail}
            />
            <select className={`${inputClass} w-auto`} value={inviteRole} onChange={(e) => setInviteRole(e.target.value as BoardRole)} aria-label="role">
              {assignableRoles.map((r) => <option key={r} value={r}>{t.members.roles[r]}</option>)}
            </select>
            <button type="submit" className={btnPrimaryClass} disabled={invite.isPending}>{t.members.invite}</button>
          </div>
          {message && (
            <p role={message.error ? 'alert' : 'status'} className={`text-sm ${message.error ? 'text-red-600' : 'text-green-700 dark:text-green-400'}`}>
              {message.text}
            </p>
          )}
        </form>
      )}

      {fail && <ErrorBanner message={fail} />}

      {members.isPending ? (
        <Spinner />
      ) : members.isError ? (
        <ErrorBanner message={t.members.loadError} onRetry={() => void members.refetch()} />
      ) : (
        <ul className="divide-y divide-slate-200 dark:divide-slate-700">
          {members.data.map((m) => {
            const isMe = m.user_id === user?.id
            const locked = m.role === 'owner'
            return (
              <li key={m.user_id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {m.profiles?.display_name || m.profiles?.email} {isMe && <span className="text-slate-500">{t.members.you}</span>}
                  </p>
                  <p className="truncate text-xs text-slate-500">{m.profiles?.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  {owner && !locked ? (
                    <select
                      className={`${inputClass} w-auto py-1`}
                      value={m.role}
                      onChange={(e) => setRole.mutate({ userId: m.user_id, role: e.target.value as BoardRole })}
                      aria-label={t.members.roles[m.role]}
                    >
                      {assignableRoles.map((r) => <option key={r} value={r}>{t.members.roles[r]}</option>)}
                    </select>
                  ) : (
                    <span className="text-xs text-slate-500">{t.members.roles[m.role]}</span>
                  )}
                  {owner && !locked && (
                    <button type="button" className={btnClass} onClick={() => remove.mutate(m.user_id)}>{t.members.remove}</button>
                  )}
                  {isMe && !locked && (
                    <button type="button" className={btnClass} onClick={() => remove.mutate(m.user_id, { onSuccess: onLeft })}>
                      {t.members.leave}
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {owner && invitations.data && invitations.data.length > 0 && (
        <div className="space-y-1">
          <h3 className="text-sm font-medium">{t.members.pending}</h3>
          <ul className="divide-y divide-slate-200 dark:divide-slate-700">
            {invitations.data.map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                <span className="min-w-0 truncate">{i.email} · {t.members.roles[i.role]}</span>
                <button type="button" className={btnClass} onClick={() => cancelInvite.mutate(i.id)}>{t.members.cancelInvite}</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Modal>
  )
}
