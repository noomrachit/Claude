import { t } from '@/lib/strings'
import { chipClass } from '@/components/ui'
import { Section } from './Section'

export interface MemberOption {
  id: string
  name: string
}

interface Props {
  members: MemberOption[]
  selected: Set<string>
  canEdit: boolean
  onToggle: (userId: string, on: boolean) => void
}

export function AssigneesSection({ members, selected, canEdit, onToggle }: Props) {
  return (
    <Section title={t.detail.assignees}>
      <div className="flex flex-wrap gap-2">
        {members.map((m) => {
          const on = selected.has(m.id)
          return (
            <button key={m.id} type="button" disabled={!canEdit} aria-pressed={on} onClick={() => onToggle(m.id, !on)} className={chipClass(on)}>
              <span className="grid size-4 place-items-center rounded-full bg-slate-300 text-[10px] text-slate-800">{m.name.slice(0, 1).toUpperCase()}</span>
              {m.name}
            </button>
          )
        })}
      </div>
    </Section>
  )
}
