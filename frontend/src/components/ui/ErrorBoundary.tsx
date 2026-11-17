import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen items-center justify-center bg-background p-4">
          <div className="w-full max-w-md rounded-2xl border border-red-200 bg-surface p-8 text-center shadow-[var(--shadow-pop)] dark:border-red-500/25">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/15">
              <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-foreground">Algo salió mal</h2>
            <p className="mb-6 text-sm text-muted">
              Ha ocurrido un error inesperado. Por favor, intenta de nuevo.
            </p>
            {this.state.error && (
              <pre className="mb-4 max-h-32 overflow-auto rounded-lg bg-surface-muted p-3 text-left text-xs text-muted">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-secondary-strong"
            >
              <RefreshCw className="h-4 w-4" />
              Intentar de nuevo
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
