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
  const [showContent, setShowContent] = useState(true)
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
      setShowContent(true);
      setIsFadingOut(false);
      return;
    }

    setIsFadingOut(true)

    const node = contentRef.current
    let cleaned = false
    let fallback = null

    const onContentTransitionEnd = (e) => {
      if (cleaned) return
      if (!e || e.propertyName === 'opacity') {
        cleaned = true
        setShowContent(false)
        // swap content on next frame for smoother repaint
        requestAnimationFrame(() => {
          prevContentTypeRef.current = contentType
          setRenderedChildren(children)
          setContentKey((prev) => prev + 1)
          setIsFadingOut(false)
          setShowContent(true)
        })
        if (node) node.removeEventListener('transitionend', onContentTransitionEnd)
        if (fallback) clearTimeout(fallback)
      }
    }

    if (node) {
      node.addEventListener('transitionend', onContentTransitionEnd)
      fallback = setTimeout(() => onContentTransitionEnd(), 1000)
    } else {
      prevContentTypeRef.current = contentType
      setRenderedChildren(children)
      setContentKey((prev) => prev + 1)
      setIsFadingOut(false)
      setShowContent(true)
    }

    return () => {
      if (node) node.removeEventListener('transitionend', onContentTransitionEnd)
      if (fallback) clearTimeout(fallback)
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
          className={`up-content ${showContent ? 'visible' : ''} ${isFadingOut ? 'fading-out' : 'fading-in'}`}
          >
             {renderedChildren}
          </div>
        </div>
      </aside>
    </>
  )
}

export default UnifiedPanel

