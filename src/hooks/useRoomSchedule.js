import { useState, useEffect } from 'react'
import { getSchedulesByDate } from '../services/scheduleService'
import { fetchRoomRequests } from '../services/roomRequestService'
import { SCHEDULE_STATUS } from '../constants/schedule'
import { ROOM_REQUEST_STATUS } from '../constants/requests'

/**
 * Custom hook for managing room schedule data
 * @param {string} roomCode - The room code to fetch schedule for
 * @param {string} scheduleDate - The date to fetch schedule for
 * @returns {object} - Schedule data and loading state
 */
export const useRoomSchedule = (roomCode, scheduleDate) => {
  const [roomSchedule, setRoomSchedule] = useState([])
  const [scheduleLoading, setScheduleLoading] = useState(false)

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
            const startHour = Math.min(request.start_hour, request.end_hour)
            const endHour = Math.max(request.start_hour, request.end_hour)
            
            for (let hour = startHour; hour <= endHour; hour++) {
              const existingIndex = filtered.findIndex(
                entry => entry.slot_hour === hour
              )
              
              if (existingIndex === -1) {
                // Add new pending entry
                filtered.push({
                  room_number: request.room_number,
                  slot_hour: hour,
                  status: SCHEDULE_STATUS.pending,
                  course_name: request.course_name || 'Pending Request',
                  booked_by: request.requester_name || request.requester_email,
                  schedule_date: date
                })
              } else {
                // Only mark as pending if slot is not already occupied/maintenance
                if (filtered[existingIndex].status === SCHEDULE_STATUS.empty) {
                  filtered[existingIndex] = {
                    ...filtered[existingIndex],
                    status: SCHEDULE_STATUS.pending,
                    course_name: request.course_name || filtered[existingIndex].course_name,
                    booked_by: request.requester_name || request.requester_email
                  }
                }
              }
            }
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

