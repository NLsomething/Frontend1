import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import '../../styles/HomePageStyle/BuildingInfoStyle.css'

const filterRoomsByType = (rooms = [], type) =>
  rooms.filter((room) => (room?.room_type || '').toLowerCase() === type)

const resolveFloorKey = (group, fallback) =>
  group?.floor_id ?? group?.floorId ?? group?.id ?? group?.floor_name ?? group?.floorName ?? group?.name ?? fallback

const resolveFloorName = (group, fallback) =>
  group?.floor_name ?? group?.floorName ?? group?.name ?? `Floor ${fallback + 1}`

const BuildingInfoModal = ({
  isOpen,
  roomsByFloor = [],
  isRoomScheduleOpen,
  activeRoomCode,
  onOpenRoomSchedule,
  onCloseRoomSchedule
}) => {
  const scrollContainerRef = useRef(null)
  const [expandedFloorKey, setExpandedFloorKey] = useState(null)

  const normalizedRooms = useMemo(() => Array.isArray(roomsByFloor) ? roomsByFloor : [], [roomsByFloor])

  const focusRoomButton = useCallback((roomCode) => {
    if (!scrollContainerRef.current || !roomCode) return
    const button = scrollContainerRef.current.querySelector(
      `button[data-room-code="${roomCode}"]`
    )
    if (button) {
      button.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
    }
  }, [])

  const ensureFloorExpanded = useCallback((floorKey) => {
    if (!floorKey) return
    setExpandedFloorKey((prev) => (prev === floorKey ? prev : floorKey))
  }, [])

  const handleRoomAction = useCallback((room) => {
    if (!room?.room_code) return
    const isActive = isRoomScheduleOpen && activeRoomCode === room.room_code
    if (isActive) {
      onCloseRoomSchedule?.()
    } else {
      onOpenRoomSchedule?.(room)
    }
  }, [isRoomScheduleOpen, activeRoomCode, onOpenRoomSchedule, onCloseRoomSchedule])

  useEffect(() => {
    if (!isOpen || !activeRoomCode) return

    let targetFloorKey = null
    normalizedRooms.some((group, index) => {
      const floorKey = resolveFloorKey(group, index)
      const found = (group.rooms || []).some((room) => {
        if ((room.room_code || '').toLowerCase() === activeRoomCode.toLowerCase()) {
          targetFloorKey = floorKey
          return true
        }
        return false
      })
      return found
    })

    if (targetFloorKey) {
      ensureFloorExpanded(targetFloorKey)
      const timeout = setTimeout(() => focusRoomButton(activeRoomCode), 120)
      return () => clearTimeout(timeout)
    }
    return undefined
  }, [isOpen, activeRoomCode, normalizedRooms, ensureFloorExpanded, focusRoomButton])

  useEffect(() => {
    const handleSearchRoom = (event) => {
      const roomCode = event?.detail?.roomCode
      if (!roomCode) return
      let targetFloorKey = null
      let targetRoom = null

      normalizedRooms.some((group, index) => {
        const floorKey = resolveFloorKey(group, index)
        const match = (group.rooms || []).find((room) =>
          (room.room_code || '').toLowerCase() === roomCode.toLowerCase()
        )
        if (match) {
          targetFloorKey = floorKey
          targetRoom = match
          return true
        }
        return false
      })

      if (targetFloorKey && targetRoom) {
        ensureFloorExpanded(targetFloorKey)
        requestAnimationFrame(() => focusRoomButton(roomCode))
        if (!isRoomScheduleOpen || activeRoomCode?.toLowerCase() !== roomCode.toLowerCase()) {
          onOpenRoomSchedule?.(targetRoom)
        }
      }
    }

    window.addEventListener('search-room', handleSearchRoom)
    return () => window.removeEventListener('search-room', handleSearchRoom)
  }, [normalizedRooms, ensureFloorExpanded, focusRoomButton, onOpenRoomSchedule, isRoomScheduleOpen, activeRoomCode])

  return (
    <div
      ref={scrollContainerRef}
      className="bi-modal no-scrollbar"
      {...(isOpen ? { 'data-open': '' } : {})}
    >
      {normalizedRooms.map((group, idx) => {
        const floorKey = resolveFloorKey(group, idx)
        const floorName = resolveFloorName(group, idx)
        const rooms = Array.isArray(group?.rooms) ? group.rooms : []
        const expanded = expandedFloorKey === floorKey
        const classroomRooms = filterRoomsByType(rooms, 'classroom')
        const administrativeRooms = filterRoomsByType(rooms, 'administrative')
        const hasRooms = rooms.length > 0

        return (
          <div key={`${floorKey}-${floorName}`} className="bi-floor">
            <button
              type="button"
              onClick={() => setExpandedFloorKey((prev) => (prev === floorKey ? null : floorKey))}
              className="bi-floor-toggle"
              {...(expanded ? { 'data-expanded': '' } : {})}
            >
              <span className="bi-toggle-icon">{expanded ? '−' : '+'}</span>
              <span>{floorName}</span>
            </button>

            <div
              className="bi-floor-content"
              {...(expanded && hasRooms ? { 'data-expanded': '' } : {})}
            >
              {hasRooms && (
                <div
                  className="bi-room-grid"
                  {...(expanded ? { 'data-expanded': '' } : {})}
                >
                  <div className="bi-room-column" data-variant="classroom">
                    {classroomRooms.map((room, roomIdx) => {
                      const isActive = isRoomScheduleOpen && activeRoomCode === room.room_code
                      const label = room.room_name || room.roomNumber || room.room_number || room.room_code || ''
                      return (
                        <button
                          key={room.id || room.room_code || `${floorKey}-${roomIdx}-classroom`}
                          data-room-code={room.room_code}
                          type="button"
                          onClick={() => handleRoomAction(room)}
                          className="bi-room-button"
                          {...(expanded ? { 'data-expanded': '' } : {})}
                          {...(isActive ? { 'data-active': '' } : {})}
                          style={{ transitionDelay: `${roomIdx * 15}ms` }}
                        >
                          {`Room ${label}`}
                        </button>
                      )
                    })}
                  </div>

                  <div className="bi-room-column" data-variant="administrative">
                    {administrativeRooms.map((room, roomIdx) => {
                      const isActive = isRoomScheduleOpen && activeRoomCode === room.room_code
                      const label = room.room_name || room.roomNumber || room.room_number || room.room_code || ''
                      const order = classroomRooms.length + roomIdx
                      return (
                        <button
                          key={room.id || room.room_code || `${floorKey}-${roomIdx}-administrative`}
                          data-room-code={room.room_code}
                          type="button"
                          onClick={() => handleRoomAction(room)}
                          className="bi-room-button"
                          {...(expanded ? { 'data-expanded': '' } : {})}
                          {...(isActive ? { 'data-active': '' } : {})}
                          style={{ transitionDelay: `${order * 15}ms` }}
                        >
                          {label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })}

      {normalizedRooms.length === 0 && (
        <div className="bi-empty">No floors found.</div>
      )}
    </div>
  )
}

export default BuildingInfoModal
