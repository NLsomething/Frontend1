import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import '../../styles/HomePageStyle/UnifiedPanelStyle.css'
import { SCHEDULE_STATUS, SCHEDULE_STATUS_LABELS } from '../../constants/schedule'
import { useHomePageStore } from '../../stores/useHomePageStore'
import { useNotifications } from '../../context/NotificationContext'
import RequestsPanelContent from './RequestsPanelContent'
import MyRequestsPanelContent from './MyRequestsPanelContent'
import BuildingScheduleContent from './BuildingScheduleContent'
import RoomScheduleContent from './RoomScheduleContent'

const MAIN_CONTEXTS = ['requests', 'my-requests', 'user-management', 'building-info', 'schedule', 'room-schedule']

const UnifiedPanel = ({
  isOpen,
  contentType,
  selectedBuilding,
  buildingRooms,
  roomsByFloor,
  scheduleDate,
  setScheduleDate,
  timeSlots,
  roomScheduleState,
  isoDate,
  canEditSchedule,
  canRequestRoom,
  roomLookupByCode,
  getSlotLabel,
}) => {
  const [mounted, setMounted] = useState(false)
  const [contentKey, setContentKey] = useState(0)
  const [isFadingOut, setIsFadingOut] = useState(false)
  const prevContentTypeRef = useRef(contentType)
  const panelRef = useRef(null)
  const contentRef = useRef(null)

  // Animation speed limit
  const prevType = prevContentTypeRef.current
  const limitSlide = (prevType === 'building-info' && contentType === 'schedule') ||
    (prevType === 'schedule' && contentType === 'building-info')

  // Get notifications
  const { notifyError } = useNotifications()

  // Store data
  const scheduleMap = useHomePageStore((state) => state.scheduleMap)
  const buildScheduleKey = useHomePageStore((state) => state.buildScheduleKey)
  const setRequestState = useHomePageStore((state) => state.setRequestState)

  // Requests panel data
  const pendingRequests = useHomePageStore((state) => state.pendingRequests)
  const historicalRequests = useHomePageStore((state) => state.historicalRequests)
  const requestsLoading = useHomePageStore((state) => state.requestsLoading)
  const historicalDateFilter = useHomePageStore((state) => state.historicalDateFilter)
  const rejectionReasons = useHomePageStore((state) => state.rejectionReasons)
  const requestActionLoading = useHomePageStore((state) => state.requestActionLoading)
  const setRejectionReasons = useHomePageStore((state) => state.setRejectionReasons)
  const approveRequest = useHomePageStore((state) => state.approveRequest)
  const rejectRequest = useHomePageStore((state) => state.rejectRequest)
  const revertRequest = useHomePageStore((state) => state.revertRequest)
  const setHistoricalDateFilter = useHomePageStore((state) => state.setHistoricalDateFilter)

  // My Requests panel data
  const myRequests = useHomePageStore((state) => state.myRequests)
  const myRequestsLoading = useHomePageStore((state) => state.myRequestsLoading)
  const filteredMyRequests = useHomePageStore((state) => state.filteredMyRequests)
  const myRequestsDateFilter = useHomePageStore((state) => state.myRequestsDateFilter)
  const setMyRequestsDateFilter = useHomePageStore((state) => state.setMyRequestsDateFilter)

  // Room schedule computed
  const roomSchedule = useMemo(() => {
    if (!roomScheduleState?.roomScheduleRoomCode || typeof buildScheduleKey !== 'function') return []
    return timeSlots.map((slot) => {
      const slotId = slot.id || slot.slot_id
      const key = buildScheduleKey(roomScheduleState.roomScheduleRoomCode, slotId)
      const entry = scheduleMap[key]
      if (entry) return entry
      return {
        room_number: roomScheduleState.roomScheduleRoomCode,
        slot_hour: slotId,
        status: SCHEDULE_STATUS.empty,
        timeslot_id: slotId,
        slot_id: slotId,
        slot_order: slot.slotOrder ?? slot.slot_order ?? null,
        slot_type: slot.slotType || slot.slot_type || null,
        slot_name: slot.slotName || slot.slot_name || null,
        start_time: slot.start_time || slot.startTime || null,
        end_time: slot.end_time || slot.endTime || null
      }
    })
  }, [roomScheduleState?.roomScheduleRoomCode, scheduleMap, buildScheduleKey, timeSlots])

  // Callbacks for child components
  const handleBuildingScheduleCellClick = useCallback((roomMeta, slotHour) => {
    const roomCode = typeof roomMeta === 'string' ? roomMeta : roomMeta?.room_code || roomMeta?.roomNumber || roomMeta?.room_number || null
    const roomName = typeof roomMeta === 'string' ? null : roomMeta?.room_name || roomMeta?.name || null
    const roomId = typeof roomMeta === 'string' ? null : roomMeta?.id || null

    if (!roomCode) {
      notifyError('Missing room details')
      return
    }
    if (typeof buildScheduleKey !== 'function') {
      notifyError('Schedule unavailable')
      return
    }

    if (canEditSchedule) {
      const key = buildScheduleKey(roomCode, slotHour)
      const existing = scheduleMap[key]
      setRequestState({
        isOpen: true,
        isEditMode: true,
        room: roomCode,
        roomId: roomId || existing?.room_id || null,
        roomName: roomName || null,
        startHour: slotHour,
        endHour: slotHour,
        existingEntry: existing
      })
    } else if (canRequestRoom) {
      const key = buildScheduleKey(roomCode, slotHour)
      const entry = scheduleMap[key]

      if (entry && entry.status !== SCHEDULE_STATUS.empty && entry.status !== SCHEDULE_STATUS.pending) {
        notifyError('Slot not available', {
          description: `Room ${roomCode} at ${getSlotLabel(slotHour)} is already ${SCHEDULE_STATUS_LABELS[entry.status].toLowerCase()}.`
        })
        return
      }
      setRequestState({
        isOpen: true,
        isEditMode: false,
        room: roomCode,
        roomId: roomId || null,
        roomName: roomName || null,
        startHour: slotHour,
        endHour: slotHour,
        existingEntry: null
      })
    }
  }, [canEditSchedule, canRequestRoom, buildScheduleKey, scheduleMap, setRequestState, getSlotLabel, notifyError])

  const handleRoomScheduleAdminAction = useCallback((roomNumber, slotHour) => {
    if (!canEditSchedule) return
    if (typeof buildScheduleKey !== 'function') {
      notifyError('Schedule unavailable')
      return
    }
    const roomMeta = roomLookupByCode.get(roomNumber)
    const key = buildScheduleKey(roomNumber, slotHour)
    const existing = scheduleMap[key]
    setRequestState({
      isOpen: true,
      isEditMode: true,
      room: roomNumber,
      roomId: existing?.room_id || roomMeta?.id || null,
      roomName: roomMeta?.room_name || roomScheduleState?.roomScheduleRoomName || null,
      startHour: slotHour,
      endHour: slotHour,
      existingEntry: existing
    })
  }, [canEditSchedule, buildScheduleKey, roomLookupByCode, scheduleMap, setRequestState, roomScheduleState, notifyError])

  const handleRoomScheduleTeacherRequest = useCallback((roomNumber, slotHour) => {
    if (!canRequestRoom) return
    if (typeof buildScheduleKey !== 'function') {
      notifyError('Schedule unavailable')
      return
    }
    const key = buildScheduleKey(roomNumber, slotHour)
    const entry = scheduleMap[key]
    if (entry && entry.status !== SCHEDULE_STATUS.empty && entry.status !== SCHEDULE_STATUS.pending) {
      notifyError('Slot not available', {
        description: `Room ${roomNumber} at ${getSlotLabel(slotHour)} is already ${SCHEDULE_STATUS_LABELS[entry.status].toLowerCase()}.`
      })
      return
    }
    const roomMeta = roomLookupByCode.get(roomNumber)
    setRequestState({
      isOpen: true,
      isEditMode: false,
      room: roomNumber,
      roomId: roomMeta?.id || null,
      roomName: roomMeta?.room_name || roomScheduleState?.roomScheduleRoomName || null,
      startHour: slotHour,
      endHour: slotHour,
      existingEntry: null
    })
  }, [canRequestRoom, buildScheduleKey, roomLookupByCode, scheduleMap, setRequestState, roomScheduleState, getSlotLabel, notifyError])

  const parseDateStringWrapper = useCallback((dateString) => {
    const parts = dateString.split('/')
    if (parts.length === 3) {
      const [dd, mm, yyyy] = parts
      return new Date(Number(yyyy), Number(mm) - 1, Number(dd))
    }
    return null
  }, [])

  // Generate Internal Children
  const internalChildren = useMemo(() => {
    if (contentType === 'requests') {
      return (
        <RequestsPanelContent
          pendingRequests={pendingRequests}
          historicalRequests={historicalRequests}
          requestsLoading={requestsLoading}
          historicalDateFilter={historicalDateFilter}
          rejectionReasons={rejectionReasons}
          setRejectionReasons={setRejectionReasons}
          requestActionLoading={requestActionLoading}
          onDateFilterChange={setHistoricalDateFilter}
          onApprove={(request) => approveRequest(request, { parseDateString: parseDateStringWrapper })}
          onReject={rejectRequest}
          onRevert={(request) => revertRequest(request, { parseDateString: parseDateStringWrapper })}
          timeSlots={timeSlots}
        />
      )
    }
    if (contentType === 'my-requests') {
      return (
        <MyRequestsPanelContent
          myRequests={myRequests}
          filteredMyRequests={filteredMyRequests}
          myRequestsLoading={myRequestsLoading}
          myRequestsDateFilter={myRequestsDateFilter}
          onDateFilterChange={setMyRequestsDateFilter}
          timeSlots={timeSlots}
        />
      )
    }
    if (contentType === 'schedule' && selectedBuilding) {
      return (
        <BuildingScheduleContent
          selectedBuilding={selectedBuilding}
          buildingRooms={buildingRooms}
          buildingRoomsLoading={false}
          roomsByFloor={roomsByFloor}
          scheduleDate={scheduleDate}
          setScheduleDate={setScheduleDate}
          timeSlots={timeSlots}
          onCellClick={handleBuildingScheduleCellClick}
          canEdit={canEditSchedule}
          canRequest={canRequestRoom}
        />
      )
    }
    if (contentType === 'room-schedule' && roomScheduleState?.roomScheduleRoomCode) {
      return (
        <RoomScheduleContent
          isOpen={true}
          embedded={true}
          roomCode={roomScheduleState.roomScheduleRoomCode}
          roomName={roomScheduleState.roomScheduleRoomName}
          bookable={roomScheduleState.roomScheduleBookable}
          schedule={roomSchedule}
          scheduleDate={isoDate}
          timeSlots={timeSlots}
          roomType={roomScheduleState.roomScheduleRoomType}
          onDateChange={(val) => {
            if (typeof val === 'string') {
              const parts = val.split('/')
              if (parts.length === 3) {
                const [dd, mm, yyyy] = parts
                const y = Number(yyyy)
                const m = Number(mm) - 1
                const dNum = Number(dd)
                const parsed = new Date(y, m, dNum)
                if (!isNaN(parsed.getTime())) {
                  setScheduleDate(parsed)
                  return
                }
              }
              setScheduleDate(new Date())
            } else if (val instanceof Date) {
              setScheduleDate(val)
            }
          }}
          canEdit={canEditSchedule}
          canRequest={canRequestRoom}
          onAdminAction={handleRoomScheduleAdminAction}
          onTeacherRequest={handleRoomScheduleTeacherRequest}
        />
      )
    }
    return null
  }, [
    contentType, pendingRequests, historicalRequests, requestsLoading, historicalDateFilter,
    rejectionReasons, setRejectionReasons, requestActionLoading, setHistoricalDateFilter,
    approveRequest, rejectRequest, revertRequest, timeSlots, parseDateStringWrapper,
    myRequests, filteredMyRequests, myRequestsLoading, myRequestsDateFilter, setMyRequestsDateFilter,
    selectedBuilding, buildingRooms, roomsByFloor, scheduleDate, setScheduleDate,
    handleBuildingScheduleCellClick, canEditSchedule, canRequestRoom, roomScheduleState,
    roomSchedule, isoDate, handleRoomScheduleAdminAction, handleRoomScheduleTeacherRequest
  ])

  const [renderedChildren, setRenderedChildren] = useState(internalChildren)

  // Animation Effects
  useEffect(() => {
    if (isOpen) {
      setMounted(true)
      // Only increment contentKey on content type change (handled in second effect)
      return
    }

    const node = panelRef.current
    let fallback = null
    const onTransitionEnd = (e) => {
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
      prevContentTypeRef.current = contentType
      setRenderedChildren(internalChildren)
      return
    }
    const shouldAnimate =
      MAIN_CONTEXTS.includes(prevContentTypeRef.current) &&
      MAIN_CONTEXTS.includes(contentType) &&
      prevContentTypeRef.current !== contentType

    if (!shouldAnimate) {
      prevContentTypeRef.current = contentType
      setRenderedChildren(internalChildren)
      setIsFadingOut(false)
      return
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
          setRenderedChildren(internalChildren)
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
      setRenderedChildren(internalChildren)
      setContentKey((prev) => prev + 1)
      setIsFadingOut(false)
    }

    return () => {
      if (node) node.removeEventListener('transitionend', onContentFadeOutComplete)
      if (phase2Timeout) clearTimeout(phase2Timeout)
      if (phase3Timeout) clearTimeout(phase3Timeout)
    }
  }, [contentType, internalChildren, isOpen])

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

