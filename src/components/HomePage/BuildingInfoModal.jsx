import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '../../styles/shared'

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
      className="no-scrollbar flex flex-col gap-1 px-0 py-0 mx-auto overflow-y-auto"
      style={{
        width: '244px',
        maxHeight: 'calc(95vh - 250px)',
        opacity: isOpen ? 1 : 0,
        transform: isOpen ? 'translateY(0)' : 'translateY(-20px)',
        willChange: 'opacity, transform',
        transitionProperty: 'opacity, transform',
        transitionDuration: '300ms',
        transitionTimingFunction: 'ease-out',
        transitionDelay: '0ms'
      }}
    >
      {normalizedRooms.map((group, idx) => {
        const floorKey = resolveFloorKey(group, idx)
        const floorName = resolveFloorName(group, idx)
        const rooms = group?.rooms || []
        const expanded = expandedFloorKey === floorKey
        const classroomRooms = filterRoomsByType(rooms, 'classroom')
        const administrativeRooms = filterRoomsByType(rooms, 'administrative')

        return (
          <div key={`${floorKey}-${floorName}`} className="w-full">
            <button
              type="button"
              onClick={() => setExpandedFloorKey((prev) => (prev === floorKey ? null : floorKey))}
              className={cn(
                'w-full text-left px-3 py-1.5 font-bold uppercase tracking-[0.19em] text-[0.62rem] mb-0 transition-colors duration-150',
                expanded
                  ? 'bg-[#4a5568] border-white text-white'
                  : 'bg-[#323640] border-[#b8beca19] text-[#f0f0f0] hover:bg-[#4a5568] hover:border-white hover:text-white'
              )}
              style={{ borderRadius: 0 }}
            >
              <span className="text-[#F8F8F8]/90 mr-2">{expanded ? '−' : '+'}</span>
              {floorName}
            </button>

            <div
              className="flex flex-col gap-1 mt-1 mb-1 overflow-hidden"
              style={{
                maxHeight: expanded && rooms.length > 0 ? '1000px' : '0px',
                opacity: expanded && rooms.length > 0 ? 1 : 0,
                transition: 'max-height 300ms ease-out, opacity 300ms ease-out',
                pointerEvents: expanded && rooms.length > 0 ? 'auto' : 'none'
              }}
            >
              {rooms.length > 0 && (
                <div
                  className="grid grid-cols-2 gap-2 w-full"
                  style={{
                    opacity: expanded ? 1 : 0,
                    transition: 'opacity 300ms ease-out'
                  }}
                >
                  <div className="flex flex-col gap-1">
                    {classroomRooms.map((room, roomIdx) => {
                      const isActive = isRoomScheduleOpen && activeRoomCode === room.room_code
                      const label = room.room_name || room.roomNumber || room.room_number || room.room_code || ''
                      return (
                        <button
                          key={room.id || room.room_code || `${floorKey}-${roomIdx}-classroom`}
                          data-room-code={room.room_code}
                          type="button"
                          onClick={() => handleRoomAction(room)}
                          className={cn(
                            'text-left px-3 py-1.5 text-[0.54rem] tracking-[0.12em] border-none shadow-none font-normal transition-colors duration-150',
                            isActive
                              ? 'bg-[#4a5568] text-white'
                              : 'bg-[#49505c] text-[#F8F8F8] hover:bg-[#4a5568] hover:text-white'
                          )}
                          style={{
                            borderRadius: 0,
                            width: '100%',
                            opacity: expanded ? 1 : 0,
                            transition: expanded
                              ? `opacity 10ms ease-out ${roomIdx * 20}ms, background-color 150ms ease-out`
                              : `opacity 300ms ease-out ${roomIdx * 10}ms`
                          }}
                        >
                          {`Room ${label}`}
                        </button>
                      )
                    })}
                  </div>

                  <div className="flex flex-col gap-1">
                    {administrativeRooms.map((room, roomIdx) => {
                      const isActive = isRoomScheduleOpen && activeRoomCode === room.room_code
                      const label = room.room_name || room.roomNumber || room.room_number || room.room_code || ''
                      return (
                        <button
                          key={room.id || room.room_code || `${floorKey}-${roomIdx}-admin`}
                          data-room-code={room.room_code}
                          type="button"
                          onClick={() => handleRoomAction(room)}
                          className={cn(
                            'text-left px-3 py-1.5 text-[0.54rem] tracking-[0.12em] border-none shadow-none font-normal transition-colors duration-150',
                            isActive
                              ? 'bg-[#4a5568] text-white'
                              : 'bg-[#49505c] text-[#F8F8F8] hover:bg-[#4a5568] hover:text-white'
                          )}
                          style={{
                            borderRadius: 0,
                            width: '100%',
                            opacity: expanded ? 1 : 0,
                            transition: expanded
                              ? `opacity 10ms ease-out ${roomIdx * 20}ms, background-color 150ms ease-out`
                              : `opacity 300ms ease-out ${roomIdx * 10}ms`
                          }}
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
        <div className="px-2 py-2 text-[0.58rem] tracking-[0.18em] text-[#EEEEEE]/60">
          No floors found.
        </div>
      )}
    </div>
  )
}

export default BuildingInfoModal
