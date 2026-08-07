import { useState } from 'react'
import { cn } from '@renderer/lib/utils'

// A failed image load degrades to a placeholder, not a broken page/card —
// see docs/decisions.md's error-handling section.
function CourseImage({
  src,
  alt,
  className
}: {
  src: string
  alt: string
  className?: string
}): React.JSX.Element {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div
        className={cn(
          'flex aspect-video w-full items-center justify-center bg-neutral-900 text-xs text-neutral-500',
          className
        )}
      >
        Image unavailable
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn('aspect-video w-full object-cover', className)}
    />
  )
}

export default CourseImage
