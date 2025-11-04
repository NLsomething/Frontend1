import { useState, useEffect, useMemo } from 'react'
import { getSchedulesByDate } from '../services/scheduleService'
import { fetchRoomRequests } from '../services/roomRequestService'
import { SCHEDULE_STATUS } from '../constants/schedule'
import { ROOM_REQUEST_STATUS } from '../constants/requests'

/**
 * Custom hook for managing room schedule data
 * @param {string} roomCode - The room code to fetch schedule for
 * @param {string} scheduleDate - The date to fetch schedule for
 * @param {object} options - Additional data for lookups
 * @param {Array} options.timeSlots - Array of timeslot metadata
 * @returns {object} - Schedule data and loading state
 */
export const useRoomSchedule = (roomCode, scheduleDate, options = {}) => {
  const [roomSchedule, setRoomSchedule] = useState([])
  const [scheduleLoading, setScheduleLoading] = useState(false)
  const { timeSlots = [] } = options

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

  const slotsByType = useMemo(() => {
    const grouped = new Map()
    timeSlots.forEach((slot) => {
      if (!slot) return
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
        return String(a.id ?? a.slot_id ?? '').localeCompare(String(b.id ?? b.slot_id ?? ''))
      })
    })

    return grouped
  }, [timeSlots])

  const resolveSlotSequence = (startId, endId, preferredType) => {
    if (!startId) return []

    const startSlot = slotLookup.get(startId) || slotLookup.get(String(startId))
    const endSlot = endId ? slotLookup.get(endId) || slotLookup.get(String(endId)) : startSlot

    if (!startSlot && !endSlot) {
      return [startId].concat(endId && endId !== startId ? [endId] : [])
    }

    const slotType = (preferredType || startSlot?.slotType || startSlot?.slot_type || endSlot?.slotType || endSlot?.slot_type || 'classroom').toLowerCase()
    const pool = slotsByType.get(slotType) || []

    if (!pool.length) {
      return [startId].concat(endId && endId !== startId ? [endId] : [])
    }

    const startIndex = pool.findIndex((slot) => String(slot.id ?? slot.slot_id) === String(startId))
    const endIndex = endSlot ? pool.findIndex((slot) => String(slot.id ?? slot.slot_id) === String(endId)) : startIndex

    if (startIndex === -1 || endIndex === -1) {
      return [startId].concat(endId && endId !== startId ? [endId] : [])
    }

    const [from, to] = startIndex <= endIndex ? [startIndex, endIndex] : [endIndex, startIndex]
    return pool.slice(from, to + 1).map((slot) => slot.id ?? slot.slot_id ?? slot.slotId ?? slot.hour ?? slot.slot_order)
  }

  const loadRoomSchedule = async (code, date) => {
    if (!code) return

    setScheduleLoading(true)
    try {
      const { data, error } = await getSchedulesByDate(date)
      
      if (error) {
        console.error('Error loading schedule:', error)
        setRoomSchedule([])
      } else {
        // Filter schedules for this room only
        let filtered = (data || []).filter(entry => entry.room_number === code)
        
          // Overlay pending requests as "pending" status
        try {
          const { data: pendingRequests } = await fetchRoomRequests()
          const pending = (pendingRequests || []).filter(req => 
            req.status === ROOM_REQUEST_STATUS.pending && 
            req.room_number === code &&
            req.base_date === date
          )
          
          // Convert pending requests to schedule format
          pending.forEach(request => {
            const startSlotId = request.start_timeslot_id || request.start_timeslot?.id || request.start_hour
            const endSlotId = request.end_timeslot_id || request.end_timeslot?.id || request.end_hour || startSlotId
            const slotType = request.start_timeslot?.slot_type || request.end_timeslot?.slot_type
            const slotIds = resolveSlotSequence(startSlotId, endSlotId, slotType)

            slotIds.forEach((slotId) => {
              const existingIndex = filtered.findIndex(
                entry => String(entry.slot_hour) === String(slotId)
              )

              if (existingIndex === -1) {
                filtered.push({
                  room_number: request.room_number,
                  slot_hour: slotId,
                  status: SCHEDULE_STATUS.pending,
                  course_name: request.course_name || 'Pending Request',
                  booked_by: request.requester_name || request.requester_email,
                  schedule_date: date,
                  timeslot_id: slotId
                })
              } else if (filtered[existingIndex].status === SCHEDULE_STATUS.empty) {
                filtered[existingIndex] = {
                  ...filtered[existingIndex],
                  status: SCHEDULE_STATUS.pending,
                  course_name: request.course_name || filtered[existingIndex].course_name,
                  booked_by: request.requester_name || request.requester_email
                }
              }
            })
          })
        } catch (reqErr) {
          console.error('Error loading pending requests:', reqErr)
        }
        
        setRoomSchedule(filtered)
      }
    } catch (err) {
      console.error('Error loading schedule:', err)
      setRoomSchedule([])
    }
    setScheduleLoading(false)
  }

  // Reload schedule when date or room changes
  useEffect(() => {
    if (roomCode) {
      loadRoomSchedule(roomCode, scheduleDate)
    } else {
      setRoomSchedule([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode, scheduleDate])

  return {
    roomSchedule,
    scheduleLoading,
    loadRoomSchedule
  }
}

