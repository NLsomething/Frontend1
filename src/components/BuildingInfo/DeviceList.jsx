import { USER_ROLES } from '../../constants/roles'

const DeviceList = ({ 
  devices, 
  devicesLoading, 
  userRole, 
  onToggleDevice, 
  onEditDevice 
}) => {
  if (devicesLoading) {
    return (
      <div style={{ color: '#6b7280', fontSize: '13px', textAlign: 'center', padding: '8px' }}>
        Loading...
      </div>
    )
  }

  if (devices.length === 0) {
    return (
      <div style={{ color: '#6b7280', fontSize: '13px', textAlign: 'center', padding: '8px' }}>
        No devices found
      </div>
    )
  }

  // Student and Teacher View - Show simple lock status
  if (userRole === USER_ROLES.student || userRole === USER_ROLES.teacher) {
    return (
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
    )
  }

  // Administrator and Building Manager View - Show device list with controls
  return (
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
              onClick={() => onEditDevice(device)}
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
                onClick={() => onToggleDevice(device)}
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
  )
}

export default DeviceList

