import { useState, useEffect, Fragment } from 'react'
import { fetchSectionsByBuildingId } from '../services/sectionService'
import { fetchFloorsBySectionId } from '../services/floorService'
import { fetchRoomsByFloorId } from '../services/roomService'
import { useNotifications } from '../context/NotificationContext'
import { getSchedulesByDate } from '../services/scheduleService'
import { fetchDevicesByRoomId, updateDeviceOutput } from '../services/deviceService'
import { SCHEDULE_STATUS, SCHEDULE_STATUS_LABELS, SCHEDULE_STATUS_STYLES } from '../constants/schedule'
import { USER_ROLES } from '../constants/roles'
import { supabase } from '../lib/supabaseClient'

const BuildingInfoPanel = ({ building, onClose, onRoomSelect, canEdit, canRequest, onAdminAction, onTeacherRequest, userRole }) => {
  const { notifyError } = useNotifications()
  const [sections, setSections] = useState([])
  const [selectedSection, setSelectedSection] = useState(null)
  const [floors, setFloors] = useState([])
  const [selectedFloor, setSelectedFloor] = useState(null)
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(false)
  const [previewImage, setPreviewImage] = useState(null)
  const [previewTitle, setPreviewTitle] = useState('')
  const [selectedRoomCode, setSelectedRoomCode] = useState(null)
  // eslint-disable-next-line no-unused-vars
  const [selectedRoomId, setSelectedRoomId] = useState(null)
  const [roomSchedule, setRoomSchedule] = useState([])
  const [scheduleLoading, setScheduleLoading] = useState(false)
  const [devices, setDevices] = useState([])
  const [devicesLoading, setDevicesLoading] = useState(false)
  const [isEditDeviceModalOpen, setIsEditDeviceModalOpen] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [editDeviceForm, setEditDeviceForm] = useState({
    device_name: '',
    device_type: '',
    status: '',
    device_output: ''
  })

  const loadSections = async () => {
    setLoading(true)
    const { data, error } = await fetchSectionsByBuildingId(building.id)
    if (error) {
      notifyError('Failed to load sections', { description: error.message })
    } else {
      setSections(data || [])
    }
    setLoading(false)
  }

  const loadFloors = async () => {
    setLoading(true)
    const { data, error } = await fetchFloorsBySectionId(selectedSection.id)
    if (error) {
      notifyError('Failed to load floors', { description: error.message })
    } else {
      setFloors(data || [])
    }
    setLoading(false)
  }

  const loadRooms = async () => {
    setLoading(true)
    const { data, error } = await fetchRoomsByFloorId(selectedFloor.id)
    if (error) {
      notifyError('Failed to load rooms', { description: error.message })
    } else {
      setRooms(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    if (building?.id) {
      loadSections()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [building?.id])

  useEffect(() => {
    if (selectedSection?.id) {
      loadFloors()
    } else {
      setFloors([])
      setSelectedFloor(null)
      setRooms([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSection?.id])

  useEffect(() => {
    if (selectedFloor?.id) {
      loadRooms()
    } else {
      setRooms([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFloor?.id])

  // Update preview when floor is selected
  useEffect(() => {
    if (selectedFloor?.model_url) {
      setPreviewImage(selectedFloor.model_url)
      setPreviewTitle(`${selectedFloor.floor_name} - 2D Layout`)
      // Clear room schedule and devices when switching to floor view
      setSelectedRoomCode(null)
      setSelectedRoomId(null)
      setRoomSchedule([])
      setDevices([])
    } else {
      setPreviewImage(null)
      setPreviewTitle('')
    }
  }, [selectedFloor])

  const loadRoomSchedule = async (roomCode) => {
    setScheduleLoading(true)
    try {
      const today = new Date()
      const local = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
      const isoDate = local.toISOString().split('T')[0]
      
      const { data, error } = await getSchedulesByDate(isoDate)
      
      if (error) {
        console.error('Error loading schedule:', error)
        setRoomSchedule([])
      } else {
        // Filter schedules for this room only
        const filtered = (data || []).filter(entry => entry.room_number === roomCode)
        setRoomSchedule(filtered)
      }
    } catch (err) {
      console.error('Error loading schedule:', err)
      setRoomSchedule([])
    }
    setScheduleLoading(false)
  }

  const loadDevices = async (roomId) => {
    setDevicesLoading(true)
    try {
      const { data, error } = await fetchDevicesByRoomId(roomId)
      
      if (error) {
        console.error('Error loading devices:', error)
        setDevices([])
      } else {
        setDevices(data || [])
      }
    } catch (err) {
      console.error('Error loading devices:', err)
      setDevices([])
    }
    setDevicesLoading(false)
  }

  const handleDeviceToggle = async (device) => {
    const newOutput = device.device_output === 'locked' ? 'unlocked' : 'locked'
    
    try {
      const { error } = await updateDeviceOutput(device.id, newOutput)
      
      if (error) {
        notifyError('Failed to update device', { description: error.message })
      } else {
        // Update local state
        setDevices(prev => prev.map(d => 
          d.id === device.id ? { ...d, device_output: newOutput } : d
        ))
      }
    } catch (err) {
      notifyError('Failed to update device', { description: err.message })
    }
  }

  const handleEditDevice = (device) => {
    setSelectedDevice(device)
    setEditDeviceForm({
      device_name: device.device_name,
      device_type: device.device_type,
      status: device.status,
      device_output: device.device_output
    })
    setIsEditDeviceModalOpen(true)
  }

  const handleSaveDevice = async () => {
    if (!selectedDevice) return

    try {
      // Update device in database
      const { error: nameError } = await supabase
        .from('devices')
        .update({
          device_name: editDeviceForm.device_name,
          device_type: editDeviceForm.device_type,
          status: editDeviceForm.status,
          device_output: editDeviceForm.device_output
        })
        .eq('id', selectedDevice.id)

      if (nameError) {
        notifyError('Failed to update device', { description: nameError.message })
        return
      }

      // Update local state
      setDevices(prev => prev.map(d =>
        d.id === selectedDevice.id ? { ...d, ...editDeviceForm } : d
      ))

      // Close modal
      setIsEditDeviceModalOpen(false)
      setSelectedDevice(null)
    } catch (err) {
      notifyError('Failed to update device', { description: err.message })
    }
  }

  const handleRoomClick = async (room) => {
    if (room.model_url) {
      setPreviewImage(room.model_url)
      setPreviewTitle(`${room.room_name} - 2D Layout`)
    }
    setSelectedRoomCode(room.room_code)
    setSelectedRoomId(room.id)
    await loadRoomSchedule(room.room_code)
    await loadDevices(room.id)
    onRoomSelect(room)
  }

  const handleBack = () => {
    if (selectedFloor) {
      setSelectedFloor(null)
      // Clear preview when going back from floor
      setPreviewImage(null)
      setPreviewTitle('')
      setSelectedRoomCode(null)
      setSelectedRoomId(null)
      setRoomSchedule([])
      setDevices([])
    } else if (selectedSection) {
      setSelectedSection(null)
    } else {
      onClose()
    }
  }

  if (!building) return null

  return (
    <aside style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '15%',
      minWidth: '260px',
      maxWidth: '300px',
      height: '100vh',
      backgroundColor: 'white',
      boxShadow: '2px 0 10px rgba(0, 0, 0, 0.1)',
      zIndex: 30,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden'
      }}>
        
        {/* Header */}
        <div style={{ 
          padding: '20px 20px 16px 20px', 
          borderBottom: '1px solid #e5e7eb',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', margin: 0, color: '#1f2937' }}>
              {selectedFloor ? selectedFloor.floor_name : selectedSection ? selectedSection.section_name : building.building_name}
            </h2>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#6b7280',
                padding: '0',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#1f2937'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
            >
              ×
            </button>
          </div>
          
          {!selectedSection && (
            <>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0' }}>
                Code: <span style={{ fontWeight: '600', color: '#374151' }}>{building.building_code}</span>
              </p>
              {building.description && (
                <p style={{ fontSize: '14px', color: '#4b5563', marginTop: '12px', lineHeight: '1.6' }}>
                  {building.description}
                </p>
              )}
            </>
          )}

          {selectedSection && !selectedFloor && (
            <>
              {selectedSection.description && (
                <p style={{ fontSize: '14px', color: '#4b5563', marginTop: '8px', lineHeight: '1.6' }}>
                  {selectedSection.description}
                </p>
              )}
            </>
          )}

          {selectedFloor && (
            <>
              {selectedFloor.description && (
                <p style={{ fontSize: '14px', color: '#4b5563', marginTop: '8px', lineHeight: '1.6' }}>
                  {selectedFloor.description}
                </p>
              )}
            </>
          )}

          {/* Breadcrumb */}
          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#6b7280' }}>
            <button
              onClick={() => {
                setSelectedSection(null)
                setSelectedFloor(null)
              }}
              style={{
                background: 'none',
                border: 'none',
                color: selectedSection || selectedFloor ? '#3b82f6' : '#6b7280',
                cursor: selectedSection || selectedFloor ? 'pointer' : 'default',
                padding: 0,
                textDecoration: selectedSection || selectedFloor ? 'underline' : 'none'
              }}
            >
              {building.building_name}
            </button>
            {selectedSection && (
              <>
                <span>/</span>
                <button
                  onClick={() => setSelectedFloor(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: selectedFloor ? '#3b82f6' : '#6b7280',
                    cursor: selectedFloor ? 'pointer' : 'default',
                    padding: 0,
                    textDecoration: selectedFloor ? 'underline' : 'none'
                  }}
                >
                  {selectedSection.section_name}
                </button>
              </>
            )}
            {selectedFloor && (
              <>
                <span>/</span>
                <span style={{ color: '#6b7280' }}>{selectedFloor.floor_name}</span>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
              Loading...
            </div>
          )}

          {!loading && !selectedSection && (
            <>
              <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>
                Sections ({sections.length})
              </h3>
              {sections.length === 0 ? (
                <p style={{ color: '#6b7280', fontSize: '14px', padding: '20px', textAlign: 'center' }}>
                  No sections found
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {sections.map(section => (
                    <button
                      key={section.id}
                      onClick={() => setSelectedSection(section)}
                      style={{
                        padding: '10px 12px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        backgroundColor: 'white',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f9fafb'
                        e.currentTarget.style.borderColor = '#3b82f6'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'white'
                        e.currentTarget.style.borderColor = '#e5e7eb'
                      }}
                    >
                      <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                        {section.section_name}
                      </div>
                      {section.description && (
                        <div style={{ fontSize: '13px', color: '#6b7280' }}>
                          {section.description}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {!loading && selectedSection && !selectedFloor && (
            <>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>
                Floors ({floors.length})
              </h3>
              {floors.length === 0 ? (
                <p style={{ color: '#6b7280', fontSize: '14px', padding: '20px', textAlign: 'center' }}>
                  No floors found
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {floors.map(floor => (
                    <button
                      key={floor.id}
                      onClick={() => setSelectedFloor(floor)}
                      style={{
                        padding: '10px 12px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        backgroundColor: 'white',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f9fafb'
                        e.currentTarget.style.borderColor = '#3b82f6'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'white'
                        e.currentTarget.style.borderColor = '#e5e7eb'
                      }}
                    >
                      <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                        {floor.floor_name}
                      </div>
                      {floor.description && (
                        <div style={{ fontSize: '13px', color: '#6b7280' }}>
                          {floor.description}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {!loading && selectedFloor && (
            <>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>
                Rooms ({rooms.filter(r => r.room_type !== 'administrative').length})
              </h3>
              {rooms.filter(r => r.room_type !== 'administrative').length === 0 ? (
                <p style={{ color: '#6b7280', fontSize: '14px', padding: '20px', textAlign: 'center' }}>
                  No bookable rooms found
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {rooms.filter(r => r.room_type !== 'administrative').map(room => (
                    <button
                      key={room.id}
                      onClick={() => handleRoomClick(room)}
                      style={{
                        padding: '10px 12px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        backgroundColor: 'white',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f0f9ff'
                        e.currentTarget.style.borderColor = '#3b82f6'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'white'
                        e.currentTarget.style.borderColor = '#e5e7eb'
                      }}
                    >
                      <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                        {room.room_name}
                      </div>
                      <div style={{ fontSize: '13px', color: '#6b7280' }}>
                        Code: {room.room_code} • Type: {room.room_type || 'classroom'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#3b82f6', marginTop: '4px' }}>
                        Click to view schedule →
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ 
          padding: '16px 20px', 
          borderTop: '1px solid #e5e7eb',
          flexShrink: 0,
          display: 'flex',
          gap: '12px'
        }}>
          <button
            onClick={handleBack}
            style={{
              flex: 1,
              padding: '10px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: 'white',
              color: '#374151',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '14px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f9fafb'
              e.currentTarget.style.borderColor = '#9ca3af'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white'
              e.currentTarget.style.borderColor = '#d1d5db'
            }}
          >
            {selectedFloor || selectedSection ? 'Back' : 'Close'}
          </button>
        </div>
      </div>

      {/* 2D Preview Popup */}
      {previewImage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          width: '450px',
          height: 'auto',
          maxHeight: '900px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
          zIndex: 35,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Preview Header */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#f9fafb',
            flexShrink: 0
          }}>
            <h3 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#1f2937',
              margin: 0
            }}>
              {previewTitle}
            </h3>
            <button
              onClick={() => {
                setPreviewImage(null)
                setPreviewTitle('')
                setSelectedRoomCode(null)
                setSelectedRoomId(null)
                setRoomSchedule([])
                setDevices([])
              }}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                color: '#6b7280',
                padding: '0',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#1f2937'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
            >
              ×
            </button>
          </div>

          {/* Preview Image */}
          <div style={{
            height: '280px',
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f9fafb',
            overflow: 'hidden',
            flexShrink: 0
          }}>
            <img 
              src={previewImage} 
              alt={previewTitle}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
              }}
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.parentElement.innerHTML = '<div style="color: #6b7280; text-align: center; padding: 40px; font-size: 13px;">Image not available</div>'
              }}
            />
          </div>

          {/* Device Status Section - Only show when room is selected */}
          {selectedRoomCode && (
            <div style={{
              borderTop: '1px solid #e5e7eb',
              padding: '16px',
              backgroundColor: 'white',
              flexShrink: 0
            }}>
              <h4 style={{
                fontSize: '13px',
                fontWeight: '600',
                color: '#374151',
                margin: '0 0 12px 0',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {(userRole === USER_ROLES.student || userRole === USER_ROLES.teacher) ? 'Status' : 'Devices'}
              </h4>

              {devicesLoading ? (
                <div style={{ color: '#6b7280', fontSize: '13px', textAlign: 'center', padding: '8px' }}>
                  Loading...
                </div>
              ) : devices.length === 0 ? (
                <div style={{ color: '#6b7280', fontSize: '13px', textAlign: 'center', padding: '8px' }}>
                  No devices found
                </div>
              ) : (
                <>
                  {/* Student and Teacher View - Show simple lock status */}
                  {(userRole === USER_ROLES.student || userRole === USER_ROLES.teacher) && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px',
                      backgroundColor: devices.some(d => d.device_output === 'unlocked') ? '#dcfce7' : '#fee2e2',
                      borderRadius: '6px',
                      border: `1px solid ${devices.some(d => d.device_output === 'unlocked') ? '#86efac' : '#fca5a5'}`
                    }}>
                      <div style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: devices.some(d => d.device_output === 'unlocked') ? '#22c55e' : '#ef4444',
                        flexShrink: 0
                      }} />
                      <span style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: devices.some(d => d.device_output === 'unlocked') ? '#166534' : '#991b1b'
                      }}>
                        Room is {devices.some(d => d.device_output === 'unlocked') ? 'Unlocked' : 'Locked'}
                      </span>
                    </div>
                  )}

                  {/* Administrator and Building Manager View - Show device list with controls */}
                  {(userRole === USER_ROLES.administrator || userRole === USER_ROLES.buildingManager) && (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      {devices.map(device => (
                        <div
                          key={device.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 12px',
                            backgroundColor: '#f9fafb',
                            borderRadius: '6px',
                            border: '1px solid #e5e7eb',
                            gap: '8px'
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{
                              fontSize: '13px',
                              fontWeight: '600',
                              color: '#1f2937',
                              marginBottom: '2px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              {device.device_name}
                              {device.device_type === 'e-lock' && (
                                <span style={{
                                  fontSize: '10px',
                                  fontWeight: '600',
                                  padding: '2px 6px',
                                  borderRadius: '3px',
                                  backgroundColor: device.device_output === 'locked' ? '#fee2e2' : '#dcfce7',
                                  color: device.device_output === 'locked' ? '#991b1b' : '#166534',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.3px'
                                }}>
                                  {device.device_output === 'locked' ? 'Locked' : 'Unlocked'}
                                </span>
                              )}
                            </div>
                            <div style={{
                              fontSize: '11px',
                              color: '#6b7280'
                            }}>
                              {device.device_type} • {device.status}
                            </div>
                          </div>
                          
                          <div style={{
                            display: 'flex',
                            gap: '6px',
                            flexShrink: 0
                          }}>
                            <button
                              onClick={() => handleEditDevice(device)}
                              style={{
                                padding: '6px 12px',
                                fontSize: '12px',
                                fontWeight: '600',
                                borderRadius: '4px',
                                border: '1px solid #d1d5db',
                                cursor: 'pointer',
                                backgroundColor: 'white',
                                color: '#374151',
                                transition: 'all 0.2s',
                                flexShrink: 0
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#f3f4f6'
                                e.currentTarget.style.borderColor = '#9ca3af'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'white'
                                e.currentTarget.style.borderColor = '#d1d5db'
                              }}
                            >
                              Edit
                            </button>
                            
                            {device.device_type === 'e-lock' && (
                              <button
                                onClick={() => handleDeviceToggle(device)}
                                style={{
                                  padding: '6px 12px',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  borderRadius: '4px',
                                  border: 'none',
                                  cursor: 'pointer',
                                  backgroundColor: device.device_output === 'locked' ? '#10b981' : '#ef4444',
                                  color: 'white',
                                  transition: 'opacity 0.2s',
                                  flexShrink: 0
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
                                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                              >
                                {device.device_output === 'locked' ? 'Unlock' : 'Lock'}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Room Schedule Panel - Separate popup on the left */}
      {selectedRoomCode && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 'clamp(260px, 15%, 300px)',
          width: 'auto',
          minWidth: '140px',
          maxWidth: '160px',
          height: '100vh',
          backgroundColor: 'white',
          boxShadow: '2px 0 10px rgba(0, 0, 0, 0.1)',
          zIndex: 29,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Schedule Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '2px solid #e5e7eb',
            backgroundColor: '#f9fafb',
            flexShrink: 0
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#1f2937',
                margin: 0
              }}>
                Room Schedule
              </h3>
              <button
                onClick={() => {
                  setSelectedRoomCode(null)
                  setSelectedRoomId(null)
                  setRoomSchedule([])
                  setDevices([])
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '0',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#1f2937'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
              >
                ×
              </button>
            </div>
            <p style={{
              fontSize: '13px',
              color: '#6b7280',
              margin: '4px 0 0 0'
            }}>
              {previewTitle} - Today's Schedule
            </p>
          </div>

          {/* Schedule Content */}
          <div style={{
            flex: 1,
            overflowY: 'auto'
          }}>
            {scheduleLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
                Loading schedule...
              </div>
            ) : (
              <div style={{ 
                fontSize: '14px',
                display: 'grid',
                gridTemplateColumns: '70px 1fr',
                borderTop: '1px solid #e2e8f0'
              }}>
                {/* Generate time slots */}
                {Array.from({ length: 14 }, (_, index) => {
                  const hour = 7 + index
                  const period = hour < 12 ? 'AM' : 'PM'
                  const twelveHour = ((hour + 11) % 12) + 1
                  const timeLabel = `${twelveHour}:00 ${period}`
                  
                  // Find schedule entry for this hour
                  const entry = roomSchedule.find(s => s.slot_hour === hour)
                  const status = entry?.status || SCHEDULE_STATUS.empty
                  const statusLabel = SCHEDULE_STATUS_LABELS[status]
                  const courseName = entry?.course_name || ''
                  const bookedBy = entry?.booked_by || ''
                  
                  // Get background color based on status
                  const getStatusColors = () => {
                    switch (status) {
                      case SCHEDULE_STATUS.empty:
                        return { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0' }
                      case SCHEDULE_STATUS.occupied:
                        return { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' }
                      case SCHEDULE_STATUS.maintenance:
                        return { bg: '#fffbeb', text: '#b45309', border: '#fde68a' }
                      case SCHEDULE_STATUS.pending:
                        return { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' }
                      default:
                        return { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0' }
                    }
                  }
                  
                  const colors = getStatusColors()
                  
                  // Check if interactive
                  const interactive = canEdit || canRequest
                  
                  const details = [courseName, bookedBy].filter(Boolean)
                  
                  return (
                    <Fragment key={hour}>
                      {/* Time label cell */}
                      <div style={{
                        backgroundColor: 'white',
                        padding: '12px 8px',
                        fontWeight: '500',
                        color: '#334155',
                        borderTop: '1px solid #e2e8f0',
                        borderRight: '1px solid #cbd5e1',
                        fontSize: '12px',
                        textAlign: 'center'
                      }}>
                        {timeLabel}
                      </div>
                      
                      {/* Schedule content cell */}
                      <button
                        type="button"
                        onClick={() => {
                          if (canEdit && onAdminAction) {
                            onAdminAction(selectedRoomCode, hour)
                          } else if (canRequest && onTeacherRequest) {
                            onTeacherRequest(selectedRoomCode, hour)
                          }
                        }}
                        disabled={!interactive}
                        style={{
                          backgroundColor: colors.bg,
                          color: colors.text,
                          padding: '12px 8px',
                          textAlign: 'left',
                          transition: 'background-color 0.15s',
                          cursor: interactive ? 'pointer' : 'default',
                          border: 'none',
                          borderTop: `1px solid ${colors.border}`,
                          borderLeft: `1px solid ${colors.border}`
                        }}
                        onMouseEnter={(e) => {
                          if (interactive) {
                            e.currentTarget.style.backgroundColor = '#cbd5e180'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (interactive) {
                            e.currentTarget.style.backgroundColor = colors.bg
                          }
                        }}
                      >
                        <span style={{
                          display: 'block',
                          fontSize: '12px',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.6px'
                        }}>
                          {statusLabel}
                        </span>
                        {details.length > 0 && (
                          <span style={{
                            marginTop: '4px',
                            display: 'block',
                            fontSize: '12px',
                            color: '#475569'
                          }}>
                            {details.map((line, idx) => (
                              <span key={idx} style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {line}
                              </span>
                            ))}
                          </span>
                        )}
                      </button>
                    </Fragment>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Device Modal */}
      {isEditDeviceModalOpen && selectedDevice && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#1f2937',
                margin: 0
              }}>
                Edit Device
              </h3>
              <button
                onClick={() => {
                  setIsEditDeviceModalOpen(false)
                  setSelectedDevice(null)
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: 0,
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>

            {/* Form */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              {/* Device Name */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Device Name
                </label>
                <input
                  type="text"
                  value={editDeviceForm.device_name}
                  onChange={(e) => setEditDeviceForm(prev => ({ ...prev, device_name: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Enter device name"
                />
              </div>

              {/* Device Type */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Device Type
                </label>
                <input
                  type="text"
                  value={editDeviceForm.device_type}
                  onChange={(e) => setEditDeviceForm(prev => ({ ...prev, device_type: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="e.g., e-lock, sensor, camera"
                />
              </div>

              {/* Status */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Status
                </label>
                <select
                  value={editDeviceForm.status}
                  onChange={(e) => setEditDeviceForm(prev => ({ ...prev, status: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="operational">Operational</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="broken">Broken</option>
                </select>
              </div>

              {/* Device Output (for e-locks) */}
              {editDeviceForm.device_type === 'e-lock' && (
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    Lock State
                  </label>
                  <select
                    value={editDeviceForm.device_output}
                    onChange={(e) => setEditDeviceForm(prev => ({ ...prev, device_output: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      backgroundColor: 'white'
                    }}
                  >
                    <option value="locked">Locked</option>
                    <option value="unlocked">Unlocked</option>
                  </select>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              marginTop: '24px'
            }}>
              <button
                onClick={() => {
                  setIsEditDeviceModalOpen(false)
                  setSelectedDevice(null)
                }}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  color: '#374151',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDevice}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}

export default BuildingInfoPanel
