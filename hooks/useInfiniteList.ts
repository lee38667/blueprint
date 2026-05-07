import { useEffect, useMemo, useRef, useState } from 'react'

interface Options<T> {
  initialCount?: number
  increment?: number
  items: T[]
}

export function useInfiniteList<T>({ items, initialCount = 8, increment = 6 }: Options<T>) {
  const [visibleCount, setVisibleCount] = useState(initialCount)
  const loaderRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setVisibleCount(initialCount)
  }, [initialCount, items.length])

  useEffect(() => {
    const node = loaderRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0]
        if (first?.isIntersecting) {
          setVisibleCount((current) => Math.min(items.length, current + increment))
        }
      },
      { rootMargin: '200px 0px' }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [increment, items.length])

  const visibleItems = useMemo(() => items.slice(0, visibleCount), [items, visibleCount])
  const canLoadMore = visibleCount < items.length

  return {
    visibleItems,
    visibleCount,
    canLoadMore,
    loaderRef,
    loadMore: () => setVisibleCount((current) => Math.min(items.length, current + increment)),
  }
}

export default useInfiniteList
