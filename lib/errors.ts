import { useToastStore } from './toastStore'

export interface ToastLike {
  error: (message: string) => void
  success: (message: string) => void
  info: (message: string) => void
  warning: (message: string) => void
}

export function extractErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (!error) return fallback
  if (typeof error === 'string') return error
  if (error instanceof Error) return error.message || fallback
  if (typeof (error as any)?.message === 'string') return (error as any).message
  if (typeof (error as any)?.error === 'string') return (error as any).error
  return fallback
}

interface HandleErrorOptions {
  fallback?: string
  toast?: ToastLike
  setError?: (value: string | null) => void
  context?: string
}

export function handleError(error: unknown, options: HandleErrorOptions = {}): string {
  const message = extractErrorMessage(error, options.fallback)
  if (options.setError) options.setError(message)
  if (options.toast) options.toast.error(message)
  if (options.context) {
    console.error(options.context, error)
  } else {
    console.error(error)
  }
  return message
}

export async function withHandledRetry<T>(
  action: () => Promise<T>,
  options: HandleErrorOptions = {}
): Promise<T> {
  try {
    return await action()
  } catch (error) {
    handleError(error, options)
    throw error
  }
}
