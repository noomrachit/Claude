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
  const [focused, setFocused] = useState(false)
  const [seen, setSeen] = useState(value)
  // Pull in changes made by others, but never overwrite what the user is typing.
  if (value !== seen) {
    setSeen(value)
    if (!focused) setDraft(value)
  }
  return (
    <Section title={t.detail.description}>
      <textarea
        className={`${inputClass} min-h-24`}
        value={draft}
        disabled={!canEdit}
        placeholder={t.detail.descriptionPlaceholder}
        aria-label={t.detail.description}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false)
          if (draft !== value) onSave(draft)
        }}
      />
    </Section>
  )
}
