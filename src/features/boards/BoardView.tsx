import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  pointerWithin,
  TouchSensor,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { horizontalListSortingStrategy, SortableContext, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AddItemForm } from '@/components/AddItemForm'
import { EmptyState } from '@/components/EmptyState'
import { ErrorBanner } from '@/components/ErrorBanner'
import { Spinner } from '@/components/Spinner'
import { FilterBar } from '@/features/filters/FilterBar'
import { matchingCardIds, parseFilters, writeFilters, type Filters } from '@/features/filters/filterCards'
import { useBoardRealtime } from '@/features/realtime/useBoardRealtime'
import { CardDetailModal } from '@/features/cards/CardDetailModal'
import { buildCardMeta } from '@/features/cards/cardMeta'
import { CardView } from '@/features/cards/CardTile'
import { ListColumn, ListOverlay } from '@/features/lists/ListColumn'
import { t } from '@/lib/strings'
import { positionAfter, useBoardContent, useBoardMutations } from './boardContent'
import { useMembers } from './hooks'
import {
  buildColumns,
  findContainer,
  moveCardAcrossColumns,
  resolveCardDrop,
  resolveListDrop,
  type Columns,
} from './dnd'

/** Cards: prefer the card under the pointer, then the list under it; lists: closest list only. */
const collisionDetection: CollisionDetection = (args) => {
  const type = args.active.data.current?.type
  const ofType = (kind: string) => args.droppableContainers.filter((c) => c.data.current?.type === kind)

  if (type === 'list') return closestCorners({ ...args, droppableContainers: ofType('list') })

  const overCards = pointerWithin({ ...args, droppableContainers: ofType('card') })
  if (overCards.length) return overCards
  const overLists = pointerWithin({ ...args, droppableContainers: ofType('list') })
  if (overLists.length) return overLists
  return closestCorners(args)
}

interface Props {
  boardId: string
  canEdit: boolean
  isOwner: boolean
}

export function BoardView({ boardId, canEdit, isOwner }: Props) {
  const { data, isPending, isError, refetch } = useBoardContent(boardId)
  const members = useMembers(boardId)
  const realtime = useBoardRealtime(boardId)
  const [params, setParams] = useSearchParams()
  const openCardId = params.get('card')
  const closeCard = useCallback(() => setParams((p) => { p.delete('card'); return p }, { replace: true }), [setParams])
  const [failed, setFailed] = useState(false)
  const m = useBoardMutations(boardId, () => setFailed(true))

  // While a card is being dragged we preview moves in local state and only commit on drop.
  const [dragColumns, setDragColumns] = useState<Columns | null>(null)
  const [origin, setOrigin] = useState<{ listId: string; index: number } | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeType, setActiveType] = useState<'card' | 'list' | null>(null)

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const lists = useMemo(() => data?.lists ?? [], [data?.lists])
  const savedColumns = useMemo(() => buildColumns(lists, data?.cards ?? []), [lists, data?.cards])
  const columns = dragColumns ?? savedColumns

  const memberOptions = useMemo(
    () => (members.data ?? []).map((mem) => ({ id: mem.user_id, name: mem.profiles?.display_name || mem.profiles?.email || t.detail.unknownUser })),
    [members.data],
  )
  const metaByCard = useMemo(
    () => (data ? buildCardMeta(data, new Map(memberOptions.map((o) => [o.id, o.name]))) : new Map()),
    [data, memberOptions],
  )

  const filters = useMemo(() => parseFilters(params), [params])
  const setFilters = useCallback(
    (next: Filters) => setParams((p) => writeFilters(p, next), { replace: true }),
    [setParams],
  )
  const visibleIds = useMemo(() => (data ? matchingCardIds(data.cards, metaByCard, filters) : null), [data, metaByCard, filters])
  const filtering = visibleIds !== null
  // Reordering while some cards are hidden would be confusing, so dragging pauses during a search.
  const dragEnabled = canEdit && !filtering

  if (isPending) return <Spinner />
  if (isError) return <ErrorBanner message={t.cards.loadError} onRetry={() => void refetch()} />

  const activeCard = activeType === 'card' && activeId ? Object.values(columns).flat().find((c) => c.id === activeId) : undefined
  const activeList = activeType === 'list' && activeId ? lists.find((l) => l.id === activeId) : undefined

  function reset() {
    setDragColumns(null)
    setOrigin(null)
    setActiveId(null)
    setActiveType(null)
  }

  function onDragStart({ active }: DragStartEvent) {
    const type = active.data.current?.type as 'card' | 'list'
    setActiveId(String(active.id))
    setActiveType(type)
    setFailed(false)
    if (type === 'card') {
      const listId = findContainer(savedColumns, String(active.id))!
      setDragColumns(savedColumns)
      setOrigin({ listId, index: savedColumns[listId].findIndex((c) => c.id === active.id) })
    }
  }

  function onDragOver({ active, over }: DragOverEvent) {
    if (activeType !== 'card' || !over) return
    const activeRect = active.rect.current.translated
    const isBelowOver = Boolean(activeRect && activeRect.top > over.rect.top + over.rect.height / 2)
    setDragColumns((prev) => (prev ? moveCardAcrossColumns(prev, String(active.id), String(over.id), isBelowOver) : prev))
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    const id = String(active.id)
    if (over && activeType === 'list') {
      const position = resolveListDrop(lists, id, String(over.id))
      if (position) m.moveList.mutate({ id, position })
    } else if (over && activeType === 'card' && dragColumns && origin) {
      const drop = resolveCardDrop(dragColumns, origin, id, String(over.id))
      if (drop) m.moveCard.mutate({ id, ...drop })
    }
    reset()
  }

  const addList = (title: string) => m.addList.mutate({ id: crypto.randomUUID(), title, position: positionAfter(lists) })

  if (lists.length === 0 && !canEdit) return <EmptyState title={t.lists.noListsReadOnly} />

  return (
    <div className="space-y-3">
      {realtime === 'offline' && (
        <p role="status" className="rounded-md border border-amber-300 bg-amber-50 p-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          {t.boards.offline}
        </p>
      )}
      {failed && (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          <span>{t.cards.saveFailed}</span>
          <button type="button" onClick={() => setFailed(false)} aria-label={t.common.close}>✕</button>
        </div>
      )}
      {lists.length === 0 && <EmptyState title={t.lists.noLists} />}

      {lists.length > 0 && (
        <FilterBar filters={filters} labels={data.labels} members={memberOptions} matchCount={visibleIds ? visibleIds.size : null} onChange={setFilters} />
      )}
      {filtering && canEdit && lists.length > 0 && <p className="text-xs text-slate-500">{t.filters.dragOff}</p>}
      {filtering && visibleIds.size === 0 && <EmptyState title={t.filters.noMatches} />}

      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={reset}
      >
        <div className="flex items-start gap-3 overflow-x-auto pb-4" style={{ maxHeight: 'calc(100dvh - 11rem)' }}>
          <SortableContext items={lists.map((l) => l.id)} strategy={horizontalListSortingStrategy}>
            {lists.map((list) => (
              <ListColumn
                key={list.id}
                list={list}
                cards={(columns[list.id] ?? []).filter((c) => !visibleIds || visibleIds.has(c.id))}
                filtering={filtering}
                dragEnabled={dragEnabled}
                metaByCard={metaByCard}
                canEdit={canEdit}
                onRename={(title) => m.renameList.mutate({ id: list.id, title })}
                onDelete={() => m.deleteList.mutate({ id: list.id })}
                onAddCard={(title) =>
                  m.addCard.mutate({ id: crypto.randomUUID(), listId: list.id, title, position: positionAfter(columns[list.id] ?? []) })
                }
                onOpenCard={(id) => setParams((p) => { p.set('card', id); return p })}
                onDeleteCard={(id) => m.deleteCard.mutate({ id })}
              />
            ))}
          </SortableContext>
          {canEdit && (
            <div className="w-72 shrink-0">
              <AddItemForm label={t.lists.add} placeholder={t.lists.titlePlaceholder} onAdd={addList} />
            </div>
          )}
        </div>
        <DragOverlay>
          {activeCard ? <CardView card={activeCard} meta={metaByCard.get(activeCard.id)} /> : activeList ? <ListOverlay list={activeList} count={columns[activeList.id]?.length ?? 0} /> : null}
        </DragOverlay>
      </DndContext>

      {openCardId && data && (
        <CardDetailModal
          boardId={boardId}
          cardId={openCardId}
          content={data}
          members={memberOptions}
          canEdit={canEdit}
          isOwner={isOwner}
          onClose={closeCard}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  )
}
