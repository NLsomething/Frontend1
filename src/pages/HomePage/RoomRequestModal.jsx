import { MAX_ROOM_REQUEST_WEEKS } from '../../constants/requests'
import { formatDateDisplay } from '../../utils'
import { COLORS } from '../../constants/colors'

const RoomRequestModal = ({ 
  isOpen, 
  requestState, 
  requestForm, 
  timeSlots,
  isoDate,
  submitting,
  onSubmit, 
  onFormChange, 
  onRangeChange,
  onClose 
}) => {
  if (!isOpen || !requestState.room) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg p-6 shadow-2xl rounded" style={{ backgroundColor: COLORS.darkGray }}>
        <div className="mb-4">
          <h3 className="text-lg font-semibold" style={{ color: COLORS.white }}>Request Room Usage</h3>
          <p className="text-sm" style={{ color: COLORS.whiteTransparentMid }}>
            Room {requestState.room} • {formatDateDisplay(isoDate)}
          </p>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: COLORS.whiteTransparentMid }}>Start time</label>
              <select
                value={requestState.startHour ?? ''}
                onChange={onRangeChange('startHour')}
                className="w-full border px-3 py-2 text-sm rounded"
                style={{ 
                  border: '1px solid rgba(238,238,238,0.2)',
                  color: COLORS.white,
                  backgroundColor: '#4A5058'
                }}
              >
                {timeSlots.map((slot, index) => {
                  const value = slot.id ?? slot.slot_id ?? slot.slotId ?? slot.hour ?? slot.slot_order ?? index
                  const label = slot.label || slot.slot_name || `Slot ${index + 1}`
                  return (
                    <option key={`request-start-${value}`} value={value} style={{ backgroundColor: '#4A5058' }}>
                      {label}
                    </option>
                  )
                })}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: COLORS.whiteTransparentMid }}>End time</label>
              <select
                value={requestState.endHour ?? ''}
                onChange={onRangeChange('endHour')}
                className="w-full border px-3 py-2 text-sm rounded"
                style={{ 
                  border: '1px solid rgba(238,238,238,0.2)',
                  color: COLORS.white,
                  backgroundColor: '#4A5058'
                }}
              >
                {timeSlots.map((slot, index) => {
                  const value = slot.id ?? slot.slot_id ?? slot.slotId ?? slot.hour ?? slot.slot_order ?? index
                  const label = slot.label || slot.slot_name || `Slot ${index + 1}`
                  return (
                    <option key={`request-end-${value}`} value={value} style={{ backgroundColor: '#4A5058' }}>
                      {label}
                    </option>
                  )
                })}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: COLORS.whiteTransparentMid }}>Weeks</label>
            <select
              name="weekCount"
              value={requestForm.weekCount}
              onChange={onFormChange}
              className="w-full border px-3 py-2 text-sm rounded"
              style={{ 
                border: '1px solid rgba(238,238,238,0.2)',
                color: COLORS.white,
                backgroundColor: '#4A5058'
              }}
            >
              {Array.from({ length: MAX_ROOM_REQUEST_WEEKS }, (_, index) => index + 1).map((week) => (
                <option key={`weeks-${week}`} value={week} style={{ backgroundColor: '#4A5058' }}>
                  {week} week{week > 1 ? 's' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: COLORS.whiteTransparentMid }}>Course / Event Name (optional)</label>
            <input
              type="text"
              name="courseName"
              value={requestForm.courseName}
              onChange={onFormChange}
              className="w-full border px-3 py-2 text-sm rounded"
              style={{ 
                border: '1px solid rgba(238,238,238,0.2)',
                color: COLORS.white,
                backgroundColor: '#4A5058'
              }}
              placeholder="e.g. Physics Workshop"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: COLORS.whiteTransparentMid }}>Additional notes (optional)</label>
            <textarea
              name="notes"
              value={requestForm.notes}
              onChange={onFormChange}
              className="w-full border px-3 py-2 text-sm rounded"
              rows={3}
              style={{ 
                border: '1px solid rgba(238,238,238,0.2)',
                color: COLORS.white,
                backgroundColor: '#4A5058'
              }}
              placeholder="Share any extra context for the building manager."
            />
          </div>

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
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold shadow transition-colors rounded"
              style={{ backgroundColor: COLORS.blue, color: COLORS.white, border: '1px solid transparent' }}
              disabled={submitting}
            >
              {submitting ? 'Submitting…' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RoomRequestModal

