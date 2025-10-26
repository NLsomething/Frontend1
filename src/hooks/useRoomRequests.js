import { useState, useCallback, useMemo, useEffect } from 'react'
import { 
  fetchRoomRequests, 
  createRoomRequest, 
  updateRoomRequestStatus 
} from '../services/roomRequestService'
import { getSchedulesByDate, upsertScheduleEntry, deleteScheduleEntry } from '../services/scheduleService'
import { ROOM_REQUEST_STATUS } from '../constants/requests'
import { SCHEDULE_STATUS } from '../constants/schedule'
import { useNotifications } from '../context/NotificationContext'

/**
 * Custom hook for managing room requests (admin/building manager view)
 * @param {boolean} canManage - Whether user can manage requests
 * @param {boolean} canRequest - Whether user can create requests
 * @param {object} user - Current user object
 * @param {object} profile - User profile
 * @returns {object} - Request state and handlers
 */
export const useRoomRequests = (canManage, canRequest, user, profile) => {
  const { notifySuccess, notifyError, notifyInfo } = useNotifications()
  const [requests, setRequests] = useState([])
  const [requestsLoading, setRequestsLoading] = useState(false)
  const [requestActionLoading, setRequestActionLoading] = useState(false)
  const [rejectionReasons, setRejectionReasons] = useState({})

  const loadRequests = useCallback(async ({ silent = false } = {}) => {
    if (!canManage && !canRequest) {
      return
    }

    if (!silent) {
      setRequestsLoading(true)
    }

    try {
      const { data, error } = await fetchRoomRequests()

      if (error) {
        console.error('Error loading requests:', error.message || error)
        if (!silent) {
          notifyError('Unable to load room requests', {
            description: error.message || 'Please try again later.'
          })
        }
        setRequests([])
      } else {
        setRequests(data)
      }
    } catch (error) {
      console.error('Unexpected error loading requests:', error)
      if (!silent) {
        notifyError('Unable to load room requests', {
          description: 'Please try again later.'
        })
      }
    } finally {
      if (!silent) {
        setRequestsLoading(false)
      }
    }
  }, [canManage, canRequest, notifyError])

  const pendingRequests = useMemo(() => {
    const filtered = requests.filter((request) => request.status === ROOM_REQUEST_STATUS.pending)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.created_at)
      const dateB = new Date(b.created_at)
      return dateA - dateB // Oldest first
    })
  }, [requests])

  const approveRequest = useCallback(async (request, { parseDateString, toIsoDateString, getSlotLabel }) => {
    if (requestActionLoading) return

    setRequestActionLoading(true)

    const startHour = Math.min(request.start_hour, request.end_hour)
    const endHour = Math.max(request.start_hour, request.end_hour)
    const hoursToBlock = []
    for (let hour = startHour; hour <= endHour; hour++) {
      hoursToBlock.push(hour)
    }

    const scheduledDates = []
    const baseDate = parseDateString(request.base_date)
    for (let week = 0; week < request.week_count; week++) {
      const date = new Date(baseDate)
      date.setDate(date.getDate() + week * 7)
      scheduledDates.push({
        iso: toIsoDateString(date),
        display: date
      })
    }

    // Conflict check
    for (const dateInfo of scheduledDates) {
      const { data, error } = await getSchedulesByDate(dateInfo.iso)
      if (error) {
        console.error('Error validating schedule:', error.message || error)
        notifyError('Unable to approve request', {
          description: 'Failed to load schedule data for conflict check.'
        })
        setRequestActionLoading(false)
        return
      }

      const map = new Map()
      data.forEach((entry) => {
        map.set(`${entry.room_number}-${entry.slot_hour}`, entry)
      })

      for (const hour of hoursToBlock) {
        const entry = map.get(`${request.room_number}-${hour}`)
        if (entry && entry.status !== SCHEDULE_STATUS.empty) {
          notifyError('Schedule conflict detected', {
            description: `Room ${request.room_number} on ${dateInfo.display.toLocaleDateString()} at ${getSlotLabel(hour)} is already reserved.`
          })
          setRequestActionLoading(false)
          return
        }
      }
    }

    const appliedEntries = []
    for (const dateInfo of scheduledDates) {
      for (const hour of hoursToBlock) {
        const { error } = await upsertScheduleEntry({
          schedule_date: dateInfo.iso,
          room_number: request.room_number,
          slot_hour: hour,
          status: SCHEDULE_STATUS.occupied,
          course_name: request.course_name || null,
          booked_by: request.booked_by || request.requester_name || 'Reserved'
        })

        if (error) {
          console.error('Error applying schedule entry:', error.message || error)
          // rollback entries already applied
          for (const applied of appliedEntries) {
            await deleteScheduleEntry(applied)
          }
          notifyError('Unable to approve request', {
            description: 'Failed to update the schedule. No changes were kept.'
          })
          setRequestActionLoading(false)
          return
        }

        appliedEntries.push({
          schedule_date: dateInfo.iso,
          room_number: request.room_number,
          slot_hour: hour
        })
      }
    }

    const reviewerName = profile?.username || profile?.full_name || user?.email || 'Reviewer'

    const { error: statusError } = await updateRoomRequestStatus({
      id: request.id,
      status: ROOM_REQUEST_STATUS.approved,
      reviewer_id: user?.id || null,
      reviewer_name: reviewerName
    })

    if (statusError) {
      console.error('Error finalising approval:', statusError.message || statusError)
      for (const applied of appliedEntries) {
        await deleteScheduleEntry(applied)
      }
      notifyError('Unable to finalise approval', {
        description: 'The request status could not be updated. The schedule changes were reverted.'
      })
      setRequestActionLoading(false)
      return
    }

    notifySuccess('Request approved', {
      description: `Room ${request.room_number} reserved from ${scheduledDates[0].display.toLocaleDateString()} for ${request.week_count} week${request.week_count > 1 ? 's' : ''}.`
    })

    setRejectionReasons((prev) => ({
      ...prev,
      [request.id]: ''
    }))
    
    setRequestActionLoading(false)
    return true
  }, [requestActionLoading, user, profile, notifySuccess, notifyError])

  const rejectRequest = useCallback(async (request) => {
    if (requestActionLoading) return

    const reason = (rejectionReasons[request.id] || '').trim()
    setRequestActionLoading(true)
    
    const reviewerName = profile?.username || profile?.full_name || user?.email || 'Reviewer'

    const { error } = await updateRoomRequestStatus({
      id: request.id,
      status: ROOM_REQUEST_STATUS.rejected,
      reviewer_id: user?.id || null,
      reviewer_name: reviewerName,
      rejection_reason: reason || null
    })

    if (error) {
      console.error('Error rejecting request:', error.message || error)
      notifyError('Unable to reject request', {
        description: error.message || 'Please try again later.'
      })
      setRequestActionLoading(false)
      return false
    }

    notifySuccess('Request rejected', {
      description: `Room request for ${request.room_number} has been rejected.`
    })

    setRejectionReasons((prev) => ({
      ...prev,
      [request.id]: ''
    }))
    
    setRequestActionLoading(false)
    return true
  }, [requestActionLoading, user, profile, rejectionReasons, notifySuccess, notifyError])

  const revertRequest = useCallback(async (request, { parseDateString, toIsoDateString }) => {
    if (requestActionLoading) return

    const reason = (rejectionReasons[request.id] || '').trim()

    if (!window.confirm(`Are you sure you want to revert the approved request for Room ${request.room_number}? This will delete all associated schedule entries.`)) {
      return false
    }

    setRequestActionLoading(true)

    const startHour = Math.min(request.start_hour, request.end_hour)
    const endHour = Math.max(request.start_hour, request.end_hour)
    const hoursToBlock = []
    for (let hour = startHour; hour <= endHour; hour++) {
      hoursToBlock.push(hour)
    }

    const scheduledDates = []
    const baseDate = parseDateString(request.base_date)
    for (let week = 0; week < request.week_count; week++) {
      const date = new Date(baseDate)
      date.setDate(date.getDate() + week * 7)
      scheduledDates.push({
        iso: toIsoDateString(date),
        display: date
      })
    }

    // Delete all schedule entries for this request
    const deletedEntries = []
    for (const dateInfo of scheduledDates) {
      for (const hour of hoursToBlock) {
        const { error } = await deleteScheduleEntry({
          schedule_date: dateInfo.iso,
          room_number: request.room_number,
          slot_hour: hour
        })

        if (!error) {
          deletedEntries.push({
            schedule_date: dateInfo.iso,
            room_number: request.room_number,
            slot_hour: hour
          })
        }
      }
    }

    const reviewerName = profile?.username || profile?.full_name || user?.email || 'Reviewer'

    const { error: statusError } = await updateRoomRequestStatus({
      id: request.id,
      status: ROOM_REQUEST_STATUS.reverted,
      reviewer_id: user?.id || null,
      reviewer_name: reviewerName,
      rejection_reason: reason || null
    })

    if (statusError) {
      console.error('Error reverting request:', statusError.message || statusError)
      notifyError('Unable to revert request', {
        description: 'The request status could not be updated.'
      })
      setRequestActionLoading(false)
      return false
    }

    notifySuccess('Request reverted', {
      description: `Room ${request.room_number} request has been reverted. ${deletedEntries.length} schedule ${deletedEntries.length === 1 ? 'entry' : 'entries'} deleted.`
    })

    setRejectionReasons((prev) => ({
      ...prev,
      [request.id]: ''
    }))
    
    setRequestActionLoading(false)
    return true
  }, [requestActionLoading, user, profile, rejectionReasons, notifySuccess, notifyError])

  const submitRequest = useCallback(async (requestData) => {
    try {
      // Add requester information to the request data
      const fullRequestData = {
        ...requestData,
        requester_id: user?.id,
        requester_name: profile?.username || profile?.full_name || user?.user_metadata?.username || user?.email || 'Teacher',
        requester_email: user?.email || null
      }

      const { error } = await createRoomRequest(fullRequestData)

      if (error) {
        throw new Error(error.message || 'Failed to create request')
      }

      notifySuccess('Request submitted', {
        description: `Your room request has been submitted for review.`
      })

      return true
    } catch (error) {
      console.error('Error creating room request:', error)
      notifyError('Unable to submit request', {
        description: error.message || 'Please try again later.'
      })
      return false
    }
  }, [user, profile, notifySuccess, notifyError])

  // UI state for panels
  const [requestsPanelOpen, setRequestsPanelOpen] = useState(false)
  const [myRequestsPanelOpen, setMyRequestsPanelOpen] = useState(false)
  
  // State for request/edit modal
  const [requestState, setRequestState] = useState({ 
    isOpen: false, 
    isEditMode: false,
    room: null, 
    startHour: null, 
    endHour: null,
    existingEntry: null
  })
  
  const [requestForm, setRequestForm] = useState({
    status: '',
    courseName: '',
    bookedBy: '',
    weekCount: 1,
    notes: ''
  })
  
  const resetRequestModal = useCallback(() => {
    setRequestState({ 
      isOpen: false, 
      isEditMode: false,
      room: null, 
      startHour: null, 
      endHour: null,
      existingEntry: null
    })
    setRequestForm({
      status: '',
      courseName: '',
      bookedBy: '',
      weekCount: 1,
      notes: ''
    })
  }, [])
  
  // Historical requests filtering
  const [historicalDateFilter, setHistoricalDateFilter] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })
  
  const historicalRequests = useMemo(() => {
    const filtered = requests.filter((request) => request.status !== ROOM_REQUEST_STATUS.pending)
    
    if (historicalDateFilter.startDate || historicalDateFilter.endDate) {
      return filtered.filter((request) => {
        const reviewedDate = request.reviewed_at ? request.reviewed_at.split('T')[0] : request.created_at.split('T')[0]
        
        const afterStart = !historicalDateFilter.startDate || reviewedDate >= historicalDateFilter.startDate
        const beforeEnd = !historicalDateFilter.endDate || reviewedDate <= historicalDateFilter.endDate
        
        return afterStart && beforeEnd
      })
    }
    
    return filtered
  }, [requests, historicalDateFilter])
  
  // My requests (teacher view)
  const [myRequests, setMyRequests] = useState([])
  const [myRequestsLoading, setMyRequestsLoading] = useState(false)
  const [myRequestsDateFilter, setMyRequestsDateFilter] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })
  
  const loadMyRequests = useCallback(async () => {
    if (!canRequest || !user?.id) {
      return
    }

    setMyRequestsLoading(true)

    try {
      const { data, error } = await fetchRoomRequests()

      if (error) {
        console.error('Error loading my requests:', error.message || error)
        notifyError('Unable to load your requests', {
          description: error.message || 'Please try again later.'
        })
        setMyRequests([])
      } else {
        // Filter to only show current user's requests
        const userRequests = data.filter(req => req.requester_id === user.id)
        setMyRequests(userRequests)
      }
    } catch (error) {
      console.error('Unexpected error loading my requests:', error)
      notifyError('Unable to load your requests', {
        description: 'Please try again later.'
      })
    } finally {
      setMyRequestsLoading(false)
    }
  }, [canRequest, user, notifyError])
  
  const filteredMyRequests = useMemo(() => {
    if (myRequestsDateFilter.startDate || myRequestsDateFilter.endDate) {
      return myRequests.filter((request) => {
        const requestDate = request.reviewed_at ? request.reviewed_at.split('T')[0] : request.created_at.split('T')[0]
        
        const afterStart = !myRequestsDateFilter.startDate || requestDate >= myRequestsDateFilter.startDate
        const beforeEnd = !myRequestsDateFilter.endDate || requestDate <= myRequestsDateFilter.endDate
        
        return afterStart && beforeEnd
      })
    }
    
    return myRequests
  }, [myRequests, myRequestsDateFilter])
  
  // Load requests on mount
  useEffect(() => {
    if (canManage) {
      loadRequests()
    }
  }, [canManage, loadRequests])
  
  // Polling for request updates (admin)
  useEffect(() => {
    if (!canManage) {
      return
    }

    const interval = setInterval(() => {
      loadRequests({ silent: true })
    }, 5000)

    return () => {
      clearInterval(interval)
    }
  }, [canManage, loadRequests])
  
  // Load requests when panel opens
  useEffect(() => {
    if (requestsPanelOpen) {
      loadRequests()
    }
  }, [requestsPanelOpen, loadRequests])
  
  // Load my requests when panel opens
  useEffect(() => {
    if (myRequestsPanelOpen) {
      loadMyRequests()
    }
  }, [myRequestsPanelOpen, loadMyRequests])

  return {
    // Request management
    requests,
    requestsLoading,
    requestActionLoading,
    pendingRequests,
    rejectionReasons,
    setRejectionReasons,
    loadRequests,
    approveRequest,
    rejectRequest,
    revertRequest,
    requestsPanelOpen,
    setRequestsPanelOpen,
    historicalRequests,
    historicalDateFilter,
    setHistoricalDateFilter,
    
    // My requests (teacher view)
    myRequests,
    myRequestsLoading,
    loadMyRequests,
    myRequestsPanelOpen,
    setMyRequestsPanelOpen,
    filteredMyRequests,
    myRequestsDateFilter,
    setMyRequestsDateFilter,
    
    // Request creation
    submitRequest,
    requestState,
    setRequestState,
    requestForm,
    setRequestForm,
    resetRequestModal
  }
}

