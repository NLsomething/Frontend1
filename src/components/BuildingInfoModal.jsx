import { useState, useEffect } from 'react'
import { fetchSectionsByBuildingId } from '../services/sectionService'
import { fetchFloorsBySectionId } from '../services/floorService'
import { fetchRoomsByFloorId } from '../services/roomService'
import { useNotifications } from '../context/NotificationContext'
import { getSchedulesByDate } from '../services/scheduleService'
import { SCHEDULE_STATUS, SCHEDULE_STATUS_LABELS, SCHEDULE_STATUS_STYLES } from '../constants/schedule'

const BuildingInfoPanel = ({ building, onClose, onRoomSelect, canEdit, canRequest, onAdminAction, onTeacherRequest }) => {
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
  const [roomSchedule, setRoomSchedule] = useState([])
  const [scheduleLoading, setScheduleLoading] = useState(false)

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
      // Clear room schedule when switching to floor view
      setSelectedRoomCode(null)
      setRoomSchedule([])
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

  const handleRoomClick = async (room) => {
    if (room.model_url) {
      setPreviewImage(room.model_url)
      setPreviewTitle(`${room.room_name} - 2D Layout`)
    }
    setSelectedRoomCode(room.room_code)
    await loadRoomSchedule(room.room_code)
    onRoomSelect(room)
  }

  const handleBack = () => {
    if (selectedFloor) {
      setSelectedFloor(null)
      // Clear preview when going back from floor
      setPreviewImage(null)
      setPreviewTitle('')
      setSelectedRoomCode(null)
      setRoomSchedule([])
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
      width: '28%',
      minWidth: '320px',
      maxWidth: '450px',
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
          height: selectedRoomCode ? 'calc(100vh - 40px)' : 'auto',
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
                setRoomSchedule([])
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

          {/* Room Schedule Section */}
          {selectedRoomCode && (
            <div style={{
              flex: 1,
              overflowY: 'auto',
              borderTop: '1px solid #e5e7eb'
            }}>
              <div style={{
                padding: '12px 16px',
                backgroundColor: '#f9fafb',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <h4 style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#1f2937',
                  margin: 0
                }}>
                  Today's Schedule
                </h4>
              </div>

              {scheduleLoading ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280', fontSize: '13px' }}>
                  Loading schedule...
                </div>
              ) : (
                <div style={{ fontSize: '12px' }}>
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
                    const bgColor = status === SCHEDULE_STATUS.empty ? '#ffffff' : 
                                   status === SCHEDULE_STATUS.booked ? '#fef3c7' :
                                   status === SCHEDULE_STATUS.available ? '#d1fae5' : '#f3f4f6'
                    
                    // Check if interactive
                    const interactive = canEdit || canRequest
                    
                    return (
                      <button
                        type="button"
                        key={hour}
                        onClick={() => {
                          if (canEdit && onAdminAction) {
                            onAdminAction(selectedRoomCode, hour)
                          } else if (canRequest && onTeacherRequest) {
                            onTeacherRequest(selectedRoomCode, hour)
                          }
                        }}
                        disabled={!interactive}
                        style={{
                          display: 'flex',
                          borderBottom: '1px solid #e5e7eb',
                          backgroundColor: bgColor,
                          transition: 'all 0.2s',
                          cursor: interactive ? 'pointer' : 'default',
                          border: 'none',
                          width: '100%',
                          textAlign: 'left'
                        }}
                        onMouseEnter={(e) => {
                          if (interactive) {
                            e.currentTarget.style.backgroundColor = '#e5e7eb'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (interactive) {
                            e.currentTarget.style.backgroundColor = bgColor
                          }
                        }}
                      >
                        <div style={{
                          width: '80px',
                          padding: '8px 12px',
                          fontWeight: '600',
                          color: '#374151',
                          borderRight: '1px solid #e5e7eb',
                          flexShrink: 0
                        }}>
                          {timeLabel}
                        </div>
                        <div style={{
                          flex: 1,
                          padding: '8px 12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px'
                        }}>
                          <div style={{
                            fontWeight: '600',
                            color: '#1f2937',
                            textTransform: 'uppercase',
                            fontSize: '11px'
                          }}>
                            {statusLabel}
                          </div>
                          {courseName && (
                            <div style={{ color: '#4b5563', fontSize: '11px' }}>
                              {courseName}
                            </div>
                          )}
                          {bookedBy && (
                            <div style={{ color: '#6b7280', fontSize: '10px' }}>
                              {bookedBy}
                            </div>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </aside>
  )
}

export default BuildingInfoPanel
