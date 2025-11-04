import { useState, useCallback, useMemo } from 'react'
import { getSchedulesByDate, upsertScheduleEntry, deleteScheduleEntry } from '../services/scheduleService'
import { fetchRoomRequests } from '../services/roomRequestService'
import { SCHEDULE_STATUS } from '../constants/schedule'
import { ROOM_REQUEST_STATUS } from '../constants/requests'
import { useNotifications } from '../context/NotificationContext'

/**
 * Custom hook for managing room schedules
 * @param {string} isoDate - The date in ISO format (YYYY-MM-DD)
 * @param {boolean} canViewSchedule - Whether user can view schedules
 * @param {object} options - Additional data used for lookups
 * @param {Array} options.timeSlots - Array of available timeslot objects
 * @param {Array} options.rooms - Array of room objects (used for lookups)
 * @returns {object} - Schedule state and handlers
 */
export const useScheduleManagement = (isoDate, canViewSchedule, options = {}) => {
  const { notifyError } = useNotifications()
  const [scheduleMap, setScheduleMap] = useState({})
  const [scheduleLoading, setScheduleLoading] = useState(false)
  const { timeSlots = [], rooms = [] } = options

  const roomLookup = useMemo(() => {
    const map = new Map()
    rooms.forEach((room) => {
      const code = room.room_code || room.roomNumber || room.room_number
      if (code) {
        map.set(code, room)
      }
    })
    return map
  }, [rooms])

  const slotsByType = useMemo(() => {
    const grouped = new Map()
    timeSlots.forEach((slot) => {
      const slotType = (slot.slotType || slot.slot_type || 'classroom').toLowerCase()
      if (!grouped.has(slotType)) {
        grouped.set(slotType, [])
      }
      grouped.get(slotType).push(slot)
    })

    grouped.forEach((list) => {
      list.sort((a, b) => {
        const orderA = a.slotOrder ?? a.slot_order ?? 0
        const orderB = b.slotOrder ?? b.slot_order ?? 0
        if (orderA !== orderB) return orderA - orderB
        const labelA = (a.label || a.slot_name || a.id || '').toString()
        const labelB = (b.label || b.slot_name || b.id || '').toString()
        return labelA.localeCompare(labelB)
      })
    })

    return grouped
  }, [timeSlots])

  const slotLookup = useMemo(() => {
    const map = new Map()
    timeSlots.forEach((slot) => {
      if (!slot) return
      const ids = new Set()
      const baseId = slot.id ?? slot.slot_id ?? slot.slotId ?? slot.timeslot_id ?? slot.hour
      if (baseId !== undefined && baseId !== null) {
        ids.add(baseId)
        ids.add(String(baseId))
      }
      const order = slot.slot_order ?? slot.slotOrder
      if (order !== undefined && order !== null) {
        ids.add(order)
        ids.add(String(order))
      }
      ids.forEach((key) => {
        if (!map.has(key)) {
          map.set(key, slot)
        }
      })
    })
    return map
  }, [timeSlots])

  const buildScheduleKey = useCallback((roomCode, slotId) => `${roomCode}-${slotId}`, [])

  const loadSchedules = useCallback(async (silent = false) => {
    if (!canViewSchedule) {
      setScheduleMap({})
      return
    }

    if (!silent) {
      setScheduleLoading(true)
    }
    const { data, error } = await getSchedulesByDate(isoDate)

    if (error) {
      console.error('Error loading schedules:', error.message || error)
      setScheduleMap({})
      notifyError('Unable to load schedule data', {
        description: 'Please try again or contact an administrator if the problem continues.'
      })
      if (!silent) {
        setScheduleLoading(false)
      }
      return
    }

    const next = {}
    ;(data || []).forEach((entry) => {
      if (!entry.room_number || !entry.slot_hour) return
  const key = buildScheduleKey(entry.room_number, entry.slot_hour)
      next[key] = entry
    })

    try {
      const { data: pendingRequests, error: requestsError } = await fetchRoomRequests()

      if (!requestsError && pendingRequests) {
        pendingRequests.forEach((request) => {
          if (request.status === ROOM_REQUEST_STATUS.pending && request.base_date === isoDate) {
            const startSlotId = request.start_timeslot_id || request.start_timeslot?.id
            const endSlotId = request.end_timeslot_id || request.end_timeslot?.id
            const roomCode = request.room_code || request.room_number

            if (!startSlotId || !endSlotId || !roomCode) {
              return
            }

            const startSlot = slotLookup.get(startSlotId) || slotLookup.get(String(startSlotId))
            const endSlot = slotLookup.get(endSlotId) || slotLookup.get(String(endSlotId))

            if (!startSlot || !endSlot) {
              return
            }

            const slotType = (startSlot.slotType || startSlot.slot_type || 'classroom').toLowerCase()
            const pool = slotsByType.get(slotType) || []
            const startIndex = pool.findIndex((slot) => slot.id === startSlotId)
            const endIndex = pool.findIndex((slot) => slot.id === endSlotId)

            if (startIndex === -1 || endIndex === -1) {
              return
            }

            const [from, to] = startIndex <= endIndex ? [startIndex, endIndex] : [endIndex, startIndex]
            for (let idx = from; idx <= to; idx++) {
              const pendingSlot = pool[idx]
              if (!pendingSlot) continue
              const key = buildScheduleKey(roomCode, pendingSlot.id)
              if (!next[key] || next[key].status === SCHEDULE_STATUS.empty) {
                next[key] = {
                  room_number: roomCode,
                  slot_hour: pendingSlot.id,
                  status: SCHEDULE_STATUS.pending,
                  course_name: request.course_name || null,
                  booked_by: request.requester_name || request.requester_email || null,
                  schedule_date: isoDate
                }
              }
            }
          }
        })
      }
    } catch (err) {
      console.error('Error loading pending requests for overlay:', err)
    }

    setScheduleMap(next)
    if (!silent) {
      setScheduleLoading(false)
    }
  }, [buildScheduleKey, canViewSchedule, isoDate, notifyError, slotLookup, slotsByType])

  const saveScheduleEntries = useCallback(async (requestState, form) => {
    const { room, roomId: explicitRoomId, startHour, endHour } = requestState

    if (!room) {
      throw new Error('Room code is required')
    }

    const startSlot = slotLookup.get(startHour) || slotLookup.get(String(startHour))
    const endSlot = slotLookup.get(endHour) || slotLookup.get(String(endHour))

    if (!startSlot || !endSlot) {
      throw new Error('Invalid time slot selection')
    }

    const slotType = (startSlot.slotType || startSlot.slot_type || 'classroom').toLowerCase()
    const pool = slotsByType.get(slotType) || []
    const startIndex = pool.findIndex((slot) => slot.id === startSlot.id)
    const endIndex = pool.findIndex((slot) => slot.id === endSlot.id)

    if (startIndex === -1 || endIndex === -1) {
      throw new Error('Unable to locate selected time slots')
    }

    const [from, to] = startIndex <= endIndex ? [startIndex, endIndex] : [endIndex, startIndex]
    const slotsToUpdate = pool.slice(from, to + 1)

    if (!slotsToUpdate.length) {
      throw new Error('Invalid time range')
    }

    const roomMeta = roomLookup.get(room)
    const roomId = explicitRoomId || roomMeta?.id

    if (!roomId) {
      throw new Error('Unable to determine room identifier')
    }

    const shouldDelete = form.status === SCHEDULE_STATUS.empty

    for (const slot of slotsToUpdate) {
      const slotId = slot.id
      const key = buildScheduleKey(room, slotId)
      const existing = scheduleMap[key]

      if (shouldDelete) {
        const { error } = await deleteScheduleEntry({
          id: existing?.id,
          schedule_date: isoDate,
          room_id: roomId,
          timeslot_id: slotId
        })

        if (error) {
          throw new Error(error.message || 'Failed to delete schedule entry')
        }
      } else {
        const { error } = await upsertScheduleEntry({
          id: existing?.id,
          schedule_date: isoDate,
          room_id: roomId,
          timeslot_id: slotId,
          status: form.status,
          course_name: form.courseName?.trim() || '',
          booked_by: form.bookedBy?.trim() || ''
        })

        if (error) {
          throw new Error(error.message || 'Failed to save schedule entry')
        }
      }
    }

    await loadSchedules()
    return slotsToUpdate.map((slot) => slot.id)
  }, [buildScheduleKey, isoDate, loadSchedules, roomLookup, scheduleMap, slotLookup, slotsByType])

  return {
    scheduleMap,
    scheduleLoading,
    buildScheduleKey,
    loadSchedules,
    saveSchedule: saveScheduleEntries,
    deleteSchedule: saveScheduleEntries
  }
}

