import { useState, useEffect } from 'react'
import { getSchedulesByDate } from '../services/scheduleService'

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
        const filtered = (data || []).filter(entry => entry.room_number === code)
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

