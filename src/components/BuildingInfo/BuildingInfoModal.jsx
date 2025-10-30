import { useState, useEffect } from 'react'
import BuildingSidebar from './BuildingSidebar'
import PreviewPanel from './PreviewPanel'
import SchedulePanel from './SchedulePanel'
import DeviceEditModal from './DeviceEditModal'
import { useRoomSchedule } from '../../hooks/useRoomSchedule'
import { useRoomDevices } from '../../hooks/useRoomDevices'
import { getTodayLocalDate } from '../../utils/dateUtils'

const BuildingInfoPanel = ({ 
  building, 
  onClose, 
  onRoomSelect, 
  canEdit, 
  canRequest, 
  onAdminAction, 
  onTeacherRequest, 
  userRole 
}) => {
  // Navigation state
  const [selectedFloor, setSelectedFloor] = useState(null)
  
  // Preview state
  const [previewImage, setPreviewImage] = useState(null)
  const [previewTitle, setPreviewTitle] = useState('')
  const [selectedRoomCode, setSelectedRoomCode] = useState(null)
  // eslint-disable-next-line no-unused-vars
  const [selectedRoomId, setSelectedRoomId] = useState(null)
  
  // Schedule state
  const [scheduleDate, setScheduleDate] = useState(() => getTodayLocalDate())
  
  // Custom hooks
  const { roomSchedule, scheduleLoading } = useRoomSchedule(selectedRoomCode, scheduleDate)
  const {
    devices,
    devicesLoading,
    isEditDeviceModalOpen,
    selectedDevice,
    editDeviceForm,
    setEditDeviceForm,
    loadDevices,
    handleDeviceToggle,
    handleEditDevice,
    handleSaveDevice,
    handleCloseDeviceModal,
    clearDevices
  } = useRoomDevices()

  // Update preview when floor is selected
  useEffect(() => {
    if (selectedFloor?.model_url) {
      setPreviewImage(selectedFloor.model_url)
      setPreviewTitle('2D Layout')
      // Clear room schedule and devices when switching to floor view
      setSelectedRoomCode(null)
      setSelectedRoomId(null)
      clearDevices()
    } else {
      setPreviewImage(null)
      setPreviewTitle('')
      // Clear room schedule when going back to floor view
      setSelectedRoomCode(null)
      setSelectedRoomId(null)
      clearDevices()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
                setSelectedRoomId(room.id)
                if (room.model_url) {
                  setPreviewImage(room.model_url)
                  setPreviewTitle('2D Layout')
                }
                loadDevices(room.id)
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
  }, [building, loadDevices])


  const handleRoomClick = async (room) => {
    if (room.model_url) {
      setPreviewImage(room.model_url)
      setPreviewTitle('2D Layout')
    }
    setSelectedRoomCode(room.room_code)
    setSelectedRoomId(room.id)
    await loadDevices(room.id)
    onRoomSelect(room)
  }

  const handleClosePreview = () => {
    setPreviewImage(null)
    setPreviewTitle('')
    setSelectedRoomCode(null)
    setSelectedRoomId(null)
    clearDevices()
  }

  const handleCloseSchedule = () => {
    setSelectedRoomCode(null)
    setSelectedRoomId(null)
    clearDevices()
    
    // Restore floor preview if we have a selected floor
    if (selectedFloor?.model_url) {
      setPreviewImage(selectedFloor.model_url)
      setPreviewTitle('2D Layout')
    }
  }

  const handleRoomDeselect = () => {
    setSelectedRoomCode(null)
    setSelectedRoomId(null)
    clearDevices()
    
    // Restore floor preview if we have a selected floor
    if (selectedFloor?.model_url) {
      setPreviewImage(selectedFloor.model_url)
      setPreviewTitle('2D Layout')
    }
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

      <PreviewPanel
        isOpen={!!previewImage}
        previewImage={previewImage}
        previewTitle={previewTitle}
        selectedRoomCode={selectedRoomCode}
        devices={devices}
        devicesLoading={devicesLoading}
        userRole={userRole}
        onToggleDevice={handleDeviceToggle}
        onEditDevice={handleEditDevice}
        onClose={handleClosePreview}
      />

      <SchedulePanel
        isOpen={!!selectedRoomCode}
        roomCode={selectedRoomCode}
        schedule={roomSchedule}
        scheduleLoading={scheduleLoading}
        scheduleDate={scheduleDate}
        onDateChange={setScheduleDate}
        canEdit={canEdit}
        canRequest={canRequest}
        onAdminAction={onAdminAction}
        onTeacherRequest={onTeacherRequest}
        onClose={handleCloseSchedule}
      />

      <DeviceEditModal
        isOpen={isEditDeviceModalOpen}
        device={selectedDevice}
        formData={editDeviceForm}
        onFormChange={setEditDeviceForm}
        onSave={handleSaveDevice}
        onClose={handleCloseDeviceModal}
      />
    </>
  )
}

export default BuildingInfoPanel
