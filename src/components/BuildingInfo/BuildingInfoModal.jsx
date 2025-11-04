import { useState, useEffect } from 'react'
import BuildingSidebar from './BuildingSidebar'
import SchedulePanel from './SchedulePanel'
import { useRoomSchedule } from '../../hooks/useRoomSchedule'
import { getTodayLocalDate } from '../../utils/dateUtils'

const BuildingInfoPanel = ({ 
  building, 
  onClose, 
  onRoomSelect, 
  canEdit, 
  canRequest, 
  onAdminAction, 
  onTeacherRequest, 
  timeSlots = []
}) => {
  // Navigation state
  const [selectedFloor, setSelectedFloor] = useState(null)
  
  const [selectedRoomName, setSelectedRoomName] = useState(null)
  const [selectedRoomCode, setSelectedRoomCode] = useState(null)
  const [selectedRoomType, setSelectedRoomType] = useState(null)
  
  // Schedule state
  const [scheduleDate, setScheduleDate] = useState(() => getTodayLocalDate())
  
  // Custom hooks
  const { roomSchedule, scheduleLoading } = useRoomSchedule(selectedRoomCode, scheduleDate, { timeSlots })
  // Update preview when floor is selected
  useEffect(() => {
    setSelectedRoomCode(null)
    setSelectedRoomType(null)
    setSelectedRoomName(null)
  }, [selectedFloor])

  // Listen for search-room events
  useEffect(() => {
    const handleSearchRoom = async (event) => {
      const { roomCode } = event.detail
      console.log('[BuildingInfoModal] Search room event received:', roomCode)
      
      try {
        // Import services
        const { fetchRoomsByBuildingId } = await import('../../services/roomService')
        const { fetchFloorsByBuildingId } = await import('../../services/floorService')
        
        console.log('[BuildingInfoModal] Fetching rooms for building:', building.id)
        
        // Find the room
        const { data: roomsData } = await fetchRoomsByBuildingId(building.id)
        console.log('[BuildingInfoModal] Rooms data:', roomsData)
        
        if (roomsData) {
          // Find the room matching the code
          const room = roomsData.find(r => r.room_code.toLowerCase() === roomCode.toLowerCase())
          console.log('[BuildingInfoModal] Found room:', room)

          // Ensure we have floor info from the join
          if (room && room.floors) {
            const floorId = room.floors.id

            // Load all floors for this building and find the one for the room
            const { data: floorsData } = await fetchFloorsByBuildingId(building.id)
            const floor = floorsData?.find(f => f.id === floorId)

            if (floor) {
              // Select floor
              setSelectedFloor(floor)

              // After sidebar loads rooms, select the room and devices
              setTimeout(() => {
                setSelectedRoomCode(room.room_code)
                setSelectedRoomType(room.room_type || null)
                setSelectedRoomName(room.room_name || null)
              }, 600)
            } else {
              console.error('[BuildingInfoModal] Floor not found for ID:', floorId)
            }
          } else {
            console.error('[BuildingInfoModal] Room structure invalid - missing floors object')
          }
        } else {
          console.error('[BuildingInfoModal] Room not found for code:', roomCode)
        }
      } catch (error) {
        console.error('[BuildingInfoModal] Error in search room:', error)
      }
    }

    window.addEventListener('search-room', handleSearchRoom)
    return () => window.removeEventListener('search-room', handleSearchRoom)
  }, [building])


  const handleRoomClick = (room) => {
    setSelectedRoomCode(room.room_code)
    setSelectedRoomType(room.room_type || null)
    setSelectedRoomName(room.room_name || null)
    onRoomSelect(room)
  }


  const handleRoomDeselect = () => {
    setSelectedRoomCode(null)
    setSelectedRoomType(null)
    setSelectedRoomName(null)
  }

  if (!building) return null

  return (
    <>
      <BuildingSidebar
        building={building}
        onClose={onClose}
        onRoomSelect={handleRoomClick}
        selectedFloor={selectedFloor}
        setSelectedFloor={setSelectedFloor}
        selectedRoomCode={selectedRoomCode}
        onRoomDeselect={handleRoomDeselect}
        isOpen={true}
      />

      <SchedulePanel
        isOpen={!!selectedRoomCode}
        roomCode={selectedRoomCode}
        roomName={selectedRoomName}
        schedule={roomSchedule}
        scheduleLoading={scheduleLoading}
        scheduleDate={scheduleDate}
        onDateChange={setScheduleDate}
        canEdit={canEdit}
        canRequest={canRequest}
        onAdminAction={onAdminAction}
        onTeacherRequest={onTeacherRequest}
        timeSlots={timeSlots}
        roomType={selectedRoomType}
      />
    </>
  )
}

export default BuildingInfoPanel
