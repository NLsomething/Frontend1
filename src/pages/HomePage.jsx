import { useNavigate } from 'react-router-dom'
import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationContext'
import { USER_ROLES } from '../constants/roles'
import { SCHEDULE_STATUS } from '../constants/schedule'
import { cn } from '../utils/classnames'
import { toIsoDateString } from '../utils'

// Import New Hooks
import { usePanelManager } from '../hooks/usePanelManager'
import { useCoreData } from '../hooks/useCoreData'
import { useBuildingManager } from '../hooks/useBuildingManager'
import { useSceneManager } from '../hooks/useSceneManager'
import { useCameraControls } from '../hooks/useCameraControls'

// Import Store
import { useHomePageStore } from '../stores/useHomePageStore'

// Import Components
import SchoolScene from '../components/SchoolScene'
import HomePageStateProvider from '../components/HomePage/HomePageStateProvider'
import BuildingInfoModal from '../components/HomePage/BuildingInfoModal'
import SearchBuilding from '../components/HomePage/SearchBuilding'

// Import Layout Components
import UnifiedPanel from '../components/HomePage/UnifiedPanel'
import UnifiedPanelCenter from '../components/HomePage/UnifiedPanelCenter'

// Import Services
import { signOut } from '../services/authService'

// Import Styles
import '../styles/HomePageStyle.css'

function HomePage() {
  console.log('[HomePage] Component rendering...')
  const navigate = useNavigate()
  const { user, loading: authLoading, role, profile } = useAuth()
  console.log('[HomePage] Auth state:', { user: !!user, loading: authLoading, role })
  const { notifyError, notifySuccess } = useNotifications()

  // ===== HOOKS =====

  // 1. Core Data
  const { buildings, timeSlots, loading: coreDataLoading } = useCoreData()

  // 2. Panel/UI State
  const { state: panelState, actions: panelActions } = usePanelManager()

  // 3. Building State
  const {
    selectedBuilding,
    buildingRooms,
    buildingRoomsLoading,
    roomsByFloor,
    roomLookupByCode,
    actions: buildingActions,
  } = useBuildingManager()

  // 4. Schedule State
  const [scheduleDate, setScheduleDate] = useState(() => new Date())
  const isoDate = useMemo(() => toIsoDateString(scheduleDate), [scheduleDate])

  // 5. Request/Edit Form State
  const [editForm, setEditForm] = useState({
    status: SCHEDULE_STATUS.occupied,
    courseName: '',
    bookedBy: ''
  })
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false)
  const isSubmittingRequestRef = useRef(false)
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false)
  const isSubmittingEditRef = useRef(false)

  // Refs
  const dropdownRef = useRef(null)
  const sceneManagerRef = useRef(null)
  const sceneStateRef = useRef({ panelState, selectedBuilding, buildings, buildingActions, panelActions })

  // ===== STORE =====
  const loadSchedules = useHomePageStore((state) => state.loadSchedules)
  const saveSchedule = useHomePageStore((state) => state.saveSchedule)
  const resetRequestModal = useHomePageStore((state) => state.resetRequestModal)
  const setRequestState = useHomePageStore((state) => state.setRequestState)
  const requestState = useHomePageStore((state) => state.requestState)
  const requestForm = useHomePageStore((state) => state.requestForm)
  const setRequestForm = useHomePageStore((state) => state.setRequestForm)
  const submitRequest = useHomePageStore((state) => state.submitRequest)
  const setMyRequestsPanelOpen = useHomePageStore((state) => state.setMyRequestsPanelOpen)
  const setRequestsPanelOpen = useHomePageStore((state) => state.setRequestsPanelOpen)

  // ===== COMPUTED =====

  // Memoize buildings array to prevent unnecessary SchoolScene re-renders
  const buildingsList = useMemo(() => buildings, [buildings])

  // Permissions
  const canEditSchedule = role === USER_ROLES.administrator || role === USER_ROLES.buildingManager
  const canManageRequests = canEditSchedule
  const canRequestRoom = role === USER_ROLES.teacher || role === USER_ROLES.student

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

  const normalizeSlotTypeValue = useCallback((value) => {
    if (!value) return ''
    return value.toString().toLowerCase().replace(/[^a-z0-9]/g, '')
  }, [])

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

  const getSlotLabel = useCallback((slotId) => {
    const slot = timeSlots.find(s => (s.id || s.slot_id) === slotId)
    if (slot) {
      return slot.slot_name || slot.slotName || `Slot ${slotId}`
    }
    return `Slot ${slotId}`
  }, [timeSlots])

  // ===== HANDLERS =====

  // Handler when building is clicked on the 3D scene
  const handleSceneBuildingClick = useCallback((clickedBuilding) => {
    const { panelState: ps, selectedBuilding: sb, buildings: bs, buildingActions: ba, panelActions: pa } = sceneStateRef.current

    if (ps.isUnifiedPanelOpen) {
      pa.handleUnifiedPanelClose()
      return
    }

    const clickedId = (typeof clickedBuilding === 'object' ? clickedBuilding?.id : clickedBuilding)
    let resolved = null

    if (typeof clickedBuilding === 'object') {
      resolved = clickedBuilding
    } else if (clickedId !== undefined && clickedId !== null) {
      resolved = bs.find(b => b?.id === clickedId) || null
    }

    if (resolved?.id === sb?.id) {
      ba.selectBuilding(null)
      pa.handleCloseDropdown()
    } else {
      ba.selectBuilding(resolved)
      pa.handleOpenDropdown()
    }
  }, [])

  // Handler when room is clicked on the 3D scene
  const handleSceneRoomClick = useCallback((roomObjectName) => {
    // Read all dependencies from the ref
    const {
      selectedBuilding,
      panelState,
      roomLookupByCode,
      panelActions,
      sceneManagerRef: smRef
    } = sceneStateRef.current

    if (!selectedBuilding || !panelState.isBuildingDropdownOpen) {
      console.log('[HomePage] Room click ignored - building not selected or dropdown closed')
      return
    }

    let roomCode = roomObjectName
    if (roomCode.startsWith('MB-')) {
      roomCode = roomCode.substring(3)
    } else if (roomCode.startsWith('MB')) {
      roomCode = roomCode.substring(2)
    }

    console.log('[HomePage] Mapped room code:', roomCode)

    const room = roomLookupByCode.get(roomCode)
    if (!room) {
      console.log('[HomePage] Room not found in lookup:', roomCode)
      return
    }

    console.log('[HomePage] Found room:', room)

    const roomFloorId = room.floor_id
    const floor2Id = 'c2bf5515-daa4-4078-aae9-6c019e79e4b8'

    if (smRef.current && roomFloorId === floor2Id && !smRef.current.state.upperLayerTransparent) {
      smRef.current.actions.setFloorTransparency('Floor 2', true)
    }

    if (!panelState.isBuildingInfoOpen) {
      panelActions.setIsBuildingInfoOpen(true)
    }

    window.dispatchEvent(new CustomEvent('search-room', {
      detail: { roomCode: room.room_code }
    }))

    panelActions.handleOpenRoomSchedulePanel(room)

    if (smRef.current) {
      const isAdministrativeRoom = !roomCode.match(/^\d{3}$/)
      const modelObjectName = isAdministrativeRoom ? `MB-${roomCode}` : `MB${roomCode}`
      smRef.current.actions.highlightRoomInScene(modelObjectName, true)
    }
  }, [])

  // Initialize scene manager with handlers
  const sceneManager = useSceneManager({
    onBuildingClick: handleSceneBuildingClick,
    onRoomClick: handleSceneRoomClick,
  })

  // Sync sceneManager to ref for use in effects
  useEffect(() => {
    sceneManagerRef.current = sceneManager
  }, [sceneManager])

  // Sync scene state to ref so handleSceneBuildingClick and handleSceneRoomClick always access latest values
  useEffect(() => {
    sceneStateRef.current = {
      panelState,
      selectedBuilding,
      buildings,
      buildingActions,
      panelActions,
      roomLookupByCode,
      sceneManagerRef
    }
  }, [panelState, selectedBuilding, buildings, buildingActions, panelActions, roomLookupByCode])

  // Sync unified panel content type with request panel states
  useEffect(() => {
    if (panelState.unifiedPanelContentType === 'my-requests') {
      setMyRequestsPanelOpen?.(true)
    } else {
      setMyRequestsPanelOpen?.(false)
    }

    if (panelState.unifiedPanelContentType === 'requests') {
      setRequestsPanelOpen?.(true)
    } else {
      setRequestsPanelOpen?.(false)
    }
  }, [panelState.unifiedPanelContentType, setMyRequestsPanelOpen, setRequestsPanelOpen])

  // Initialize edit form when entering edit mode
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
      panelActions.setCenterPanelContentType(requestState.isEditMode ? 'schedule-edit' : 'schedule-request')
    } else {
      panelActions.setCenterPanelContentType(null)
    }
  }, [requestState.isOpen, requestState.room, requestState.isEditMode, panelActions])

  // Handle room highlighting and floor transparency when room schedule changes
  useEffect(() => {
    if (!sceneManagerRef.current) return

    if (panelState.isRoomScheduleOpen && panelState.roomScheduleRoomCode) {
      // Opening a room: highlight it and handle floor 2 transparency
      const roomCode = panelState.roomScheduleRoomCode
      const roomMeta = roomLookupByCode.get(roomCode)
      
      if (roomMeta) {
        // Highlight the room
        const isAdministrativeRoom = !roomCode.match(/^\d{3}$/)
        const modelObjectName = isAdministrativeRoom ? `MB-${roomCode}` : `MB${roomCode}`
        sceneManagerRef.current.actions.highlightRoomInScene(modelObjectName, true)
        
        // Check if room is on Floor 2 and apply transparency if needed
        const roomFloorId = roomMeta.floor_id
        const floor2Id = 'c2bf5515-daa4-4078-aae9-6c019e79e4b8'
        
        if (roomFloorId === floor2Id && !sceneManagerRef.current.state.upperLayerTransparent) {
          sceneManagerRef.current.actions.setFloorTransparency('Floor 2', true)
        }
      }
    } else {
      // Closing room: unhighlight and revert floor 2 transparency
      sceneManagerRef.current.actions.highlightRoomInScene(null, false)
      // Always revert Floor 2 transparency when closing room
      if (sceneManagerRef.current.state.upperLayerTransparent) {
        sceneManagerRef.current.actions.setFloorTransparency('Floor 2', false)
      }
    }
  }, [panelState.isRoomScheduleOpen, panelState.roomScheduleRoomCode, roomLookupByCode])

  // Handle room schedule deselection
  useEffect(() => {
    const shouldDeselect =
      (panelState.unifiedPanelContentType && panelState.unifiedPanelContentType !== 'building-info' && panelState.unifiedPanelContentType !== 'room-schedule') ||
      (!panelState.isBuildingInfoOpen && panelState.unifiedPanelContentType === null)

    if (shouldDeselect && panelState.roomScheduleRoomCode) {
      if (sceneManagerRef.current) {
        sceneManagerRef.current.actions.highlightRoomInScene(null, false)
      }
      panelActions.handleCloseRoomSchedulePanel()
    }
  }, [panelState.unifiedPanelContentType, panelState.isBuildingInfoOpen, panelState.roomScheduleRoomCode, panelActions])

  // Track previous building
  const prevBuildingIdRef = useRef(selectedBuilding?.id)
  useEffect(() => {
    const currentBuildingId = selectedBuilding?.id
    const previousBuildingId = prevBuildingIdRef.current

    if (
      panelState.roomScheduleRoomCode &&
      currentBuildingId &&
      previousBuildingId &&
      currentBuildingId !== previousBuildingId
    ) {
      if (sceneManagerRef.current) {
        sceneManagerRef.current.actions.highlightRoomInScene(null, false)
      }
      panelActions.handleCloseRoomSchedulePanel()
    }

    prevBuildingIdRef.current = currentBuildingId
  }, [selectedBuilding?.id, panelState.roomScheduleRoomCode, panelActions])

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/')
    }
  }, [user, authLoading, navigate])

  // Handle center panel close
  const handleCenterPanelClose = useCallback(() => {
    if (typeof resetRequestModal === 'function') {
      resetRequestModal()
    }
    panelActions.setCenterPanelContentType(null)
    isSubmittingRequestRef.current = false
    setIsSubmittingRequest(false)
    isSubmittingEditRef.current = false
    setIsSubmittingEdit(false)
  }, [resetRequestModal, panelActions])

  // Handle request submit
  const handleRequestSubmit = useCallback(async (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (isSubmittingRequestRef.current) return
    if (!requestState.room || !requestState.startHour || !requestState.endHour) return

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
          await loadSchedules()
        }
      }
    } finally {
      isSubmittingRequestRef.current = false
      setIsSubmittingRequest(false)
    }
  }, [requestState, requestForm, isoDate, submitRequest, handleCenterPanelClose, loadSchedules, roomLookupByCode, notifyError])

  // Handle edit submit
  const handleEditSubmit = useCallback(async (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (isSubmittingEditRef.current) return
    if (!requestState.room || !requestState.startHour || !requestState.endHour) return

    isSubmittingEditRef.current = true
    setIsSubmittingEdit(true)

    try {
      if (typeof saveSchedule !== 'function') {
        throw new Error('Schedule handlers are not ready yet.')
      }

      await saveSchedule(requestState, editForm)
      handleCenterPanelClose()
      if (typeof loadSchedules === 'function') {
        await loadSchedules()
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

  // Handle range change
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

  // Handle request form change
  const handleRequestFormChange = useCallback((e) => {
    const { name, value } = e.target
    if (typeof setRequestForm !== 'function') return
    setRequestForm(prev => ({
      ...prev,
      [name]: value
    }))
  }, [setRequestForm])

  // Handle edit form change
  const handleEditFormChange = useCallback((e) => {
    const { name, value } = e.target
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }))
  }, [])

  // Handle building info toggle
  const handleBuildingInfoToggle = useCallback(() => {
    const willOpen = !panelState.isBuildingInfoOpen
    panelActions.setIsBuildingInfoOpen(willOpen)

    if (willOpen && selectedBuilding && sceneManagerRef.current) {
      sceneManagerRef.current.actions.focusOnBuilding(selectedBuilding)
    }

    panelActions.setIsScheduleOpen(false)

    if (!panelState.isBuildingInfoOpen && selectedBuilding && buildingRooms.length === 0 && !buildingRoomsLoading) {
      buildingActions.fetchRoomsForBuilding(selectedBuilding)
    }
  }, [panelState.isBuildingInfoOpen, selectedBuilding, buildingRooms.length, buildingRoomsLoading, panelActions, buildingActions])

  // Handle schedule toggle
  const handleScheduleToggle = useCallback(() => {
    if (panelState.unifiedPanelContentType === 'schedule') {
      panelActions.setUnifiedPanelContentType(null)
      panelActions.setIsScheduleOpen(false)
    } else {
      if (timeSlots.length === 0) {
        notifyError('No time slots available', {
          description: 'Unable to display the schedule without time slot information.'
        })
        return
      }

      if (!selectedBuilding) {
        return
      }

      panelActions.setUnifiedPanelContentType('schedule')
      panelActions.setIsScheduleOpen(true)

      if (buildingRooms.length === 0 && !buildingRoomsLoading) {
        buildingActions.fetchRoomsForBuilding(selectedBuilding)
      }
    }
  }, [panelState.unifiedPanelContentType, selectedBuilding, buildingRooms.length, buildingRoomsLoading, timeSlots.length, panelActions, buildingActions, notifyError])

  // Handle room search
  const handleRoomSearch = useCallback(async (building, roomCode) => {
    try {
      // Ensure the building is selected (do not toggle off if it's already selected)
      if (!building || building.id !== selectedBuilding?.id) {
        buildingActions.setSelectedBuilding(building)
      }
      panelActions.handleOpenDropdown()

      if (!panelState.heroCollapsed) {
        panelActions.setHeroCollapsed(true)
      }

      // Fetch rooms for the building and get the data directly
      let rooms = buildingRooms
      if (buildingRooms.length === 0 && !buildingRoomsLoading) {
        rooms = await buildingActions.fetchRoomsForBuilding(building)
      }

      if (roomCode) {
        const room = rooms.find(r => r.room_code.toLowerCase() === roomCode.trim().toLowerCase())

        if (!room) {
          notifyError('Room not found', {
            description: `Room ${roomCode} does not exist in building ${building.building_code}`
          })
          return
        }

        const roomFloorId = room.floor_id
        const floor2Id = 'c2bf5515-daa4-4078-aae9-6c019e79e4b8'

        if (sceneManagerRef.current && roomFloorId === floor2Id) {
          sceneManagerRef.current.actions.setFloorTransparency('Floor 2', true)
        }

        panelActions.setIsBuildingInfoOpen(true)
        window.dispatchEvent(new CustomEvent('search-room', {
          detail: { roomCode: room.room_code }
        }))

        panelActions.handleOpenRoomSchedulePanel(room)
      }
    } catch (err) {
      console.error('Error searching:', err)
      notifyError('Search failed', {
        description: 'An unexpected error occurred while searching.'
      })
    }
  }, [buildingActions, buildingRooms, buildingRoomsLoading, panelState.heroCollapsed, panelActions, notifyError, selectedBuilding])

  // Handle floor toggle
  const handleFloorToggle = useCallback((floorName, isExpanded) => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.actions.setFloorTransparency(floorName, isExpanded)
    }
  }, [])

  // Camera controls hook
  useCameraControls(sceneManager.refs.controlsRef, panelState.heroCollapsed)

  // Loading state
  if (authLoading || coreDataLoading) {
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
        isScheduleOpen={panelState.isScheduleOpen}
        isRoomScheduleOpen={panelState.isRoomScheduleOpen}
        user={user}
        profile={profile}
        canManageRequests={canManageRequests}
        canRequestRoom={canRequestRoom}
      />

      {/* 3D Canvas */}
      <div
        className={`hp-canvasContainer canvas-container`}
        {...sceneManager.canvasProps}
        onClick={(e) => {
          const justDragged = Date.now() - (sceneManager.refs.lastDragEndAtRef.current || 0) < 120
          if (justDragged || e.button !== 0) return

          const target = e.target
          const panelEl = document.querySelector('.unified-panel')
          const insidePanel = panelEl ? panelEl.contains(target) : false
          const insideDropdown = dropdownRef.current ? dropdownRef.current.contains(target) : false

          if (insidePanel || insideDropdown) return

          if (Date.now() - (sceneManager.refs.lastRoomClickAtRef.current || 0) < 100) return
          if (Date.now() - (sceneManager.refs.lastBuildingClickAtRef.current || 0) < 50) return

          if (panelState.isUnifiedPanelOpen) {
            panelActions.handleUnifiedPanelClose()
            return
          }

          if (selectedBuilding) {
            buildingActions.selectBuilding(null)
            panelActions.handleCloseDropdown()
          }
        }}
      >
        <SchoolScene
          {...sceneManager.sceneProps}
          heroCollapsed={panelState.heroCollapsed}
          allBuildings={buildingsList}
          selectedBuilding={selectedBuilding}
        />
      </div>

      {/* Welcome Modal */}
      {!panelState.heroCollapsed && (
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
              onClick={() => panelActions.setHeroCollapsed(true)}
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
                className={`transition-opacity duration-500 h-full flex items-stretch ${panelState.heroCollapsed ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              >
                <SearchBuilding
                  buildings={buildings}
                  onRoomSelect={handleRoomSearch}
                  onOpen={() => {}}
                />
              </div>
              {canRequestRoom && !canManageRequests && (
                <button
                  type="button"
                  onClick={() => panelActions.setUnifiedPanelContentType('my-requests')}
                  className={cn('hp-headerRequestsButton', panelState.unifiedPanelContentType === 'my-requests' ? 'hp-headerRequestsButton--active' : '')}
                >
                  My Requests
                </button>
              )}
              {canManageRequests && (
                <button
                  type="button"
                  onClick={() => panelActions.setUnifiedPanelContentType('requests')}
                  className={cn('hp-headerRequestsButton', panelState.unifiedPanelContentType === 'requests' ? 'hp-headerRequestsButton--active' : '')}
                >
                  Manage Requests
                </button>
              )}
              {role === USER_ROLES.administrator && (
                <button
                  type="button"
                  onClick={() => navigate('/users')}
                  className={cn('hp-headerUserManagementButton', panelState.unifiedPanelContentType === 'user-management' ? 'hp-headerUserManagementButton--active' : '')}
                >
                  User Management
                </button>
              )}
              <div className="ml-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    await signOut()
                    navigate('/')
                  }}
                  className="hp-logoutBtn"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Building-specific Controls */}
        <div className={`hp-buildingControlsWrapper ${panelState.heroCollapsed ? 'hp-buildingControlsVisible' : 'hp-buildingControlsHidden'}`}>
          <div className="relative -ml-2" ref={dropdownRef}>
            <div
              className={cn(
                "canvas-building-btn border border-[#EEEEEE]/30 text-[#EEEEEE] shadow-lg backdrop-blur-sm transition-all duration-300 overflow-hidden flex items-center",
                selectedBuilding !== null ? "" : "border-[#EEEEEE]/10 text-[#EEEEEE]/30",
                panelState.isBuildingDropdownOpen && selectedBuilding
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
                  panelState.isBuildingDropdownOpen && selectedBuilding
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
                      panelState.isBuildingDropdownOpen ? "opacity-100" : "opacity-0"
                    )}>Building code: {selectedBuilding.building_code}</div>
                  </>
                ) : (
                  'Select a Building'
                )}
              </div>
            </div>

            {(panelState.isBuildingDropdownOpen || panelState.isDropdownClosing) && (
              <div
                className="building-dropdown absolute top-full left-0 mt-2 z-40 flex flex-col gap-0 pointer-events-auto select-none"
                style={{
                  animation: panelState.isDropdownClosing ? 'slideOutDrop 0.3s ease-out' : 'slideInDrop 0.3s ease-out',
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
                      panelState.isBuildingInfoOpen
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
                      panelState.unifiedPanelContentType === 'schedule'
                        ? "bg-[rgba(57,62,70,0.5)] text-white border-white"
                        : "bg-[rgba(57,62,70,0.2)] text-[#EEEEEE]/90 border-[#EEEEEE]/60 hover:text-white hover:border-white hover:bg-[rgba(57,62,70,0.35)]"
                    )}
                    style={{ borderRadius: 0 }}
                  >
                    Schedule
                  </button>
                </div>

                {/* Floor/room accordion */}
                <>
                  <div
                    className={cn("my-2 mx-auto transition-all duration-300 ease-out", panelState.isBuildingInfoOpen ? "opacity-100" : "opacity-0")}
                    style={{ width: '260px', height: '1px', backgroundColor: 'rgba(255,255,255,0.6)' }}
                  />
                  <BuildingInfoModal
                    isOpen={panelState.isBuildingInfoOpen}
                    roomsByFloor={roomsByFloor}
                    isRoomScheduleOpen={panelState.isRoomScheduleOpen && panelState.unifiedPanelContentType === 'room-schedule'}
                    activeRoomCode={panelState.roomScheduleRoomCode}
                    onOpenRoomSchedule={panelActions.handleOpenRoomSchedulePanel}
                    onCloseRoomSchedule={panelActions.handleCloseRoomSchedulePanel}
                    onFloorToggle={handleFloorToggle}
                  />
                  <div
                    className={cn("my-2 mx-auto transition-all duration-300 ease-out", panelState.isBuildingInfoOpen ? "opacity-100" : "opacity-0")}
                    style={{ width: '260px', height: '1px', backgroundColor: 'rgba(255,255,255,0.6)' }}
                  />
                </>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Unified Panel Container */}
      <UnifiedPanel
        isOpen={panelState.isUnifiedPanelOpen}
        contentType={panelState.unifiedPanelContentType}
        selectedBuilding={selectedBuilding}
        buildingRooms={buildingRooms}
        roomsByFloor={roomsByFloor}
        scheduleDate={scheduleDate}
        setScheduleDate={setScheduleDate}
        timeSlots={timeSlots}
        roomScheduleState={panelState}
        isoDate={isoDate}
        canEditSchedule={canEditSchedule}
        canRequestRoom={canRequestRoom}
        roomLookupByCode={roomLookupByCode}
        getSlotLabel={getSlotLabel}
      />

      {/* Center Modal Container */}
      <UnifiedPanelCenter
        isOpen={panelState.isCenterPanelOpen}
        contentType={panelState.centerPanelContentType}
        onClose={handleCenterPanelClose}
        filteredRequestTimeSlots={filteredRequestTimeSlots}
        isSubmittingRequest={isSubmittingRequest}
        isSubmittingEdit={isSubmittingEdit}
        onRequestSubmit={handleRequestSubmit}
        onEditSubmit={handleEditSubmit}
        onRequestFormChange={handleRequestFormChange}
        onEditFormChange={handleEditFormChange}
        onRangeChange={handleRangeChange}
        isoDate={isoDate}
        requestForm={requestForm}
        editForm={editForm}
      />
    </div>
  )
}

export default HomePage
