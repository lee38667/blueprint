import { ReactNode } from 'react'

type PageWidth = 'default' | 'narrow' | 'wide'

interface PageContainerProps {
  children: ReactNode
  /** default = max-w-7xl (most pages), narrow = max-w-3xl (forms), wide = max-w-(--breakpoint-2xl) */
  width?: PageWidth
  className?: string
}

const widthClass: Record<PageWidth, string> = {
  narrow: 'max-w-3xl',
  default: 'max-w-7xl',
  wide: 'max-w-(--breakpoint-2xl)',
}

/**
 * Standard page shell: centered container with consistent max-width and
 * vertical rhythm. Use on every page so spacing/width stay uniform.
 */
export default function PageContainer({ children, width = 'default', className = '' }: PageContainerProps) {
  return <div className={`${widthClass[width]} mx-auto space-y-6 ${className}`}>{children}</div>
}
