import { btnClass, inputClass } from '@/components/ui'
import { dateInputToIso, dueStatus, isoToDateInput } from '@/lib/dates'
import { t } from '@/lib/strings'
import { Section } from './Section'

interface Props {
  value: string | null
  canEdit: boolean
  onChange: (iso: string | null) => void
}

export function DueDateSection({ value, canEdit, onChange }: Props) {
  const status = value ? dueStatus(value) : null
  return (
    <Section title={t.detail.dueDate}>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="date"
          className={`${inputClass} w-auto`}
          value={isoToDateInput(value)}
          disabled={!canEdit}
          aria-label={t.detail.dueDate}
          onChange={(e) => onChange(dateInputToIso(e.target.value))}
        />
        {canEdit && value && <button type="button" className={btnClass} onClick={() => onChange(null)}>{t.detail.clearDate}</button>}
        {status === 'overdue' && <span className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">{t.detail.overdue}</span>}
        {status === 'today' && <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-950 dark:text-amber-300">{t.detail.today}</span>}
      </div>
    </Section>
  )
}
