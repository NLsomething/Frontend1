import { SCHEDULE_STATUS, SCHEDULE_STATUS_LABELS } from '../../constants/schedule'
import { COLORS } from '../../constants/colors'

const ScheduleEditContent = ({ 
  editState, 
  editForm, 
  timeSlots,
  submitting,
  onSubmit, 
  onFormChange, 
  onRangeChange,
  onClose 
}) => {
  if (!editState.room) return null

  return (
    <div className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold" style={{ color: COLORS.white }}>Edit Schedule</h3>
        <p className="text-sm" style={{ color: COLORS.whiteTransparentMid }}>
          Room {editState.room}
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
              value={editState.startHour ?? ''}
              onChange={onRangeChange('startHour')}
              className="w-full border px-3 py-2 text-sm"
              style={{ 
                border: '1px solid rgba(238,238,238,0.2)',
                color: COLORS.white,
                backgroundColor: '#4A5058',
                borderRadius: 0 // Square corners
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
              className="w-full border px-3 py-2 text-sm"
              style={{ 
                border: '1px solid rgba(238,238,238,0.2)',
                color: COLORS.white,
                backgroundColor: '#4A5058',
                borderRadius: 0 // Square corners
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
            className="w-full border px-3 py-2 text-sm"
            style={{ 
              border: '1px solid rgba(238,238,238,0.2)',
              color: COLORS.white,
              backgroundColor: '#4A5058',
              borderRadius: 0 // Square corners
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
                className="w-full border px-3 py-2 text-sm"
                style={{ 
                  border: '1px solid rgba(238,238,238,0.2)',
                  color: COLORS.white,
                  backgroundColor: '#4A5058',
                  borderRadius: 0 // Square corners
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
                className="w-full border px-3 py-2 text-sm"
                style={{ 
                  border: '1px solid rgba(238,238,238,0.2)',
                  color: COLORS.white,
                  backgroundColor: '#4A5058',
                  borderRadius: 0 // Square corners
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
              backgroundColor: '#4A5058',
              borderRadius: 0 // Square corners
            }}
            className="px-4 py-2 text-sm font-semibold transition-colors duration-150 hover:bg-opacity-70"
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
            {submitting ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ScheduleEditContent

