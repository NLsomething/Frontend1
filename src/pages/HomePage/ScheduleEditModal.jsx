import { SCHEDULE_STATUS, SCHEDULE_STATUS_LABELS } from '../../constants/schedule'
import { COLORS } from '../../constants/colors'

const ScheduleEditModal = ({ 
  isOpen, 
  editState, 
  editForm, 
  timeSlots,
  onSubmit, 
  onFormChange, 
  onRangeChange,
  onClose 
}) => {
  if (!isOpen || !editState.room) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg p-6 shadow-2xl rounded" style={{ backgroundColor: COLORS.darkGray }}>
        <div className="mb-4">
          <h3 className="text-lg font-semibold" style={{ color: COLORS.white }}>Edit Schedule</h3>
          <p className="text-sm" style={{ color: COLORS.whiteTransparentMid }}>
            Room {editState.room}
          </p>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: COLORS.whiteTransparentMid }}>Start time</label>
              <select
                value={editState.startHour ?? ''}
                onChange={onRangeChange('startHour')}
                className="w-full border px-3 py-2 text-sm rounded"
                style={{ 
                  border: '1px solid rgba(238,238,238,0.2)',
                  color: COLORS.white,
                  backgroundColor: '#4A5058'
                }}
              >
                {timeSlots.map((slot) => (
                  <option key={`start-${slot.hour}`} value={slot.hour} style={{ backgroundColor: '#4A5058' }}>
                    {slot.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: COLORS.whiteTransparentMid }}>End time</label>
              <select
                value={editState.endHour ?? ''}
                onChange={onRangeChange('endHour')}
                className="w-full border px-3 py-2 text-sm rounded"
                style={{ 
                  border: '1px solid rgba(238,238,238,0.2)',
                  color: COLORS.white,
                  backgroundColor: '#4A5058'
                }}
              >
                {timeSlots.map((slot) => (
                  <option key={`end-${slot.hour}`} value={slot.hour} style={{ backgroundColor: '#4A5058' }}>
                    {slot.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: COLORS.whiteTransparentMid }}>Status</label>
            <select
              name="status"
              value={editForm.status}
              onChange={onFormChange}
              className="w-full border px-3 py-2 text-sm rounded"
              style={{ 
                border: '1px solid rgba(238,238,238,0.2)',
                color: COLORS.white,
                backgroundColor: '#4A5058'
              }}
            >
              {Object.values(SCHEDULE_STATUS)
                .filter(status => status !== SCHEDULE_STATUS.pending)
                .map((status) => (
                  <option key={status} value={status} style={{ backgroundColor: '#4A5058' }}>
                    {SCHEDULE_STATUS_LABELS[status]}
                  </option>
                ))}
            </select>
          </div>

          {editForm.status === SCHEDULE_STATUS.occupied && (
            <>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: COLORS.whiteTransparentMid }}>Course / Event Name (optional)</label>
                <input
                  type="text"
                  name="courseName"
                  value={editForm.courseName}
                  onChange={onFormChange}
                  className="w-full border px-3 py-2 text-sm rounded"
                  style={{ 
                    border: '1px solid rgba(238,238,238,0.2)',
                    color: COLORS.white,
                    backgroundColor: '#4A5058'
                  }}
                  placeholder="e.g. Physics 101"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: COLORS.whiteTransparentMid }}>Who is using it?</label>
                <input
                  type="text"
                  name="bookedBy"
                  value={editForm.bookedBy}
                  onChange={onFormChange}
                  className="w-full border px-3 py-2 text-sm rounded"
                  style={{ 
                    border: '1px solid rgba(238,238,238,0.2)',
                    color: COLORS.white,
                    backgroundColor: '#4A5058'
                  }}
                  placeholder="e.g. Ms. Tran"
                  required={true}
                />
              </div>
            </>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              style={{ 
                border: '1px solid rgba(238,238,238,0.2)', 
                color: COLORS.white,
                backgroundColor: '#4A5058'
              }}
              className="px-4 py-2 text-sm font-semibold transition-colors duration-150 hover:bg-opacity-70 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold shadow transition-colors rounded"
              style={{ backgroundColor: COLORS.blue, color: COLORS.white, border: '1px solid transparent' }}
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ScheduleEditModal

