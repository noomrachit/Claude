import { useMemo, useState } from 'react'
import { AppHeader } from '@/components/AppHeader'
import { EmptyState } from '@/components/EmptyState'
import { ErrorBanner } from '@/components/ErrorBanner'
import { McpPanel } from '@/components/McpPanel'
import { Spinner } from '@/components/Spinner'
import { BoardCard } from '@/features/boards/BoardCard'
import { CreateBoardForm } from '@/features/boards/CreateBoardForm'
import { splitBoards } from '@/features/boards/boardsSelectors'
import { useBoards } from '@/features/boards/hooks'
import { useBoardsListRealtime } from '@/features/realtime/useBoardsListRealtime'
import { t } from '@/lib/strings'

type Tab = 'active' | 'archived'

export default function BoardsPage() {
  const { data, isPending, isError, refetch } = useBoards()
  useBoardsListRealtime()
  const [tab, setTab] = useState<Tab>('active')
  const groups = useMemo(() => splitBoards(data ?? []), [data])
  const list = groups[tab]

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-4xl space-y-4 p-4">
        <h1 className="text-xl font-semibold">{t.boards.title}</h1>
        <CreateBoardForm />

        <div role="tablist" className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
          {(['active', 'archived'] as const).map((key) => (
            <button
              key={key}
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={`-mb-px border-b-2 px-3 py-2 text-sm ${tab === key ? 'border-blue-600 font-medium' : 'border-transparent text-slate-500'}`}
            >
              {t.boards[key]} ({groups[key].length})
            </button>
          ))}
        </div>

        {isPending ? (
          <Spinner />
        ) : isError ? (
          <ErrorBanner message={t.boards.loadError} onRetry={() => void refetch()} />
        ) : list.length === 0 ? (
          <EmptyState title={tab === 'active' ? t.boards.emptyActive : t.boards.emptyArchived} />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((b) => <BoardCard key={b.id} board={b} />)}
          </ul>
        )}
        <McpPanel />
      </main>
    </>
  )
}
