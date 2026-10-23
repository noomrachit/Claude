// Shared Tailwind class strings for form controls and buttons.
export const inputClass =
  'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800'
export const btnClass =
  'rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100 disabled:opacity-50 dark:border-slate-600 dark:hover:bg-slate-800'
export const btnPrimaryClass =
  'rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50'
export const btnDangerClass =
  'rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50'

export const chipClass = (active: boolean) =>
  `inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs ${
    active
      ? 'border-blue-600 bg-blue-600 text-white'
      : 'border-slate-300 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-700'
  }`
