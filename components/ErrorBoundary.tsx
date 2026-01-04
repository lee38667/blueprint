import React, { ReactNode } from 'react'
import Card from './Card'
import Button from './Button'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends React.Component<Props, State> {
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

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white p-4">
          <Card title="Something went wrong" className="max-w-md">
            <div className="space-y-4">
              <p className="text-sm text-neutral-300">
                An unexpected error occurred. The page has been refreshed.
              </p>
              <div className="bg-red-900/20 border border-red-800 rounded p-3">
                <p className="text-xs font-mono text-red-400 break-all">
                  {this.state.error?.message || 'Unknown error'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  onClick={() => window.location.reload()}
                  className="flex-1 text-xs"
                >
                  Reload Page
                </Button>
                <Button
                  onClick={() => window.location.href = '/dashboard'}
                  className="flex-1 text-xs"
                >
                  Go Home
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
