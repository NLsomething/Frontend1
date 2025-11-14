import { useState, useEffect, useRef } from 'react'
import { useHomePageStore } from '../../stores/useHomePageStore'
import ScheduleRequestContent from './ScheduleRequestContent'
import ScheduleEditContent from './ScheduleEditContent'
import '../../styles/HomePageStyle/UnifiedPanelCenterStyle.css'

const UnifiedPanelCenter = ({
  isOpen,
  contentType,
  onClose,
  filteredRequestTimeSlots,
  isSubmittingRequest,
  isSubmittingEdit,
  onRequestSubmit,
  onEditSubmit,
  onRequestFormChange,
  onEditFormChange,
  onRangeChange,
  isoDate,
  requestForm,
  editForm,
}) => {
  const [mounted, setMounted] = useState(false)
  const [contentKey, setContentKey] = useState(0)
  const [showContent, setShowContent] = useState(true)
  const prevContentTypeRef = useRef(contentType)
  const panelRef = useRef(null)
  const backdropRef = useRef(null)
  const contentRef = useRef(null)

  // Get request state from Zustand store
  const requestState = useHomePageStore((state) => state.requestState)

  // Generate the children internally based on contentType
  let internalChildren = null
  if (contentType === 'schedule-request' && requestState.room) {
    internalChildren = (
      <ScheduleRequestContent
        requestState={requestState}
        requestForm={requestForm}
        timeSlots={filteredRequestTimeSlots}
        isoDate={isoDate}
        submitting={isSubmittingRequest}
        onSubmit={onRequestSubmit}
        onFormChange={onRequestFormChange}
        onRangeChange={onRangeChange}
        onClose={onClose}
      />
    )
  } else if (contentType === 'schedule-edit' && requestState.room) {
    internalChildren = (
      <ScheduleEditContent
        editState={requestState}
        editForm={editForm}
        timeSlots={filteredRequestTimeSlots}
        submitting={isSubmittingEdit}
        onSubmit={onEditSubmit}
        onFormChange={onEditFormChange}
        onRangeChange={onRangeChange}
        onClose={onClose}
      />
    )
  }

  const [renderedChildren, setRenderedChildren] = useState(internalChildren)

  useEffect(() => {
    if (isOpen) {
      setMounted(true)
      setContentKey(prev => prev + 1)
      return
    }

    const node = panelRef.current
    let fallback = null
    const onTransitionEnd = (e) => {
      if (!e || e.propertyName === 'transform' || e.propertyName === 'opacity') {
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
      prevContentTypeRef.current = contentType
      setRenderedChildren(internalChildren)
      return
    }

    const shouldAnimate =
      prevContentTypeRef.current !== contentType &&
      prevContentTypeRef.current !== null

    if (!shouldAnimate) {
      prevContentTypeRef.current = contentType
      setRenderedChildren(internalChildren)
      setShowContent(true)
      return
    }

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
          setRenderedChildren(internalChildren)
          setContentKey((prev) => prev + 1)
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
      setRenderedChildren(internalChildren)
      setContentKey((prev) => prev + 1)
      setShowContent(true)
    }

    return () => {
      if (node) node.removeEventListener('transitionend', onContentTransitionEnd)
      if (fallback) clearTimeout(fallback)
    }
  }, [contentType, internalChildren, isOpen])

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
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className={`upc-backdrop
        ${mounted && isOpen ? 'opened' : ''}`}
        aria-hidden={!isOpen}
      />

      {/* Center Panel */}
      <div className="upc-shell" aria-hidden={!isOpen}>
        <div
          ref={panelRef}
          className={`upc-panel
          ${mounted && isOpen ? 'opened' : ''}`}
          onClick={(e) => {
            e.stopPropagation()
          }}
        >
          {/* Content loader */}
          <div
            key={contentKey}
            className={`upc-content
              ${showContent ? ' visible' : ''}`}
            ref={contentRef}
          >
            {renderedChildren}
          </div>
        </div>
      </div>
    </>
  )
}

export default UnifiedPanelCenter

