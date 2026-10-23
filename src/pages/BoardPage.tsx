import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AppHeader } from '@/components/AppHeader'
import { EmptyState } from '@/components/EmptyState'
import { ErrorBanner } from '@/components/ErrorBanner'
import { Spinner } from '@/components/Spinner'
import { btnClass } from '@/components/ui'
import { useBoard } from '@/features/boards/hooks'
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
              <h1 className="text-xl font-semibold">{board.title}</h1>
              <button type="button" className={btnClass} onClick={() => setShowMembers(true)}>{t.boards.members}</button>
            </div>
            <EmptyState title={t.boards.listsComingSoon} />
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
