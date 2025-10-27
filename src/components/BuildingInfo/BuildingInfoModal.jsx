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
  const [selectedSection, setSelectedSection] = useState(null)
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
      // Clear room schedule when going back to section view
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
        const { fetchSectionsByBuildingId } = await import('../../services/sectionService')
        const { fetchFloorsBySectionId } = await import('../../services/floorService')
        
        console.log('[BuildingInfoModal] Fetching rooms for building:', building.id)
        
        // Find the room
        const { data: roomsData } = await fetchRoomsByBuildingId(building.id)
        console.log('[BuildingInfoModal] Rooms data:', roomsData)
        
        if (roomsData) {
          // Find the room matching the code
          const room = roomsData.find(r => r.room_code.toLowerCase() === roomCode.toLowerCase())
          console.log('[BuildingInfoModal] Found room:', room)
          console.log('[BuildingInfoModal] Room floors:', room?.floors)
          console.log('[BuildingInfoModal] Room floor object keys:', room?.floors ? Object.keys(room.floors) : 'no floors')
          
          // The floor data structure from Supabase join
          if (room && room.floors) {
            console.log('[BuildingInfoModal] Floor entries:', Object.entries(room.floors))
            
            // The floors object contains: id, floor_name, sections
            const floorId = room.floors.id
            const floorName = room.floors.floor_name
            const sections = room.floors.sections
            console.log('[BuildingInfoModal] Floor ID:', floorId)
            console.log('[BuildingInfoModal] Floor Name:', floorName)
            console.log('[BuildingInfoModal] Sections:', sections)
            
            if (sections) {
              // sections is an object, get the section data
              const sectionKeys = Object.keys(sections)
              console.log('[BuildingInfoModal] Section keys:', sectionKeys)
              
              // Find the section entry that's an object (not 'id')
              const sectionEntry = Object.entries(sections).find(([key, value]) => 
                key !== 'id' && typeof value === 'object'
              )
              console.log('[BuildingInfoModal] Section entry:', sectionEntry)
              
              if (!sectionEntry) {
                // Maybe the first entry after 'id' is the section
                const sectionData = sections
                console.log('[BuildingInfoModal] Section data (direct):', sectionData)
                
                const sectionId = sectionData?.id
                console.log('[BuildingInfoModal] Section ID:', sectionId, 'Floor ID:', floorId)
              
              // Load sections and find the matching one
              const { data: sectionsData } = await fetchSectionsByBuildingId(building.id)
              console.log('[BuildingInfoModal] Sections data:', sectionsData)
              const section = sectionsData?.find(s => s.id === sectionId)
              console.log('[BuildingInfoModal] Found section:', section)
              
              if (section) {
                console.log('[BuildingInfoModal] Setting section...')
                // Set section first
                setSelectedSection(section)
                
                // After section is set, wait a bit and load floors
                setTimeout(async () => {
                  console.log('[BuildingInfoModal] Loading floors for section:', section.id)
                  const { data: floorsData } = await fetchFloorsBySectionId(section.id)
                  console.log('[BuildingInfoModal] Floors data:', floorsData)
                  const floor = floorsData?.find(f => f.id === floorId)
                  console.log('[BuildingInfoModal] Found floor:', floor)
                  
                  if (floor) {
                    console.log('[BuildingInfoModal] Setting floor...')
                    setSelectedFloor(floor)
                    
                    // After floor is set, the BuildingSidebar will auto-load rooms
                    // We need to wait for that to complete before selecting the room
                    setTimeout(() => {
                      console.log('[BuildingInfoModal] Setting room code and loading devices...')
                      setSelectedRoomCode(room.room_code)
                      setSelectedRoomId(room.id)
                      
                      // Load preview and devices
                      if (room.model_url) {
                        setPreviewImage(room.model_url)
                        setPreviewTitle('2D Layout')
                      }
                      loadDevices(room.id)
                    }, 800)
                  } else {
                    console.error('[BuildingInfoModal] Floor not found for ID:', floorId)
                  }
                }, 500)
              } else {
                console.error('[BuildingInfoModal] Section not found for ID:', sectionId)
              }
              }
            } else {
              console.error('[BuildingInfoModal] Section data not found in floor')
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

  // Clear preview when going back to section or building view
  useEffect(() => {
    if (!selectedSection) {
      // If no section selected, we're back at building view, clear everything
      setPreviewImage(null)
      setPreviewTitle('')
      setSelectedRoomCode(null)
      setSelectedRoomId(null)
      clearDevices()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSection])

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
        selectedSection={selectedSection}
        setSelectedSection={setSelectedSection}
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
