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
 * @returns {object} - Schedule state and handlers
 */
export const useScheduleManagement = (isoDate, canViewSchedule) => {
  const { notifyError } = useNotifications()
  const [scheduleMap, setScheduleMap] = useState({})
  const [scheduleLoading, setScheduleLoading] = useState(false)

  const buildScheduleKey = useCallback((roomNumber, slotHour) => 
    `${roomNumber}-${slotHour}`, 
  [])

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

    // Build the schedule map from database entries
    const next = {}
    data.forEach((entry) => {
      const key = buildScheduleKey(entry.room_number, entry.slot_hour)
      next[key] = entry
    })

    // Overlay pending requests as "pending" status
    try {
      const { data: pendingRequests, error: requestsError } = await fetchRoomRequests()
      
      if (!requestsError && pendingRequests) {
        pendingRequests.forEach((request) => {
          // Only show pending requests for current date
          if (request.status === ROOM_REQUEST_STATUS.pending && request.base_date === isoDate) {
            const startHour = Math.min(request.start_hour, request.end_hour)
            const endHour = Math.max(request.start_hour, request.end_hour)
            
            for (let hour = startHour; hour <= endHour; hour++) {
              const key = buildScheduleKey(request.room_number, hour)
              // Only mark as pending if slot is not already occupied/maintenance
              if (!next[key] || next[key].status === SCHEDULE_STATUS.empty) {
                next[key] = {
                  room_number: request.room_number,
                  slot_hour: hour,
                  status: SCHEDULE_STATUS.pending,
                  course_name: null,
                  booked_by: null,
                  schedule_date: isoDate
                }
              }
            }
          }
        })
      }
    } catch (err) {
      console.error('Error loading pending requests for overlay:', err)
      // Continue without pending overlay
    }

    setScheduleMap(next)
    if (!silent) {
      setScheduleLoading(false)
    }
  }, [buildScheduleKey, isoDate, canViewSchedule, notifyError])

  const saveScheduleEntries = useCallback(async (requestState, form) => {
    const { room, startHour, endHour } = requestState
    const start = Math.min(startHour, endHour)
    const end = Math.max(startHour, endHour)
    
    const hoursToUpdate = []
    for (let hour = start; hour <= end; hour++) {
      hoursToUpdate.push(hour)
    }

    if (!hoursToUpdate.length) {
      throw new Error('Invalid time range')
    }

    // If status is empty, delete the schedule entries
    if (form.status === SCHEDULE_STATUS.empty) {
      for (const hour of hoursToUpdate) {
        const { error } = await deleteScheduleEntry({
          schedule_date: isoDate,
          room_number: room,
          slot_hour: hour
        })

        if (error) {
          throw new Error(error.message || 'Failed to delete schedule entry')
        }
      }
    } else {
      // Update/insert entries
      for (const hour of hoursToUpdate) {
        const key = buildScheduleKey(room, hour)
        const existing = scheduleMap[key]
        const { error } = await upsertScheduleEntry({
          id: existing?.id,
          schedule_date: isoDate,
          room_number: room,
          slot_hour: hour,
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
    return hoursToUpdate
  }, [isoDate, scheduleMap, buildScheduleKey, loadSchedules])

  return {
    scheduleMap,
    scheduleLoading,
    buildScheduleKey,
    loadSchedules,
    saveSchedule: saveScheduleEntries,
    deleteSchedule: saveScheduleEntries // Same function handles both based on form.status
  }
}

