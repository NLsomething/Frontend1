import { Fragment, useEffect, useMemo, useState } from 'react'
import { SCHEDULE_STATUS, SCHEDULE_STATUS_LABELS } from '../../constants/schedule'
import '../../styles/HomePageStyle/RoomScheduleStyle.css'
import { useHomePageStore, selectScheduleSlice } from '../../stores/useHomePageStore'

const DEFAULT_SLOT_CATEGORY = 'classroom'

const RoomScheduleContent = ({
  isOpen,
  roomCode,
  roomName,
  bookable = true,
  schedule = [],
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
  const { scheduleLoading } = useHomePageStore(selectScheduleSlice)

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
      className={`rs-root
      ${embedded ? 'embedded' : ''}
      ${!embedded && mounted && isOpen ? 'opened' : ''}`}
    >
      <div className={`rs-header ${embedded? 'embedded' : ''}`}>
        <h3 className={`rs-title ${embedded ? 'embedded' : ''}`}>
          {`Room ${roomName || roomCode}`}
        </h3>
        <div className="rs-meta">Room code: {roomCode}</div>
        <div className="rs-date">
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
            className="rs-date-input"
          />
        </div>
      </div>

      <div
        className={`rs-scroll 
        ${embedded ? 'embedded' : ''} 
        ${!bookable ? 'unbookable' : ''}`}
      >
        {!bookable ? (
          <div className={`rs-message ${embedded ? 'embedded' : ''}`}>
            <div className="rs-notice">This room cannot be booked.</div>
          </div>
        ) : scheduleLoading ? (
          <div className="rs-message">Loading schedule...</div>
        ) : filteredSlots.length === 0 ? (
          <div className="rs-message">No time slots available for this view.</div>
        ) : (
          <div className="rs-grid">
            {filteredSlots.map((slot) => {
              const slotMapKey = slot.mapKey
              const scheduleEntry = slotMapKey ? scheduleBySlotId.get(slotMapKey) : undefined
              const status = scheduleEntry?.status || SCHEDULE_STATUS.empty
              const statusLabel = SCHEDULE_STATUS_LABELS[status]
              const courseName = scheduleEntry?.course_name || ''
              const bookedBy = scheduleEntry?.booked_by || ''
              const interactive = bookable && (canEdit || canRequest)
              const hasValidSlotId = slot.id !== null && slot.id !== undefined
              const details = status === SCHEDULE_STATUS.pending ? [] : [courseName, bookedBy].filter(Boolean)

              return (
                <Fragment key={slot.mapKey}>
                  <div className="rs-slot-name">{slot.displayLabel}</div>
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
                    className={`rs-slot ${interactive && hasValidSlotId ? 'interactive' : ''} status-${status}`}
                  >
                    <span className="rs-slot-label">
                      {bookable ? statusLabel : 'Unavailable'}
                    </span>
                    {details.length > 0 && (
                      <span className="rs-slot-details">
                        {details.map((line, index) => (
                          <span key={index}>{line}</span>
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
