import { useEffect, useRef } from 'react'

export const useInfiniteScroll = (callback, hasMore) => {
  const ref = useRef(null)

  useEffect(() => {
    if (!hasMore) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) callback() },
      { threshold: 0.1 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [callback, hasMore])

  return ref
}
