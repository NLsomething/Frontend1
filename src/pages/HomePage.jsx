import { useNavigate } from 'react-router-dom'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useAuth } from '../context/AuthContext'
import { signOut } from '../services/authService'
import { useEffect, useState, useMemo, useCallback, Fragment, useRef } from 'react'
import * as THREE from 'three'
import SchoolModel from '../components/SchoolModel'
import BuildingInfoModal from '../components/BuildingInfoModal'
import { useNotifications } from '../context/NotificationContext'
import { USER_ROLES } from '../constants/roles'
import { SCHEDULE_STATUS, SCHEDULE_STATUS_LABELS, SCHEDULE_STATUS_STYLES } from '../constants/schedule'
import { getSchedulesByDate, upsertScheduleEntry, deleteScheduleEntry } from '../services/scheduleService'
import { ROOM_REQUEST_STATUS, ROOM_REQUEST_STATUS_LABELS, ROOM_REQUEST_STATUS_STYLES, MAX_ROOM_REQUEST_WEEKS } from '../constants/requests'
import { createRoomRequest, fetchRoomRequests, updateRoomRequestStatus } from '../services/roomRequestService'
import { fetchBuildings } from '../services/buildingService'
import { fetchRoomsByBuildingId } from '../services/roomService'
import { createButton, cn } from '../styles/shared'

// Styles
const styles = {
  screen: "relative w-full h-screen overflow-hidden",
  canvasContainer: "w-full h-full",
  logoutBtn: cn(createButton('secondary', 'lg'), "absolute top-6 right-6 z-10 shadow-lg"),
  canvasInstructions: "absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10 text-white bg-black/50 backdrop-blur-sm px-6 py-3 rounded-full text-sm font-medium shadow-lg",
  requestsButton: (isOpen, loading) => cn(
    "absolute top-6 left-6 z-20 bg-white text-[#0b7a4b] font-semibold py-3 px-5 border border-[#0b7a4b] shadow-lg transition-all duration-200 rounded-lg",
    loading ? "opacity-60 cursor-not-allowed" : "hover:bg-[#0b7a4b] hover:text-white hover:shadow-xl",
    isOpen ? "scale-95" : "scale-100"
  ),
  myRequestsButton: (isOpen) => cn(
    "absolute top-6 left-6 z-20 bg-white text-[#096ecc] font-semibold py-3 px-5 border border-[#096ecc] shadow-lg transition-all duration-200 hover:bg-[#096ecc] hover:text-white hover:shadow-xl rounded-lg",
    isOpen ? "scale-95" : "scale-100"
  ),
  buildingInfoButton: (isOpen, hasBuilding) => cn(
    "absolute top-[5.5rem] left-6 z-20 font-semibold py-3 px-5 border shadow-lg transition-all duration-200 rounded-lg",
    hasBuilding 
      ? "bg-white text-[#f97316] border-[#f97316] hover:bg-[#f97316] hover:text-white hover:shadow-xl" 
      : "bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed",
    isOpen ? "scale-95" : "scale-100"
  ),
  scheduleButton: (isOpen, hasBuilding) => cn(
    "absolute top-[10rem] left-6 z-20 font-semibold py-3 px-5 border shadow-lg transition-all duration-200 rounded-lg",
    hasBuilding 
      ? "bg-white text-[#096ecc] border-[#096ecc] hover:bg-[#096ecc] hover:text-white hover:shadow-xl" 
      : "bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed",
    isOpen ? "scale-95" : "scale-100"
  )
}

const ScheduleGrid = ({ rooms, timeSlots, scheduleMap, onAdminAction, onTeacherRequest, buildKey, canEdit, canRequest }) => {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[960px]">
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: `120px repeat(${timeSlots.length}, minmax(70px, 1fr))`,
            borderTop: '1px solid #e2e8f0',
            fontSize: '14px'
          }}
        >
          {/* Top-left corner cell */}
          <div className="bg-white px-4 py-3 font-semibold text-slate-700 border-r border-slate-200">
            Room
          </div>
          
          {/* Header row: Time slots */}
          {timeSlots.map((slot) => (
            <div key={`header-${slot.hour}`} className="bg-white px-2 py-3 text-center font-semibold text-slate-600 border-l border-slate-200 text-xs">
              {slot.label}
            </div>
          ))}
          
          {/* Data rows: One row per room */}
          {rooms.map((room) => (
            <Fragment key={`room-${room}`}>
              {/* Room name cell */}
              <div className="bg-white px-4 py-3 font-medium text-slate-700 border-t border-r border-slate-200">
                {room}
              </div>
              
              {/* Schedule cells for this room across all time slots */}
              {timeSlots.map((slot) => {
                const key = buildKey(room, slot.hour)
                const entry = scheduleMap[key]
                const status = entry?.status || SCHEDULE_STATUS.empty
                const label = SCHEDULE_STATUS_LABELS[status]
                const details = entry?.course_name || entry?.booked_by ? [entry?.course_name, entry?.booked_by].filter(Boolean) : []
                const interactive = canEdit || canRequest
                
                // Get style based on status with explicit colors
                const getStatusStyle = () => {
                  switch (status) {
                    case SCHEDULE_STATUS.empty:
                      return 'bg-slate-50/80 text-slate-600 border-slate-200'
                    case SCHEDULE_STATUS.occupied:
                      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    case SCHEDULE_STATUS.maintenance:
                      return 'bg-amber-50 text-amber-700 border-amber-200'
                    case SCHEDULE_STATUS.pending:
                      return 'bg-blue-50 text-blue-700 border-blue-200'
                    default:
                      return 'bg-slate-50/80 text-slate-600 border-slate-200'
                  }
                }
                
                const cellClasses = `border-t border-l px-2 py-3 text-left transition-colors duration-150 ${getStatusStyle()} ${interactive ? 'cursor-pointer hover:bg-slate-200/60' : 'cursor-default'}`

                return (
                  <button
                    type="button"
                    key={key}
                    className={cellClasses}
                    onClick={() => {
                      if (canEdit && onAdminAction) {
                        onAdminAction(room, slot.hour)
                      } else if (canRequest && onTeacherRequest) {
                        onTeacherRequest(room, slot.hour)
                      }
                    }}
                    disabled={!interactive}
                  >
                    <span className="block text-xs font-semibold uppercase tracking-wide">
                      {label}
                    </span>
                    {details.length > 0 && (
                      <span className="mt-1 block space-y-0.5 text-xs text-slate-600">
                        {details.map((line, index) => (
                          <span key={`${key}-detail-${index}`} className="block truncate">
                            {line}
                          </span>
                        ))}
                      </span>
                    )}
                  </button>
                )
              })}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}

const CAMERA_CONFIG = {
  baseSpeed: 0.6,
  referenceDistance: 50,
  getScaledSpeed: (distance) => {
    return CAMERA_CONFIG.baseSpeed * (distance / CAMERA_CONFIG.referenceDistance)
  }
}

function HomePage() {
  const navigate = useNavigate()
  const { user, loading, role, profile } = useAuth()
  const { notifySuccess, notifyError, notifyInfo } = useNotifications()
  const controlsRef = useRef()
  const isPanning = useRef(false)
  const lastPanPosition = useRef({ x: 0, y: 0 })
  const [building, setBuilding] = useState(null)
  const [buildingLoading, setBuildingLoading] = useState(true)
  const [selectedBuilding, setSelectedBuilding] = useState(null)
  const [isBuildingInfoOpen, setIsBuildingInfoOpen] = useState(false)
  const [isScheduleOpen, setScheduleOpen] = useState(false)
  const [buildingRooms, setBuildingRooms] = useState([])
  const [buildingRoomsLoading, setBuildingRoomsLoading] = useState(false)
  const [scheduleDate, setScheduleDate] = useState(() => new Date())
  const [scheduleLoading, setScheduleLoading] = useState(false)
  const [scheduleMap, setScheduleMap] = useState({})
  const [editState, setEditState] = useState({ isOpen: false, room: null, startHour: null, endHour: null })
  const [editForm, setEditForm] = useState({
    status: SCHEDULE_STATUS.empty,
    courseName: '',
    bookedBy: ''
  })
  const [requestState, setRequestState] = useState({ isOpen: false, room: null, startHour: null, endHour: null })
  const [requestForm, setRequestForm] = useState({
    courseName: '',
    bookedBy: '',
    weekCount: 1,
    notes: ''
  })
  const [requestsPanelOpen, setRequestsPanelOpen] = useState(false)
  const [requestsLoading, setRequestsLoading] = useState(false)
  const [requests, setRequests] = useState([])
  const [rejectionReasons, setRejectionReasons] = useState({})
  const [requestActionLoading, setRequestActionLoading] = useState(false)
  const [submittingRequest, setSubmittingRequest] = useState(false)
  const [myRequestsPanelOpen, setMyRequestsPanelOpen] = useState(false)
  const [myRequests, setMyRequests] = useState([])
  
  // Date filter for historical requests (default to last 7 days)
  const [historicalDateFilter, setHistoricalDateFilter] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })
  
  // Date filter for my requests (default to last 7 days)
  const [myRequestsDateFilter, setMyRequestsDateFilter] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })
  const [myRequestsLoading, setMyRequestsLoading] = useState(false)

  const isoDate = useMemo(() => {
    const local = new Date(scheduleDate.getTime() - scheduleDate.getTimezoneOffset() * 60000)
    return local.toISOString().split('T')[0]
  }, [scheduleDate])

  const timeSlots = useMemo(() => (
    Array.from({ length: 14 }, (_, index) => {
      const hour = 7 + index
      const period = hour < 12 ? 'AM' : 'PM'
      const twelveHour = ((hour + 11) % 12) + 1
      return {
        label: `${twelveHour}:00 ${period}`,
        hour
      }
    })
  ), [])

  const slotHours = useMemo(() => timeSlots.map((slot) => slot.hour), [timeSlots])
  const getSlotLabel = useCallback((hour) => timeSlots.find((slot) => slot.hour === hour)?.label || '', [timeSlots])
  const toIsoDateString = useCallback((dateObj) => {
    const local = new Date(dateObj.getTime() - dateObj.getTimezoneOffset() * 60000)
    return local.toISOString().split('T')[0]
  }, [])
  const parseDateString = useCallback((dateString) => {
    if (!dateString) return new Date()
    const [year, month, day] = dateString.split('-').map(Number)
    return new Date(year, (month || 1) - 1, day || 1)
  }, [])
  const formatDateDisplay = useCallback((dateString) => (
    parseDateString(dateString).toLocaleDateString()
  ), [parseDateString])
  const formatRequestRange = useCallback((request) => {
    const start = Math.min(request.start_hour, request.end_hour)
    const end = Math.max(request.start_hour, request.end_hour)
    const startLabel = getSlotLabel(start)
    const endLabel = getSlotLabel(end)
    return startLabel === endLabel ? startLabel : `${startLabel} – ${endLabel}`
  }, [getSlotLabel])

  const canEditSchedule = role === USER_ROLES.administrator || role === USER_ROLES.buildingManager
  const canViewSchedule = role === USER_ROLES.teacher || role === USER_ROLES.student || canEditSchedule
  const canManageRequests = canEditSchedule
  const canRequestRoom = role === USER_ROLES.teacher
  const defaultBookedBy = useMemo(() => (
    profile?.username || profile?.full_name || user?.user_metadata?.username || user?.email || ''
  ), [profile, user])

  const buildScheduleKey = useCallback((roomNumber, slotHour) => `${roomNumber}-${slotHour}`, [])

  // Group rooms by section and floor
  const roomsBySection = useMemo(() => {
    if (!buildingRooms || buildingRooms.length === 0) return []
    
    const sections = {}
    buildingRooms.forEach(room => {
      const sectionId = room.floors?.sections?.id
      const sectionName = room.floors?.sections?.section_name || 'Unknown Section'
      const floorId = room.floors?.id
      const floorName = room.floors?.floor_name || 'Unknown Floor'
      
      if (!sections[sectionId]) {
        sections[sectionId] = {
          id: sectionId,
          name: sectionName,
          floors: {}
        }
      }
      
      if (!sections[sectionId].floors[floorId]) {
        sections[sectionId].floors[floorId] = {
          id: floorId,
          name: floorName,
          rooms: []
        }
      }
      
      sections[sectionId].floors[floorId].rooms.push(room)
    })
    
    // Convert to array and sort
    return Object.values(sections).map(section => ({
      ...section,
      floors: Object.values(section.floors).sort((a, b) => a.name.localeCompare(b.name))
    })).sort((a, b) => a.name.localeCompare(b.name))
  }, [buildingRooms])

  const loadRequests = useCallback(async ({ silent = false } = {}) => {
    if (!canManageRequests && !canRequestRoom) {
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
  }, [canManageRequests, canRequestRoom, notifyError])

  const loadMyRequests = useCallback(async () => {
    if (!canRequestRoom || !user?.id) {
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
  }, [canRequestRoom, user, notifyError])

  const loadSchedules = useCallback(async () => {
    if (!canViewSchedule) {
      setScheduleMap({})
      return
    }

    setScheduleLoading(true)
    const { data, error } = await getSchedulesByDate(isoDate)

    if (error) {
      console.error('Error loading schedules:', error.message || error)
      setScheduleMap({})
      notifyError('Unable to load schedule data', {
        description: 'Please try again or contact an administrator if the problem continues.'
      })
      setScheduleLoading(false)
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
    setScheduleLoading(false)
  }, [buildScheduleKey, isoDate, canViewSchedule, notifyError])

  useEffect(() => {
    if (!loading && !user) {
      navigate('/')
    }
  }, [user, loading, navigate])

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
          setBuilding(data[0])
        }
      } catch (err) {
        console.error('Unexpected error loading building:', err)
      } finally {
        setBuildingLoading(false)
      }
    }

    loadBuilding()
  }, [notifyError])

  useEffect(() => {
    loadSchedules()
  }, [loadSchedules])

  useEffect(() => {
    setRequestForm((prev) => ({
      ...prev,
      bookedBy: prev.bookedBy || defaultBookedBy
    }))
  }, [defaultBookedBy])

  useEffect(() => {
    if (canManageRequests) {
      loadRequests()
    }
  }, [canManageRequests, loadRequests])

  useEffect(() => {
    if (requestsPanelOpen) {
      loadRequests()
    }
  }, [requestsPanelOpen, loadRequests])

  useEffect(() => {
    if (myRequestsPanelOpen) {
      loadMyRequests()
    }
  }, [myRequestsPanelOpen, loadMyRequests])

  useEffect(() => {
    if (!canManageRequests) {
      return
    }

    const interval = setInterval(() => {
      loadRequests({ silent: true })
    }, 5000)

    return () => {
      clearInterval(interval)
    }
  }, [canManageRequests, loadRequests])

  useEffect(() => {
    const keysPressed = new Set()
    const minX = -60
    const maxX = 60
    const minZ = -60
    const maxZ = 60

    const handleKeyDown = (event) => {
      const target = event.target
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return
      }

      const key = event.key.toLowerCase()
      
      if (!['w', 'a', 's', 'd'].includes(key)) return

      event.preventDefault()
      keysPressed.add(key)

      if (controlsRef.current && controlsRef.current.autoRotate) {
        controlsRef.current.autoRotate = false
      }
    }

    const handleKeyUp = (event) => {
      const key = event.key.toLowerCase()
      keysPressed.delete(key)
    }

    const updateMovement = () => {
      if (!controlsRef.current || keysPressed.size === 0) {
        requestAnimationFrame(updateMovement)
        return
      }

      const orbitTarget = controlsRef.current.target
      const camera = controlsRef.current.object

      const distance = camera.position.distanceTo(orbitTarget)
      const dynamicSpeed = CAMERA_CONFIG.getScaledSpeed(distance)

      const forward = new THREE.Vector3()
      const right = new THREE.Vector3()
      
      camera.getWorldDirection(forward)
      forward.y = 0
      forward.normalize()
      
      right.crossVectors(forward, new THREE.Vector3(0, 1, 0))
      right.normalize()

      const movement = new THREE.Vector3()

      if (keysPressed.has('w')) {
        movement.addScaledVector(forward, dynamicSpeed)
      }
      if (keysPressed.has('s')) {
        movement.addScaledVector(forward, -dynamicSpeed)
      }
      if (keysPressed.has('a')) {
        movement.addScaledVector(right, -dynamicSpeed)
      }
      if (keysPressed.has('d')) {
        movement.addScaledVector(right, dynamicSpeed)
      }

      if (movement.length() > 0) {
        if (keysPressed.size > 1) {
          movement.normalize().multiplyScalar(dynamicSpeed)
        }
        
        const newTarget = orbitTarget.clone().add(movement)
        
        newTarget.x = Math.max(minX, Math.min(maxX, newTarget.x))
        newTarget.z = Math.max(minZ, Math.min(maxZ, newTarget.z))
        
        const actualMovement = newTarget.clone().sub(orbitTarget)
        
        camera.position.add(actualMovement)
        orbitTarget.copy(newTarget)
        controlsRef.current.update()
      }

      requestAnimationFrame(updateMovement)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    const animationId = requestAnimationFrame(updateMovement)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      cancelAnimationFrame(animationId)
    }
  }, [])

  useEffect(() => {
    const handleMouseDown = (event) => {
      if (event.button === 2) {
        event.preventDefault()
        isPanning.current = true
        lastPanPosition.current = { x: event.clientX, y: event.clientY }
        
        if (controlsRef.current) {
          controlsRef.current.autoRotate = false
        }
      }
    }

    const handleMouseMove = (event) => {
      if (!isPanning.current || !controlsRef.current) return

      const deltaX = event.clientX - lastPanPosition.current.x
      const deltaY = event.clientY - lastPanPosition.current.y
      lastPanPosition.current = { x: event.clientX, y: event.clientY }

      const controls = controlsRef.current
      const camera = controls.object

      const distance = camera.position.distanceTo(controls.target)
      const dynamicPanSpeed = CAMERA_CONFIG.getScaledSpeed(distance)

      const right = new THREE.Vector3()
      const forward = new THREE.Vector3()
      
      camera.getWorldDirection(forward)
      forward.y = 0
      forward.normalize()
      
      right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize()

      const horizontalOffset = right.multiplyScalar(-deltaX * dynamicPanSpeed * 0.1)
      const forwardOffset = forward.multiplyScalar(deltaY * dynamicPanSpeed * 0.1)

      const offset = new THREE.Vector3().add(horizontalOffset).add(forwardOffset)
      
      controls.target.add(offset)
      camera.position.add(offset)
      controls.update()
    }

    const handleMouseUp = (event) => {
      if (event.button === 2) {
        isPanning.current = false
      }
    }

    const handleContextMenu = (event) => {
      event.preventDefault()
    }

    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('contextmenu', handleContextMenu)

    return () => {
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('contextmenu', handleContextMenu)
    }
  }, [])

  const pendingRequests = useMemo(() => {
    // Filter pending requests and sort by oldest first (first come, first serve)
    const filtered = requests.filter((request) => request.status === ROOM_REQUEST_STATUS.pending)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.created_at)
      const dateB = new Date(b.created_at)
      return dateA - dateB // Oldest first
    })
  }, [requests])

  const historicalRequests = useMemo(() => {
    const filtered = requests.filter((request) => request.status !== ROOM_REQUEST_STATUS.pending)
    
    // Filter by date range
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

  // Filtered My Requests based on date range
  const filteredMyRequests = useMemo(() => {
    // Filter by date range
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

  const handleRequestsButtonClick = () => {
    if (!canManageRequests) {
      return
    }
    setRequestsPanelOpen((prev) => !prev)
  }

  const handleCellInteraction = (roomNumber, slotHour) => {
    if (!canEditSchedule) {
      return
    }

    const key = buildScheduleKey(roomNumber, slotHour)
    const existing = scheduleMap[key]

    setEditForm({
      status: existing?.status || SCHEDULE_STATUS.empty,
      courseName: existing?.course_name || '',
      bookedBy: existing?.booked_by || ''
    })

    setEditState({
      isOpen: true,
      room: roomNumber,
      startHour: slotHour,
      endHour: slotHour
    })
  }

  const handleTeacherRequest = (roomNumber, slotHour) => {
    if (!canRequestRoom) {
      return
    }

    // Only block if slot is occupied or in maintenance (not pending)
    const key = buildScheduleKey(roomNumber, slotHour)
    const entry = scheduleMap[key]
    
    if (entry && entry.status !== SCHEDULE_STATUS.empty && entry.status !== SCHEDULE_STATUS.pending) {
      notifyError('Slot not available', {
        description: `Room ${roomNumber} at ${getSlotLabel(slotHour)} is already ${SCHEDULE_STATUS_LABELS[entry.status].toLowerCase()}.`
      })
      return
    }

    setRequestState({
      isOpen: true,
      room: roomNumber,
      startHour: slotHour,
      endHour: slotHour
    })

    setRequestForm((prev) => ({
      courseName: '',
      notes: '',
      weekCount: 1,
      bookedBy: prev.bookedBy || defaultBookedBy
    }))
  }

  const resetEditor = () => {
    setEditState({ isOpen: false, room: null, startHour: null, endHour: null })
    setEditForm({ status: SCHEDULE_STATUS.empty, courseName: '', bookedBy: '' })
  }

  const resetRequestModal = () => {
    setRequestState({ isOpen: false, room: null, startHour: null, endHour: null })
    setRequestForm({
      courseName: '',
      bookedBy: defaultBookedBy,
      weekCount: 1,
      notes: ''
    })
  }

  const handleEditChange = (event) => {
    const { name, value } = event.target
    if (name === 'status' && value === SCHEDULE_STATUS.maintenance) {
      setEditForm({ status: value, courseName: '', bookedBy: '' })
      return
    }

    setEditForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleRangeChange = (field) => (event) => {
    const value = Number(event.target.value)
    if (!Number.isFinite(value)) {
      return
    }

    setEditState((prev) => {
      if (field === 'startHour') {
        const newStart = value
        const adjustedEnd = prev.endHour !== null ? Math.max(value, prev.endHour) : value
        return { ...prev, startHour: newStart, endHour: adjustedEnd }
      }

      const newEnd = value
      const adjustedStart = prev.startHour !== null ? Math.min(prev.startHour, value) : value
      return { ...prev, startHour: adjustedStart, endHour: newEnd }
    })
  }

  const handleRequestRangeChange = (field) => (event) => {
    const value = Number(event.target.value)
    if (!Number.isFinite(value)) {
      return
    }

    setRequestState((prev) => {
      if (field === 'startHour') {
        const newStart = value
        const adjustedEnd = prev.endHour !== null ? Math.max(value, prev.endHour) : value
        return { ...prev, startHour: newStart, endHour: adjustedEnd }
      }

      const newEnd = value
      const adjustedStart = prev.startHour !== null ? Math.min(prev.startHour, value) : value
      return { ...prev, startHour: adjustedStart, endHour: newEnd }
    })
  }

  const handleRequestFormChange = (event) => {
    const { name, value } = event.target
    if (name === 'weekCount') {
      const parsed = Number(value)
      if (!Number.isFinite(parsed)) {
        return
      }
      const clamped = Math.min(MAX_ROOM_REQUEST_WEEKS, Math.max(1, Math.round(parsed)))
      setRequestForm((prev) => ({ ...prev, weekCount: clamped }))
      return
    }

    setRequestForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleScheduleSubmit = async (event) => {
    event.preventDefault()
    if (!editState.room || editState.startHour === null || editState.endHour === null) {
      return
    }

    const trimmedCourse = editForm.courseName.trim()
    const trimmedBookedBy = editForm.bookedBy.trim()
    const startHour = Math.min(editState.startHour, editState.endHour)
    const endHour = Math.max(editState.startHour, editState.endHour)
    const hoursToUpdate = slotHours.filter((hour) => hour >= startHour && hour <= endHour)

    if (!hoursToUpdate.length) {
      notifyError('Invalid time range', {
        description: 'Please select a valid time window before saving.'
      })
      return
    }

    const rangeLabel = hoursToUpdate.length === 1
      ? getSlotLabel(hoursToUpdate[0])
      : `${getSlotLabel(hoursToUpdate[0])} – ${getSlotLabel(hoursToUpdate[hoursToUpdate.length - 1])}`

    if (editForm.status === SCHEDULE_STATUS.empty && !trimmedCourse && !trimmedBookedBy) {
      for (const hour of hoursToUpdate) {
        const { error } = await deleteScheduleEntry({
          schedule_date: isoDate,
          room_number: editState.room,
          slot_hour: hour
        })

        if (error) {
          console.error('Error clearing schedule:', error.message || error)
          notifyError('Unable to clear selected slots', {
            description: 'Please try again later.'
          })
          return
        }
      }

      await loadSchedules()
      notifySuccess('Time slots cleared', {
        description: `Room ${editState.room} • ${rangeLabel} is now empty.`
      })
      resetEditor()
      return
    }

    for (const hour of hoursToUpdate) {
      const key = buildScheduleKey(editState.room, hour)
      const existing = scheduleMap[key]
      const { error } = await upsertScheduleEntry({
        id: existing?.id,
        schedule_date: isoDate,
        room_number: editState.room,
        slot_hour: hour,
        status: editForm.status,
        course_name: trimmedCourse,
        booked_by: trimmedBookedBy
      })

      if (error) {
        console.error('Error saving schedule:', error.message || error)
        notifyError('Unable to save schedule', {
          description: 'Please try again later.'
        })
        return
      }
    }

    await loadSchedules()
    notifySuccess('Schedule updated', {
      description: `Room ${editState.room} • ${rangeLabel} has been updated.`
    })
    resetEditor()
  }

  const handleRequestSubmit = async (event) => {
    event.preventDefault()

    if (!requestState.room || requestState.startHour === null || requestState.endHour === null) {
      notifyError('Missing time selection', {
        description: 'Please choose a valid time range before submitting your request.'
      })
      return
    }

    const startHour = Math.min(requestState.startHour, requestState.endHour)
    const endHour = Math.max(requestState.startHour, requestState.endHour)
    const weekCount = requestForm.weekCount
    const trimmedCourse = requestForm.courseName.trim()
    const trimmedBookedBy = requestForm.bookedBy.trim()
    const trimmedNotes = requestForm.notes.trim()

    if (!trimmedBookedBy) {
      notifyError('Missing usage information', {
        description: 'Please provide who will use the room.'
      })
      return
    }

    if (!Number.isInteger(weekCount) || weekCount < 1 || weekCount > MAX_ROOM_REQUEST_WEEKS) {
      notifyError('Invalid week selection', {
        description: `Please choose between 1 and ${MAX_ROOM_REQUEST_WEEKS} weeks.`
      })
      return
    }

    // Validate that the requested slots are still available (not occupied/maintenance)
    for (let hour = startHour; hour <= endHour; hour++) {
      const key = buildScheduleKey(requestState.room, hour)
      const entry = scheduleMap[key]
      
      if (entry && entry.status !== SCHEDULE_STATUS.empty && entry.status !== SCHEDULE_STATUS.pending) {
        notifyError('Slot no longer available', {
          description: `Room ${requestState.room} at ${getSlotLabel(hour)} is now ${SCHEDULE_STATUS_LABELS[entry.status].toLowerCase()}. Please choose a different time.`
        })
        return
      }
    }

    // Check if user already has a pending request for this slot
    try {
      const { data: allRequests, error: checkError } = await fetchRoomRequests()
      
      if (!checkError && allRequests) {
        const duplicateRequest = allRequests.find((req) => 
          req.requester_id === user?.id &&
          req.status === ROOM_REQUEST_STATUS.pending &&
          req.room_number === requestState.room &&
          req.base_date === isoDate &&
          // Check if time ranges overlap
          Math.max(startHour, Math.min(req.start_hour, req.end_hour)) <= 
          Math.min(endHour, Math.max(req.start_hour, req.end_hour))
        )

        if (duplicateRequest) {
          notifyInfo('Request already submitted', {
            description: `You already have a pending request for Room ${requestState.room} on this date at an overlapping time.`
          })
          return
        }
      }
    } catch (err) {
      console.error('Error checking for duplicate requests:', err)
      // Continue anyway - don't block if check fails
    }

    if (!user?.id) {
      notifyError('Not authenticated', {
        description: 'Please sign in again before submitting a request.'
      })
      return
    }

    setSubmittingRequest(true)

    const { error } = await createRoomRequest({
      requester_id: user?.id,
      requester_name: profile?.username || profile?.full_name || user?.user_metadata?.username || user?.email || 'Teacher',
      requester_email: user?.email || null,
      room_number: requestState.room,
      base_date: isoDate,
      start_hour: startHour,
      end_hour: endHour,
      week_count: weekCount,
      course_name: trimmedCourse,
      booked_by: trimmedBookedBy,
      notes: trimmedNotes
    })

    if (error) {
      console.error('Error creating room request:', error.message || error)
      notifyError('Unable to submit request', {
        description: error.message || 'Please try again later.'
      })
      setSubmittingRequest(false)
      return
    }

    notifySuccess('Request submitted', {
      description: `Room ${requestState.room} • ${getSlotLabel(startHour)}${startHour !== endHour ? ` – ${getSlotLabel(endHour)}` : ''} • ${weekCount} week${weekCount > 1 ? 's' : ''}.`
    })

    resetRequestModal()
    setSubmittingRequest(false)

    // Reload admin requests panel if open
    if (requestsPanelOpen) {
      loadRequests({ silent: true })
    }
    
    // Reload teacher's own requests if they have the panel or might open it
    if (canRequestRoom && !canManageRequests) {
      loadMyRequests({ silent: true })
    }
    
    // Reload schedule to show pending request
    await loadSchedules()
  }

  const handleApproveRequest = async (request) => {
    if (requestActionLoading) {
      return
    }

    setRequestActionLoading(true)

    const startHour = Math.min(request.start_hour, request.end_hour)
    const endHour = Math.max(request.start_hour, request.end_hour)
    const hoursToBlock = []
    for (let hour = startHour; hour <= endHour; hour += 1) {
      hoursToBlock.push(hour)
    }

  const scheduledDates = []
  const baseDate = parseDateString(request.base_date)
    for (let week = 0; week < request.week_count; week += 1) {
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
    try {
      await loadRequests()
      await loadSchedules()
    } finally {
      setRequestActionLoading(false)
    }
  }

  const handleRejectRequest = async (request) => {
    if (requestActionLoading) {
      return
    }

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
      return
    }

    notifySuccess('Request rejected', {
      description: `Room request for ${request.room_number} has been rejected.`
    })

    setRejectionReasons((prev) => ({
      ...prev,
      [request.id]: ''
    }))
    try {
      await loadRequests()
    } finally {
      setRequestActionLoading(false)
    }
  }

  const handleBuildingClick = (clickedBuilding) => {
    if (selectedBuilding?.id === clickedBuilding?.id) {
      setSelectedBuilding(null)
      setIsBuildingInfoOpen(false)
      setScheduleOpen(false)
    } else {
      setSelectedBuilding(clickedBuilding)
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

  const handleRoomSelect = async () => {
    // Room selection now only shows the 2D preview popup
    // The schedule panel doesn't automatically open anymore
    // Users can manually open it using the schedule button if needed
  }

  const handleLogout = async () => {
    try {
      const { error } = await signOut()
      if (error) {
        console.error('Error logging out:', error)
        notifyError('Logout failed', {
          description: 'Please try again in a moment.'
        })
      } else {
        navigate('/')
      }
    } catch (error) {
      console.error('Unexpected error during logout:', error)
      notifyError('Unexpected error', {
        description: 'Something went wrong while logging out. Please try again.'
      })
    }
  }

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700">
        <div className="text-white text-xl font-semibold">Loading...</div>
      </div>
    )
  }

  return (
    <div className={styles.screen}>
      <button
        onClick={handleLogout}
        className={styles.logoutBtn}
      >
        Logout
      </button>

      {canManageRequests && (
        <button
          onClick={handleRequestsButtonClick}
          className={styles.requestsButton(requestsPanelOpen, requestActionLoading)}
          disabled={requestActionLoading}
        >
          {requestsPanelOpen ? 'Hide Requests' : `Manage Requests${pendingRequests.length ? ` (${pendingRequests.length})` : ''}`}
        </button>
      )}

      {canRequestRoom && !canManageRequests && (
        <button
          onClick={() => setMyRequestsPanelOpen((prev) => !prev)}
          className={styles.myRequestsButton(myRequestsPanelOpen)}
        >
          {myRequestsPanelOpen ? 'Hide My Requests' : `My Requests${myRequests.length ? ` (${myRequests.length})` : ''}`}
        </button>
      )}

      {selectedBuilding && (
        <>
          <button
            onClick={handleToggleBuildingInfo}
            className={styles.buildingInfoButton(isBuildingInfoOpen, selectedBuilding !== null)}
          >
            {isBuildingInfoOpen ? 'Hide Building Info' : `Building Info: ${selectedBuilding.building_name}`}
          </button>

          <button
            onClick={handleScheduleButtonClick}
            className={styles.scheduleButton(isScheduleOpen, selectedBuilding !== null)}
          >
            {isScheduleOpen ? 'Hide Schedule' : `Schedule: ${selectedBuilding.building_name}`}
          </button>
        </>
      )}

      {requestsPanelOpen && (
        <div
          className="absolute inset-0 z-30 bg-black/10"
          onClick={() => {
            if (requestActionLoading) return
            setRequestsPanelOpen(false)
          }}
        />
      )}

      <aside
        className={`absolute top-0 right-0 z-40 h-full w-full max-w-4xl transition-transform duration-300 ease-in-out ${requestsPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}
        aria-hidden={!requestsPanelOpen}
      >
        <div className="flex h-full w-full flex-col bg-white/95 backdrop-blur-sm border-l border-slate-200 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Room Requests</h2>
              <p className="text-sm text-slate-500">Review and respond to teacher submissions</p>
            </div>
            <button
              onClick={() => setRequestsPanelOpen(false)}
              className="border border-slate-300 px-3 py-1 text-sm font-medium text-slate-600 transition-colors duration-150 hover:bg-slate-100"
            >
              Close
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {requestsLoading ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                Loading requests…
              </div>
            ) : (
              <>
                <section className="space-y-4">
                  <header className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Pending</h3>
                    <span className="text-xs font-medium text-slate-400">{pendingRequests.length} awaiting decision</span>
                  </header>

                  {pendingRequests.length === 0 ? (
                    <div className="rounded border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500">
                      All caught up. No pending requests.
                    </div>
                  ) : (
                    pendingRequests.map((request) => {
                      const statusStyle = ROOM_REQUEST_STATUS_STYLES[request.status] || ROOM_REQUEST_STATUS_STYLES.pending
                      return (
                        <div key={request.id} className="border border-slate-200 bg-white px-5 py-4 shadow-sm">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-800">Room {request.room_number}</p>
                              <p className="text-xs text-slate-500">
                                {formatDateDisplay(request.base_date)} • {formatRequestRange(request)} • {request.week_count} week{request.week_count > 1 ? 's' : ''}
                              </p>
                            </div>
                            <span className={`rounded border px-2 py-1 text-xs font-semibold uppercase tracking-wide ${statusStyle}`}>
                              {ROOM_REQUEST_STATUS_LABELS[request.status]}
                            </span>
                          </div>

                          <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                            <div>
                              <span className="font-semibold text-slate-700">Teacher:</span> {request.requester_name || request.requester_email}
                            </div>
                            {request.booked_by && (
                              <div>
                                <span className="font-semibold text-slate-700">Usage:</span> {request.booked_by}
                              </div>
                            )}
                            {request.course_name && (
                              <div className="sm:col-span-2">
                                <span className="font-semibold text-slate-700">Course/Event:</span> {request.course_name}
                              </div>
                            )}
                            {request.notes && (
                              <div className="sm:col-span-2">
                                <span className="font-semibold text-slate-700">Notes:</span> {request.notes}
                              </div>
                            )}
                          </div>

                          <div className="mt-4 space-y-3">
                            <textarea
                              value={rejectionReasons[request.id] || ''}
                              onChange={(event) => setRejectionReasons((prev) => ({ ...prev, [request.id]: event.target.value }))}
                              placeholder="Add a rejection note (optional)"
                              className="w-full border border-slate-300 px-3 py-2 text-sm text-slate-700"
                              rows={2}
                            />

                            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                              <button
                                type="button"
                                onClick={() => handleRejectRequest(request)}
                                className="border border-rose-400 px-4 py-2 text-sm font-semibold text-rose-500 transition-colors duration-150 hover:bg-rose-50"
                                disabled={requestActionLoading}
                              >
                                {requestActionLoading ? 'Working…' : 'Reject'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleApproveRequest(request)}
                                className="bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700"
                                disabled={requestActionLoading}
                              >
                                {requestActionLoading ? 'Working…' : 'Approve'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </section>

                <section className="space-y-4">
                  <header className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Recent decisions</h3>
                    <span className="text-xs font-medium text-slate-400">Showing last {historicalRequests.length}</span>
                  </header>

                  {/* Date Filter */}
                  <div className="rounded border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">Filter by Date</label>
                      <button
                        onClick={() => {
                          setHistoricalDateFilter({
                            startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                            endDate: new Date().toISOString().split('T')[0]
                          })
                        }}
                        className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        Reset to Last 7 Days
                      </button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">From</label>
                        <input
                          type="date"
                          value={historicalDateFilter.startDate}
                          onChange={(e) => setHistoricalDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
                          className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">To</label>
                        <input
                          type="date"
                          value={historicalDateFilter.endDate}
                          onChange={(e) => setHistoricalDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
                          className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {historicalRequests.length === 0 ? (
                    <div className="rounded border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500">
                      No decisions found for the selected date range.
                    </div>
                  ) : (
                    historicalRequests.map((request) => {
                      const statusStyle = ROOM_REQUEST_STATUS_STYLES[request.status] || ROOM_REQUEST_STATUS_STYLES.pending
                      return (
                        <div key={request.id} className="border border-slate-200 bg-white px-5 py-4 shadow-sm">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-800">Room {request.room_number}</p>
                              <p className="text-xs text-slate-500">
                                {formatDateDisplay(request.base_date)} • {formatRequestRange(request)} • {request.week_count} week{request.week_count > 1 ? 's' : ''}
                              </p>
                            </div>
                            <span className={`rounded border px-2 py-1 text-xs font-semibold uppercase tracking-wide ${statusStyle}`}>
                              {ROOM_REQUEST_STATUS_LABELS[request.status]}
                            </span>
                          </div>

                          <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                            <div>
                              <span className="font-semibold text-slate-700">Teacher:</span> {request.requester_name || request.requester_email}
                            </div>
                            {request.booked_by && (
                              <div>
                                <span className="font-semibold text-slate-700">Usage:</span> {request.booked_by}
                              </div>
                            )}
                            {request.course_name && (
                              <div className="sm:col-span-2">
                                <span className="font-semibold text-slate-700">Course/Event:</span> {request.course_name}
                              </div>
                            )}
                            {request.reviewer_name && (
                              <div>
                                <span className="font-semibold text-slate-700">Reviewed by:</span> {request.reviewer_name} {request.reviewed_at ? `• ${formatDateDisplay(request.reviewed_at.slice(0, 10))}` : ''}
                              </div>
                            )}
                            {request.rejection_reason && (
                              <div className="sm:col-span-2">
                                <span className="font-semibold text-slate-700">Reason:</span> {request.rejection_reason}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </section>
              </>
            )}
          </div>
        </div>
      </aside>

      {myRequestsPanelOpen && (
        <div
          className="absolute inset-0 z-30 bg-black/10"
          onClick={() => setMyRequestsPanelOpen(false)}
        />
      )}

      <aside
        className={`absolute top-0 right-0 z-40 h-full w-full max-w-3xl transition-transform duration-300 ease-in-out ${myRequestsPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}
        aria-hidden={!myRequestsPanelOpen}
      >
        <div className="flex h-full w-full flex-col bg-white/95 backdrop-blur-sm border-l border-slate-200 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">My Requests</h2>
              <p className="text-sm text-slate-500">View the status of your room requests</p>
            </div>
            <button
              onClick={() => setMyRequestsPanelOpen(false)}
              className="border border-slate-300 px-3 py-1 text-sm font-medium text-slate-600 transition-colors duration-150 hover:bg-slate-100"
            >
              Close
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {myRequestsLoading ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                Loading your requests…
              </div>
            ) : myRequests.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <div className="rounded border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500 max-w-md">
                  <p className="font-medium text-slate-600 mb-2">No requests yet</p>
                  <p className="text-xs text-slate-400">Submit a request by clicking on an empty slot in the schedule.</p>
                </div>
              </div>
            ) : (
              <>
                {/* Date Filter */}
                <div className="rounded border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">Filter by Date</label>
                    <button
                      onClick={() => {
                        setMyRequestsDateFilter({
                          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                          endDate: new Date().toISOString().split('T')[0]
                        })
                      }}
                      className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      Reset to Last 7 Days
                    </button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">From</label>
                      <input
                        type="date"
                        value={myRequestsDateFilter.startDate}
                        onChange={(e) => setMyRequestsDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
                        className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">To</label>
                      <input
                        type="date"
                        value={myRequestsDateFilter.endDate}
                        onChange={(e) => setMyRequestsDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
                        className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {filteredMyRequests.filter((r) => r.status === 'pending').length > 0 && (
                  <section className="space-y-4">
                    <header className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Pending</h3>
                      <span className="text-xs font-medium text-slate-400">
                        {filteredMyRequests.filter((r) => r.status === 'pending').length} awaiting review
                      </span>
                    </header>

                    {filteredMyRequests
                      .filter((r) => r.status === 'pending')
                      .map((request) => {
                        const statusStyle = ROOM_REQUEST_STATUS_STYLES[request.status] || ROOM_REQUEST_STATUS_STYLES.pending
                        return (
                          <div key={request.id} className="border border-slate-200 bg-white px-5 py-4 shadow-sm">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-slate-800">Room {request.room_number}</p>
                                <p className="text-xs text-slate-500">
                                  {formatDateDisplay(request.base_date)} • {formatRequestRange(request)} • {request.week_count} week{request.week_count > 1 ? 's' : ''}
                                </p>
                              </div>
                              <span className={`rounded border px-2 py-1 text-xs font-semibold uppercase tracking-wide ${statusStyle}`}>
                                {ROOM_REQUEST_STATUS_LABELS[request.status]}
                              </span>
                            </div>

                            <div className="mt-3 grid gap-2 text-xs text-slate-600">
                              {request.booked_by && (
                                <div>
                                  <span className="font-semibold text-slate-700">Usage:</span> {request.booked_by}
                                </div>
                              )}
                              {request.course_name && (
                                <div>
                                  <span className="font-semibold text-slate-700">Course/Event:</span> {request.course_name}
                                </div>
                              )}
                              {request.notes && (
                                <div>
                                  <span className="font-semibold text-slate-700">Notes:</span> {request.notes}
                                </div>
                              )}
                              <div className="text-xs text-slate-400 mt-1">
                                Submitted {formatDateDisplay(request.created_at.slice(0, 10))}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                  </section>
                )}

                {filteredMyRequests.filter((r) => r.status === 'approved').length > 0 && (
                  <section className="space-y-4">
                    <header className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-600">Approved</h3>
                      <span className="text-xs font-medium text-slate-400">
                        {filteredMyRequests.filter((r) => r.status === 'approved').length} accepted
                      </span>
                    </header>

                    {filteredMyRequests
                      .filter((r) => r.status === 'approved')
                      .map((request) => {
                        const statusStyle = ROOM_REQUEST_STATUS_STYLES[request.status]
                        return (
                          <div key={request.id} className="border border-emerald-200 bg-emerald-50/30 px-5 py-4 shadow-sm">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-slate-800">Room {request.room_number}</p>
                                <p className="text-xs text-slate-500">
                                  {formatDateDisplay(request.base_date)} • {formatRequestRange(request)} • {request.week_count} week{request.week_count > 1 ? 's' : ''}
                                </p>
                              </div>
                              <span className={`rounded border px-2 py-1 text-xs font-semibold uppercase tracking-wide ${statusStyle}`}>
                                {ROOM_REQUEST_STATUS_LABELS[request.status]}
                              </span>
                            </div>

                            <div className="mt-3 grid gap-2 text-xs text-slate-600">
                              {request.booked_by && (
                                <div>
                                  <span className="font-semibold text-slate-700">Usage:</span> {request.booked_by}
                                </div>
                              )}
                              {request.course_name && (
                                <div>
                                  <span className="font-semibold text-slate-700">Course/Event:</span> {request.course_name}
                                </div>
                              )}
                              {request.reviewer_name && (
                                <div>
                                  <span className="font-semibold text-slate-700">Approved by:</span> {request.reviewer_name}
                                  {request.reviewed_at && ` • ${formatDateDisplay(request.reviewed_at.slice(0, 10))}`}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                  </section>
                )}

                {filteredMyRequests.filter((r) => r.status === 'rejected').length > 0 && (
                  <section className="space-y-4">
                    <header className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-rose-600">Rejected</h3>
                      <span className="text-xs font-medium text-slate-400">
                        {filteredMyRequests.filter((r) => r.status === 'rejected').length} declined
                      </span>
                    </header>

                    {filteredMyRequests
                      .filter((r) => r.status === 'rejected')
                      .map((request) => {
                        const statusStyle = ROOM_REQUEST_STATUS_STYLES[request.status]
                        return (
                          <div key={request.id} className="border border-rose-200 bg-rose-50/30 px-5 py-4 shadow-sm">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-slate-800">Room {request.room_number}</p>
                                <p className="text-xs text-slate-500">
                                  {formatDateDisplay(request.base_date)} • {formatRequestRange(request)} • {request.week_count} week{request.week_count > 1 ? 's' : ''}
                                </p>
                              </div>
                              <span className={`rounded border px-2 py-1 text-xs font-semibold uppercase tracking-wide ${statusStyle}`}>
                                {ROOM_REQUEST_STATUS_LABELS[request.status]}
                              </span>
                            </div>

                            <div className="mt-3 grid gap-2 text-xs text-slate-600">
                              {request.booked_by && (
                                <div>
                                  <span className="font-semibold text-slate-700">Usage:</span> {request.booked_by}
                                </div>
                              )}
                              {request.course_name && (
                                <div>
                                  <span className="font-semibold text-slate-700">Course/Event:</span> {request.course_name}
                                </div>
                              )}
                              {request.reviewer_name && (
                                <div>
                                  <span className="font-semibold text-slate-700">Reviewed by:</span> {request.reviewer_name}
                                  {request.reviewed_at && ` • ${formatDateDisplay(request.reviewed_at.slice(0, 10))}`}
                                </div>
                              )}
                              {request.rejection_reason && (
                                <div className="bg-rose-100/50 px-3 py-2 rounded border border-rose-200 mt-2">
                                  <span className="font-semibold text-rose-700 block mb-1">Reason for rejection:</span>
                                  <span className="text-rose-600">{request.rejection_reason}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                  </section>
                )}
              </>
            )}
          </div>
        </div>
      </aside>

      <div className={styles.canvasContainer}>
        <Canvas 
          camera={{ position: [40, 25, 40], fov: 50 }}
          style={{ background: 'linear-gradient(to bottom, #e8f4ff, #ffffff)' }}
        >
          {!buildingLoading && (
            <SchoolModel 
              building={building} 
              onBuildingClick={handleBuildingClick}
            />
          )}
          <OrbitControls 
            ref={controlsRef}
            enableZoom={true}
            enablePan={false}
            enableRotate={true}
            minDistance={10}
            maxDistance={100}
            maxPolarAngle={Math.PI / 2}
            autoRotate={true}
            autoRotateSpeed={2}
            mouseButtons={{
              LEFT: THREE.MOUSE.ROTATE,
              MIDDLE: THREE.MOUSE.DOLLY,
              RIGHT: undefined
            }}
            onStart={() => {
              if (controlsRef.current) {
                controlsRef.current.autoRotate = false
              }
            }}
          />
        </Canvas>
      </div>

      <p className={styles.canvasInstructions}>
        🖱️ Click and drag to rotate • Scroll to zoom • Right-click to move • ⌨️ WASD to move
      </p>

      {editState.isOpen && canEditSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg bg-white p-6 shadow-2xl">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Edit Schedule</h3>
              <p className="text-sm text-slate-500">
                Room {editState.room}
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleScheduleSubmit}>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Start time</label>
                  <select
                    value={editState.startHour ?? ''}
                    onChange={handleRangeChange('startHour')}
                    className="w-full border border-slate-300 px-3 py-2 text-sm text-slate-700"
                  >
                    {timeSlots.map((slot) => (
                      <option key={`start-${slot.hour}`} value={slot.hour}>
                        {slot.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">End time</label>
                  <select
                    value={editState.endHour ?? ''}
                    onChange={handleRangeChange('endHour')}
                    className="w-full border border-slate-300 px-3 py-2 text-sm text-slate-700"
                  >
                    {timeSlots.map((slot) => (
                      <option key={`end-${slot.hour}`} value={slot.hour}>
                        {slot.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Status</label>
                <select
                  name="status"
                  value={editForm.status}
                  onChange={handleEditChange}
                  className="w-full border border-slate-300 px-3 py-2 text-sm text-slate-700"
                >
                  {Object.values(SCHEDULE_STATUS).map((status) => (
                    <option key={status} value={status}>
                      {SCHEDULE_STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </div>

              {editForm.status !== SCHEDULE_STATUS.maintenance && (
                <>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Course / Event Name (optional)</label>
                    <input
                      type="text"
                      name="courseName"
                      value={editForm.courseName}
                      onChange={handleEditChange}
                      className="w-full border border-slate-300 px-3 py-2 text-sm text-slate-700"
                      placeholder="e.g. Physics 101"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Who is using it?</label>
                    <input
                      type="text"
                      name="bookedBy"
                      value={editForm.bookedBy}
                      onChange={handleEditChange}
                      className="w-full border border-slate-300 px-3 py-2 text-sm text-slate-700"
                      placeholder="e.g. Ms. Tran"
                      required={editForm.status === SCHEDULE_STATUS.occupied}
                    />
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetEditor}
                  className="border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#096ecc] px-4 py-2 text-sm font-semibold text-white shadow hover:bg-[#085cac]"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {requestState.isOpen && canRequestRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg bg-white p-6 shadow-2xl">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Request Room Usage</h3>
              <p className="text-sm text-slate-500">
                Room {requestState.room} • {formatDateDisplay(isoDate)}
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleRequestSubmit}>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Start time</label>
                  <select
                    value={requestState.startHour ?? ''}
                    onChange={handleRequestRangeChange('startHour')}
                    className="w-full border border-slate-300 px-3 py-2 text-sm text-slate-700"
                  >
                    {timeSlots.map((slot) => (
                      <option key={`request-start-${slot.hour}`} value={slot.hour}>
                        {slot.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">End time</label>
                  <select
                    value={requestState.endHour ?? ''}
                    onChange={handleRequestRangeChange('endHour')}
                    className="w-full border border-slate-300 px-3 py-2 text-sm text-slate-700"
                  >
                    {timeSlots.map((slot) => (
                      <option key={`request-end-${slot.hour}`} value={slot.hour}>
                        {slot.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Weeks</label>
                <select
                  name="weekCount"
                  value={requestForm.weekCount}
                  onChange={handleRequestFormChange}
                  className="w-full border border-slate-300 px-3 py-2 text-sm text-slate-700"
                >
                  {Array.from({ length: MAX_ROOM_REQUEST_WEEKS }, (_, index) => index + 1).map((week) => (
                    <option key={`weeks-${week}`} value={week}>
                      {week} week{week > 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Course / Event Name (optional)</label>
                <input
                  type="text"
                  name="courseName"
                  value={requestForm.courseName}
                  onChange={handleRequestFormChange}
                  className="w-full border border-slate-300 px-3 py-2 text-sm text-slate-700"
                  placeholder="e.g. Physics Workshop"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Who will use the room?</label>
                <input
                  type="text"
                  name="bookedBy"
                  value={requestForm.bookedBy}
                  onChange={handleRequestFormChange}
                  className="w-full border border-slate-300 px-3 py-2 text-sm text-slate-700"
                  placeholder="e.g. Grade 11 Physics"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Additional notes (optional)</label>
                <textarea
                  name="notes"
                  value={requestForm.notes}
                  onChange={handleRequestFormChange}
                  className="w-full border border-slate-300 px-3 py-2 text-sm text-slate-700"
                  rows={3}
                  placeholder="Share any extra context for the building manager."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetRequestModal}
                  className="border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                  disabled={submittingRequest}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#096ecc] px-4 py-2 text-sm font-semibold text-white shadow hover:bg-[#085cac]"
                  disabled={submittingRequest}
                >
                  {submittingRequest ? 'Submitting…' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isBuildingInfoOpen && selectedBuilding && (
        <BuildingInfoModal 
          building={selectedBuilding}
          onClose={() => setIsBuildingInfoOpen(false)}
          onRoomSelect={handleRoomSelect}
          canEdit={canEditSchedule}
          canRequest={canRequestRoom}
          onAdminAction={handleCellInteraction}
          onTeacherRequest={handleTeacherRequest}
          userRole={role}
        />
      )}

      <aside
        className={`absolute top-0 left-0 z-20 h-full w-full max-w-5xl transition-transform duration-300 ease-in-out ${isScheduleOpen ? 'translate-x-0' : '-translate-x-full'}`}
        aria-hidden={!isScheduleOpen}
      >
        <div className="flex h-full w-full flex-col bg-white/95 backdrop-blur-sm border-r border-slate-200 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                {selectedBuilding ? `${selectedBuilding.building_name} Schedule` : 'Room Schedule'}
              </h2>
              <p className="text-sm text-slate-500">
                {buildingRoomsLoading ? 'Loading rooms...' : buildingRooms.length > 0 ? `${buildingRooms.length} Classroom${buildingRooms.length !== 1 ? 's' : ''} • 7:00 AM – 8:00 PM` : 'No classrooms found'}
              </p>
              <p className="text-xs text-slate-400">Viewing as {role ? role.replace('_', ' ') : 'guest'}{!canViewSchedule ? ' • Access required' : ''}</p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={isoDate}
                onChange={(event) => {
                  const { value } = event.target
                  if (!value) return
                  setScheduleDate(new Date(`${value}T00:00:00`))
                }}
                className="border border-slate-300 px-3 py-1 text-sm tracking-tight text-slate-600"
              />
              <button
                onClick={() => setScheduleOpen(false)}
                className="border border-slate-300 px-3 py-1 text-sm font-medium text-slate-600 transition-colors duration-150 hover:bg-slate-100"
              >
                Close
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
            {!canViewSchedule ? (
              <div className="flex h-full w-full items-center justify-center rounded border border-dashed border-slate-300 bg-white text-sm text-slate-500">
                Your role does not have access to view schedules.
              </div>
            ) : buildingRoomsLoading ? (
              <div className="flex h-full w-full items-center justify-center rounded border border-dashed border-slate-300 bg-white text-sm text-slate-500">
                Loading classroom rooms...
              </div>
            ) : buildingRooms.length === 0 ? (
              <div className="flex h-full w-full items-center justify-center rounded border border-dashed border-slate-300 bg-white text-sm text-slate-500">
                No classroom rooms found in this building.
              </div>
            ) : (
              <>
                {roomsBySection.map(section => (
                  <div key={section.id} className="space-y-4">
                    {/* Section Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4 rounded-t-lg">
                      <h3 className="text-lg font-bold text-white uppercase tracking-wide">
                        {section.name}
                      </h3>
                      {scheduleLoading && <span className="text-xs font-medium text-blue-100">Loading…</span>}
                    </div>
                    
                    {/* Floors within this section */}
                    {section.floors.map(floor => (
                      <section key={floor.id} className="border border-slate-200 shadow-sm overflow-hidden ml-4">
                        <header className="flex items-center justify-between bg-slate-50 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
                          <span>{floor.name} • {floor.rooms.length} Room{floor.rooms.length !== 1 ? 's' : ''}</span>
                        </header>
                        <ScheduleGrid
                          rooms={floor.rooms.map(room => room.room_code)}
                          timeSlots={timeSlots}
                          scheduleMap={scheduleMap}
                          onAdminAction={handleCellInteraction}
                          onTeacherRequest={handleTeacherRequest}
                          buildKey={buildScheduleKey}
                          canEdit={canEditSchedule}
                          canRequest={canRequestRoom}
                        />
                      </section>
                    ))}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </aside>
    </div>
  )
}

export default HomePage