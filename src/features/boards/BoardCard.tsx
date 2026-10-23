import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { btnClass, inputClass } from '@/components/ui'
import { t } from '@/lib/strings'
import type { BoardWithRole } from './boardsSelectors'
import { useArchiveBoard, useDeleteBoard, useRenameBoard } from './hooks'
import { isOwner } from './permissions'

export function BoardCard({ board }: { board: BoardWithRole }) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(board.title)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const rename = useRenameBoard()
  const archive = useArchiveBoard()
  const remove = useDeleteBoard()
  const owner = isOwner(board.role)
  const archived = Boolean(board.archived_at)

  function submitRename(e: FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (trimmed && trimmed !== board.title) rename.mutate({ id: board.id, title: trimmed })
    else setTitle(board.title)
    setEditing(false)
  }

  return (
    <li className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      {editing ? (
        <form onSubmit={submitRename} className="flex gap-2">
          <input autoFocus className={inputClass} value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} aria-label={t.common.rename} />
          <button type="submit" className={btnClass}>{t.common.save}</button>
        </form>
      ) : (
        <Link to={`/boards/${board.id}`} className="min-w-0 break-words text-base font-medium hover:underline">
          {board.title}
        </Link>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-300">
          {t.members.roles[board.role]}
        </span>
        {owner && (
          <div className="flex flex-wrap gap-1">
            <button type="button" className={btnClass} onClick={() => setEditing(true)}>{t.common.rename}</button>
            <button type="button" className={btnClass} onClick={() => archive.mutate({ id: board.id, archived: !archived })}>
              {archived ? t.boards.unarchive : t.boards.archive}
            </button>
            <button type="button" className={btnClass} onClick={() => setConfirmDelete(true)}>{t.common.delete}</button>
          </div>
        )}
      </div>
      {confirmDelete && (
        <ConfirmDialog
          title={t.boards.deleteTitle}
          message={t.boards.deleteBody(board.title)}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            setConfirmDelete(false)
            remove.mutate({ id: board.id })
          }}
        />
      )}
    </li>
  )
}
