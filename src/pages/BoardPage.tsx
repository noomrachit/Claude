import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AppHeader } from '@/components/AppHeader'
import { EmptyState } from '@/components/EmptyState'
import { ErrorBanner } from '@/components/ErrorBanner'
import { Spinner } from '@/components/Spinner'
import { btnClass } from '@/components/ui'
import { BoardView } from '@/features/boards/BoardView'
import { useBoard } from '@/features/boards/hooks'
import { canEdit, isOwner } from '@/features/boards/permissions'
import { MembersDialog } from '@/features/boards/MembersDialog'
import { t } from '@/lib/strings'

export default function BoardPage() {
  const { boardId = '' } = useParams()
  const navigate = useNavigate()
  const { data: board, isPending, isError, refetch } = useBoard(boardId)
  const [showMembers, setShowMembers] = useState(false)

  return (
    <>
      <AppHeader>
        {board && <span className="min-w-0 truncate text-sm text-slate-600 dark:text-slate-300">/ {board.title}</span>}
      </AppHeader>
      <main className="p-4">
        {isPending ? (
          <Spinner />
        ) : isError ? (
          <ErrorBanner message={t.boards.loadError} onRetry={() => void refetch()} />
        ) : !board ? (
          <EmptyState title={t.boards.notFound}>
            <Link to="/" className="text-blue-600 underline">{t.common.back}</Link>
          </EmptyState>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h1 className="text-xl font-semibold">
                {board.title}
                {!canEdit(board.role) && <span className="ml-2 text-sm font-normal text-slate-500">({t.boards.readOnly})</span>}
              </h1>
              <button type="button" className={btnClass} onClick={() => setShowMembers(true)}>{t.boards.members}</button>
            </div>
            <BoardView boardId={board.id} canEdit={canEdit(board.role)} isOwner={isOwner(board.role)} />
            {showMembers && (
              <MembersDialog
                boardId={board.id}
                myRole={board.role}
                onClose={() => setShowMembers(false)}
                onLeft={() => navigate('/')}
              />
            )}
          </div>
        )}
      </main>
    </>
  )
}
