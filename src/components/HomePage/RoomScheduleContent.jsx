import { Fragment, useEffect, useMemo, useState } from 'react'
import { SCHEDULE_STATUS, SCHEDULE_STATUS_LABELS } from '../../constants/schedule'
import '../../styles/HomePageStyle/RoomScheduleStyle.css'
import { useHomePageStore, selectScheduleSlice } from '../../stores/useHomePageStore'
import { fetchRoomRequests } from '../../services/roomRequestService'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationContext'

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

  const { user } = useAuth()
  const { notifyInfo } = useNotifications()
  const [pendingRequestsForDate, setPendingRequestsForDate] = useState([])

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const { data } = await fetchRoomRequests()
        if (!mounted || !Array.isArray(data)) return

        const toIso = (d) => {
          if (!d) return ''
          const date = new Date(d)
          if (Number.isNaN(date.getTime())) return ''
          const y = date.getFullYear()
          const m = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          return `${y}-${m}-${day}`
        }

        const parseDdMmYyyyToIso = (s) => {
          if (!s) return ''
          const parts = s.split('/')
          if (parts.length !== 3) return ''
          const [dd, mm, yyyy] = parts
          return `${yyyy}-${String(Number(mm)).padStart(2,'0')}-${String(Number(dd)).padStart(2,'0')}`
        }

        const iso = parseDdMmYyyyToIso(scheduleDate)
        const appliesToDate = (req, isoStr) => {
          if (!req || !isoStr) return false
          const base = req.base_date
          if (!base) return false
          const weekCount = Number(req.week_count) || 1
          const baseDate = new Date(base)
          if (Number.isNaN(baseDate.getTime())) return false
          for (let w = 0; w < weekCount; w++) {
            const d = new Date(baseDate)
            d.setDate(d.getDate() + w * 7)
            if (toIso(d) === isoStr) return true
          }
          return false
        }

        setPendingRequestsForDate(Array.isArray(data) ? data.filter(r => r.status === 'pending' && appliesToDate(r, iso)) : [])
      } catch {
        // best-effort
      }
    }
    load()
    return () => { mounted = false }
  }, [scheduleDate])

  const slotIndexMap = useMemo(() => {
    const map = new Map()
    timeSlots.forEach((slot, idx) => {
      const key = slot.mapKey ?? slot.id ?? slot.slot_id ?? slot.slotId ?? slot.hour ?? slot.slot_order
      if (key !== undefined && key !== null) {
        map.set(String(key), idx)
      }
    })
    return map
  }, [timeSlots])

  const slotCoveredByPendingForUser = (roomCode, slotKey) => {
    if (!Array.isArray(pendingRequestsForDate) || pendingRequestsForDate.length === 0) return false
    const targetIdx = slotIndexMap.get(String(slotKey))

    return pendingRequestsForDate.some((request) => {
      if (request.status !== 'pending') return false
      if (!user || request.requester_id !== user.id) return false
      const reqRoom = request.room_code || request.room_number || request.room || ''
      if (String(reqRoom) !== String(roomCode)) return false

      const start = request.start_timeslot_id || (request.start_timeslot && request.start_timeslot.id)
      const end = request.end_timeslot_id || (request.end_timeslot && request.end_timeslot.id) || start

      if (targetIdx !== undefined) {
        const startIdx = slotIndexMap.get(String(start))
        const endIdx = slotIndexMap.get(String(end))
        if (startIdx !== undefined && endIdx !== undefined) {
          const from = Math.min(startIdx, endIdx)
          const to = Math.max(startIdx, endIdx)
          return targetIdx >= from && targetIdx <= to
        }
      }

      return String(slotKey) === String(start) || String(slotKey) === String(end)
    })
  }

  const slotCoveredByAnyPending = (roomCode, slotKey) => {
    if (!Array.isArray(pendingRequestsForDate) || pendingRequestsForDate.length === 0) return false
    const targetIdx = slotIndexMap.get(String(slotKey))
    return pendingRequestsForDate.some((request) => {
      const reqRoom = request.room_code || request.room_number || request.room || ''
      if (String(reqRoom) !== String(roomCode)) return false
      const start = request.start_timeslot_id || (request.start_timeslot && request.start_timeslot.id)
      const end = request.end_timeslot_id || (request.end_timeslot && request.end_timeslot.id) || start
      if (targetIdx !== undefined) {
        const startIdx = slotIndexMap.get(String(start))
        const endIdx = slotIndexMap.get(String(end))
        if (startIdx !== undefined && endIdx !== undefined) {
          const from = Math.min(startIdx, endIdx)
          const to = Math.max(startIdx, endIdx)
          return targetIdx >= from && targetIdx <= to
        }
      }
      return String(slotKey) === String(start) || String(slotKey) === String(end)
    })
  }

  if (!roomCode) return null

  return (
    <div
      className={`rs-root
      ${embedded ? 'embedded' : ''}
      ${!embedded && mounted && isOpen ? 'opened' : ''}`}
    >
      <div className={`rs-header ${embedded? 'embedded' : ''}`}>
        <h3 className={`rs-title ${embedded ? 'embedded' : ''}`}>
          {roomName || roomCode}
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
        const anyPending = slotCoveredByAnyPending(roomCode, slot.id ?? slot.mapKey)
        const finalStatus = scheduleEntry?.status === SCHEDULE_STATUS.pending || anyPending ? SCHEDULE_STATUS.pending : scheduleEntry?.status || SCHEDULE_STATUS.empty
        const statusLabel = SCHEDULE_STATUS_LABELS[finalStatus]
        const courseName = scheduleEntry?.course_name || ''
        const bookedBy = scheduleEntry?.booked_by || ''
        const interactive = bookable && (canEdit || canRequest)
        const hasValidSlotId = slot.id !== null && slot.id !== undefined
        const details = finalStatus === SCHEDULE_STATUS.pending ? [] : [courseName, bookedBy].filter(Boolean)

      const blockedByPending = slotCoveredByPendingForUser(roomCode, slot.id ?? slot.mapKey)
              return (
                <Fragment key={slot.mapKey}>
                  <div className="rs-slot-name">{slot.displayLabel}</div>
                  <button
                    type="button"
                    onClick={() => {
                      if (blockedByPending) {
                        notifyInfo('You already have a pending request for this slot.')
                        return
                      }
                      if (!hasValidSlotId) return
                      if (canEdit && onAdminAction) {
                        onAdminAction(roomCode, slot.id)
                        return
                      }
                      if (canRequest && onTeacherRequest) {
                        onTeacherRequest(roomCode, slot.id)
                      }
                    }}
                    disabled={!interactive || !hasValidSlotId || blockedByPending}
                    className={`rs-slot ${interactive && hasValidSlotId ? 'interactive' : ''} status-${finalStatus}`}
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
