import { useEffect, useMemo } from 'react'
import { InlineTitle } from '@/components/InlineTitle'
import { Modal } from '@/components/Modal'
import { positionAfter, type BoardContent } from '@/features/boards/boardContent'
import { useAuth } from '@/features/auth/useAuth'
import { useCardDetailMutations } from './cardMutations'
import { AssigneesSection, type MemberOption } from './detail/AssigneesSection'
import { AttachmentsSection } from './detail/AttachmentsSection'
import { ChecklistSection } from './detail/ChecklistSection'
import { CommentsSection } from './detail/CommentsSection'
import { DescriptionSection } from './detail/DescriptionSection'
import { DueDateSection } from './detail/DueDateSection'
import { LabelsSection } from './detail/LabelsSection'

interface Props {
  boardId: string
  cardId: string
  content: BoardContent
  members: MemberOption[]
  canEdit: boolean
  isOwner: boolean
  onClose: () => void
  onError: () => void
}

export function CardDetailModal({ boardId, cardId, content, members, canEdit, isOwner, onClose, onError }: Props) {
  const { user } = useAuth()
  const m = useCardDetailMutations(boardId, onError)
  const card = content.cards.find((c) => c.id === cardId)

  // The card may vanish while open (deleted here or elsewhere).
  useEffect(() => {
    if (!card) onClose()
  }, [card, onClose])

  const labelIds = useMemo(() => new Set(content.cardLabels.filter((x) => x.card_id === cardId).map((x) => x.label_id)), [content.cardLabels, cardId])
  const assigneeIds = useMemo(() => new Set(content.cardAssignees.filter((x) => x.card_id === cardId).map((x) => x.user_id)), [content.cardAssignees, cardId])
  const items = useMemo(() => content.checklistItems.filter((x) => x.card_id === cardId), [content.checklistItems, cardId])

  if (!card) return null

  return (
    <Modal title={card.title} onClose={onClose} wide>
      <div className="space-y-5">
        <InlineTitle value={card.title} canEdit={canEdit} onSave={(title) => m.renameCard.mutate({ id: card.id, title })} className="text-base font-medium" />
        <DescriptionSection key={card.id} value={card.description} canEdit={canEdit} onSave={(description) => m.setDescription.mutate({ id: card.id, description })} />
        <DueDateSection value={card.due_date} canEdit={canEdit} onChange={(due_date) => m.setDueDate.mutate({ id: card.id, due_date })} />
        <LabelsSection
          labels={content.labels}
          selected={labelIds}
          canEdit={canEdit}
          onToggle={(labelId, on) => m.toggleLabel.mutate({ cardId, labelId, on })}
          onCreate={(name, color) => m.addLabel.mutate({ id: crypto.randomUUID(), name, color })}
          onDelete={(id) => m.deleteLabel.mutate({ id })}
        />
        <AssigneesSection members={members} selected={assigneeIds} canEdit={canEdit} onToggle={(userId, on) => m.toggleAssignee.mutate({ cardId, userId, on })} />
        <ChecklistSection
          items={items}
          canEdit={canEdit}
          onAdd={(text) => m.addChecklistItem.mutate({ id: crypto.randomUUID(), cardId, content: text, position: positionAfter(items) })}
          onToggle={(id, done) => m.toggleChecklistItem.mutate({ id, done })}
          onDelete={(id) => m.deleteChecklistItem.mutate({ id })}
        />
        <AttachmentsSection boardId={boardId} cardId={cardId} canEdit={canEdit} isOwner={isOwner} userId={user?.id} />
        <CommentsSection boardId={boardId} cardId={cardId} canEdit={canEdit} isOwner={isOwner} userId={user?.id} members={members} />
      </div>
    </Modal>
  )
}
