const DeviceEditModal = ({ 
  isOpen, 
  device, 
  formData, 
  onFormChange, 
  onSave, 
  onClose 
}) => {
  if (!isOpen || !device) return null

  return (
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
            onClick={onClose}
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
              value={formData.device_name}
              onChange={(e) => onFormChange({ ...formData, device_name: e.target.value })}
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
              value={formData.device_type}
              onChange={(e) => onFormChange({ ...formData, device_type: e.target.value })}
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
              value={formData.status}
              onChange={(e) => onFormChange({ ...formData, status: e.target.value })}
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
          {formData.device_type === 'e-lock' && (
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
                value={formData.device_output}
                onChange={(e) => onFormChange({ ...formData, device_output: e.target.value })}
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
            onClick={onClose}
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
            onClick={onSave}
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
  )
}

export default DeviceEditModal

