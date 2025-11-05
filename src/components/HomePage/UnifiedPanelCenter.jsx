import { useState, useEffect, useRef } from 'react'
import { COLORS } from '../../constants/colors'

const UnifiedPanelCenter = ({ 
  isOpen, 
  contentType, // 'schedule-request' | 'schedule-edit'
  children,
  onClose
}) => {
  const [mounted, setMounted] = useState(false)
  const [contentKey, setContentKey] = useState(0)
  const [isFadingOut, setIsFadingOut] = useState(false)
  const [showContent, setShowContent] = useState(true)
  const prevContentTypeRef = useRef(contentType)
  const panelRef = useRef(null)
  const backdropRef = useRef(null)
  const [renderedChildren, setRenderedChildren] = useState(children)

  // Animation timing (ms)
  const SCALE_MS = 300          // scale animation duration
  const FADE_OUT_MS = 120        // fast fade-out
  const FADE_IN_MS = 240         // fast fade-in
  const BACKDROP_MS = 300        // backdrop fade duration

  // Handle mounting for animations
  useEffect(() => {
    if (isOpen) {
      setMounted(true)
      // Increment content key to trigger fade animation on first open
      setContentKey(prev => prev + 1)
    } else {
      // Delay unmounting to allow scale-out animation
      const timer = setTimeout(() => setMounted(false), SCALE_MS)
      return () => clearTimeout(timer)
    }
  }, [isOpen, SCALE_MS])

  // Handle content type changes with fade animation
  useEffect(() => {
    if (!isOpen) {
      prevContentTypeRef.current = contentType;
      setRenderedChildren(children);
      return;
    }
    
    // Only animate if switching between content types
    const shouldAnimate = 
      prevContentTypeRef.current !== contentType &&
      prevContentTypeRef.current !== null;
    
    if (!shouldAnimate) {
      prevContentTypeRef.current = contentType;
      setRenderedChildren(children);
      setShowContent(true);
      setIsFadingOut(false);
      return;
    }
    
    // Fade out old content
    setIsFadingOut(true);
    const fadeOutTimer = setTimeout(() => {
      setShowContent(false);
      // After fade out, mount new content and fade in
      setTimeout(() => {
        prevContentTypeRef.current = contentType;
        setRenderedChildren(children);
        setContentKey((prev) => prev + 1);
        setIsFadingOut(false);
        setShowContent(true);
      }, 12); // tiny delay to ensure fade out completes
    }, FADE_OUT_MS);
    return () => clearTimeout(fadeOutTimer);
  }, [contentType, children, isOpen]);

  // Handle backdrop click to close
  useEffect(() => {
    if (!isOpen || !mounted) return

    const handleBackdropClick = (e) => {
      if (
        backdropRef.current &&
        e.target === backdropRef.current &&
        !panelRef.current?.contains(e.target)
      ) {
        onClose()
      }
    }

    // Add click listener to backdrop
    const backdrop = backdropRef.current
    if (backdrop) {
      backdrop.addEventListener('click', handleBackdropClick)
    }

    return () => {
      if (backdrop) {
        backdrop.removeEventListener('click', handleBackdropClick)
      }
    }
  }, [isOpen, mounted, onClose])

  if (!mounted && !isOpen) return null

  return (
    <>
      {/* Backdrop overlay with darkening effect */}
      <div
        ref={backdropRef}
        className="fixed inset-0 z-50"
        style={{
          backgroundColor: mounted && isOpen ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0)',
          transition: `background-color ${BACKDROP_MS}ms ease-out`,
          pointerEvents: mounted && isOpen ? 'auto' : 'none',
          cursor: mounted && isOpen ? 'pointer' : 'default'
        }}
        aria-hidden={!isOpen}
      />

      {/* Center Panel */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
        style={{
          pointerEvents: mounted && isOpen ? 'none' : 'none'
        }}
        aria-hidden={!isOpen}
      >
        <div
          ref={panelRef}
          className="w-full max-w-lg mx-4 pointer-events-auto"
          style={{
            backgroundColor: COLORS.darkGray,
            transform: mounted && isOpen ? 'scale(1)' : 'scale(0.8)',
            opacity: mounted && isOpen ? 1 : 0,
            borderRadius: 0, // Square corners (brutalist style)
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
            transition: `transform ${SCALE_MS}ms cubic-bezier(0.22, 1, 0.36, 1), opacity ${SCALE_MS}ms ease-out`,
            overflow: 'hidden'
          }}
          onClick={(e) => {
            // Prevent backdrop click when clicking inside panel
            e.stopPropagation()
          }}
        >
          {/* Content with two-phase fade: out old, scale, then in new */}
          <div
            key={contentKey}
            className="w-full"
            style={{
              opacity: showContent ? 1 : 0,
              transition: isFadingOut ? `opacity ${FADE_OUT_MS}ms ease-out` : `opacity ${FADE_IN_MS}ms ease-out`
            }}
          >
            {renderedChildren}
          </div>
        </div>
      </div>
    </>
  )
}

export default UnifiedPanelCenter

