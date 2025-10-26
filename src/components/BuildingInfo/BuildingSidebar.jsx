import { useState, useEffect } from 'react'
import { fetchSectionsByBuildingId } from '../../services/sectionService'
import { fetchFloorsBySectionId } from '../../services/floorService'
import { fetchRoomsByFloorId } from '../../services/roomService'
import { useNotifications } from '../../context/NotificationContext'
import { COLORS } from '../../constants/colors'

const BuildingSidebar = ({ 
  building, 
  onClose, 
  onRoomSelect,
  selectedSection,
  setSelectedSection,
  selectedFloor,
  setSelectedFloor
}) => {
  const { notifyError } = useNotifications()
  const [sections, setSections] = useState([])
  const [floors, setFloors] = useState([])
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(false)

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

  const handleBack = () => {
    if (selectedFloor) {
      setSelectedFloor(null)
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
      backgroundColor: '#222831',
      boxShadow: '2px 0 10px rgba(0, 0, 0, 0.5)',
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
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', margin: 0, color: '#ffffff' }}>
              {selectedFloor ? selectedFloor.floor_name : selectedSection ? selectedSection.section_name : building.building_name}
            </h2>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#ffffff',
                padding: '0',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#3282B8'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#ffffff'}
            >
              ×
            </button>
          </div>
          
          {!selectedSection && (
            <>
              <p style={{ fontSize: '14px', color: '#ffffff80', margin: '4px 0' }}>
                Code: <span style={{ fontWeight: '600', color: '#ffffff' }}>{building.building_code}</span>
              </p>
              {building.description && (
                <p style={{ fontSize: '14px', color: '#ffffff70', marginTop: '12px', lineHeight: '1.6' }}>
                  {building.description}
                </p>
              )}
            </>
          )}

          {selectedSection && !selectedFloor && (
            <>
              {selectedSection.description && (
                <p style={{ fontSize: '14px', color: '#ffffff70', marginTop: '8px', lineHeight: '1.6' }}>
                  {selectedSection.description}
                </p>
              )}
            </>
          )}

          {selectedFloor && (
            <>
              {selectedFloor.description && (
                <p style={{ fontSize: '14px', color: '#ffffff70', marginTop: '8px', lineHeight: '1.6' }}>
                  {selectedFloor.description}
                </p>
              )}
            </>
          )}

          {/* Breadcrumb */}
          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#ffffff60' }}>
            <button
              onClick={() => {
                setSelectedSection(null)
                setSelectedFloor(null)
              }}
              style={{
                background: 'none',
                border: 'none',
                color: selectedSection || selectedFloor ? '#3282B8' : '#EEEEEE60',
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
                    color: selectedFloor ? '#3282B8' : '#EEEEEE60',
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
                <span style={{ color: '#ffffff60' }}>{selectedFloor.floor_name}</span>
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
        flexDirection: 'column',
        scrollbarWidth: 'thin',
        scrollbarColor: '#3282B8 #222831'
      }}>
        <style>
          {`
            ::-webkit-scrollbar {
              width: 8px;
            }
            ::-webkit-scrollbar-track {
              background: #222831;
            }
            ::-webkit-scrollbar-thumb {
              background: #3282B8;
              border-radius: 4px;
            }
            ::-webkit-scrollbar-thumb:hover {
              background: #0F4C75;
            }
          `}
        </style>
          {loading && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#ffffff60' }}>
              Loading...
            </div>
          )}

          {!loading && !selectedSection && (
            <>
              <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '12px', color: '#ffffff' }}>
                Sections ({sections.length})
              </h3>
              {sections.length === 0 ? (
                <p style={{ color: '#ffffff60', fontSize: '14px', padding: '20px', textAlign: 'center' }}>
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
                    border: '1px solid rgba(238,238,238,0.2)',
                        borderRadius: '6px',
                    backgroundColor: '#393E46',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#0F4C75'
                        e.currentTarget.style.borderColor = '#3282B8'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#393E46'
                        e.currentTarget.style.borderColor = 'rgba(238,238,238,0.2)'
                      }}
                    >
                      <div style={{ fontWeight: '600', color: '#ffffff', marginBottom: '4px' }}>
                        {section.section_name}
                      </div>
                      {section.description && (
                        <div style={{ fontSize: '13px', color: '#ffffff80' }}>
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
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#ffffff' }}>
                Floors ({floors.length})
              </h3>
              {floors.length === 0 ? (
                <p style={{ color: '#ffffff60', fontSize: '14px', padding: '20px', textAlign: 'center' }}>
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
                    border: '1px solid rgba(238,238,238,0.2)',
                        borderRadius: '6px',
                    backgroundColor: '#393E46',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#0F4C75'
                        e.currentTarget.style.borderColor = '#3282B8'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#393E46'
                        e.currentTarget.style.borderColor = 'rgba(238,238,238,0.2)'
                      }}
                    >
                      <div style={{ fontWeight: '600', color: '#ffffff', marginBottom: '4px' }}>
                        {floor.floor_name}
                      </div>
                      {floor.description && (
                        <div style={{ fontSize: '13px', color: '#ffffff80' }}>
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
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#ffffff' }}>
                Rooms ({rooms.filter(r => r.room_type !== 'administrative').length})
              </h3>
              {rooms.filter(r => r.room_type !== 'administrative').length === 0 ? (
                <p style={{ color: '#ffffff60', fontSize: '14px', padding: '20px', textAlign: 'center' }}>
                  No bookable rooms found
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {rooms.filter(r => r.room_type !== 'administrative').map(room => (
                    <button
                      key={room.id}
                      onClick={() => onRoomSelect(room)}
                      style={{
                        padding: '10px 12px',
                    border: '1px solid rgba(238,238,238,0.2)',
                        borderRadius: '6px',
                    backgroundColor: '#393E46',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#0F4C75'
                        e.currentTarget.style.borderColor = '#3282B8'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#393E46'
                        e.currentTarget.style.borderColor = 'rgba(238,238,238,0.2)'
                      }}
                    >
                      <div style={{ fontWeight: '600', color: '#ffffff', marginBottom: '4px' }}>
                        {room.room_name}
                      </div>
                      <div style={{ fontSize: '13px', color: '#ffffff80' }}>
                        Code: {room.room_code} • Type: {room.room_type || 'classroom'}
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
          borderTop: '1px solid rgba(255,255,255,0.1)',
          flexShrink: 0,
          display: 'flex',
          gap: '12px'
        }}>
          <button
            onClick={handleBack}
            style={{
              flex: 1,
              padding: '10px 16px',
              border: '1px solid rgba(238,238,238,0.2)',
              borderRadius: '6px',
              backgroundColor: '#393E46',
              color: '#EEEEEE',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '14px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#7f1d1d'
              e.currentTarget.style.borderColor = '#ef4444'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#2a2a2a'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
            }}
          >
            {selectedFloor || selectedSection ? 'Back' : 'Close'}
          </button>
        </div>
      </div>
    </aside>
  )
}

export default BuildingSidebar

