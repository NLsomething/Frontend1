import { useNavigate } from 'react-router-dom'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useAuth } from '../../context/AuthContext'
import { signOut } from '../../services/authService'
import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import SchoolModel from '../../components/SchoolModel'
import BuildingInfoModal from '../../components/BuildingInfo'
import UserManagementModal from '../../components/UserManagementModal'
import { useNotifications } from '../../context/NotificationContext'
import { USER_ROLES } from '../../constants/roles'
import { SCHEDULE_STATUS, SCHEDULE_STATUS_LABELS } from '../../constants/schedule'
import { fetchBuildings } from '../../services/buildingService'
import { fetchRoomsByBuildingId } from '../../services/roomService'
import { cn } from '../../styles/shared'

// Import extracted components
import {
  ScheduleEditModal,
  RoomRequestModal,
  BuildingSchedulePanel,
  RequestsPanel,
  MyRequestsPanel
} from './'

// Import custom hooks
import { useScheduleManagement } from '../../hooks/useScheduleManagement'
import { useRoomRequests } from '../../hooks/useRoomRequests'
import { useCameraControls } from '../../hooks/useCameraControls'

// Import utilities
import {
  generateTimeSlots,
  toIsoDateString,
  parseDateString,
  groupRoomsBySection
} from '../../utils'

// Styles
const styles = {
  screen: "relative min-h-screen overflow-hidden bg-gradient-to-br from-[#e6f1ff] via-[#f7fbff] to-white text-[#0a1f44]",
  canvasContainer: "absolute inset-0 z-0",
  logoutBtn: "uppercase tracking-[0.28em] text-[0.6rem] px-5 py-2.5 border border-white/70 bg-white/15 text-white shadow-lg backdrop-blur-md transition-colors duration-200 hover:bg-white hover:text-[#0a2a5f] hover:border-white",
  headerRequestsButton: (isOpen, loading) => cn(
    "uppercase tracking-[0.28em] text-[0.6rem] px-5 py-2.5 border border-white/50 bg-white/15 text-white shadow-lg backdrop-blur-md transition-colors duration-200",
    loading ? "opacity-50 cursor-not-allowed" : "hover:bg-white hover:text-[#0a2a5f] hover:border-white",
    isOpen ? "bg-white text-[#0a2a5f]" : ""
  ),
  headerUserManagementButton: "uppercase tracking-[0.28em] text-[0.6rem] px-5 py-2.5 border border-white/50 bg-white/15 text-white shadow-lg backdrop-blur-md transition-colors duration-200 hover:bg-white hover:text-[#0a2a5f] hover:border-white",
  canvasInstructions: "absolute bottom-2 left-1/2 -translate-x-1/2 z-10 text-[0.6rem] uppercase tracking-[0.3em] text-[#0a2a5f] bg-white/90 border border-[#c8dcff] backdrop-blur-sm px-5 py-2 rounded-full pointer-events-none select-none transition-all duration-500 ease-in-out transform",
  canvasInstructionsVisible: "translate-y-0 opacity-100",
  canvasInstructionsHidden: "translate-y-full opacity-0",
  myRequestsButton: (isOpen) => cn(
    "uppercase tracking-[0.28em] text-[0.6rem] px-5 py-2.5 border border-[#c4dbff] bg-white/90 text-[#0a2a5f] shadow-lg backdrop-blur-sm transition-colors duration-200",
    isOpen ? "border-[#0a62c2] text-[#0a62c2]" : "hover:text-[#0a62c2] hover:bg-[#e4f1ff] hover:border-[#0a62c2]"
  ),
  buildingInfoButton: (isOpen, hasBuilding) => cn(
    "uppercase tracking-[0.28em] text-[0.6rem] px-5 py-2.5 border border-[#d3e4ff] bg-white/85 text-[#0a2a5f] shadow-lg backdrop-blur-sm transition-colors duration-200",
    hasBuilding 
      ? isOpen ? "border-[#0a62c2] text-[#0a62c2]" : "hover:text-[#0a62c2] hover:bg-[#e9f4ff] hover:border-[#0a62c2]"
      : "border-[#e0ecff] text-[#9fb7dd] cursor-not-allowed"
  ),
  scheduleButton: (isOpen, hasBuilding) => cn(
    "uppercase tracking-[0.28em] text-[0.6rem] px-5 py-2.5 border border-[#d3e4ff] bg-white/85 text-[#0a2a5f] shadow-lg backdrop-blur-sm transition-colors duration-200",
    hasBuilding 
      ? isOpen ? "border-[#0a62c2] text-[#0a62c2]" : "hover:text-[#0a62c2] hover:bg-[#e9f4ff] hover:border-[#0a62c2]"
      : "border-[#e0ecff] text-[#9fb7dd] cursor-not-allowed"
  ),
  heroOverlay: "absolute inset-0 z-20 pointer-events-none flex flex-col items-stretch justify-start gap-6 px-0 pt-0 pb-12",
  heroHeader: "relative z-10 pointer-events-auto w-full px-8 md:px-12 py-4 bg-gradient-to-r from-[#0a62c2] via-[#084d9d] to-[#052863] text-white shadow-lg",
  heroHeaderTop: "flex w-full flex-wrap items-center justify-between gap-3",
  heroHeaderTitle: "flex flex-col gap-0.5 text-[0.6rem] uppercase tracking-[0.35em]",
  heroHeaderActions: "flex flex-wrap items-center justify-end gap-2.5",
  heroContent: "relative z-10 flex w-full max-w-xl flex-col gap-6 mt-2 self-start px-8 md:px-12 overflow-hidden",
  heroIntro: "flex flex-col gap-6 text-[#0a1f44] transition-all duration-500 ease-in-out transform",
  heroIntroVisible: "translate-x-0 opacity-100 pointer-events-auto",
  heroIntroHidden: "-translate-x-full opacity-0 pointer-events-none",
  heroActions: "flex flex-wrap items-center gap-4",
  heroControlsWrapper: "relative flex flex-col gap-3 transition-all duration-500 ease-in-out transform",
  heroControlsVisible: "translate-x-0 opacity-100 pointer-events-auto",
  heroControlsHidden: "-translate-x-full opacity-0 pointer-events-none",
  heroControls: "flex flex-col gap-2.5",
  heroControlRow: "flex flex-wrap items-center justify-start gap-2.5",
  buildingControlsWrapper: "absolute top-[5.5rem] left-8 md:left-12 z-30 pointer-events-auto flex flex-col gap-2.5 transition-all duration-300 ease-in-out transform",
  buildingControlsVisible: "translate-x-0 opacity-100",
  buildingControlsHidden: "-translate-x-full opacity-0"
}

function HomePage() {
  console.log('[HomePage] Component rendering...')
  const navigate = useNavigate()
  const { user, loading, role, profile } = useAuth()
  console.log('[HomePage] Auth state:', { user: !!user, loading, role })
  const { notifyError, notifyInfo } = useNotifications()
  const controlsRef = useRef()
  
  // Building state
  const [building, setBuilding] = useState(null)
  const [buildingLoading, setBuildingLoading] = useState(true)
  const [selectedBuilding, setSelectedBuilding] = useState(null)
  const [isBuildingInfoOpen, setIsBuildingInfoOpen] = useState(false)
  
  // Schedule panel state
  const [isScheduleOpen, setScheduleOpen] = useState(false)
  const [buildingRooms, setBuildingRooms] = useState([])
  const [buildingRoomsLoading, setBuildingRoomsLoading] = useState(false)
  const [scheduleDate, setScheduleDate] = useState(() => new Date())
  
  // UI state
  const [userManagementOpen, setUserManagementOpen] = useState(false)
  const [heroCollapsed, setHeroCollapsed] = useState(false)

  // Calculate ISO date
  const isoDate = useMemo(() => toIsoDateString(scheduleDate), [scheduleDate])

  // Generate time slots
  const timeSlots = useMemo(() => generateTimeSlots(), [])

  // Utility functions for hooks
  const getSlotLabel = useCallback((hour) => {
    return timeSlots.find((slot) => slot.hour === hour)?.label || ''
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
    scheduleMap,
    scheduleLoading,
    loadSchedules,
    saveSchedule,
    buildScheduleKey
  } = useScheduleManagement(isoDate, canViewSchedule)

  const {
    // Request management
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
    submitRequest,
    requestState,
    setRequestState,
    requestForm,
    setRequestForm,
    resetRequestModal
  } = useRoomRequests(canManageRequests, canRequestRoom, user, profile)

  // Camera controls hook
  useCameraControls(controlsRef, heroCollapsed)

  // Group rooms by section
  const roomsBySection = useMemo(() => 
    groupRoomsBySection(buildingRooms), 
    [buildingRooms]
  )

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate('/')
    }
  }, [user, loading, navigate])

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

  // Handle schedule button click
  const handleScheduleButtonClick = async () => {
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

  const handleHeroExplore = () => {
    setHeroCollapsed(true)
    
    // Auto-rotate off when user starts exploring
    if (controlsRef.current) {
      controlsRef.current.autoRotate = false
    }
  }

  const handleRequestsButtonClick = () => {
    if (!canManageRequests) {
      return
    }
    setRequestsPanelOpen((prev) => !prev)
  }

  const handleBuildingClick = (clickedBuilding) => {
    if (selectedBuilding?.id === clickedBuilding?.id) {
      setSelectedBuilding(null)
      setIsBuildingInfoOpen(false)
      setScheduleOpen(false)
    } else {
      setSelectedBuilding(clickedBuilding)
      // Don't open BuildingInfo automatically - only select the building
    }
  }

  const handleToggleBuildingInfo = () => {
    if (isBuildingInfoOpen) {
      setIsBuildingInfoOpen(false)
      setScheduleOpen(false)
    } else {
      setIsBuildingInfoOpen(true)
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
      <div className={styles.canvasContainer}>
        <Canvas camera={{ position: [0, 60, 80], fov: 45 }}>
          <ambientLight intensity={0.7} />
          <directionalLight position={[10, 20, 10]} intensity={0.8} castShadow />
          <SchoolModel 
            building={building} 
            onBuildingClick={heroCollapsed ? handleBuildingClick : null}
          />
          <OrbitControls 
            ref={controlsRef}
            enabled={true}
            enablePan={false}
            enableZoom={heroCollapsed}
            enableRotate={heroCollapsed}
            minDistance={30}
            maxDistance={150}
            maxPolarAngle={Math.PI / 2.1}
            autoRotate={!heroCollapsed}
            autoRotateSpeed={0.5}
          />
        </Canvas>
      </div>

              {/* Canvas Instructions */}
              <div 
                className={`${styles.canvasInstructions} ${
                  heroCollapsed ? styles.canvasInstructionsVisible : styles.canvasInstructionsHidden
                }`}
              >
                <span className="mr-3">🖱️ Drag to rotate</span>
                <span className="mr-3">•</span>
                <span className="mr-3">Scroll to zoom</span>
                <span className="mr-3">•</span>
                <span className="mr-3">Right-click to pan</span>
                <span className="mr-3">•</span>
                <span>⌨️ WASD to move</span>
              </div>

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
                      <span className="text-[0.85rem] tracking-[0.8em] text-white/80">CTU</span>
                      <span className="text-[0.85rem] tracking-[0.8em] text-white">Building Monitoring</span>
                    </div>
            <div className={styles.heroHeaderActions}>
              {canRequestRoom && !canManageRequests && (
                <button
                  type="button"
                  onClick={() => setMyRequestsPanelOpen((prev) => !prev)}
                  className={styles.headerRequestsButton(myRequestsPanelOpen, false)}
                >
                  {myRequestsPanelOpen ? 'Hide My Requests' : `My Requests`}
                  {filteredMyRequests.length > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-blue-600 rounded-full">
                      {filteredMyRequests.length}
                    </span>
                  )}
                </button>
              )}
              {canManageRequests && (
                <button
                  type="button"
                  onClick={handleRequestsButtonClick}
                  className={styles.headerRequestsButton(requestsPanelOpen, requestsLoading)}
                  disabled={requestsLoading}
                >
                  {requestsLoading ? 'Loading...' : 'Manage Requests'}
                  {pendingRequests.length > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                      {pendingRequests.length}
                    </span>
                  )}
                </button>
              )}
              {role === USER_ROLES.administrator && (
                <button
                  type="button"
                  onClick={() => setUserManagementOpen(true)}
                  className={styles.headerUserManagementButton}
                >
                  User Management
                </button>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className={styles.logoutBtn}
              >
                Logout
              </button>
            </div>
          </div>
        </header>

                {/* Hero Content */}
                <div className={styles.heroContent}>
                  {/* Intro Section */}
                  <div 
                    className={`${styles.heroIntro} ${
                      !heroCollapsed ? styles.heroIntroVisible : styles.heroIntroHidden
                    }`}
                    style={{ transitionDelay: heroCollapsed ? '0s' : '0.2s' }}
                  >
                    <h1 className="text-4xl font-semibold leading-tight text-[#072c63] sm:text-5xl md:text-6xl">
                      <span className="block">See the school from within</span>
                      <span className="mt-4 block text-2xl font-light uppercase tracking-[0.4em] text-[#0a62c2]">Kham pha khuon vien</span>
                    </h1>
                    <div className={styles.heroActions}>
                      <button
                        type="button"
                        onClick={handleHeroExplore}
                        className="px-6 py-3 text-sm uppercase tracking-[0.35em] bg-[#0a62c2] text-white shadow-lg transition hover:bg-[#084f9b]"
                      >
                        Explore 3D Map
                      </button>
                    </div>
                  </div>

        </div>

                {/* Building-specific Controls */}
                <div 
                  className={`${styles.buildingControlsWrapper} ${
                    heroCollapsed && !isBuildingInfoOpen && !isScheduleOpen ? styles.buildingControlsVisible : styles.buildingControlsHidden
                  }`}
                >
                  <button
                    type="button"
                    onClick={handleToggleBuildingInfo}
                    className={styles.buildingInfoButton(isBuildingInfoOpen, selectedBuilding !== null)}
                    disabled={!selectedBuilding}
                  >
                    {isBuildingInfoOpen ? 'Hide Building Info' : selectedBuilding ? `Building Info: ${selectedBuilding.building_name}` : 'Select a Building'}
                  </button>

                  <button
                    type="button"
                    onClick={handleScheduleButtonClick}
                    className={styles.scheduleButton(isScheduleOpen, selectedBuilding !== null)}
                    disabled={!selectedBuilding}
                  >
                    {isScheduleOpen ? 'Hide Schedule' : selectedBuilding ? `Schedule: ${selectedBuilding.building_name}` : 'Select a Building'}
                  </button>
                </div>
      </div>

      {/* Modals and Panels */}
      {isBuildingInfoOpen && selectedBuilding && (
        <BuildingInfoModal
          building={selectedBuilding}
          onClose={() => setIsBuildingInfoOpen(false)}
          onRoomSelect={() => {
            // Room selection now only shows the 2D preview popup
            // The schedule panel doesn't automatically open anymore
            // Users can manually open it using the schedule button if needed
          }}
          canEdit={canEditSchedule}
          canRequest={canRequestRoom}
          onAdminAction={(roomNumber, slotHour) => {
            if (canEditSchedule) {
              // Open edit modal for admin/building manager
              const key = buildScheduleKey(roomNumber, slotHour)
              const existing = scheduleMap[key]
              setRequestState({
                isOpen: true,
                isEditMode: true,
                room: roomNumber,
                startHour: slotHour,
                endHour: slotHour,
                existingEntry: existing
              })
            }
          }}
          onTeacherRequest={(roomNumber, slotHour) => {
            if (!canRequestRoom) {
              return
            }

            // Check if slot is available
            const key = buildScheduleKey(roomNumber, slotHour)
            const entry = scheduleMap[key]
            
            if (entry && entry.status !== SCHEDULE_STATUS.empty && entry.status !== SCHEDULE_STATUS.pending) {
              notifyError('Slot not available', {
                description: `Room ${roomNumber} at ${getSlotLabel(slotHour)} is already ${SCHEDULE_STATUS_LABELS[entry.status].toLowerCase()}.`
              })
              return
            }

            // Open request modal for teacher
            setRequestState({
              isOpen: true,
              isEditMode: false,
              room: roomNumber,
              startHour: slotHour,
              endHour: slotHour
            })
          }}
          userRole={role}
        />
      )}

      <UserManagementModal
        isOpen={userManagementOpen}
        onClose={() => setUserManagementOpen(false)}
      />

      <BuildingSchedulePanel
        isOpen={isScheduleOpen}
        selectedBuilding={selectedBuilding}
        buildingRooms={buildingRooms}
        buildingRoomsLoading={buildingRoomsLoading}
        roomsBySection={roomsBySection}
        scheduleDate={scheduleDate}
        setScheduleDate={setScheduleDate}
        timeSlots={timeSlots}
        scheduleMap={scheduleMap}
        scheduleLoading={scheduleLoading}
        onClose={() => setScheduleOpen(false)}
        onCellClick={(roomNumber, slotHour) => {
          if (canEditSchedule) {
            // Open edit modal for admin/building manager
            const key = buildScheduleKey(roomNumber, slotHour)
            const existing = scheduleMap[key]
            setRequestState({
              isOpen: true,
              isEditMode: true,
              room: roomNumber,
              startHour: slotHour,
              endHour: slotHour,
              existingEntry: existing
            })
          } else if (canRequestRoom) {
            // Check if slot is available
            const key = buildScheduleKey(roomNumber, slotHour)
            const entry = scheduleMap[key]
            
            if (entry && entry.status !== SCHEDULE_STATUS.empty && entry.status !== SCHEDULE_STATUS.pending) {
              notifyError('Slot not available', {
                description: `Room ${roomNumber} at ${getSlotLabel(slotHour)} is already ${SCHEDULE_STATUS_LABELS[entry.status].toLowerCase()}.`
              })
              return
            }

            // Open request modal for teacher
            setRequestState({
              isOpen: true,
              isEditMode: false,
              room: roomNumber,
              startHour: slotHour,
              endHour: slotHour
            })
          }
        }}
        canEdit={canEditSchedule}
        canRequest={canRequestRoom}
      />

      {/* Schedule Edit Modal (Admin/Building Manager) */}
      {canEditSchedule && requestState.isOpen && requestState.isEditMode && (
        <ScheduleEditModal
          isOpen={requestState.isOpen}
          editState={requestState}
          editForm={requestForm}
          timeSlots={timeSlots}
          onClose={resetRequestModal}
          onFormChange={(e) => {
            const { name, value } = e.target
            setRequestForm((prev) => ({ ...prev, [name]: value }))
          }}
          onRangeChange={(field) => (e) => {
            const value = Number(e.target.value)
            setRequestState((prev) => ({
              ...prev,
              [field]: value,
              endHour: field === 'startHour' ? Math.max(value, prev.endHour || value) : value,
              startHour: field === 'endHour' ? Math.min(prev.startHour || value, value) : (field === 'startHour' ? value : prev.startHour)
            }))
          }}
          onSubmit={async (e) => {
            e.preventDefault()
            await saveSchedule(requestState, requestForm)
            resetRequestModal()
          }}
        />
      )}

      {/* Room Request Modal (Teacher) */}
      {canRequestRoom && requestState.isOpen && !requestState.isEditMode && (
        <RoomRequestModal
          isOpen={requestState.isOpen}
          requestState={requestState}
          requestForm={requestForm}
          timeSlots={timeSlots}
          onClose={resetRequestModal}
          onFormChange={(e) => {
            const { name, value } = e.target
            setRequestForm((prev) => ({ ...prev, [name]: value }))
          }}
          onRangeChange={(field) => (e) => {
            const value = Number(e.target.value)
            setRequestState((prev) => ({
              ...prev,
              [field]: value,
              endHour: field === 'startHour' ? Math.max(value, prev.endHour || value) : value,
              startHour: field === 'endHour' ? Math.min(prev.startHour || value, value) : (field === 'startHour' ? value : prev.startHour)
            }))
          }}
          onSubmit={async (e) => {
            e.preventDefault()
            
            if (!requestState.room || requestState.startHour === null || requestState.endHour === null) {
              notifyError('Missing time selection', {
                description: 'Please choose a valid time range before submitting your request.'
              })
              return
            }

            // Convert scheduleDate to ISO string
            const toIsoDateString = (dateObj) => {
              const local = new Date(dateObj.getTime() - dateObj.getTimezoneOffset() * 60000)
              return local.toISOString().split('T')[0]
            }
            
            const isoDate = toIsoDateString(scheduleDate)
            const startHour = Math.min(requestState.startHour, requestState.endHour)
            const endHour = Math.max(requestState.startHour, requestState.endHour)
            const weekCount = requestForm.weekCount
            const trimmedCourse = requestForm.courseName?.trim() || ''
            const trimmedBookedBy = requestForm.bookedBy?.trim() || ''
            const trimmedNotes = requestForm.notes?.trim() || ''

            if (!trimmedBookedBy) {
              notifyError('Missing usage information', {
                description: 'Please provide who will use the room.'
              })
              return
            }

            const result = await submitRequest({
              room_number: requestState.room,
              base_date: isoDate,
              start_hour: startHour,
              end_hour: endHour,
              week_count: weekCount,
              course_name: trimmedCourse || null,
              booked_by: trimmedBookedBy || null,
              notes: trimmedNotes || null
            })
            
            if (result) {
              resetRequestModal()
            }
          }}
        />
      )}

      {/* Requests Panel (Admin/Building Manager) */}
      {canManageRequests && (
        <RequestsPanel
          isOpen={requestsPanelOpen}
          requests={requests}
          pendingRequests={pendingRequests}
          historicalRequests={historicalRequests}
          requestsLoading={requestsLoading}
          historicalDateFilter={historicalDateFilter}
          rejectionReasons={rejectionReasons}
          setRejectionReasons={setRejectionReasons}
          requestActionLoading={requestActionLoading}
          onClose={() => setRequestsPanelOpen(false)}
          onDateFilterChange={setHistoricalDateFilter}
          onApprove={(request) => approveRequest(request, { parseDateString: parseDateStringWrapper, toIsoDateString, getSlotLabel })}
          onReject={rejectRequest}
          onRevert={(request) => revertRequest(request, { parseDateString: parseDateStringWrapper, toIsoDateString })}
        />
      )}

      {/* My Requests Panel (Teacher) */}
      {canRequestRoom && (
        <MyRequestsPanel
          isOpen={myRequestsPanelOpen}
          myRequests={myRequests}
          filteredMyRequests={filteredMyRequests}
          myRequestsLoading={myRequestsLoading}
          myRequestsDateFilter={myRequestsDateFilter}
          onClose={() => setMyRequestsPanelOpen(false)}
          onDateFilterChange={setMyRequestsDateFilter}
        />
      )}
    </div>
  )
}

export default HomePage
