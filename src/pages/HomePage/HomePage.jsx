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
  SearchBuilding
} from './'
import UnifiedPanel from './UnifiedPanel'
import { RequestsPanelContent, MyRequestsPanelContent } from './UnifiedPanelContent'
import { UserManagementContent } from './UserManagementContent'
import { BuildingSchedulePanelContent } from './BuildingSchedulePanelContent'
import BuildingSidebar from '../../components/BuildingInfo/BuildingSidebar'

// Import custom hooks
import { useScheduleManagement } from '../../hooks/useScheduleManagement'
import { useRoomRequests } from '../../hooks/useRoomRequests'
import { useCameraControls } from '../../hooks/useCameraControls'

// Import utilities
import {
  generateTimeSlots,
  toIsoDateString,
  parseDateString,
  groupRoomsByFloor
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
  buildingControlsWrapper: "absolute top-[5.5rem] left-8 md:left-12 z-30 pointer-events-auto flex flex-col gap-2.5 transition-opacity duration-200",
  buildingControlsVisible: "opacity-100",
  buildingControlsHidden: "opacity-0 pointer-events-none"
}

function HomePage() {
  console.log('[HomePage] Component rendering...')
  const navigate = useNavigate()
  const { user, loading, role, profile } = useAuth()
  console.log('[HomePage] Auth state:', { user: !!user, loading, role })
  const { notifyError, notifyInfo } = useNotifications()
  const controlsRef = useRef()
  
  // Building state
  const [buildings, setBuildings] = useState([])
  const [building, setBuilding] = useState(null)
  const [buildingLoading, setBuildingLoading] = useState(true)
  const [selectedBuilding, setSelectedBuilding] = useState(null)
  const [isBuildingInfoOpen, setIsBuildingInfoOpen] = useState(false)
  
  // Schedule panel state
  const [isScheduleOpen, setScheduleOpen] = useState(false)
  
  // Building dropdown state
  const [isBuildingDropdownOpen, setIsBuildingDropdownOpen] = useState(false)
  const [isDropdownClosing, setIsDropdownClosing] = useState(false)
  const dropdownRef = useRef(null)
  
  const [buildingRooms, setBuildingRooms] = useState([])
  const [buildingRoomsLoading, setBuildingRoomsLoading] = useState(false)
  const [scheduleDate, setScheduleDate] = useState(() => new Date())
  
  // UI state (kept for backward compatibility with existing button states)
  // eslint-disable-next-line no-unused-vars
  const [userManagementOpen, setUserManagementOpen] = useState(false)
  const [heroCollapsed, setHeroCollapsed] = useState(false)
  
  // Unified Panel state
  const [unifiedPanelContentType, setUnifiedPanelContentType] = useState(null) // 'requests' | 'my-requests' | 'user-management' | 'building-info' | null
  const isUnifiedPanelOpen = unifiedPanelContentType !== null
  
  // BuildingSidebar state (for UnifiedPanel building-info content)
  const [selectedFloor, setSelectedFloor] = useState(null)
  const [selectedRoomCode, setSelectedRoomCode] = useState(null)

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
    submitRequest,
    requestState,
    setRequestState,
    requestForm,
    setRequestForm,
    resetRequestModal
  } = useRoomRequests(canManageRequests, canRequestRoom, user, profile)

  // Camera drag detection to guard building select/deselect during drags
  const [isCameraInteracting, setIsCameraInteracting] = useState(false)
  const [lastCameraInteractionAt, setLastCameraInteractionAt] = useState(0)

  // Camera controls hook
  useCameraControls(controlsRef, heroCollapsed)

  // Group rooms by floor
  const roomsByFloor = useMemo(() => 
    groupRoomsByFloor(buildingRooms), 
    [buildingRooms]
  )

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
    setTimeout(() => {
      setIsBuildingDropdownOpen(false)
      setIsDropdownClosing(false)
    }, 200) // Match animation duration
  }

  const handleOpenDropdown = () => {
    setIsDropdownClosing(false)
    setIsBuildingDropdownOpen(true)
  }

  // Dropdown stays open when panels open - don't auto-close it

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

  const handleHeroExplore = () => {
    setHeroCollapsed(true)
    
    // Auto-rotate off when user starts exploring
    if (controlsRef.current) {
      controlsRef.current.autoRotate = false
    }
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
      setIsBuildingInfoOpen(false)
      setScheduleOpen(false)
    }
  }

  const handleMyRequestsClick = () => {
    // Don't close dropdown - allow switching content types
    if (unifiedPanelContentType === 'my-requests') {
      setUnifiedPanelContentType(null)
      setMyRequestsPanelOpen(false)
    } else {
      setUnifiedPanelContentType('my-requests')
      setMyRequestsPanelOpen(true)
      setIsBuildingInfoOpen(false)
      setScheduleOpen(false)
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
      setIsBuildingInfoOpen(false)
      setScheduleOpen(false)
    }
  }

  const handleBuildingInfoToggle = () => {
    // Don't close dropdown - allow switching content types
    if (unifiedPanelContentType === 'building-info') {
      setUnifiedPanelContentType(null)
      setIsBuildingInfoOpen(false)
    } else {
      // Switch to building-info content
      setUnifiedPanelContentType('building-info')
      setIsBuildingInfoOpen(true)
      setScheduleOpen(false) // Close schedule if open
    }
  }

  const handleScheduleToggle = () => {
    // Don't close dropdown - allow switching content types
    if (unifiedPanelContentType === 'schedule') {
      setUnifiedPanelContentType(null)
      setScheduleOpen(false)
    } else {
      // Switch to schedule content in UnifiedPanel
      if (!selectedBuilding) {
        // Need a building selected first
        return
      }
      setUnifiedPanelContentType('schedule')
      setScheduleOpen(true)
      setIsBuildingInfoOpen(false) // Close building-info if open
      // Ensure building rooms are loaded
      if (buildingRooms.length === 0 && !buildingRoomsLoading) {
        handleScheduleButtonClickInternal()
      }
    }
  }

  const handleBuildingClick = (clickedBuilding) => {
    // Ignore clicks that immediately follow camera drags to prevent accidental (de)select
    if (isCameraInteracting || Date.now() - lastCameraInteractionAt < 200) {
      return
    }
    if (selectedBuilding?.id === clickedBuilding?.id) {
      setSelectedBuilding(null)
      setIsBuildingInfoOpen(false)
      setScheduleOpen(false)
      setUnifiedPanelContentType(null)
      // Close dropdown when deselecting building
      handleCloseDropdown()
    } else {
      setSelectedBuilding(clickedBuilding)
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
      
      // Load building rooms
      setBuildingRoomsLoading(true)
      const { data: buildingRoomsData, error: roomsError } = await fetchRoomsByBuildingId(building.id)
      if (!roomsError && buildingRoomsData) {
        setBuildingRooms(buildingRoomsData)
      }
      setBuildingRoomsLoading(false)

      // Open building info in unified panel
      setIsBuildingInfoOpen(true)
      setUnifiedPanelContentType('building-info')
      
      // Collapse hero if not already collapsed
      if (!heroCollapsed) {
        setHeroCollapsed(true)
      }

      // If room code is provided, navigate to the specific room
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

        // Navigate to the specific room
        // This will be handled by BuildingInfoModal
        setTimeout(() => {
          // Trigger selection of the room in the modal
          const event = new CustomEvent('search-room', { detail: { roomCode: roomCode } })
          window.dispatchEvent(event)
        }, 300) // Small delay to ensure modal is mounted
        
        notifyInfo('Room found', {
          description: `Showing ${building.building_code} - Room ${roomCode}`
        })
      } else {
        // Just open building info
        notifyInfo('Building opened', {
          description: `Showing building ${building.building_code}`
        })
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
      <div className={styles.canvasContainer}>
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
              setLastCameraInteractionAt(Date.now())
            }}
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
                  className={styles.headerRequestsButton(requestsPanelOpen, requestsLoading)}
                  disabled={requestsLoading}
                >
                  {requestsLoading ? 'Loading...' : 'Manage Requests'}
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

                {/* Hero Content - Left Side Fade Overlay */}
                <div className={`absolute top-0 left-0 w-[45%] h-full z-0 transition-all duration-500 ease-in-out ${
                      !heroCollapsed ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
                    }`}>
                  {/* Gradient Background - Fades from top to bottom and right to left */}
                  <div 
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(to bottom, rgba(34, 40, 49, 0.4) 0%, rgba(34, 40, 49, 0.3) 20%, rgba(34, 40, 49, 0.18) 45%, rgba(34, 40, 49, 0.08) 65%, rgba(34, 40, 49, 0.02) 80%, transparent 95%), linear-gradient(to right, rgba(34, 40, 49, 0.25) 0%, rgba(34, 40, 49, 0.15) 20%, rgba(34, 40, 49, 0.08) 45%, rgba(34, 40, 49, 0.03) 70%, rgba(34, 40, 49, 0.01) 85%, transparent 95%)'
                    }}
                    aria-hidden="true"
                  />
                  
                  {/* Content */}
                  <div className="relative h-full flex flex-col justify-center pl-8 md:pl-12">
                    <div 
                      className={`${styles.heroIntro} ${
                        !heroCollapsed ? styles.heroIntroVisible : styles.heroIntroHidden
                      }`}
                      style={{ transitionDelay: heroCollapsed ? '0s' : '0.2s' }}
                    >
                      <div className="relative max-w-xl">
                        <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl md:text-6xl drop-shadow-2xl">
                          <span className="block bg-gradient-to-r from-white via-[#EEEEEE] to-white bg-clip-text text-transparent">See the school</span>
                          <span className="block text-white mt-3">from within</span>
                          <span className="mt-6 block text-xl font-light uppercase tracking-[0.5em] text-white drop-shadow-xl">Explore the campus</span>
                        </h1>
                        <div className={styles.heroActions} style={{ marginTop: '2.5rem' }}>
                          <button
                            type="button"
                            onClick={handleHeroExplore}
                            className="px-8 py-4 text-sm uppercase tracking-[0.35em] bg-[#3282B8] text-[#EEEEEE] shadow-xl transition-all duration-300 hover:bg-[#4BA3D3] hover:shadow-2xl hover:scale-105 border border-[#3282B8]/30 rounded-lg font-semibold"
                            style={{
                              boxShadow: '0 6px 20px rgba(50, 130, 184, 0.5)'
                            }}
                          >
                            Explore 3D Map
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Building-specific Controls */}
                {/* Building Controls - Always visible when hero is collapsed, no sliding */}
                <div 
                  className={`${styles.buildingControlsWrapper} ${
                    heroCollapsed ? styles.buildingControlsVisible : styles.buildingControlsHidden
                  }`}
                >
                  <div className="relative" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => isBuildingDropdownOpen ? handleCloseDropdown() : handleOpenDropdown()}
                      className={cn(
                        "uppercase tracking-[0.28em] text-[0.6rem] px-5 py-2.5 border border-[#EEEEEE]/30 bg-[#393E46]/80 text-[#EEEEEE] shadow-lg backdrop-blur-sm transition-colors duration-200",
                        selectedBuilding !== null ? (isBuildingInfoOpen || isScheduleOpen ? "bg-[#3282B8]" : "hover:bg-[#3282B8]") : "border-[#EEEEEE]/10 text-[#EEEEEE]/30 cursor-not-allowed"
                      )}
                      disabled={!selectedBuilding}
                    >
                      Building: {selectedBuilding ? selectedBuilding.building_name : 'Select a Building'}
                    </button>
                    
                    {(isBuildingDropdownOpen || isDropdownClosing) && selectedBuilding && (
                      <div 
                        className="building-dropdown absolute top-full left-0 mt-2 z-40 flex flex-col gap-1 min-w-[200px]"
                        style={{
                          animation: isDropdownClosing ? 'fadeOutDrop 0.2s ease-out' : 'fadeInDrop 0.2s ease-out'
                        }}
                      >
                        <style>{`
                          @keyframes fadeInDrop {
                            from {
                              opacity: 0;
                              transform: translateY(-10px) scale(0.95);
                            }
                            to {
                              opacity: 1;
                              transform: translateY(0) scale(1);
                            }
                          }
                          @keyframes fadeOutDrop {
                            from {
                              opacity: 1;
                              transform: translateY(0) scale(1);
                            }
                            to {
                              opacity: 0;
                              transform: translateY(-10px) scale(0.95);
                            }
                          }
                        `}</style>
                        <button
                          type="button"
                          onClick={() => {
                            handleBuildingInfoToggle()
                          }}
                          className="uppercase tracking-[0.28em] text-[0.6rem] px-5 py-2.5 border border-[#EEEEEE]/30 bg-[#393E46]/90 text-[#EEEEEE] shadow-lg backdrop-blur-sm transition-all duration-200 text-left"
                          onMouseEnter={(e) => {
                            if (!isBuildingInfoOpen) {
                              e.currentTarget.style.backgroundColor = COLORS.blue
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isBuildingInfoOpen) {
                              e.currentTarget.style.backgroundColor = '#393E4690'
                            }
                          }}
                          style={{ backgroundColor: isBuildingInfoOpen ? COLORS.blue : '#393E4690' }}
                        >
                          Building Info
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => {
                            handleScheduleToggle()
                          }}
                          className="uppercase tracking-[0.28em] text-[0.6rem] px-5 py-2.5 border border-[#EEEEEE]/30 bg-[#393E46]/90 text-[#EEEEEE] shadow-lg backdrop-blur-sm transition-all duration-200 text-left"
                          onMouseEnter={(e) => {
                            if (!isScheduleOpen) {
                              e.currentTarget.style.backgroundColor = COLORS.blue
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isScheduleOpen) {
                              e.currentTarget.style.backgroundColor = '#393E4690'
                            }
                          }}
                          style={{ backgroundColor: isScheduleOpen ? COLORS.blue : '#393E4690' }}
                        >
                          Schedule
                        </button>
                      </div>
                    )}
                  </div>
                </div>
      </div>

      {/* Modals and Panels */}
      {/* BuildingInfoModal removed - now using UnifiedPanel with BuildingSidebar */}
      {/* Keep BuildingInfoModal for PreviewPanel and SchedulePanel functionality - but these stay separate */}
      {isBuildingInfoOpen && selectedBuilding && unifiedPanelContentType !== 'building-info' && (
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

      {/* Unified Panel for Requests, My Requests, User Management, Building Info, and Schedule */}
      <UnifiedPanel
        isOpen={isUnifiedPanelOpen}
        contentType={unifiedPanelContentType}
        onClose={() => {
          const currentType = unifiedPanelContentType
          setUnifiedPanelContentType(null)
          // Also close individual panel states when unified panel closes
          if (currentType === 'requests') setRequestsPanelOpen(false)
          if (currentType === 'my-requests') setMyRequestsPanelOpen(false)
          if (currentType === 'user-management') setUserManagementOpen(false)
          if (currentType === 'building-info') setIsBuildingInfoOpen(false)
          if (currentType === 'schedule') setScheduleOpen(false)
        }}
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
          />
        )}
        {unifiedPanelContentType === 'my-requests' && canRequestRoom && (
          <MyRequestsPanelContent
            myRequests={myRequests}
            filteredMyRequests={filteredMyRequests}
            myRequestsLoading={myRequestsLoading}
            myRequestsDateFilter={myRequestsDateFilter}
            onDateFilterChange={setMyRequestsDateFilter}
          />
        )}
        {unifiedPanelContentType === 'user-management' && (
          <UserManagementContent currentUserId={user?.id} />
        )}
        {unifiedPanelContentType === 'building-info' && selectedBuilding && (
          <BuildingSidebar
            building={selectedBuilding}
            onClose={() => {
              setUnifiedPanelContentType(null)
              setIsBuildingInfoOpen(false)
              setSelectedFloor(null)
              setSelectedRoomCode(null)
            }}
            onRoomSelect={() => {
              // Room selection handled within BuildingSidebar
              // PreviewPanel and SchedulePanel stay separate (not in UnifiedPanel)
            }}
            selectedFloor={selectedFloor}
            setSelectedFloor={setSelectedFloor}
            selectedRoomCode={selectedRoomCode}
            onRoomDeselect={() => {
              setSelectedRoomCode(null)
            }}
            isOpen={true}
          />
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
        )}
      </UnifiedPanel>

      {/* Legacy schedule panel removed; schedule now always renders inside UnifiedPanel */}

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
            const trimmedNotes = requestForm.notes?.trim() || ''

            const result = await submitRequest({
              room_number: requestState.room,
              building_code: selectedBuilding?.building_code || '',
              base_date: isoDate,
              start_hour: startHour,
              end_hour: endHour,
              week_count: weekCount,
              course_name: trimmedCourse || null,
              notes: trimmedNotes || null
            })
            
            if (result) {
              resetRequestModal()
            }
          }}
        />
      )}

      {/* Old RequestsPanel and MyRequestsPanel removed - now using UnifiedPanel */}
    </div>
  )
}

export default HomePage
