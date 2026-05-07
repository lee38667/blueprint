// Network Retry Utility with Exponential Backoff

interface RetryOptions {
  maxRetries?: number
  initialDelay?: number
  maxDelay?: number
  backoffMultiplier?: number
  retryableErrors?: string[]
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
  retryableErrors: ['ETIMEDOUT', 'ECONNRESET', 'ENOTFOUND', 'ECONNREFUSED', 'Network request failed']
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  let lastError: any
  
  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error
      
      // Check if error is retryable
      const isRetryable = opts.retryableErrors.some(err => 
        error?.message?.includes(err) || 
        error?.code?.includes(err) ||
        error?.name?.includes(err)
      )
      
      // Don't retry on last attempt or if error is not retryable
      if (attempt === opts.maxRetries || !isRetryable) {
        throw error
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        opts.initialDelay * Math.pow(opts.backoffMultiplier, attempt),
        opts.maxDelay
      )
      
      console.log(`Retry attempt ${attempt + 1}/${opts.maxRetries} after ${delay}ms...`)
      await sleep(delay)
    }
  }
  
  throw lastError
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Helper for Supabase queries
export async function supabaseWithRetry<T>(
  queryFn: () => PromiseLike<{ data: T | null; error: any }>,
  options?: RetryOptions
): Promise<{ data: T | null; error: any }> {
  return withRetry(async () => {
    const result = await queryFn()
    
    // Throw on Supabase error so retry logic kicks in
    if (result.error) {
      throw new Error(result.error.message || 'Supabase query failed')
    }
    
    return result
  }, options)
}
