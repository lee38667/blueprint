import React from 'react'

interface PaginationProps {
  currentPage: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  maxVisiblePages?: number
}

export default function Pagination({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  maxVisiblePages = 5
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage)

  if (totalPages <= 1) return null

  const getPageNumbers = (): (number | string)[] => {
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const pages: (number | string)[] = []
    const leftOffset = Math.floor((maxVisiblePages - 3) / 2)
    const rightOffset = Math.ceil((maxVisiblePages - 3) / 2)

    if (currentPage <= leftOffset + 2) {
      for (let i = 1; i <= maxVisiblePages - 1; i++) {
        pages.push(i)
      }
      pages.push('...')
      pages.push(totalPages)
    } else if (currentPage >= totalPages - rightOffset - 1) {
      pages.push(1)
      pages.push('...')
      for (let i = totalPages - maxVisiblePages + 2; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)
      pages.push('...')
      for (let i = currentPage - leftOffset; i <= currentPage + rightOffset; i++) {
        pages.push(i)
      }
      pages.push('...')
      pages.push(totalPages)
    }

    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <div
      className="flex items-center justify-between px-4 py-3 sm:px-6 rounded-b-lg"
      style={{ borderTop: '1px solid var(--theme-border)', background: 'var(--theme-surface)' }}
    >
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="btn-outline btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="btn-outline btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>

      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>
            Showing{' '}
            <span className="font-medium" style={{ color: 'var(--theme-text-dim)' }}>
              {(currentPage - 1) * itemsPerPage + 1}
            </span>
            {' '}-{' '}
            <span className="font-medium" style={{ color: 'var(--theme-text-dim)' }}>
              {Math.min(currentPage * itemsPerPage, totalItems)}
            </span>
            {' '}of{' '}
            <span className="font-medium" style={{ color: 'var(--theme-text-dim)' }}>{totalItems}</span>
            {' '}results
          </p>
        </div>

        <nav className="isolate inline-flex -space-x-px rounded-md" aria-label="Pagination">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="relative inline-flex items-center rounded-l-md px-2 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ color: 'var(--theme-text-muted)', border: '1px solid var(--theme-border)' }}
          >
            <span className="sr-only">Previous</span>
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
            </svg>
          </button>

          {pageNumbers.map((page, idx) =>
            typeof page === 'number' ? (
              <button
                key={idx}
                onClick={() => onPageChange(page)}
                aria-current={page === currentPage ? 'page' : undefined}
                className="relative inline-flex items-center px-4 py-2 text-sm font-semibold transition-colors focus:z-20"
                style={{
                  border: '1px solid var(--theme-border)',
                  ...(page === currentPage
                    ? { background: 'var(--theme-accent)', color: 'var(--theme-accent-text)' }
                    : { color: 'var(--theme-text-dim)' }
                  ),
                }}
              >
                {page}
              </button>
            ) : (
              <span
                key={idx}
                className="relative inline-flex items-center px-4 py-2 text-sm font-semibold"
                style={{ color: 'var(--theme-text-muted)', border: '1px solid var(--theme-border)' }}
              >
                {page}
              </span>
            )
          )}

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="relative inline-flex items-center rounded-r-md px-2 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ color: 'var(--theme-text-muted)', border: '1px solid var(--theme-border)' }}
          >
            <span className="sr-only">Next</span>
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
            </svg>
          </button>
        </nav>
      </div>
    </div>
  )
}

// Hook for managing pagination state
export function usePagination(totalItems: number, itemsPerPage: number = 50) {
  const [currentPage, setCurrentPage] = React.useState(1)

  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const nextPage = () => goToPage(currentPage + 1)
  const prevPage = () => goToPage(currentPage - 1)
  const reset = () => setCurrentPage(1)

  return {
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    goToPage,
    nextPage,
    prevPage,
    reset,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1
  }
}
