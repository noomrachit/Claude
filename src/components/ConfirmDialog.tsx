import { Modal } from './Modal'
import { btnClass, btnDangerClass } from './ui'
import { t } from '@/lib/strings'

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ title, message, confirmLabel = t.common.delete, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="text-sm text-slate-600 dark:text-slate-300">{message}</p>
      <div className="flex justify-end gap-2">
        <button type="button" className={btnClass} onClick={onCancel}>{t.common.cancel}</button>
        <button type="button" className={btnDangerClass} onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </Modal>
  )
}
