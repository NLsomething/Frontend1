import { useState, useEffect } from 'react'
import { fetchFloorsByBuildingId } from '../../services/floorService'
import { fetchRoomsByFloorId } from '../../services/roomService'
import { useNotifications } from '../../context/NotificationContext'
import { COLORS } from '../../constants/colors'

const BuildingSidebar = ({ 
  building, 
  onClose, 
  onRoomSelect,
  selectedFloor,
  setSelectedFloor,
  selectedRoomCode,
  onRoomDeselect,
  isOpen = true
}) => {
  const { notifyError } = useNotifications()
  const [floors, setFloors] = useState([])
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const loadFloors = async () => {
    setLoading(true)
    const { data, error } = await fetchFloorsByBuildingId(building.id)
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
      loadFloors()
    } else {
      setFloors([])
      setSelectedFloor(null)
      setRooms([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [building?.id])

  useEffect(() => {
    if (selectedFloor?.id) {
      loadRooms()
    } else {
      setRooms([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFloor?.id])

  const handleBack = () => {
    // If a room is selected, deselect it first
    if (selectedRoomCode && onRoomDeselect) {
      onRoomDeselect()
    } else if (selectedFloor) {
      setSelectedFloor(null)
    } else {
      onClose()
    }
  }

  if (!building) return null

  return (
    <aside style={{
      // Embedded inside UnifiedPanel: occupy full panel space
      position: 'relative',
      width: '100%',
      minWidth: '260px',
      maxWidth: '100%',
      height: '100%',
      backgroundColor: '#222831',
      boxShadow: 'none',
      zIndex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      opacity: mounted && isOpen ? 1 : 0,
      transition: 'opacity 0.35s ease-out'
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
          <div style={{ marginBottom: '8px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', margin: 0, color: '#ffffff' }}>
              {selectedFloor ? selectedFloor.floor_name : building.building_name}
            </h2>
          </div>
          
          {!selectedFloor && (
            <>
              <p style={{ fontSize: '14px', color: '#ffffff80', margin: '4px 0' }}>
                Code: <span style={{ fontWeight: '600', color: '#ffffff' }}>{building.building_code}</span>
              </p>
            </>
          )}

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
          `}
        </style>
          {loading && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#ffffff60' }}>
              Loading...
            </div>
          )}

          {!loading && !selectedFloor && (
            <>
              <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '12px', color: '#ffffff' }}>
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
            {selectedFloor ? 'Back' : 'Close'}
          </button>
        </div>
      </div>
    </aside>
  )
}

export default BuildingSidebar
