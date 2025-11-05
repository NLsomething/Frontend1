import { Fragment, useEffect, useMemo, useState } from 'react'
import { SCHEDULE_STATUS, SCHEDULE_STATUS_LABELS } from '../../constants/schedule'
import { getScheduleStatusColors } from '../../utils/scheduleUtils'
import { COLORS } from '../../constants/colors'

const DEFAULT_SLOT_CATEGORY = 'classroom'

const RoomScheduleContent = ({
  isOpen,
  roomCode,
  roomName,
  bookable = true,
  schedule = [],
  scheduleLoading,
  scheduleDate,
  onDateChange,
  canEdit,
  canRequest,
  onAdminAction,
  onTeacherRequest,
  embedded = false,
  timeSlots = [],
  roomType = null
}) => {
  const [mounted, setMounted] = useState(false)

  const getTodayDDMMYYYY = () => {
    const today = new Date()
    const dd = String(today.getDate()).padStart(2, '0')
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const yyyy = String(today.getFullYear())
    return `${dd}/${mm}/${yyyy}`
  }

  useEffect(() => {
    if (isOpen && roomCode) {
      setMounted(true)
    } else {
      setMounted(false)
    }
  }, [isOpen, roomCode])

  const normalizedSlots = useMemo(() => {
    if (!Array.isArray(timeSlots)) return []

    return timeSlots
      .map((slot, index) => {
        const slotType = (slot.slotType || slot.slot_type || slot.type || DEFAULT_SLOT_CATEGORY).toLowerCase()
        const baseLabel =
          slot.label ||
          slot.slot_name ||
          slot.slotName ||
          slot.name ||
          slot.displayLabel ||
          `Slot ${index + 1}`
        const displayLabel = baseLabel
        const resolvedId = slot.id ?? slot.slot_id ?? slot.slotId ?? null
        const mapKey = resolvedId != null ? String(resolvedId) : `${slotType}-${index}`

        return {
          ...slot,
          id: resolvedId,
          slotType,
          displayLabel,
          mapKey,
          slotOrder: slot.slotOrder ?? slot.slot_order ?? index
        }
      })
      .sort((a, b) => (a.slotOrder ?? 0) - (b.slotOrder ?? 0))
  }, [timeSlots])

  const resolvedSlotType = useMemo(() => {
    if (roomType) {
      const normalized = String(roomType).toLowerCase()
      if (normalized.includes('admin')) return 'administrative'
      if (normalized.includes('class')) return 'classroom'
      return normalized
    }
    return normalizedSlots[0]?.slotType || DEFAULT_SLOT_CATEGORY
  }, [roomType, normalizedSlots])

  const filteredSlots = useMemo(() => {
    if (!normalizedSlots.length) return []
    const subset = normalizedSlots.filter((slot) => slot.slotType === resolvedSlotType)
    return subset.length > 0 ? subset : normalizedSlots
  }, [normalizedSlots, resolvedSlotType])

  const scheduleBySlotId = useMemo(() => {
    const map = new Map()
    schedule.forEach((entry) => {
      const slotId = entry.slot_hour ?? entry.timeslot_id ?? entry.slot_id ?? null
      if (slotId !== null && slotId !== undefined) {
        map.set(String(slotId), entry)
      }
    })
    return map
  }, [schedule])

  if (!roomCode) return null

  return (
    <div
      style={{
        position: embedded ? 'relative' : 'fixed',
        top: embedded ? 'auto' : 0,
        left: embedded ? 'auto' : 'clamp(260px, 15%, 300px)',
        width: embedded ? '100%' : 'auto',
        minWidth: embedded ? '180px' : '180px',
        maxWidth: embedded ? '200px' : '200px',
        height: embedded ? '100%' : '100vh',
        backgroundColor: embedded ? 'transparent' : '#393E46',
        boxShadow: embedded ? 'none' : '2px 0 10px rgba(0, 0, 0, 0.5)',
        zIndex: embedded ? 1 : 29,
        display: 'flex',
        flexDirection: 'column',
        overflow: embedded ? 'visible' : 'hidden',
        opacity: embedded ? 1 : (mounted && isOpen ? 1 : 0),
        transform: embedded ? 'none' : (mounted && isOpen ? 'translateX(0)' : 'translateX(-100%)'),
        transition: embedded ? 'none' : 'opacity 0.3s ease-out, transform 0.3s ease-out',
        pointerEvents: embedded ? 'auto' : (mounted && isOpen ? 'auto' : 'none')
      }}
    >
      <div
        style={{
          padding: embedded ? '12px 16px' : '14px 21px',
          borderBottom: '2px solid rgba(238,238,238,0.1)',
          backgroundColor: embedded ? COLORS.black : '#222831',
          flexShrink: 0
        }}
      >
        <div>
          <h3
            style={{
              fontSize: embedded ? '14px' : '15px',
              fontWeight: '600',
              color: '#EEEEEE',
              margin: 0
            }}
          >
            {`Room ${roomName || roomCode}`}
          </h3>
        </div>
        <div
          style={{
            marginTop: '6px',
            fontSize: '11px',
            color: '#EEEEEECC',
            letterSpacing: '0.5px'
          }}
        >
          Room code: {roomCode}
        </div>
        <div style={{ marginTop: '8px' }}>
          <input
            type="date"
            value={scheduleDate}
            onChange={(e) => {
              const value = e.target.value
              if (!value) {
                onDateChange(getTodayDDMMYYYY())
                return
              }
              const [y, m, d] = value.split('-')
              onDateChange(`${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`)
            }}
            style={{
              width: '100%',
              padding: '6px 8px',
              border: '1px solid rgba(238,238,238,0.2)',
              borderRadius: 0,
              fontSize: '12px',
              color: '#EEEEEE',
              backgroundColor: '#393E46',
              boxSizing: 'border-box'
            }}
            className="dark-date-input"
          />
          <style>
            {`
              .dark-date-input::-webkit-calendar-picker-indicator {
                filter: invert(1);
                cursor: pointer;
              }
            `}
          </style>
        </div>
      </div>

      <div
        className="room-schedule-scrollable"
        style={{
          flex: 1,
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: '#3282B8 #393E46',
          backgroundColor: embedded && !bookable ? 'transparent' : (embedded ? COLORS.black : '#393E46')
        }}
      >
        <style>
          {`
            .room-schedule-scrollable::-webkit-scrollbar {
              width: 8px;
            }
            .room-schedule-scrollable::-webkit-scrollbar-track {
              background: ${embedded ? COLORS.black : '#393E46'};
            }
            .room-schedule-scrollable::-webkit-scrollbar-thumb {
              background: #3282B8;
              border-radius: 0px;
            }
            .room-schedule-scrollable::-webkit-scrollbar-thumb:hover {
              background: #3a94c4;
            }
          `}
        </style>
        {!bookable ? (
          <div
            style={{
              padding: '20px',
              paddingTop: '40px',
              textAlign: 'center',
              color: '#EEEEEE80',
              fontSize: '14px',
              backgroundColor: embedded ? 'transparent' : '#393E46',
              minHeight: embedded ? 'calc(100% - 80px)' : 'auto',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start'
            }}
          >
            <div
              style={{
                padding: '10px 12px',
                backgroundColor: 'rgba(239,68,68,0.12)',
                color: '#fecaca',
                borderBottom: '1px solid rgba(239,68,68,0.25)',
                fontSize: '11px',
                display: 'inline-block'
              }}
            >
              This room cannot be booked.
            </div>
          </div>
        ) : scheduleLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#EEEEEE80', fontSize: '14px' }}>
            Loading schedule...
          </div>
        ) : filteredSlots.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#EEEEEE80', fontSize: '14px' }}>
            No time slots available for this view.
          </div>
        ) : (
          <div
            style={{
              fontSize: '12px',
              display: 'grid',
              gridTemplateColumns: 'minmax(60px, 80px) 1fr',
              borderTop: '1px solid rgba(238,238,238,0.1)'
            }}
          >
            {filteredSlots.map((slot) => {
              const slotMapKey = slot.mapKey
              const scheduleEntry = slotMapKey ? scheduleBySlotId.get(slotMapKey) : undefined
              const status = scheduleEntry?.status || SCHEDULE_STATUS.empty
              const statusLabel = SCHEDULE_STATUS_LABELS[status]
              const courseName = scheduleEntry?.course_name || ''
              const bookedBy = scheduleEntry?.booked_by || ''
              const colors = getScheduleStatusColors(status)
              const interactive = bookable && (canEdit || canRequest)
              const hasValidSlotId = slot.id !== null && slot.id !== undefined
              const details = status === SCHEDULE_STATUS.pending ? [] : [courseName, bookedBy].filter(Boolean)
              const statusFontSize = status === SCHEDULE_STATUS.maintenance ? '7px' : '9px'

              return (
                <Fragment key={slot.mapKey}>
                  <div
                    style={{
                      backgroundColor: '#393E46',
                      padding: '10px 7px',
                      fontWeight: '500',
                      color: '#EEEEEE',
                      borderTop: '1px solid rgba(238,238,238,0.1)',
                      borderRight: '1px solid rgba(238,238,238,0.1)',
                      fontSize: '9px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.45px'
                    }}
                  >
                    {slot.displayLabel}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!hasValidSlotId) return
                      if (canEdit && onAdminAction) {
                        onAdminAction(roomCode, slot.id)
                        return
                      }
                      if (canRequest && onTeacherRequest) {
                        onTeacherRequest(roomCode, slot.id)
                      }
                    }}
                    disabled={!interactive || !hasValidSlotId}
                    style={{
                      backgroundColor: colors.bg,
                      color: colors.text,
                      padding: '10px 7px',
                      textAlign: 'left',
                      transition: 'filter 0.15s',
                      cursor: interactive && hasValidSlotId ? 'pointer' : 'not-allowed',
                      border: 'none',
                      borderTop: '1px solid rgba(238,238,238,0.1)',
                      borderLeft: '1px solid rgba(238,238,238,0.1)'
                    }}
                    onMouseEnter={(event) => {
                      if ((interactive && hasValidSlotId) || status === SCHEDULE_STATUS.occupied) {
                        event.currentTarget.style.filter = 'brightness(1.1)'
                      }
                    }}
                    onMouseLeave={(event) => {
                      if ((interactive && hasValidSlotId) || status === SCHEDULE_STATUS.occupied) {
                        event.currentTarget.style.filter = 'none'
                      }
                    }}
                  >
                    <span
                      style={{
                        display: 'block',
                        fontSize: statusFontSize,
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.6px',
                        color: colors.text
                      }}
                    >
                      {bookable ? statusLabel : 'Unavailable'}
                    </span>
                    {details.length > 0 && (
                      <span
                        style={{
                          marginTop: '4px',
                          display: 'block',
                          fontSize: '8px',
                          color: 'rgba(238,238,238,0.7)'
                        }}
                      >
                        {details.map((line, index) => (
                          <span
                            key={index}
                            style={{
                              display: 'block',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {line}
                          </span>
                        ))}
                      </span>
                    )}
                  </button>
                </Fragment>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default RoomScheduleContent
