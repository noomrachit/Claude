import { useEffect, useRef, type ReactNode } from 'react'
import { t } from '@/lib/strings'

interface ModalProps {
  title: string
  onClose: () => void
  wide?: boolean
  children: ReactNode
}

/** Accessible modal built on the native <dialog>: focus trap, Esc to close, backdrop click to close. */
export function Modal({ title, onClose, wide, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    // No close() on cleanup: it would fire a late `close` event (StrictMode remount) and dismiss the modal.
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className={`m-auto max-h-[90dvh] w-[calc(100%-2rem)] ${wide ? 'max-w-2xl' : 'max-w-md'} overflow-y-auto rounded-lg bg-white p-0 text-slate-900 shadow-xl backdrop:bg-black/50 dark:bg-slate-800 dark:text-slate-100`}
    >
      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button type="button" onClick={onClose} aria-label={t.common.close} className="text-slate-500 hover:text-slate-900 dark:hover:text-white">
            ✕
          </button>
        </div>
        {children}
      </div>
    </dialog>
  )
}
