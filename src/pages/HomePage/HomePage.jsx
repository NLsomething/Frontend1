import { useNavigate } from 'react-router-dom'
import { COLORS } from '../../constants/colors'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useAuth } from '../../context/AuthContext'
import { signOut } from '../../services/authService'
import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import SchoolModel from '../../components/SchoolModel'
import BuildingInfoModal from '../../components/BuildingInfo'
import UserManagementModal from '../../components/UserManagementModal'
import SchedulePanel from '../../components/BuildingInfo/SchedulePanel'
import { useNotifications } from '../../context/NotificationContext'
import { USER_ROLES } from '../../constants/roles'
import { SCHEDULE_STATUS, SCHEDULE_STATUS_LABELS } from '../../constants/schedule'
import { fetchBuildings } from '../../services/buildingService'
import { fetchRoomsByBuildingId } from '../../services/roomService'
import { fetchTimeslots } from '../../services/timeslotService'
import { cn } from '../../styles/shared'

// Import extracted components
import {
  ScheduleEditModal,
  RoomRequestModal,
  BuildingSchedulePanel,
  SearchBuilding
} from './'
import UnifiedPanel from './UnifiedPanel'
import UnifiedPanelCenter from './UnifiedPanelCenter'
import { RequestsPanelContent, MyRequestsPanelContent } from './UnifiedPanelContent'
import { UserManagementContent } from './UserManagementContent'
import { BuildingSchedulePanelContent } from './BuildingSchedulePanelContent'
import BuildingSidebar from '../../components/BuildingInfo/BuildingSidebar'
import ScheduleRequestContent from './ScheduleRequestContent'
import ScheduleEditContent from './ScheduleEditContent'

// Import custom hooks
import { useScheduleManagement } from '../../hooks/useScheduleManagement'
import { useRoomRequests } from '../../hooks/useRoomRequests'
import { useCameraControls } from '../../hooks/useCameraControls'

// Import utilities
import {
  toIsoDateString,
  parseDateString,
  groupRoomsByFloor,
  getSlotLabel as resolveSlotLabel
} from '../../utils'

// Styles
const styles = {
  screen: "relative min-h-screen overflow-hidden bg-gradient-to-br from-[#e6f1ff] via-[#f7fbff] to-white text-[#EEEEEE]",
  canvasContainer: "absolute inset-0 z-0",
  logoutBtn: "uppercase tracking-[0.28em] text-[0.6rem] px-6 h-[60%] inline-flex items-center border border-[#EEEEEE]/20 bg-transparent text-[#EEEEEE] shadow-sm transition-all duration-200 hover:bg-[#2f3a4a] hover:border-[#EEEEEE]/40",
  headerRequestsButton: (isOpen, loading) => cn(
    "uppercase tracking-[0.28em] text-[0.6rem] px-6 h-full inline-flex items-center border-y-0 border-l border-r border-[#2f3a4a] bg-transparent text-[#EEEEEE] transition-all duration-200",
    loading ? "opacity-50 cursor-not-allowed" : "hover:bg-[#2f3a4a]",
    isOpen ? "bg-[#2f3a4a]" : ""
  ),
  headerUserManagementButton: "uppercase tracking-[0.28em] text-[0.6rem] px-6 h-full inline-flex items-center border-y-0 border-l border-r border-[#2f3a4a] bg-transparent text-[#EEEEEE] transition-all duration-200 hover:bg-[#2f3a4a]",
  canvasInstructions: "absolute bottom-2 left-1/2 -translate-x-1/2 z-10 text-[0.6rem] uppercase tracking-[0.3em] text-[#EEEEEE] bg-[#393E46]/80 border border-[#EEEEEE]/20 px-5 py-2 rounded-full pointer-events-none select-none transition-all duration-500 ease-in-out transform",
  canvasInstructionsVisible: "translate-y-0 opacity-100",
  canvasInstructionsHidden: "translate-y-full opacity-0",
  myRequestsButton: (isOpen) => cn(
    "uppercase tracking-[0.28em] text-[0.6rem] px-5 py-2.5 border border-[#EEEEEE]/30 bg-[#393E46]/40 text-[#EEEEEE] shadow-lg backdrop-blur-sm transition-colors duration-200",
    isOpen ? "border-yellow-500 text-yellow-500" : "hover:text-yellow-500 hover:border-yellow-500"
  ),
  buildingInfoButton: (isOpen, hasBuilding) => cn(
    "uppercase tracking-[0.28em] text-[0.6rem] px-6 h-full inline-flex items-center border border-[#EEEEEE]/20 bg-transparent text-[#EEEEEE] shadow-sm transition-all duration-200",
    hasBuilding 
      ? isOpen ? "bg-[#2f3a4a] border-[#EEEEEE]/40" : "hover:bg-[#2f3a4a] hover:border-[#EEEEEE]/40"
      : "border-[#EEEEEE]/10 text-[#EEEEEE]/30 cursor-not-allowed"
  ),
  scheduleButton: (isOpen, hasBuilding) => cn(
    "uppercase tracking-[0.28em] text-[0.6rem] px-6 h-full inline-flex items-center border border-[#EEEEEE]/20 bg-transparent text-[#EEEEEE] shadow-sm transition-all duration-200",
    hasBuilding 
      ? isOpen ? "bg-[#2f3a4a] border-[#EEEEEE]/40" : "hover:bg-[#2f3a4a] hover:border-[#EEEEEE]/40"
      : "border-[#EEEEEE]/10 text-[#EEEEEE]/30 cursor-not-allowed"
  ),
  heroOverlay: "absolute inset-0 z-20 pointer-events-none flex flex-col items-stretch justify-start gap-6 px-0 pt-0 pb-12",
  heroHeader: "relative z-10 pointer-events-auto w-full px-6 md:px-10 bg-[#222831] text-[#EEEEEE] border-b border-[#EEEEEE]/15 shadow-lg",
  heroHeaderTop: "flex w-full flex-nowrap items-stretch justify-between gap-3 h-14 overflow-hidden",
  heroHeaderTitle: "flex flex-col gap-0.5 text-[0.6rem] uppercase tracking-[0.35em] justify-center",
  heroHeaderActions: "flex flex-wrap items-stretch justify-end gap-0 h-full",
  heroContent: "relative z-10 flex w-full flex-col justify-center pl-8 md:pl-12",
  heroIntro: "flex flex-col gap-6 text-[#EEEEEE] transition-all duration-500 ease-in-out transform",
  heroIntroVisible: "translate-x-0 opacity-100 pointer-events-auto",
  heroIntroHidden: "-translate-x-full opacity-0 pointer-events-none",
  heroActions: "flex flex-wrap items-center gap-4",
  heroControlsWrapper: "relative flex flex-col gap-3 transition-all duration-500 ease-in-out transform",
  heroControlsVisible: "translate-x-0 opacity-100 pointer-events-auto",
  heroControlsHidden: "-translate-x-full opacity-0 pointer-events-none",
  heroControls: "flex flex-col gap-2.5",
  heroControlRow: "flex flex-wrap items-center justify-start gap-2.5",
  buildingControlsWrapper: "absolute top-[5.1rem] left-5 md:left-8 z-30 pointer-events-auto flex flex-col gap-2.5 transition-opacity duration-200",
  buildingControlsVisible: "opacity-100",
  buildingControlsHidden: "opacity-0 pointer-events-none"
}

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
  const floorRoomListScrollRef = useRef(null)
  
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
  
  // BuildingSidebar state (for UnifiedPanel building-info content)
  const [expandedFloorKey, setExpandedFloorKey] = useState(null)
  const toggleFloor = (floorKey) => {
    setExpandedFloorKey((prev) => (prev === floorKey ? null : floorKey))
  }

  // Calculate ISO date
  const isoDate = useMemo(() => toIsoDateString(scheduleDate), [scheduleDate])

  const {
    scheduleMap,
    scheduleLoading,
    loadSchedules,
    buildScheduleKey,
    saveSchedule
  } = useScheduleManagement(
    isoDate,
    role === USER_ROLES.teacher ||
      role === USER_ROLES.student ||
      role === USER_ROLES.administrator ||
      role === USER_ROLES.buildingManager,
    {
      timeSlots,
      rooms: buildingRooms
    }
  )
  const [roomScheduleRoomName, setRoomScheduleRoomName] = useState('')
  const [roomScheduleBookable, setRoomScheduleBookable] = useState(true)

  const roomSchedule = useMemo(() => {
    if (!roomScheduleRoomCode) return []
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

  // Use custom hooks
  const {
    // Request management
    // eslint-disable-next-line no-unused-vars
    requests,
    requestsLoading,
    approveRequest,
    rejectRequest,
    revertRequest,
    requestsPanelOpen,
    setRequestsPanelOpen,
    pendingRequests,
    historicalRequests,
    historicalDateFilter,
    setHistoricalDateFilter,
    requestActionLoading,
    rejectionReasons,
    setRejectionReasons,
    
    // My requests (teacher view)
    myRequests,
    myRequestsLoading,
    myRequestsPanelOpen,
    setMyRequestsPanelOpen,
    filteredMyRequests,
    myRequestsDateFilter,
    setMyRequestsDateFilter,
    
    // Request creation
    requestState,
    setRequestState,
    requestForm,
    setRequestForm,
    submitRequest,
    resetRequestModal
  } = useRoomRequests(canManageRequests, canRequestRoom, user, profile, {
    timeSlots,
    rooms: buildingRooms
  })

  // Camera drag detection to guard building select/deselect during drags
  const [/* isCameraInteracting */ , setIsCameraInteracting] = useState(false)

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

  // Do not auto-close the building dropdown on outside clicks; it closes only
  // when the Select Building button is toggled or the building is deselected.

  const handleCloseDropdown = () => {
    setIsDropdownClosing(true)
    // Reset expanded floor and Building Info state immediately when dropdown closes
    setExpandedFloorKey(null)
    setIsBuildingInfoOpen(false)
    setTimeout(() => {
      setIsBuildingDropdownOpen(false)
      setIsDropdownClosing(false)
    }, 200) // Match animation duration
  }

  const handleOpenDropdown = () => {
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
  }

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

  // Load schedules when date changes
  useEffect(() => {
    loadSchedules()
  }, [loadSchedules])

  // Auto-reload schedules when building schedule is open
  useEffect(() => {
    if (!isScheduleOpen) return

    // Initial load
    loadSchedules()

    // Set up polling interval (reload every 15 seconds)
    const interval = setInterval(() => {
      loadSchedules()
    }, 15000)

    return () => clearInterval(interval)
  }, [isScheduleOpen, loadSchedules])

  // Auto-reload schedules when room schedule is open
  useEffect(() => {
    if (!isRoomScheduleOpen) return

    // Initial load (with loading screen)
    loadSchedules()

    // Set up polling interval (reload every 15 seconds, silent to avoid loading screen)
    const interval = setInterval(() => {
      loadSchedules(true) // silent reload
    }, 15000)

    return () => clearInterval(interval)
  }, [isRoomScheduleOpen, loadSchedules])

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
    resetRequestModal()
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
        loadSchedules()
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
      await saveSchedule(requestState, editForm)
      handleCenterPanelClose()
      loadSchedules()
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
    setRequestState((prev) => ({
      ...prev,
      [field]: nextValue
    }))
  }, [setRequestState])

  // Handle form change for request/edit
  const handleRequestFormChange = useCallback((e) => {
    const { name, value } = e.target
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
        await loadSchedules()
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
    setRequestsPanelOpen(false)
    setMyRequestsPanelOpen(false)
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
      setRequestsPanelOpen(false)
    } else {
      setUnifiedPanelContentType('requests')
      setRequestsPanelOpen(true)
      // Keep Building Info/Schedule states as-is
    }
  }

  // Central close for UnifiedPanel (same behavior as UnifiedPanel onClose prop)
  const handleUnifiedPanelClose = () => {
    const currentType = unifiedPanelContentType
    setUnifiedPanelContentType(null)
    if (currentType === 'requests') setRequestsPanelOpen(false)
    if (currentType === 'my-requests') setMyRequestsPanelOpen(false)
    if (currentType === 'user-management') setUserManagementOpen(false)
    if (currentType === 'building-info') setIsBuildingInfoOpen(false)
    if (currentType === 'schedule') setScheduleOpen(false)
  }

  const handleMyRequestsClick = () => {
    // Don't close dropdown - allow switching content types
    if (unifiedPanelContentType === 'my-requests') {
      setUnifiedPanelContentType(null)
      setMyRequestsPanelOpen(false)
    } else {
      setUnifiedPanelContentType('my-requests')
      setMyRequestsPanelOpen(true)
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

  const handleBuildingClick = (clickedBuilding) => {
    // Ignore only if a drag just ended very recently (within 120ms)
    if (Date.now() - (lastDragEndAtRef.current || 0) < 120) {
      return
    }
    lastBuildingClickAtRef.current = Date.now()
    // If unified panel is open, only close it and don't select/deselect buildings
    if (isUnifiedPanelOpen) {
      handleUnifiedPanelClose()
      return
    }
    if (selectedBuilding?.id === clickedBuilding?.id) {
      // Trigger dropdown close animation only if it's currently open
      if (isBuildingDropdownOpen) {
        handleCloseDropdown()
      }
      setSelectedBuilding(null)
      setIsBuildingInfoOpen(false)
      setScheduleOpen(false)
      setUnifiedPanelContentType(null)
    } else {
      setSelectedBuilding(clickedBuilding)
      // Auto-open dropdown to show actions immediately when a building is selected
      handleOpenDropdown()
      // Don't open BuildingInfo automatically - only select the building
      // Don't auto-open dropdown - user clicks button to open it
    }
  }


  const handleRoomSearch = async (building, roomCode) => {
    try {
      // Don't close dropdown - only close non-building panels
      setRequestsPanelOpen(false)
      setMyRequestsPanelOpen(false)
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

        // Set room schedule state and open room schedule
        const displayName = room.room_name || room.roomNumber || room.room_number || room.room_code
        setRoomScheduleRoomCode(room.room_code)
        setRoomScheduleRoomName(displayName)
        setRoomScheduleBookable(String(room.bookable).toLowerCase() === 'true' || room.bookable === true)
  setRoomScheduleRoomType(room.room_type || null)
        
        // Also open BuildingInfo and expand the floor containing this room
        setIsBuildingInfoOpen(true)
        
        // Find and expand the floor containing this room
        // Compute the floor key directly from the room's floor data
        // The floorKey logic in render: group.floor_id ?? group.floorId ?? group.floor_name ?? group.floorName ?? idx
        // groupRoomsByFloor returns { id, name, rooms }, so we use id or name
        if (room.floors) {
          const floorId = room.floors.id
          const floorName = room.floors.floor_name
          // Use id first, then name, matching the groupRoomsByFloor structure
          const floorKey = floorId ?? floorName
          if (floorKey) {
            // Use a small delay to ensure buildingRooms state is updated and roomsByFloor memo is recalculated
            setTimeout(() => {
              setExpandedFloorKey(floorKey)
              
              // Then scroll to the room button after floor is expanded
              setTimeout(() => {
                if (floorRoomListScrollRef.current) {
                  const roomButton = floorRoomListScrollRef.current.querySelector(
                    `button[data-room-code="${room.room_code}"]`
                  )
                  if (roomButton) {
                    roomButton.scrollIntoView({ 
                      behavior: 'smooth', 
                      block: 'center',
                      inline: 'nearest'
                    })
                  }
                }
              }, 100) // Additional delay to ensure room list is rendered
            }, 50)
          }
        }
        
        // Open room schedule in UnifiedPanel
        setUnifiedPanelContentType('room-schedule')
        setIsRoomScheduleOpen(true)
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
    <div className={styles.screen}>
      {/* 3D Canvas */}
      <div
        className={`${styles.canvasContainer} canvas-container`}
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
        <Canvas camera={{ position: [40, 25, 40], fov: 50 }} style={{ background: 'radial-gradient(circle at 32% 18%, rgba(140,160,180,0.4) 0%, rgba(90,110,130,0.6) 55%, rgba(60,80,100,0.8) 100%)' }}>
          {!buildingLoading && (
          <SchoolModel 
            building={building} 
            onBuildingClick={heroCollapsed ? handleBuildingClick : null}
          />
          )}
          <OrbitControls 
            ref={controlsRef}
            enabled={true}
            enableZoom={heroCollapsed}
            enablePan={false}
            enableRotate={heroCollapsed}
            minDistance={10}
            maxDistance={100}
            maxPolarAngle={Math.PI / 2}
            autoRotate={true}
            autoRotateSpeed={2}
            mouseButtons={{
              LEFT: THREE.MOUSE.ROTATE,
              MIDDLE: THREE.MOUSE.DOLLY,
              RIGHT: THREE.MOUSE.PAN
            }}
            onStart={() => {
              setIsCameraInteracting(true)
              if (controlsRef.current && heroCollapsed) {
                controlsRef.current.autoRotate = false
              }
            }}
            onEnd={() => {
              setIsCameraInteracting(false)
              // If OrbitControls ended with an actual drag, lastDragEndAtRef will already be set by onMouseUp
              // No need to update a separate timestamp here that could block taps
            }}
          />
        </Canvas>
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
      <div className={styles.heroOverlay}>
        <div
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_left,_rgba(198,222,255,0.6)_0%,_rgba(166,206,255,0.35)_55%,_rgba(216,236,255,0.2)_100%)]"
          aria-hidden="true"
        />
                {/* Header */}
                <header className={styles.heroHeader}>
                  <div className={styles.heroHeaderTop}>
                    <div className={styles.heroHeaderTitle}>
                      <span className="text-[0.85rem] tracking-[0.8em] text-[#3282B8] font-bold">Classroom</span>
                      <span className="text-[0.85rem] tracking-[0.8em] text-[#EEEEEE]/90 font-medium">Insight</span>
                    </div>
            <div className={styles.heroHeaderActions}>
              <div 
                className={`transition-opacity duration-500 h-full flex items-stretch ${heroCollapsed ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              >
                <SearchBuilding
                  buildings={buildings}
                  onRoomSelect={handleRoomSearch}
                  onOpen={() => {
                    // Don't close building dropdown - allow it to stay open
                    // Only close other panels that aren't building-related
                    setRequestsPanelOpen(false)
                    setMyRequestsPanelOpen(false)
                    setUserManagementOpen(false)
                  }}
                />
              </div>
              {canRequestRoom && !canManageRequests && (
                <button
                  type="button"
                  onClick={handleMyRequestsClick}
                  className={styles.headerRequestsButton(myRequestsPanelOpen, false)}
                >
                  {myRequestsPanelOpen ? 'Hide My Requests' : `My Requests`}
                </button>
              )}
              {canManageRequests && (
                <button
                  type="button"
                  onClick={handleRequestsButtonClick}
                  className={styles.headerRequestsButton(requestsPanelOpen, false)}
                >
                  Manage Requests
                </button>
              )}
              {role === USER_ROLES.administrator && (
                <button
                  type="button"
                  onClick={handleUserManagementClick}
                  className={styles.headerUserManagementButton}
                >
                  User Management
                </button>
              )}
              <div className="ml-3 flex items-center">
              <button
                type="button"
                onClick={handleLogout}
                className={styles.logoutBtn}
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
                  className={`${styles.buildingControlsWrapper} ${
                    heroCollapsed ? styles.buildingControlsVisible : styles.buildingControlsHidden
                      }`}
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
                                ? "bg-transparent text-white border-white"
                                : "bg-transparent text-[#EEEEEE]/90 border-[#EEEEEE]/60 hover:text-white hover:border-white"
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
                              (unifiedPanelContentType === 'schedule')
                                ? "bg-transparent text-white border-white"
                                : "bg-transparent text-[#EEEEEE]/90 border-[#EEEEEE]/60 hover:text-white hover:border-white"
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
                          <div
                            ref={floorRoomListScrollRef}
                            className="no-scrollbar flex flex-col gap-1 px-0 py-0 mx-auto overflow-y-auto"
                            style={{
                              width: '244px',
                              maxHeight: 'calc(95vh - 250px)',
                              opacity: isBuildingInfoOpen ? 1 : 0,
                              transform: isBuildingInfoOpen ? 'translateY(0)' : 'translateY(-20px)',
                              willChange: 'opacity, transform',
                              transitionProperty: 'opacity, transform',
                              transitionDuration: '300ms',
                              transitionTimingFunction: 'ease-out',
                              transitionDelay: '0ms'
                            }}
                          >
                            {(Array.isArray(roomsByFloor) ? roomsByFloor : []).map((group, idx) => {
                              const floorKey = group.floor_id ?? group.floorId ?? group.id ?? group.floor_name ?? group.floorName ?? group.name ?? idx
                              const floorName = group.floor_name ?? group.floorName ?? group.name ?? `Floor ${idx+1}`
                              const rooms = group.rooms ?? []
                              const expanded = expandedFloorKey === floorKey
                              return (
                                <div key={`${floorKey}-${floorName}`} className="w-full">
                        <button
                          type="button"
                                    onClick={() => toggleFloor(floorKey)}
                                    className={cn(
                                      "w-full text-left px-3 py-1.5 font-bold uppercase tracking-[0.19em] text-[0.62rem] mb-0 transition-colors duration-150",
                                      expanded 
                                        ? "bg-[#4a5568] border-white text-white" 
                                        : "bg-[#323640] border-[#b8beca19] text-[#f0f0f0] hover:bg-[#4a5568] hover:border-white hover:text-white"
                                    )}
                                    style={{ borderRadius: 0 }}
                                  >
                                    <span className="text-[#F8F8F8]/90 mr-2">{expanded ? '−' : '+'}</span>{floorName}
                        </button>
                                  <div 
                                    className="flex flex-col gap-1 mt-1 mb-1 overflow-hidden"
                                    style={{
                                      maxHeight: expanded && rooms.length > 0 ? '1000px' : '0px',
                                      opacity: expanded && rooms.length > 0 ? 1 : 0,
                                      transition: 'max-height 300ms ease-out, opacity 300ms ease-out',
                                      pointerEvents: expanded && rooms.length > 0 ? 'auto' : 'none'
                                    }}
                                  >
                                    {/* Two-column layout: left classroom, right administrative */}
                                    {rooms.length > 0 && (
                                      <div className="grid grid-cols-2 gap-2 w-full" style={{
                                        opacity: expanded ? 1 : 0,
                                        transition: 'opacity 300ms ease-out'
                                      }}>
                                        {/* Classroom column */}
                                        <div className="flex flex-col gap-1">
                                          {rooms.filter(r => (r.room_type || '').toLowerCase() === 'classroom').map((room, roomIdx) => (
                                            <button
                                              key={room.id || room.room_code}
                                              data-room-code={room.room_code}
                                              type="button"
                                              onClick={() => {
                                                const isCurrentlyOpen = isRoomScheduleOpen && roomScheduleRoomCode === room.room_code && unifiedPanelContentType === 'room-schedule'
                                                if (isCurrentlyOpen) {
                                                  // Close the room schedule
                                                  setIsRoomScheduleOpen(false)
                                                  setRoomScheduleRoomCode(null)
                                                  setRoomScheduleRoomName('')
                                                  setRoomScheduleRoomType(null)
                                                  setUnifiedPanelContentType(null)
                                                } else {
                                                  // Open the room schedule
                                                  setRoomScheduleRoomCode(room.room_code)
                                                  const displayName = room.room_name || room.roomNumber || room.room_number || room.room_code
                                                  setRoomScheduleRoomName(displayName)
                                                  setRoomScheduleBookable(String(room.bookable).toLowerCase() === 'true' || room.bookable === true)
                                                  setRoomScheduleRoomType(room.room_type || null)
                                                  setUnifiedPanelContentType('room-schedule')
                                                  setIsRoomScheduleOpen(true)
                                                }
                                              }}
                                              className={cn(
                                                "text-left px-3 py-1.5 text-[0.54rem] tracking-[0.12em] border-none shadow-none font-normal transition-colors duration-150",
                                                isRoomScheduleOpen && roomScheduleRoomCode === room.room_code && unifiedPanelContentType === 'room-schedule'
                                                  ? "bg-[#4a5568] text-white"
                                                  : "bg-[#49505c] text-[#F8F8F8] hover:bg-[#4a5568] hover:text-white"
                                              )}
                                              style={{ 
                                                borderRadius: 0, 
                                                width: '100%',
                                                opacity: expanded ? 1 : 0,
                                                transition: expanded 
                                                  ? `opacity 10ms ease-out ${roomIdx * 20}ms, background-color 150ms ease-out`
                                                  : `opacity 300ms ease-out ${roomIdx * 10}ms`
                                              }}
                                            >
                                              {`Room ${room.room_name || room.roomNumber || room.room_number || room.room_code || ''}`}
                                            </button>
                                          ))}
                                        </div>
                                        {/* Administrative column */}
                                        <div className="flex flex-col gap-1">
                                          {rooms.filter(r => (r.room_type || '').toLowerCase() === 'administrative').map((room, roomIdx) => (
                                            <button
                                              key={room.id || room.room_code}
                                              data-room-code={room.room_code}
                                              type="button"
                                              onClick={() => {
                                                const isCurrentlyOpen = isRoomScheduleOpen && roomScheduleRoomCode === room.room_code && unifiedPanelContentType === 'room-schedule'
                                                if (isCurrentlyOpen) {
                                                  // Close the room schedule
                                                  setIsRoomScheduleOpen(false)
                                                  setRoomScheduleRoomCode(null)
                                                  setRoomScheduleRoomName('')
                                                  setRoomScheduleRoomType(null)
                                                  setUnifiedPanelContentType(null)
                                                } else {
                                                  // Open the room schedule
                                                  setRoomScheduleRoomCode(room.room_code)
                                                  const displayName = room.room_name || room.roomNumber || room.room_number || room.room_code
                                                  setRoomScheduleRoomName(displayName)
                                                  setRoomScheduleBookable(String(room.bookable).toLowerCase() === 'true' || room.bookable === true)
                                                  setRoomScheduleRoomType(room.room_type || null)
                                                  setUnifiedPanelContentType('room-schedule')
                                                  setIsRoomScheduleOpen(true)
                                                }
                                              }}
                                              className={cn(
                                                "text-left px-3 py-1.5 text-[0.54rem] tracking-[0.12em] border-none shadow-none font-normal transition-colors duration-150",
                                                isRoomScheduleOpen && roomScheduleRoomCode === room.room_code && unifiedPanelContentType === 'room-schedule'
                                                  ? "bg-[#4a5568] text-white"
                                                  : "bg-[#49505c] text-[#F8F8F8] hover:bg-[#4a5568] hover:text-white"
                                              )}
                                              style={{ 
                                                borderRadius: 0, 
                                                width: '100%',
                                                opacity: expanded ? 1 : 0,
                                                transition: expanded 
                                                  ? `opacity 10ms ease-out ${roomIdx * 20}ms, background-color 150ms ease-out`
                                                  : `opacity 300ms ease-out ${roomIdx * 10}ms`
                                              }}
                                            >
                                              {room.room_name || room.roomNumber || room.room_number || room.room_code || ''}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                               </div>
                             )
                           })}
                           {Array.isArray(roomsByFloor) && roomsByFloor.length === 0 && (
                             <div className="px-2 py-2 text-[0.58rem] tracking-[0.18em] text-[#EEEEEE]/60">No floors found.</div>
                           )}
                         </div>
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
           <BuildingSchedulePanelContent
         selectedBuilding={selectedBuilding}
         buildingRooms={buildingRooms}
         buildingRoomsLoading={buildingRoomsLoading}
             roomsByFloor={roomsByFloor}
         scheduleDate={scheduleDate}
         setScheduleDate={setScheduleDate}
         timeSlots={timeSlots}
         scheduleMap={scheduleMap}
         scheduleLoading={scheduleLoading}
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
          <SchedulePanel
            isOpen={true}
            embedded={true}
            roomCode={roomScheduleRoomCode}
            roomName={roomScheduleRoomName}
            bookable={roomScheduleBookable}
            schedule={roomSchedule}
            scheduleLoading={scheduleLoading}
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
