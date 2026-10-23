import { useState } from 'react'
import { inputClass } from '@/components/ui'
import { t } from '@/lib/strings'
import { Section } from './Section'

interface Props {
  value: string
  canEdit: boolean
  onSave: (value: string) => void
}

export function DescriptionSection({ value, canEdit, onSave }: Props) {
  const [draft, setDraft] = useState(value)
  return (
    <Section title={t.detail.description}>
      <textarea
        className={`${inputClass} min-h-24`}
        value={draft}
        disabled={!canEdit}
        placeholder={t.detail.descriptionPlaceholder}
        aria-label={t.detail.description}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => draft !== value && onSave(draft)}
      />
    </Section>
  )
}
