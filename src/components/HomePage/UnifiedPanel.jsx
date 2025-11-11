import { useState, useEffect, useRef } from 'react'
import '../../styles/HomePageStyle/UnifiedPanelStyle.css'

const MAIN_CONTEXTS = ['requests', 'my-requests', 'user-management', 'building-info', 'schedule', 'room-schedule']

const UnifiedPanel = ({ 
  isOpen, 
  contentType, // 'requests', 'my-requests', 'user-management', 'building-info'
  children
}) => {
  const [mounted, setMounted] = useState(false)
  const [contentKey, setContentKey] = useState(0)
  const [isFadingOut, setIsFadingOut] = useState(false)
  const prevContentTypeRef = useRef(contentType)
  const [renderedChildren, setRenderedChildren] = useState(children)
  const panelRef = useRef(null)
  const contentRef = useRef(null)


  // Animation speed limit (building-info <-> schedule)
  const prevType = prevContentTypeRef.current
  const limitSlide = (prevType === 'building-info' && contentType === 'schedule') ||
                     (prevType === 'schedule' && contentType === 'building-info')


  useEffect(() => {
    if (isOpen) {
      setMounted(true)
      setContentKey(prev => prev + 1)
      return
    }

    const node = panelRef.current
    let fallback = null
    const onTransitionEnd = (e) => {
      // wait for the transform or width transition to complete
      if (!e || e.propertyName === 'transform' || e.propertyName === 'width' || e.propertyName === 'opacity') {
        setMounted(false)
        if (node) node.removeEventListener('transitionend', onTransitionEnd)
        if (fallback) clearTimeout(fallback)
      }
    }

    if (node) {
      node.addEventListener('transitionend', onTransitionEnd)
      fallback = setTimeout(() => onTransitionEnd(), 1500)
    } else {
      setMounted(false)
    }

    return () => {
      if (node) node.removeEventListener('transitionend', onTransitionEnd)
      if (fallback) clearTimeout(fallback)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      prevContentTypeRef.current = contentType;
      setRenderedChildren(children);
      return;
    }
    const shouldAnimate =
      MAIN_CONTEXTS.includes(prevContentTypeRef.current) &&
      MAIN_CONTEXTS.includes(contentType) &&
      prevContentTypeRef.current !== contentType;
    if (!shouldAnimate) {
      prevContentTypeRef.current = contentType;
      setRenderedChildren(children);
      setIsFadingOut(false);
      return;
    }

    // Phase 1: Fade out current content
    setIsFadingOut(true)

    const node = contentRef.current
    let cleaned = false
    let phase2Timeout = null
    let phase3Timeout = null

    const onContentFadeOutComplete = (e) => {
      if (cleaned) return
      if (!e || e.propertyName === 'opacity') {
        cleaned = true
        
        // Phase 2: Wait a brief moment then swap content
        phase2Timeout = setTimeout(() => {
          prevContentTypeRef.current = contentType
          setRenderedChildren(children)
          setContentKey((prev) => prev + 1)
          
          // Phase 3: Fade in new content on next frame
          requestAnimationFrame(() => {
            setIsFadingOut(false)
          })
        }, 50)
        
        if (node) node.removeEventListener('transitionend', onContentFadeOutComplete)
      }
    }

    if (node) {
      node.addEventListener('transitionend', onContentFadeOutComplete)
      // Fallback timeout for fade out
      phase3Timeout = setTimeout(() => onContentFadeOutComplete(), 250)
    } else {
      prevContentTypeRef.current = contentType
      setRenderedChildren(children)
      setContentKey((prev) => prev + 1)
      setIsFadingOut(false)
    }

    return () => {
      if (node) node.removeEventListener('transitionend', onContentFadeOutComplete)
      if (phase2Timeout) clearTimeout(phase2Timeout)
      if (phase3Timeout) clearTimeout(phase3Timeout)
    }
  }, [contentType, children, isOpen]);

  if (!mounted && !isOpen) return null

  return (
    <>

      {/* Unified Panel */}
      <aside
        ref={panelRef}
        className={`up-panel ${mounted && isOpen ? 'opened' : ''} up-panel--${contentType} ${limitSlide ? 'up-panel--slow' : ''}`}
        aria-hidden={!isOpen}
      >
        <div 
        className={`up-panel-inner
        ${mounted && isOpen ? 'visible' : ''}`}
        >
          <div
          ref={contentRef}
          key={contentKey}
          className={`up-content ${!isFadingOut ? 'fading-in' : 'fading-out'}`}
          >
             {renderedChildren}
          </div>
        </div>
      </aside>
    </>
  )
}

export default UnifiedPanel

