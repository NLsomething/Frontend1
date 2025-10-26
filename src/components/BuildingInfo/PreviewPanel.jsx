import { USER_ROLES } from '../../constants/roles'
import DeviceList from './DeviceList'
import { COLORS } from '../../constants/colors'

const PreviewPanel = ({ 
  isOpen,
  previewImage, 
  previewTitle, 
  selectedRoomCode,
  devices, 
  devicesLoading, 
  userRole, 
  onToggleDevice, 
  onEditDevice, 
  onClose 
}) => {
  if (!isOpen || !previewImage) return null

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      width: '450px',
      height: 'auto',
      maxHeight: '900px',
      backgroundColor: '#393E46',
      borderRadius: '12px',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
      zIndex: 35,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Preview Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid rgba(238,238,238,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#222831',
        flexShrink: 0
      }}>
        <h3 style={{
          fontSize: '14px',
          fontWeight: '600',
          color: '#EEEEEE',
          margin: 0
        }}>
          {previewTitle}
        </h3>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            color: '#EEEEEE',
            padding: '0',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#3282B8'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#EEEEEE'}
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
        backgroundColor: '#222831',
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
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
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
        borderTop: '1px solid rgba(238,238,238,0.1)',
        padding: '16px',
        backgroundColor: '#222831',
        flexShrink: 0
      }}>
          <h4 style={{
            fontSize: '13px',
            fontWeight: '600',
            color: '#EEEEEE',
            margin: '0 0 12px 0',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {(userRole === USER_ROLES.student || userRole === USER_ROLES.teacher) ? 'Status' : 'Devices'}
          </h4>

          <DeviceList
            devices={devices}
            devicesLoading={devicesLoading}
            userRole={userRole}
            onToggleDevice={onToggleDevice}
            onEditDevice={onEditDevice}
          />
        </div>
      )}
    </div>
  )
}

export default PreviewPanel

