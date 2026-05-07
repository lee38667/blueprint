import { cn } from '../lib/utils'

interface SkeletonProps {
  className?: string
}

interface ListSkeletonProps extends SkeletonProps {
  count?: number
  itemClassName?: string
}

interface LineSkeletonProps extends SkeletonProps {
  width?: string
}

export function CardSkeleton({ className }: SkeletonProps) {
  return <div className={cn('card-skeleton w-full h-24', className)} />
}

export function ListSkeleton({ count = 3, className, itemClassName }: ListSkeletonProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className={cn('card-skeleton h-4 w-full', itemClassName)} />
      ))}
    </div>
  )
}

export function LineSkeleton({ width = '100%', className }: LineSkeletonProps) {
  return <div className={cn('card-skeleton h-3', className)} style={{ width }} />
}

export const Skeleton = Object.assign(CardSkeleton, {
  Card: CardSkeleton,
  List: ListSkeleton,
  Line: LineSkeleton
})

export default Skeleton
