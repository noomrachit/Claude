import { useRef, useState } from 'react'
import { ErrorBanner } from '@/components/ErrorBanner'
import { Spinner } from '@/components/Spinner'
import { btnClass } from '@/components/ui'
import { formatBytes } from '@/lib/dates'
import { t } from '@/lib/strings'
import { useAttachments } from '../cardMutations'
import { MAX_ATTACHMENT_BYTES, signedAttachmentUrl } from '../detailApi'
import { Section } from './Section'

interface Props {
  boardId: string
  cardId: string
  canEdit: boolean
  isOwner: boolean
  userId: string | undefined
}

export function AttachmentsSection({ boardId, cardId, canEdit, isOwner, userId }: Props) {
  const { list, upload, remove } = useAttachments(cardId)
  const input = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  function onPick(files: FileList | null) {
    const file = files?.[0]
    if (input.current) input.current.value = ''
    if (!file) return
    if (file.size > MAX_ATTACHMENT_BYTES) return setError(t.detail.tooLarge)
    setError(null)
    upload.mutate({ boardId, file }, { onError: () => setError(t.detail.uploadFailed) })
  }

  async function open(path: string) {
    try {
      const url = await signedAttachmentUrl(path)
      const link = document.createElement('a')
      link.href = url
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      link.click()
    } catch {
      setError(t.detail.openFailed)
    }
  }

  return (
    <Section title={t.detail.attachments}>
      {error && <ErrorBanner message={error} />}
      {list.isPending ? (
        <Spinner />
      ) : list.isError ? (
        <ErrorBanner message={t.detail.loadFailed} onRetry={() => void list.refetch()} />
      ) : list.data.length === 0 ? (
        <p className="text-xs text-slate-500">{t.detail.noAttachments}</p>
      ) : (
        <ul className="divide-y divide-slate-200 dark:divide-slate-700">
          {list.data.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-1.5 text-sm">
              <span className="min-w-0 flex-1 truncate">{a.file_name} <span className="text-xs text-slate-500">({formatBytes(a.size_bytes)})</span></span>
              <span className="flex gap-1">
                <button type="button" className={btnClass} onClick={() => void open(a.storage_path)}>{t.detail.open}</button>
                {canEdit && (a.uploaded_by === userId || isOwner) && (
                  <button type="button" className={btnClass} aria-label={`${t.common.delete}: ${a.file_name}`} onClick={() => remove.mutate({ id: a.id, path: a.storage_path })}>✕</button>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
      {canEdit && (
        <>
          <input ref={input} type="file" className="hidden" aria-label={t.detail.upload} onChange={(e) => onPick(e.target.files)} />
          <button type="button" className={btnClass} disabled={upload.isPending} onClick={() => input.current?.click()}>
            {upload.isPending ? t.detail.uploading : `+ ${t.detail.upload}`}
          </button>
        </>
      )}
    </Section>
  )
}
