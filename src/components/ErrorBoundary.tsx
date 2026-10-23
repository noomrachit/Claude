import { Component, type ErrorInfo, type ReactNode } from 'react'
import { btnPrimaryClass } from './ui'
import { t } from '@/lib/strings'

interface State {
  failed: boolean
}

/** Last-resort screen so a rendering bug never leaves a blank page. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <main role="alert" className="grid min-h-screen place-items-center p-6 text-center">
        <div className="space-y-3">
          <p className="font-medium">{t.crash.title}</p>
          <button type="button" className={btnPrimaryClass} onClick={() => window.location.reload()}>{t.crash.reload}</button>
        </div>
      </main>
    )
  }
}
