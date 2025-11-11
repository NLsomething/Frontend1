import { useNavigate } from 'react-router-dom'
import { COLORS } from '../constants/colors'
import { useAuth } from '../context/AuthContext'
import { signOut } from '../services/authService'
import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import SchoolScene from '../components/SchoolScene'
import { useNotifications } from '../context/NotificationContext'
import { USER_ROLES } from '../constants/roles'
import { SCHEDULE_STATUS, SCHEDULE_STATUS_LABELS } from '../constants/schedule'
import { fetchBuildings } from '../services/buildingService'
import { fetchRoomsByBuildingId } from '../services/roomService'
import { fetchTimeslots } from '../services/timeslotService'
import { cn } from '../utils/classnames'

// Import extracted components
import BuildingInfoModal from '../components/HomePage/BuildingInfoModal'
import BuildingScheduleContent from '../components/HomePage/BuildingScheduleContent'
import RoomScheduleContent from '../components/HomePage/RoomScheduleContent'
import SearchBuilding from '../components/HomePage/SearchBuilding'
import UnifiedPanel from '../components/HomePage/UnifiedPanel'
import UnifiedPanelCenter from '../components/HomePage/UnifiedPanelCenter'
import RequestsPanelContent from '../components/HomePage/RequestsPanelContent'
import MyRequestsPanelContent from '../components/HomePage/MyRequestsPanelContent'
import { UserManagementContent } from '../components/HomePage/UserManagementContent'
import ScheduleRequestContent from '../components/HomePage/ScheduleRequestContent'
import ScheduleEditContent from '../components/HomePage/ScheduleEditContent'

// Custom hooks
import { useCameraControls } from '../hooks/useCameraControls'
import HomePageStateProvider from '../components/HomePage/HomePageStateProvider'
import { useHomePageStore } from '../stores/useHomePageStore'

// Utilities
import {
  toIsoDateString,
  parseDateString,
  groupRoomsByFloor,
  getSlotLabel as resolveSlotLabel
} from '../utils'

//Styles
import '../styles/HomePageStyle.css'

function HomePage() {
  console.log('[HomePage] Component rendering...')
  const navigate = useNavigate()
  const { user, loading, role, profile } = useAuth()
  console.log('[HomePage] Auth state:', { user: !!user, loading, role })
  const { notifyError, notifyInfo, notifySuccess } = useNotifications()
  const controlsRef = useRef()
  const lastDragEndAtRef = useRef(0)
  const lastBuildingClickAtRef = useRef(0)
  const pointerRef = useRef({ downX: 0, downY: 0, moved: false })
  
  // Building state
  const [buildings, setBuildings] = useState([])
  const [building, setBuilding] = useState(null)
  const [buildingLoading, setBuildingLoading] = useState(true)
  const [selectedBuilding, setSelectedBuilding] = useState(null)
  const [isBuildingInfoOpen, setIsBuildingInfoOpen] = useState(false)
  
  // Schedule panel state
  const [isScheduleOpen, setScheduleOpen] = useState(false)
  const [isRoomScheduleOpen, setIsRoomScheduleOpen] = useState(false)
  const [roomScheduleRoomCode, setRoomScheduleRoomCode] = useState(null)
  const [roomScheduleRoomType, setRoomScheduleRoomType] = useState(null)
  
  // Building dropdown state
  const [isBuildingDropdownOpen, setIsBuildingDropdownOpen] = useState(false)
  const [isDropdownClosing, setIsDropdownClosing] = useState(false)
  const dropdownRef = useRef(null)
  
  const [buildingRooms, setBuildingRooms] = useState([])
  const [buildingRoomsLoading, setBuildingRoomsLoading] = useState(false)
  const [scheduleDate, setScheduleDate] = useState(() => new Date())
  const [timeSlots, setTimeSlots] = useState([])
  const [timeSlotsLoading, setTimeSlotsLoading] = useState(true)
  
  // UI state (kept for backward compatibility with existing button states)
  // eslint-disable-next-line no-unused-vars
  const [userManagementOpen, setUserManagementOpen] = useState(false)
  const [heroCollapsed, setHeroCollapsed] = useState(false)
  
  // Unified Panel state
  const [unifiedPanelContentType, setUnifiedPanelContentType] = useState(null) // 'requests' | 'my-requests' | 'user-management' | 'building-info' | null
  const isUnifiedPanelOpen = unifiedPanelContentType !== null

  // Unified Panel Center state (for schedule request/edit)
  const [centerPanelContentType, setCenterPanelContentType] = useState(null) // 'schedule-request' | 'schedule-edit' | null
  const isCenterPanelOpen = centerPanelContentType !== null
  
  // Calculate ISO date
  const isoDate = useMemo(() => toIsoDateString(scheduleDate), [scheduleDate])

  const scheduleMap = useHomePageStore((state) => state.scheduleMap)
  const loadSchedules = useHomePageStore((state) => state.loadSchedules)
  const saveSchedule = useHomePageStore((state) => state.saveSchedule)
  const buildScheduleKey = useHomePageStore((state) => state.buildScheduleKey)
  const [roomScheduleRoomName, setRoomScheduleRoomName] = useState('')
  const [roomScheduleBookable, setRoomScheduleBookable] = useState(true)

  // Make building-derived props stable primitives so they don't cause
  // shallow-prop changes when unrelated UI state updates.
  const buildingModelUrl = useMemo(() => building?.model_url || null, [building?.model_url])
  const buildingPosition = useMemo(() => [building?.pos_x ?? 0, building?.pos_y ?? 0, building?.pos_z ?? 0], [building?.pos_x, building?.pos_y, building?.pos_z])
  const buildingId = building?.id ?? null

  const roomSchedule = useMemo(() => {
    if (!roomScheduleRoomCode || typeof buildScheduleKey !== 'function') return []
    return timeSlots.map((slot) => {
      const slotId = slot.id || slot.slot_id
      const key = buildScheduleKey(roomScheduleRoomCode, slotId)
      const entry = scheduleMap[key]
      if (entry) {
        return entry
      }

      return {
        room_number: roomScheduleRoomCode,
        slot_hour: slotId,
        status: SCHEDULE_STATUS.empty,
        timeslot_id: slotId,
        slot_id: slotId,
        slot_order: slot.slotOrder ?? slot.slot_order ?? null,
        slot_type: slot.slotType || slot.slot_type || null,
        slot_name: slot.slotName || slot.slot_name || null,
        start_time: slot.start_time || slot.startTime || null,
        end_time: slot.end_time || slot.endTime || null
      }
    })
  }, [roomScheduleRoomCode, scheduleMap, buildScheduleKey, timeSlots])

  const handleOpenRoomSchedulePanel = useCallback((roomMeta) => {
    if (!roomMeta) return
    const roomCode =
      roomMeta.room_code || roomMeta.roomNumber || roomMeta.room_number || roomMeta.code || null
    if (!roomCode) return

    const displayName = roomMeta.room_name || roomMeta.roomNumber || roomMeta.room_number || roomCode
    const isBookable =
      String(roomMeta.bookable).toLowerCase() === 'true' || roomMeta.bookable === true

    setRoomScheduleRoomCode(roomCode)
    setRoomScheduleRoomName(displayName)
    setRoomScheduleBookable(isBookable)
    setRoomScheduleRoomType(roomMeta.room_type || null)
    setUnifiedPanelContentType('room-schedule')
    setIsRoomScheduleOpen(true)
  }, [])

  const handleCloseRoomSchedulePanel = useCallback(() => {
    setIsRoomScheduleOpen(false)
    setRoomScheduleRoomCode(null)
    setRoomScheduleRoomName('')
    setRoomScheduleBookable(true)
    setRoomScheduleRoomType(null)
    setUnifiedPanelContentType((prev) => (prev === 'room-schedule' ? null : prev))
  }, [])

  // Utility functions for hooks
  const getSlotLabel = useCallback((slotId) => {
    return resolveSlotLabel(slotId, timeSlots)
  }, [timeSlots])

  const parseDateStringWrapper = useCallback((dateString) => {
    return parseDateString(dateString)
  }, [])

  // Role permissions
  const canEditSchedule = role === USER_ROLES.administrator || role === USER_ROLES.buildingManager
  const canViewSchedule = role === USER_ROLES.teacher || role === USER_ROLES.student || canEditSchedule
  const canManageRequests = canEditSchedule
  const canRequestRoom = role === USER_ROLES.teacher

  const requestsLoading = useHomePageStore((state) => state.requestsLoading)
  const requestActionLoading = useHomePageStore((state) => state.requestActionLoading)
  const pendingRequests = useHomePageStore((state) => state.pendingRequests)
  const rejectionReasons = useHomePageStore((state) => state.rejectionReasons)
  const historicalRequests = useHomePageStore((state) => state.historicalRequests)
  const historicalDateFilter = useHomePageStore((state) => state.historicalDateFilter)
  const myRequests = useHomePageStore((state) => state.myRequests)
  const myRequestsLoading = useHomePageStore((state) => state.myRequestsLoading)
  const filteredMyRequests = useHomePageStore((state) => state.filteredMyRequests)
  const myRequestsDateFilter = useHomePageStore((state) => state.myRequestsDateFilter)
  const requestState = useHomePageStore((state) => state.requestState)
  const requestForm = useHomePageStore((state) => state.requestForm)

  const setRejectionReasons = useHomePageStore((state) => state.setRejectionReasons)
  const approveRequest = useHomePageStore((state) => state.approveRequest)
  const rejectRequest = useHomePageStore((state) => state.rejectRequest)
  const revertRequest = useHomePageStore((state) => state.revertRequest)
  const setRequestsPanelOpen = useHomePageStore((state) => state.setRequestsPanelOpen)
  const setHistoricalDateFilter = useHomePageStore((state) => state.setHistoricalDateFilter)
  const setMyRequestsPanelOpen = useHomePageStore((state) => state.setMyRequestsPanelOpen)
  const setMyRequestsDateFilter = useHomePageStore((state) => state.setMyRequestsDateFilter)
  const submitRequest = useHomePageStore((state) => state.submitRequest)
  const setRequestState = useHomePageStore((state) => state.setRequestState)
  const setRequestForm = useHomePageStore((state) => state.setRequestForm)
  const resetRequestModal = useHomePageStore((state) => state.resetRequestModal)

  // Camera drag detection to guard building select/deselect during drags
  const [/* isCameraInteracting */ , setIsCameraInteracting] = useState(false)

  const handleCameraStart = useCallback(() => {
    setIsCameraInteracting(true)
  }, [])

  const handleCameraEnd = useCallback(() => {
    setIsCameraInteracting(false)
  }, [])

  // Camera controls hook
  useCameraControls(controlsRef, heroCollapsed)

  // Group rooms by floor
  const roomsByFloor = useMemo(() => 
    groupRoomsByFloor(buildingRooms), 
    [buildingRooms]
  )

  const roomLookupByCode = useMemo(() => {
    const map = new Map()
    buildingRooms.forEach((room) => {
      const code = room?.room_code || room?.roomNumber || room?.room_number || room?.code
      if (code) {
        map.set(code, room)
      }
    })
    return map
  }, [buildingRooms])

  const normalizeSlotTypeValue = useCallback((value) => {
    if (!value) return ''
    return value.toString().toLowerCase().replace(/[^a-z0-9]/g, '')
  }, [])

  const requestRoomType = useMemo(() => {
    const roomCode = requestState?.room
    if (!roomCode) return null

    const roomMeta = roomLookupByCode.get(roomCode)
    if (roomMeta?.room_type) {
      return roomMeta.room_type
    }

    const existingEntry = requestState?.existingEntry
    if (existingEntry) {
      return (
        existingEntry.slot_type ||
        existingEntry.timeslot?.slot_type ||
        existingEntry.start_timeslot?.slot_type ||
        existingEntry.end_timeslot?.slot_type ||
        null
      )
    }

    return null
  }, [requestState, roomLookupByCode])

  const filteredRequestTimeSlots = useMemo(() => {
    if (!Array.isArray(timeSlots) || timeSlots.length === 0) {
      return []
    }

    if (!requestRoomType) {
      return timeSlots
    }

    const targetType = normalizeSlotTypeValue(requestRoomType)
    if (!targetType) {
      return timeSlots
    }

    const subset = timeSlots.filter((slot) => {
      const slotType = normalizeSlotTypeValue(slot.slotType || slot.slot_type || slot.type)
      return slotType && slotType === targetType
    })

    return subset.length > 0 ? subset : timeSlots
  }, [timeSlots, requestRoomType, normalizeSlotTypeValue])

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate('/')
    }
  }, [user, loading, navigate])

  // Dropdown
  const handleCloseDropdown = useCallback(() => {
    setIsDropdownClosing(true)
    // Reset Building Info state immediately when dropdown closes
    setIsBuildingInfoOpen(false)
    setTimeout(() => {
      setIsBuildingDropdownOpen(false)
      setIsDropdownClosing(false)
    }, 200) // Match animation duration
  }, [])

  const handleOpenDropdown = useCallback(() => {
    setIsDropdownClosing(false)
    setIsBuildingDropdownOpen(true)
    // Ensure rooms are loaded to populate floor/room list
    if (selectedBuilding && buildingRooms.length === 0 && !buildingRoomsLoading) {
      (async () => {
        try {
          const { data } = await fetchRoomsByBuildingId(selectedBuilding.id)
          if (data) setBuildingRooms(data)
        } catch { /* noop */ }
      })()
    }
  }, [selectedBuilding, buildingRooms.length, buildingRoomsLoading])

  // Dropdown stays open when panels open - don't auto-close it

  useEffect(() => {
    const loadTimeSlots = async () => {
      setTimeSlotsLoading(true)
      try {
        const { data, error } = await fetchTimeslots()

        if (error) {
          console.error('Error loading time slots:', error)
          setTimeSlots([])
          notifyError('Failed to load time slots', {
            description: 'Schedule views may be incomplete until the issue is resolved.'
          })
        } else {
          setTimeSlots(data || [])
        }
      } catch (err) {
        console.error('Unexpected error loading time slots:', err)
        setTimeSlots([])
        notifyError('Failed to load time slots', {
          description: 'Schedule views may be incomplete until the issue is resolved.'
        })
      } finally {
        setTimeSlotsLoading(false)
      }
    }

    loadTimeSlots()
  }, [notifyError])

          // Load building on mount
          useEffect(() => {
            const loadBuilding = async () => {
              setBuildingLoading(true)
              try {
                const { data, error } = await fetchBuildings()
                
                if (error) {
                  console.error('Error loading building:', error)
                  notifyError('Failed to load building model', {
                    description: 'Using default model instead.'
                  })
                } else if (data && data.length > 0) {
                  console.log('[HomePage] Building loaded:', data[0])
                  setBuildings(data)
                  setBuilding(data[0])
                } else {
                  console.log('[HomePage] No buildings found in data:', data)
                }
              } catch (err) {
                console.error('Unexpected error loading building:', err)
              } finally {
                setBuildingLoading(false)
              }
            }

            loadBuilding()
          }, [notifyError])

  // Initialize edit form when entering edit mode
  const [editForm, setEditForm] = useState({
    status: SCHEDULE_STATUS.occupied,
    courseName: '',
    bookedBy: ''
  })

  useEffect(() => {
    if (requestState.isEditMode && requestState.existingEntry) {
      const entry = requestState.existingEntry
      setEditForm({
        status: entry.status || SCHEDULE_STATUS.occupied,
        courseName: entry.course_name || '',
        bookedBy: entry.booked_by || ''
      })
    } else if (!requestState.isEditMode) {
      setEditForm({
        status: SCHEDULE_STATUS.occupied,
        courseName: '',
        bookedBy: ''
      })
    }
  }, [requestState.isEditMode, requestState.existingEntry])

  // Sync center panel with requestState
  useEffect(() => {
    if (requestState.isOpen && requestState.room) {
      setCenterPanelContentType(requestState.isEditMode ? 'schedule-edit' : 'schedule-request')
    } else {
      setCenterPanelContentType(null)
    }
  }, [requestState.isOpen, requestState.room, requestState.isEditMode])

  // Handle center panel close
  const handleCenterPanelClose = useCallback(() => {
    if (typeof resetRequestModal === 'function') {
      resetRequestModal()
    }
    setCenterPanelContentType(null)
    isSubmittingRequestRef.current = false
    setIsSubmittingRequest(false)
    isSubmittingEditRef.current = false
    setIsSubmittingEdit(false)
  }, [resetRequestModal])

  // Request submission loading state (using ref for reliable double-submission prevention)
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false)
  const isSubmittingRequestRef = useRef(false)

  // Handle schedule request submit
  const handleRequestSubmit = useCallback(async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Prevent double submission using ref (more reliable than state)
    if (isSubmittingRequestRef.current) return
    if (!requestState.room || !requestState.startHour || !requestState.endHour) return

    // Set both ref and state
    isSubmittingRequestRef.current = true
    setIsSubmittingRequest(true)
    
    try {
      const roomCode = requestState.room
      const roomMeta = roomCode ? roomLookupByCode.get(roomCode) : null
      const resolvedRoomId = requestState.roomId || roomMeta?.id || requestState.existingEntry?.room_id

      if (!resolvedRoomId) {
        notifyError('Missing room information', {
          description: 'Unable to submit the request because the room identifier could not be resolved.'
        })
        return
      }

      if (typeof submitRequest !== 'function') {
        notifyError('Request service unavailable', {
          description: 'Please try again in a moment.'
        })
        return
      }

      const success = await submitRequest({
        room_id: resolvedRoomId,
        room_code: roomCode,
        room_name: requestState.roomName || roomMeta?.room_name || null,
        base_date: isoDate,
        start_timeslot_id: requestState.startHour,
        end_timeslot_id: requestState.endHour,
        week_count: requestForm.weekCount,
        course_name: requestForm.courseName || null,
        notes: requestForm.notes || null
      })

      if (success) {
        handleCenterPanelClose()
        if (typeof loadSchedules === 'function') {
          loadSchedules()
        }
      }
    } finally {
      isSubmittingRequestRef.current = false
      setIsSubmittingRequest(false)
    }
  }, [requestState, requestForm, isoDate, submitRequest, handleCenterPanelClose, loadSchedules, roomLookupByCode, notifyError])

  // Edit submission loading state (using ref for reliable double-submission prevention)
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false)
  const isSubmittingEditRef = useRef(false)

  // Handle schedule edit submit
  const handleEditSubmit = useCallback(async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Prevent double submission using ref (more reliable than state)
    if (isSubmittingEditRef.current) return
    if (!requestState.room || !requestState.startHour || !requestState.endHour) return

    // Set both ref and state
    isSubmittingEditRef.current = true
    setIsSubmittingEdit(true)

    try {
      if (typeof saveSchedule !== 'function') {
        throw new Error('Schedule handlers are not ready yet.')
      }

      await saveSchedule(requestState, editForm)
      handleCenterPanelClose()
      if (typeof loadSchedules === 'function') {
        loadSchedules()
      }
      notifySuccess('Schedule updated', {
        description: `Room ${requestState.room} schedule has been updated.`
      })
    } catch (error) {
      notifyError('Failed to update schedule', {
        description: error.message || 'Please try again later.'
      })
    } finally {
      isSubmittingEditRef.current = false
      setIsSubmittingEdit(false)
    }
  }, [requestState, editForm, saveSchedule, handleCenterPanelClose, loadSchedules, notifySuccess, notifyError])

  // Handle range change for request/edit
  const handleRangeChange = useCallback((field) => (e) => {
    const rawValue = e.target.value
    const numericValue = Number(rawValue)
    const nextValue = Number.isNaN(numericValue) ? rawValue : numericValue
    if (typeof setRequestState !== 'function') return
    setRequestState((prev) => ({
      ...prev,
      [field]: nextValue
    }))
  }, [setRequestState])

  // Handle form change for request/edit
  const handleRequestFormChange = useCallback((e) => {
    const { name, value } = e.target
    if (typeof setRequestForm !== 'function') return
    setRequestForm(prev => ({
      ...prev,
      [name]: value
    }))
  }, [setRequestForm])

  const handleEditFormChange = useCallback((e) => {
    const { name, value } = e.target
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }))
  }, [])

  // Handle schedule button click (internal function)
  const handleScheduleButtonClickInternal = async () => {
    if (!canViewSchedule) {
      notifyInfo('Access required', {
        description: 'Your role does not allow viewing the room schedule.'
      })
      return
    }
    if (!selectedBuilding) {
      notifyInfo('Building Required', {
        description: 'Please select a building to view its schedule.'
      })
      return
    }
    
    // If opening the panel, load the rooms and schedules
    if (!isScheduleOpen) {
      setBuildingRoomsLoading(true)
      try {
        const { data, error } = await fetchRoomsByBuildingId(selectedBuilding.id)
        if (error) {
          notifyError('Failed to load rooms', {
            description: error.message || 'Could not fetch classroom rooms for this building.'
          })
          setBuildingRoomsLoading(false)
          return
        }
        setBuildingRooms(data || [])
        setBuildingRoomsLoading(false)
        // Load schedule data
        if (typeof loadSchedules === 'function') {
          await loadSchedules()
        }
      } catch (err) {
        notifyError('Failed to load rooms', {
          description: err.message || 'An unexpected error occurred.'
        })
        setBuildingRoomsLoading(false)
        return
      }
    }
    
    setScheduleOpen((prev) => !prev)
  }

  // eslint-disable-next-line no-unused-vars
  const closeAllPanels = () => {
    // Only close header-level panels, not modals
    // DON'T close building dropdown - it stays open when unified panel is open
    setRequestsPanelOpen?.(false)
    setMyRequestsPanelOpen?.(false)
    setIsBuildingInfoOpen(false)
    setScheduleOpen(false)
    setUserManagementOpen(false)
    // Note: isBuildingDropdownOpen is NOT closed here
  }

  const handleRequestsButtonClick = () => {
    if (!canManageRequests) {
      return
    }
    // Don't close dropdown - allow switching content types
    if (unifiedPanelContentType === 'requests') {
      setUnifiedPanelContentType(null)
      setRequestsPanelOpen?.(false)
    } else {
      setUnifiedPanelContentType('requests')
      setRequestsPanelOpen?.(true)
      // Keep Building Info/Schedule states as-is
    }
  }

  // Central close for UnifiedPanel (same behavior as UnifiedPanel onClose prop)
  const handleUnifiedPanelClose = useCallback(() => {
    const currentType = unifiedPanelContentType
    if (currentType === 'room-schedule') {
      handleCloseRoomSchedulePanel()
      return
    }
    setUnifiedPanelContentType(null)
    if (currentType === 'requests') setRequestsPanelOpen?.(false)
    if (currentType === 'my-requests') setMyRequestsPanelOpen?.(false)
    if (currentType === 'user-management') setUserManagementOpen(false)
    if (currentType === 'building-info') setIsBuildingInfoOpen(false)
    if (currentType === 'schedule') setScheduleOpen(false)
  }, [
    unifiedPanelContentType,
    handleCloseRoomSchedulePanel,
    setRequestsPanelOpen,
    setMyRequestsPanelOpen,
    setUserManagementOpen,
    setIsBuildingInfoOpen,
    setScheduleOpen,
    setUnifiedPanelContentType
  ])

  const handleMyRequestsClick = () => {
    // Don't close dropdown - allow switching content types
    if (unifiedPanelContentType === 'my-requests') {
      setUnifiedPanelContentType(null)
      setMyRequestsPanelOpen?.(false)
    } else {
      setUnifiedPanelContentType('my-requests')
      setMyRequestsPanelOpen?.(true)
      // Keep Building Info/Schedule states as-is
    }
  }

  const handleUserManagementClick = () => {
    // Don't close dropdown - allow switching content types
    if (unifiedPanelContentType === 'user-management') {
      setUnifiedPanelContentType(null)
      setUserManagementOpen(false)
    } else {
      setUnifiedPanelContentType('user-management')
    setUserManagementOpen(true)
      // Keep Building Info/Schedule states as-is
    }
  }

  const handleBuildingInfoToggle = () => {
    // Don't close dropdown - allow switching content types
    // Building Info no longer uses UnifiedPanel; just toggle the dropdown section
    setIsBuildingInfoOpen((prev) => !prev)
    // Do not touch the UnifiedPanel content; keep it open if any
    setScheduleOpen(false)
    // Ensure floors are loaded when first opening Building Info
    if (!isBuildingInfoOpen && selectedBuilding && buildingRooms.length === 0 && !buildingRoomsLoading) {
      (async () => {
        try {
          const { data } = await fetchRoomsByBuildingId(selectedBuilding.id)
          if (data) setBuildingRooms(data)
        } catch { /* noop */ }
      })()
    }
  }

  const handleScheduleToggle = () => {
    // Don't close dropdown - allow switching content types
    if (unifiedPanelContentType === 'schedule') {
      setUnifiedPanelContentType(null)
      setScheduleOpen(false)
    } else {
      if (timeSlotsLoading) {
        notifyInfo('Time slots are still loading', {
          description: 'Please try again in a moment.'
        })
        return
      }

      if (!timeSlots || timeSlots.length === 0) {
        notifyError('No time slots available', {
          description: 'Unable to display the schedule without time slot information.'
        })
        return
      }

      // Switch to schedule content in UnifiedPanel
      if (!selectedBuilding) {
        // Need a building selected first
        return
      }
      setUnifiedPanelContentType('schedule')
      setScheduleOpen(true)
      // Allow Building Info to stay open simultaneously
      // Ensure building rooms are loaded
      if (buildingRooms.length === 0 && !buildingRoomsLoading) {
      handleScheduleButtonClickInternal()
      }
    }
  }



  // Create a stable onBuildingClick to pass into the memoized SchoolScene.
  // The actual logic lives in a ref so we can update it when local state changes
  // without recreating the function reference passed to the scene.
  const buildingClickHandlerRef = useRef()
  useEffect(() => {
    buildingClickHandlerRef.current = (clickedBuilding) => {
      // Mirror the logic of handleBuildingClick here so it has access to latest state
      if (Date.now() - (lastDragEndAtRef.current || 0) < 120) {
        return
      }
      lastBuildingClickAtRef.current = Date.now()
      if (isUnifiedPanelOpen) {
        handleUnifiedPanelClose()
        return
      }

      const clickedId = (typeof clickedBuilding === 'object' ? clickedBuilding?.id : clickedBuilding)

      if (selectedBuilding?.id === clickedId) {
        if (isBuildingDropdownOpen) {
          handleCloseDropdown()
        }
        setSelectedBuilding(null)
        setIsBuildingInfoOpen(false)
        setScheduleOpen(false)
        setUnifiedPanelContentType(null)
      } else {
        // Resolve the clicked building object from the available lists if we were passed an id
        let resolved = null
        if (typeof clickedBuilding === 'object') {
          resolved = clickedBuilding
        } else if (clickedId !== undefined && clickedId !== null) {
          resolved = buildings.find(b => b?.id === clickedId) || (building?.id === clickedId ? building : null)
        }
        setSelectedBuilding(resolved)
        handleOpenDropdown()
      }
    }
  }, [isUnifiedPanelOpen, selectedBuilding, isBuildingDropdownOpen, handleUnifiedPanelClose, handleCloseDropdown, handleOpenDropdown, buildings, building])

  const stableOnBuildingClick = useCallback((b) => {
    if (buildingClickHandlerRef.current) buildingClickHandlerRef.current(b)
  }, [])


  const handleRoomSearch = async (building, roomCode) => {
    try {
      // Don't close dropdown - only close non-building panels
      setRequestsPanelOpen?.(false)
      setMyRequestsPanelOpen?.(false)
      setUserManagementOpen(false)
      
      // Select the building
      setSelectedBuilding(building)
      // Auto-open dropdown to show actions immediately after selecting building
      handleOpenDropdown()
      
      // Load building rooms
      setBuildingRoomsLoading(true)
      const { data: buildingRoomsData, error: roomsError } = await fetchRoomsByBuildingId(building.id)
      if (!roomsError && buildingRoomsData) {
        setBuildingRooms(buildingRoomsData)
      }
      setBuildingRoomsLoading(false)

      // Collapse hero if not already collapsed
      if (!heroCollapsed) {
        setHeroCollapsed(true)
      }

      // If room code is provided, open room schedule directly
      if (roomCode) {
        // Search for the room in the building
        const { data: roomsData, error } = await fetchRoomsByBuildingId(building.id)
        
        if (error) {
          notifyError('Room not found', {
            description: `Could not find room ${roomCode} in building ${building.building_code}`
          })
          return
        }

        // Find the room
        const room = roomsData.find(r => r.room_code.toLowerCase() === roomCode.trim().toLowerCase())
        
        if (!room) {
          notifyError('Room not found', {
            description: `Room ${roomCode} does not exist in building ${building.building_code}`
          })
          return
        }

        // Open Building Info and focus the floor containing this room
        setIsBuildingInfoOpen(true)
        window.dispatchEvent(new CustomEvent('search-room', {
          detail: { roomCode: room.room_code }
        }))

        // Open room schedule in UnifiedPanel
        handleOpenRoomSchedulePanel(room)
      } else {
        // Just open building dropdown - don't open unified panel
        // The building is already selected and dropdown is opened above
      }
    } catch (err) {
      console.error('Error searching:', err)
      notifyError('Search failed', {
        description: 'An unexpected error occurred while searching.'
      })
    }
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/')
  }

  console.log('[HomePage] Render state:', { loading, buildingLoading })
  
  if (loading || buildingLoading) {
    console.log('[HomePage] Showing loading screen')
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#0a62c2] border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-slate-500">Loading...</p>
        </div>
      </div>
    )
  }
  
  console.log('[HomePage] Rendering main content')

  return (
    <div className="hp-screen">
      <HomePageStateProvider
        isoDate={isoDate}
        role={role}
        timeSlots={timeSlots}
        buildingRooms={buildingRooms}
        isScheduleOpen={isScheduleOpen}
        isRoomScheduleOpen={isRoomScheduleOpen}
        user={user}
        profile={profile}
        canManageRequests={canManageRequests}
        canRequestRoom={canRequestRoom}
      />
      {/* 3D Canvas */}
      <div
        className={`hp-canvasContainer canvas-container`}
        onMouseDown={(e) => {
          pointerRef.current.downX = e.clientX
          pointerRef.current.downY = e.clientY
          pointerRef.current.moved = false
        }}
        onMouseMove={(e) => {
          const dx = Math.abs(e.clientX - pointerRef.current.downX)
          const dy = Math.abs(e.clientY - pointerRef.current.downY)
          if (dx > 6 || dy > 6) pointerRef.current.moved = true
        }}
        onMouseUp={() => {
          if (pointerRef.current.moved) {
            lastDragEndAtRef.current = Date.now()
          }
        }}
        onClick={(e) => {
          // Plain background click (not a drag) should deselect and close panel if open
          const justDragged = Date.now() - (lastDragEndAtRef.current || 0) < 120
          if (justDragged) return
          // Only respond to left-clicks
          if (e.button !== 0) return
          const target = e.target
          const panelEl = document.querySelector('.unified-panel')
          const insidePanel = panelEl ? panelEl.contains(target) : false
          const insideBuildingDropdown = dropdownRef.current ? dropdownRef.current.contains(target) : false
          // Do not close if click was inside the unified panel or the select building dropdown/button
          if (insidePanel || insideBuildingDropdown) return
          // If a building mesh was just clicked, skip background handler
          if (Date.now() - (lastBuildingClickAtRef.current || 0) < 50) return
          if (isUnifiedPanelOpen) {
            handleUnifiedPanelClose()
            // When unified panel is open, only close the panel, don't deselect building
            return
          }
          if (selectedBuilding) {
            // Trigger dropdown close animation only if it's currently open
            if (isBuildingDropdownOpen) {
              handleCloseDropdown()
            }
            setSelectedBuilding(null)
            setIsBuildingInfoOpen(false)
            setScheduleOpen(false)
            setUnifiedPanelContentType(null)
          }
        }}
      >
        <SchoolScene
          modelUrl={buildingModelUrl}
          position={buildingPosition}
          buildingId={buildingId}
          buildingLoading={buildingLoading}
          heroCollapsed={heroCollapsed}
          controlsRef={controlsRef}
          onBuildingClick={stableOnBuildingClick}
          onCameraStart={handleCameraStart}
          onCameraEnd={handleCameraEnd}
        />
      </div>

      {/* Welcome Notice Overlay, replaces heroIntro and instructions tip */}
      {!heroCollapsed && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/50 backdrop-blur-xs pointer-events-auto">
          <div className="box centered relative bg-[#393e46] border border-[#8991a4] shadow-2xl py-5 px-9 min-w-[340px] max-w-sm w-full flex flex-col items-center" style={{borderRadius: 0}}>
            <div className="text-[#eee] text-center font-sans text-base tracking-wide w-full" style={{lineHeight: 1.25}}>
              <p className="mb-2 text-[1.01rem] md:text-[1.09rem] font-normal whitespace-nowrap">Click and drag to rotate the camera.</p>
              <p className="mb-2 text-[1.01rem] md:text-[1.09rem] font-normal whitespace-nowrap">Right-click and drag to pan.</p>
              <p className="mb-1 text-[1.01rem] md:text-[1.09rem] font-normal whitespace-nowrap">WASD to move.</p>
            </div>
            <button
              tabIndex={0}
              type="button"
              aria-label="Close welcome dialog"
              onClick={() => setHeroCollapsed(true)}
              className="btn-close absolute top-2 right-2 w-8 h-8 bg-transparent border-0 flex items-center justify-center cursor-pointer text-2xl transition text-[#eee] hover:bg-[#222831]/40 focus:outline-none"
              style={{borderRadius: 0}}
            >
              <span className="sr-only">Close</span>
              <svg width="24" height="24" aria-hidden="true" fill="none" stroke="#eee" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M6 6l12 12M6 18L18 6" />
              </svg>
            </button>
              </div>
        </div>
      )}

      {/* Main Overlay */}
  <div className="hp-heroOverlay">
        <div
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_left,_rgba(198,222,255,0.6)_0%,_rgba(166,206,255,0.35)_55%,_rgba(216,236,255,0.2)_100%)]"
          aria-hidden="true"
        />
                {/* Header */}
                <header className="hp-heroHeader">
                  <div className="hp-heroHeaderTop">
                    <div className="hp-heroHeaderTitle">
                      <span className="text-[0.85rem] tracking-[0.8em] text-[#3282B8] font-bold">Classroom</span>
                      <span className="text-[0.85rem] tracking-[0.8em] text-[#EEEEEE]/90 font-medium">Insight</span>
                    </div>
            <div className="hp-heroHeaderActions">
              <div 
                className={`transition-opacity duration-500 h-full flex items-stretch ${heroCollapsed ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              >
                <SearchBuilding
                  buildings={buildings}
                  onRoomSelect={handleRoomSearch}
                  onOpen={() => {
                    setRequestsPanelOpen?.(false)
                    setMyRequestsPanelOpen?.(false)
                    setUserManagementOpen(false)
                  }}
                />
              </div>
              {canRequestRoom && !canManageRequests && (
                <button
                  type="button"
                  onClick={handleMyRequestsClick}
                  className={cn('hp-headerRequestsButton', unifiedPanelContentType === 'my-requests' ? 'hp-headerRequestsButton--active' : '')}
                >
                  My Requests
                </button>
              )}
              {canManageRequests && (
                <button
                  type="button"
                  onClick={handleRequestsButtonClick}
                  className={cn('hp-headerRequestsButton', unifiedPanelContentType === 'requests' ? 'hp-headerRequestsButton--active' : '')}
                >
                  Manage Requests
                </button>
              )}
              {role === USER_ROLES.administrator && (
                <button
                  type="button"
                  onClick={handleUserManagementClick}
                  className={cn('hp-headerUserManagementButton', unifiedPanelContentType === 'user-management' ? 'hp-headerUserManagementButton--active' : '')}
                >
                  User Management
                </button>
              )}
              <div className="ml-3 flex items-center">
              <button
                type="button"
                onClick={handleLogout}
                className="hp-logoutBtn"
              >
                Logout
              </button>
              </div>
            </div>
          </div>
        </header>

                {/* Building-specific Controls */}
                {/* Building Controls - Always visible when hero is collapsed, no sliding */}
                  <div 
                  className={`hp-buildingControlsWrapper ${heroCollapsed ? 'hp-buildingControlsVisible' : 'hp-buildingControlsHidden'}`}
                    >
                  <div className="relative -ml-2" ref={dropdownRef}>
                    <div
                      className={cn(
                        "canvas-building-btn border border-[#EEEEEE]/30 text-[#EEEEEE] shadow-lg backdrop-blur-sm transition-all duration-300 overflow-hidden flex items-center",
                        selectedBuilding !== null ? "" : "border-[#EEEEEE]/10 text-[#EEEEEE]/30",
                        isBuildingDropdownOpen && selectedBuilding
                          ? "px-5 h-14 bg-[#393E46]/60"
                          : "px-5 h-9 bg-[#393E46]/80"
                      )}
                            style={{
                         width: '260px'
                      }}
                    >
                      <div
                        className={cn(
                          "w-full text-left uppercase tracking-[0.28em] transition-all duration-300 flex flex-col items-start justify-center",
                          isBuildingDropdownOpen && selectedBuilding
                            ? "text-[0.9rem] font-bold"
                            : "text-[0.72rem]"
                        )}
                        aria-hidden="true"
                      >
                        {selectedBuilding ? (
                          <>
                            <div className="leading-tight">{selectedBuilding.building_name}</div>
                            <div className={cn(
                              "text-[0.65rem] tracking-[0.24em] mt-1 text-[#EEEEEE]/75 font-normal leading-tight transition-opacity duration-300",
                              isBuildingDropdownOpen ? "opacity-100" : "opacity-0"
                            )}>Building code: {selectedBuilding.building_code}</div>
                          </>
                        ) : (
                          'Select a Building'
                        )}
                  </div>
                </div>

                    {(isBuildingDropdownOpen || isDropdownClosing) && (
                <div 
                        className="building-dropdown absolute top-full left-0 mt-2 z-40 flex flex-col gap-0 pointer-events-auto select-none"
                        style={{
                          animation: isDropdownClosing ? 'slideOutDrop 0.3s ease-out' : 'slideInDrop 0.3s ease-out',
                          background: 'none', border: 'none', boxShadow: 'none', padding: 0, width: '260px'
                        }}
                      >
                        <style>{`
                          @keyframes slideInDrop { from { opacity: 0; transform: translateY(-20px);} to { opacity: 1; transform: translateY(0);} }
                          @keyframes slideOutDrop { from { opacity: 1; transform: translateY(0);} to { opacity: 0; transform: translateY(-20px);} }
                          .no-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
                          .no-scrollbar::-webkit-scrollbar { display: none; }
                        `}</style>
 
                         {/* Actions row */}
                        <div className="flex flex-row gap-2 justify-center mb-2 w-full">
                    <button
                      type="button"
                            onClick={handleBuildingInfoToggle}
                      className={cn(
                              "brutal-btn w-1/2 px-2 py-2 text-[0.58rem] font-bold uppercase tracking-[0.16em] border shadow-none focus:outline-none transition-colors duration-150",
                              isBuildingInfoOpen
                                ? "bg-[rgba(57,62,70,0.5)] text-white border-white"
                                : "bg-[rgba(57,62,70,0.2)] text-[#EEEEEE]/90 border-[#EEEEEE]/60 hover:text-white hover:border-white hover:bg-[rgba(57,62,70,0.35)]"
                      )}
                            style={{ borderRadius: 0 }}
                          >
                            Building Info
                    </button>
                          <button
                            type="button"
                            onClick={handleScheduleToggle}
                            className={cn(
                              "brutal-btn w-1/2 px-2 py-2 text-[0.58rem] font-bold uppercase tracking-[0.16em] border shadow-none focus:outline-none transition-colors duration-150",
                              unifiedPanelContentType === 'schedule'
                                ? "bg-[rgba(57,62,70,0.5)] text-white border-white"
                                : "bg-[rgba(57,62,70,0.2)] text-[#EEEEEE]/90 border-[#EEEEEE]/60 hover:text-white hover:border-white hover:bg-[rgba(57,62,70,0.35)]"
                            )}
                            style={{ borderRadius: 0 }}
                          >
                            Schedule
                          </button>
                        </div>

                        {/* Floor/room accordion with animated open/close and divider */}
                        <>
                          {/* Subtle divider line (centered) with fade/slide */}
                      <div 
                            className={cn("my-2 mx-auto transition-all duration-300 ease-out", isBuildingInfoOpen ? "opacity-100" : "opacity-0")}
                            style={{ width: '260px', height: '1px', backgroundColor: 'rgba(255,255,255,0.6)' }}
                          />
                        <BuildingInfoModal
                          isOpen={isBuildingInfoOpen}
                          roomsByFloor={roomsByFloor}
                          isRoomScheduleOpen={isRoomScheduleOpen && unifiedPanelContentType === 'room-schedule'}
                          activeRoomCode={roomScheduleRoomCode}
                          onOpenRoomSchedule={handleOpenRoomSchedulePanel}
                          onCloseRoomSchedule={handleCloseRoomSchedulePanel}
                        />
                          {/* Subtle divider line below (centered) with fade/slide - outside scrollable container */}
                          <div 
                            className={cn("my-2 mx-auto transition-all duration-300 ease-out", isBuildingInfoOpen ? "opacity-100" : "opacity-0")}
                            style={{ width: '260px', height: '1px', backgroundColor: 'rgba(255,255,255,0.6)' }}
                          />
                       </>
                     </div>
                   )}
                 </div>
               </div>
       </div>
 
       {/* Modals and Panels */}
 
       {/* Unified Panel for Requests, My Requests, User Management, Building Info, and Schedule */}
       <UnifiedPanel
         isOpen={isUnifiedPanelOpen}
         contentType={unifiedPanelContentType}
       >
         {unifiedPanelContentType === 'requests' && canManageRequests && (
           <RequestsPanelContent
             pendingRequests={pendingRequests}
             historicalRequests={historicalRequests}
             requestsLoading={requestsLoading}
             historicalDateFilter={historicalDateFilter}
             rejectionReasons={rejectionReasons}
             setRejectionReasons={setRejectionReasons}
             requestActionLoading={requestActionLoading}
             onDateFilterChange={setHistoricalDateFilter}
             onApprove={(request) => approveRequest(request, { parseDateString: parseDateStringWrapper, toIsoDateString, getSlotLabel })}
             onReject={rejectRequest}
          onRevert={(request) => revertRequest(request, { parseDateString: parseDateStringWrapper, toIsoDateString })}
          timeSlots={timeSlots}
           />
         )}
         {unifiedPanelContentType === 'my-requests' && canRequestRoom && (
           <MyRequestsPanelContent
             myRequests={myRequests}
             filteredMyRequests={filteredMyRequests}
             myRequestsLoading={myRequestsLoading}
             myRequestsDateFilter={myRequestsDateFilter}
             onDateFilterChange={setMyRequestsDateFilter}
            timeSlots={timeSlots}
           />
         )}
         {unifiedPanelContentType === 'user-management' && (
           <UserManagementContent currentUserId={user?.id} />
         )}
         {unifiedPanelContentType === 'schedule' && selectedBuilding && (
           <BuildingScheduleContent
         selectedBuilding={selectedBuilding}
         buildingRooms={buildingRooms}
         buildingRoomsLoading={buildingRoomsLoading}
             roomsByFloor={roomsByFloor}
         scheduleDate={scheduleDate}
         setScheduleDate={setScheduleDate}
         timeSlots={timeSlots}
         onCellClick={(roomMeta, slotHour) => {
           const roomCode = typeof roomMeta === 'string' ? roomMeta : roomMeta?.room_code || roomMeta?.roomNumber || roomMeta?.room_number || null
           const roomName = typeof roomMeta === 'string' ? null : roomMeta?.room_name || roomMeta?.name || null
           const roomId = typeof roomMeta === 'string' ? null : roomMeta?.id || null

           if (!roomCode) {
             notifyError('Missing room details', {
               description: 'Unable to determine which room was selected.'
             })
             return
           }

           if (typeof buildScheduleKey !== 'function') {
             notifyError('Schedule unavailable', {
               description: 'The schedule service is still initialising. Please try again shortly.'
             })
             return
           }

           if (canEditSchedule) {
             const key = buildScheduleKey(roomCode, slotHour)
             const existing = scheduleMap[key]
             setRequestState({
               isOpen: true,
               isEditMode: true,
               room: roomCode,
               roomId: roomId || existing?.room_id || null,
               roomName: roomName || null,
               startHour: slotHour,
               endHour: slotHour,
               existingEntry: existing
             })
           } else if (canRequestRoom) {
             const key = buildScheduleKey(roomCode, slotHour)
             const entry = scheduleMap[key]

             if (entry && entry.status !== SCHEDULE_STATUS.empty && entry.status !== SCHEDULE_STATUS.pending) {
               notifyError('Slot not available', {
                 description: `Room ${roomCode} at ${getSlotLabel(slotHour)} is already ${SCHEDULE_STATUS_LABELS[entry.status].toLowerCase()}.`
               })
               return
             }

             setRequestState({
               isOpen: true,
               isEditMode: false,
               room: roomCode,
               roomId: roomId || null,
               roomName: roomName || null,
               startHour: slotHour,
               endHour: slotHour,
               existingEntry: null
             })
           }
         }}
         canEdit={canEditSchedule}
         canRequest={canRequestRoom}
       />
         )}
        {unifiedPanelContentType === 'room-schedule' && isRoomScheduleOpen && roomScheduleRoomCode && (
          <RoomScheduleContent
            isOpen={true}
            embedded={true}
            roomCode={roomScheduleRoomCode}
            roomName={roomScheduleRoomName}
            bookable={roomScheduleBookable}
            schedule={roomSchedule}
            scheduleDate={isoDate}
            timeSlots={timeSlots}
            roomType={roomScheduleRoomType}
            onDateChange={(val) => {
              if (typeof val === 'string') {
                const parts = val.split('/')
                if (parts.length === 3) {
                  const [dd, mm, yyyy] = parts
                  const y = Number(yyyy)
                  const m = Number(mm) - 1
                  const dNum = Number(dd)
                  const parsed = new Date(y, m, dNum)
                  if (!isNaN(parsed.getTime())) {
                    setScheduleDate(parsed)
                    return
                  }
                }
                // Fallback: today
                setScheduleDate(new Date())
              } else if (val instanceof Date) {
                setScheduleDate(val)
              }
            }}
            canEdit={canEditSchedule}
            canRequest={canRequestRoom}
            onAdminAction={(roomNumber, slotHour) => {
              if (!canEditSchedule) return
              if (typeof buildScheduleKey !== 'function') {
                notifyError('Schedule unavailable', {
                  description: 'The schedule service is still initialising. Please try again shortly.'
                })
                return
              }
              const roomMeta = roomLookupByCode.get(roomNumber)
              const key = buildScheduleKey(roomNumber, slotHour)
              const existing = scheduleMap[key]
              setRequestState({
                isOpen: true,
                isEditMode: true,
                room: roomNumber,
                roomId: existing?.room_id || roomMeta?.id || null,
                roomName: roomMeta?.room_name || roomScheduleRoomName || null,
                startHour: slotHour,
                endHour: slotHour,
                existingEntry: existing
              })
            }}
            onTeacherRequest={(roomNumber, slotHour) => {
              if (!canRequestRoom) return
              if (typeof buildScheduleKey !== 'function') {
                notifyError('Schedule unavailable', {
                  description: 'The schedule service is still initialising. Please try again shortly.'
                })
                return
              }
              const key = buildScheduleKey(roomNumber, slotHour)
              const entry = scheduleMap[key]
              if (entry && entry.status !== SCHEDULE_STATUS.empty && entry.status !== SCHEDULE_STATUS.pending) {
                notifyError('Slot not available', {
                  description: `Room ${roomNumber} at ${getSlotLabel(slotHour)} is already ${SCHEDULE_STATUS_LABELS[entry.status].toLowerCase()}.`
                })
                return
              }
              const roomMeta = roomLookupByCode.get(roomNumber)
              setRequestState({
                isOpen: true,
                isEditMode: false,
                room: roomNumber,
                roomId: roomMeta?.id || null,
                roomName: roomMeta?.room_name || roomScheduleRoomName || null,
                startHour: slotHour,
                endHour: slotHour,
                existingEntry: null
              })
            }}
          />
        )}
       </UnifiedPanel>

      {/* Legacy schedule panel removed; schedule now always renders inside UnifiedPanel */}

      {/* Per-room Schedule rendered in UnifiedPanel (embedded) */}

      {/* Unified Panel Center for Schedule Request/Edit */}
      <UnifiedPanelCenter
        isOpen={isCenterPanelOpen}
        contentType={centerPanelContentType}
        onClose={handleCenterPanelClose}
      >
        {centerPanelContentType === 'schedule-request' && requestState.room && (
          <ScheduleRequestContent
            requestState={requestState}
            requestForm={requestForm}
            timeSlots={filteredRequestTimeSlots}
            isoDate={isoDate}
            submitting={isSubmittingRequest}
            onSubmit={handleRequestSubmit}
            onFormChange={handleRequestFormChange}
            onRangeChange={handleRangeChange}
            onClose={handleCenterPanelClose}
          />
        )}
        {centerPanelContentType === 'schedule-edit' && requestState.room && (
          <ScheduleEditContent
            editState={requestState}
            editForm={editForm}
            timeSlots={filteredRequestTimeSlots}
            submitting={isSubmittingEdit}
            onSubmit={handleEditSubmit}
            onFormChange={handleEditFormChange}
            onRangeChange={handleRangeChange}
            onClose={handleCenterPanelClose}
          />
        )}
      </UnifiedPanelCenter>
    </div>
  )
}

export default HomePage
