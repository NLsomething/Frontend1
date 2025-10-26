import { USER_ROLES } from '../../constants/roles'
import { COLORS } from '../../constants/colors'

const DeviceList = ({ 
  devices, 
  devicesLoading, 
  userRole, 
  onToggleDevice, 
  onEditDevice 
}) => {
  if (devicesLoading) {
    return (
      <div style={{ color: '#EEEEEE80', fontSize: '13px', textAlign: 'center', padding: '8px' }}>
        Loading...
      </div>
    )
  }

  if (devices.length === 0) {
    return (
      <div style={{ color: '#EEEEEE80', fontSize: '13px', textAlign: 'center', padding: '8px' }}>
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
        backgroundColor: devices.some(d => d.device_output === 'unlocked') ? '#222831' : '#222831',
        borderRadius: '6px',
        border: `1px solid ${devices.some(d => d.device_output === 'unlocked') ? '#3282B8' : '#EEEEEE20'}`
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
          color: devices.some(d => d.device_output === 'unlocked') ? '#3282B8' : '#EEEEEE'
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
            backgroundColor: '#393E46',
            borderRadius: '6px',
            border: '1px solid rgba(238,238,238,0.1)',
            gap: '8px'
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '13px',
              fontWeight: '600',
              color: '#EEEEEE',
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
              color: '#EEEEEE80'
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
                border: '1px solid rgba(238,238,238,0.2)',
                cursor: 'pointer',
                backgroundColor: '#393E46',
                color: '#EEEEEE',
                transition: 'all 0.2s',
                flexShrink: 0
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

