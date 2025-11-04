import { useState, useEffect, useRef } from 'react'
import { COLORS } from '../../constants/colors'

// Panel width configurations for different content types
const PANEL_WIDTHS = {
  'requests': '806px',        // 896px - 10% = ~806px
  'my-requests': '691px',     // 768px - 10% = ~691px
  'user-management': '717px', // 1024px - 30% = ~717px
  'building-info': '300px',    // BuildingSidebar width
  'schedule': '1024px',        // max-w-5xl (BuildingSchedulePanel)
  'room-schedule': '180px'     // Wider room schedule panel width (~22% wider)
}

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
  const panelRef = useRef(null)
  const [renderedChildren, setRenderedChildren] = useState(children)

  // Animation timing (ms)
  const DEFAULT_SLIDE_MS = 600
  const DEFAULT_WIDTH_MS = 450
  const LIMITED_SLIDE_MS = 900   // speed limit for big width changes (building-info <-> schedule)
  const LIMITED_WIDTH_MS = 900
  const FADE_OUT_MS = 120        // fast fade-out
  const FADE_IN_MS = 240         // fast fade-in

  // Determine if we should apply speed limit (building-info <-> schedule)
  const prevType = prevContentTypeRef.current
  const limitSlide = (prevType === 'building-info' && contentType === 'schedule') ||
                     (prevType === 'schedule' && contentType === 'building-info')
  const SLIDE_MS = limitSlide ? LIMITED_SLIDE_MS : DEFAULT_SLIDE_MS
  const WIDTH_MS = limitSlide ? LIMITED_WIDTH_MS : DEFAULT_WIDTH_MS

  // Outside click to close is handled by HomePage canvas-container onClick for reliability

  // Get width for current content type
  const panelWidth = PANEL_WIDTHS[contentType] || '768px'

  // Handle mounting for animations
  useEffect(() => {
    if (isOpen) {
      setMounted(true)
      // Increment content key to trigger fade animation on first open
      setContentKey(prev => prev + 1)
    } else {
      // Delay unmounting to allow slide-out animation (match transition duration)
      const timer = setTimeout(() => setMounted(false), SLIDE_MS)
      return () => clearTimeout(timer)
    }
  }, [isOpen, SLIDE_MS])

  // Only animate fade/slide for main panel contentType changes
  useEffect(() => {
    if (!isOpen) {
      prevContentTypeRef.current = contentType;
      setRenderedChildren(children);
      return;
    }
    // Only animate if switching between main panel types
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
    // Fade out old content
    setIsFadingOut(true);
    const fadeOutTimer = setTimeout(() => {
      setShowContent(false);
      // After fade out (almost instant), mount new content and fade in + slide
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

  if (!mounted && !isOpen) return null

  return (
    <>
      {/* No backdrop - panel closes via document click handler to allow camera controls */}

      {/* Unified Panel */}
      <aside
        ref={panelRef}
        className="unified-panel fixed right-0 z-40 overflow-hidden"
        style={{
          top: '56px', // Below header
          height: 'calc(100vh - 56px)', // Full height minus header
          width: panelWidth,
          backgroundColor: COLORS.black,
          borderLeft: `1px solid ${COLORS.darkGray}`,
          boxShadow: '-2px 0 10px rgba(0, 0, 0, 0.5)',
          transform: mounted && isOpen ? 'translateX(0)' : 'translateX(100%)',
          opacity: mounted && isOpen ? 1 : 0,
          borderRadius: 0, // Square corners
          transition: `transform ${SLIDE_MS}ms cubic-bezier(0.22, 1, 0.36, 1), opacity 450ms ease-out, width ${WIDTH_MS}ms ease-out` // dynamic slide/width
        }}
        aria-hidden={!isOpen}
      >
        <div 
          className="h-full w-full flex flex-col"
          style={{
            opacity: mounted && isOpen ? 1 : 0,
            transition: 'opacity 350ms ease-out'
          }}
        >
           {/* Content with two-phase fade: out old, slide, then in new */}
          <div
            key={contentKey}
            className="flex-1 overflow-hidden"
            style={{
              opacity: showContent ? 1 : 0,
              transition: isFadingOut ? `opacity ${FADE_OUT_MS}ms ease-out` : `opacity ${FADE_IN_MS}ms ease-out`
            }}
          >
             {renderedChildren}
          </div>
        </div>
      </aside>
    </>
  )
}

export default UnifiedPanel

