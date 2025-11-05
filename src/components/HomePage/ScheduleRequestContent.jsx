import { MAX_ROOM_REQUEST_WEEKS } from '../../constants/requests'
import { formatDateDisplay } from '../../utils'
import { COLORS } from '../../constants/colors'

const ScheduleRequestContent = ({ 
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

  if (!requestState.room) return null

  return (
    <div className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold" style={{ color: COLORS.white }}>Request Room Usage</h3>
        <p className="text-sm" style={{ color: COLORS.whiteTransparentMid }}>
          Room {requestState.room} • {formatDateDisplay(isoDate)}
        </p>
      </div>

      <form 
        className="space-y-4" 
        onSubmit={(e) => {
          if (submitting) {
            e.preventDefault()
            e.stopPropagation()
            return false
          }
          onSubmit(e)
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: COLORS.whiteTransparentMid }}>Start time</label>
            <select
              value={requestState.startHour ?? ''}
              onChange={onRangeChange('startHour')}
              className="w-full border px-3 py-2 text-sm"
              style={{ 
                border: '1px solid rgba(238,238,238,0.2)',
                color: COLORS.white,
                backgroundColor: '#4A5058',
                borderRadius: 0 // Square corners
              }}
            >
              {timeSlots.map((slot, index) => {
                const value = slot.id ?? slot.slot_id ?? slot.slotId ?? slot.hour ?? slot.slot_order ?? index
                const label = slot.slot_name || slot.label || slot.name || `Slot ${index + 1}`
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
              className="w-full border px-3 py-2 text-sm"
              style={{ 
                border: '1px solid rgba(238,238,238,0.2)',
                color: COLORS.white,
                backgroundColor: '#4A5058',
                borderRadius: 0 // Square corners
              }}
            >
              {timeSlots.map((slot, index) => {
                const value = slot.id ?? slot.slot_id ?? slot.slotId ?? slot.hour ?? slot.slot_order ?? index
                const label = slot.slot_name || slot.label || slot.name || `Slot ${index + 1}`
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
            className="w-full border px-3 py-2 text-sm"
            style={{ 
              border: '1px solid rgba(238,238,238,0.2)',
              color: COLORS.white,
              backgroundColor: '#4A5058',
              borderRadius: 0 // Square corners
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
            className="w-full border px-3 py-2 text-sm"
            style={{ 
              border: '1px solid rgba(238,238,238,0.2)',
              color: COLORS.white,
              backgroundColor: '#4A5058',
              borderRadius: 0 // Square corners
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
            className="w-full border px-3 py-2 text-sm"
            rows={3}
            style={{ 
              border: '1px solid rgba(238,238,238,0.2)',
              color: COLORS.white,
              backgroundColor: '#4A5058',
              borderRadius: 0 // Square corners
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
              backgroundColor: '#4A5058',
              borderRadius: 0 // Square corners
            }}
            className="px-4 py-2 text-sm font-semibold transition-colors duration-150 hover:bg-opacity-70"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-semibold shadow transition-colors"
            style={{ 
              backgroundColor: submitting ? COLORS.darkGray : COLORS.blue, 
              color: COLORS.white, 
              border: '1px solid transparent',
              borderRadius: 0, // Square corners
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.6 : 1
            }}
            disabled={submitting}
            onClick={(e) => {
              if (submitting) {
                e.preventDefault()
                e.stopPropagation()
              }
            }}
          >
            {submitting ? 'Submitting…' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ScheduleRequestContent

