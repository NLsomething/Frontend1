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
      setPreviewTitle(`${selectedFloor.floor_name} - 2D Layout`)
      // Clear room schedule and devices when switching to floor view
      setSelectedRoomCode(null)
      setSelectedRoomId(null)
      clearDevices()
    } else {
      setPreviewImage(null)
      setPreviewTitle('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFloor])

  const handleRoomClick = async (room) => {
    if (room.model_url) {
      setPreviewImage(room.model_url)
      setPreviewTitle(`${room.room_name} - 2D Layout`)
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
        roomTitle={previewTitle}
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
