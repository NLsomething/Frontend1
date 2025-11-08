import { SCHEDULE_STATUS, SCHEDULE_STATUS_LABELS } from '../../constants/schedule'
import '../../styles/HomePageStyle/ScheduleEditStyle.css'

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

  const busy = submitting
  const isOccupied = editForm.status === SCHEDULE_STATUS.occupied

  return (
    <div className="se-panel">
      <div className="se-header">
        <h3 className="se-title">Edit Schedule</h3>
        <p className="se-subtitle">Room {editState.room}</p>
      </div>

      <form
        className={`se-form 
        ${busy ? 'busy' : ''}`}
        onSubmit={(event) => {
          if (busy) {
            event.preventDefault()
            event.stopPropagation()
            return false
          }
          onSubmit(event)
          return undefined
        }}
      >
        <div className="se-grid">
          <div className="se-field">
            <label className="se-label" htmlFor="se-start-hour">Start time</label>
            <select
              id="se-start-hour"
              value={editState.startHour ?? ''}
              onChange={onRangeChange('startHour')}
              className="se-control se-select"
            >
              {timeSlots.map((slot, index) => {
                const value = slot.id ?? slot.slot_id ?? slot.slotId ?? slot.hour ?? slot.slot_order ?? index
                const label = slot.slot_name || slot.label || slot.name || `Slot ${index + 1}`
                return (
                  <option key={`start-${value}`} value={value}>
                    {label}
                  </option>
                )
              })}
            </select>
          </div>

          <div className="se-field">
            <label className="se-label" htmlFor="se-end-hour">End time</label>
            <select
              id="se-end-hour"
              value={editState.endHour ?? ''}
              onChange={onRangeChange('endHour')}
              className="se-control se-select"
            >
              {timeSlots.map((slot, index) => {
                const value = slot.id ?? slot.slot_id ?? slot.slotId ?? slot.hour ?? slot.slot_order ?? index
                const label = slot.slot_name || slot.label || slot.name || `Slot ${index + 1}`
                return (
                  <option key={`end-${value}`} value={value}>
                    {label}
                  </option>
                )
              })}
            </select>
          </div>
        </div>

        <div className="se-field">
          <label className="se-label" htmlFor="se-status">Status</label>
          <select
            id="se-status"
            name="status"
            value={editForm.status}
            onChange={onFormChange}
            className="se-control se-select"
          >
            {Object.values(SCHEDULE_STATUS)
              .filter((status) => status !== SCHEDULE_STATUS.pending)
              .map((status) => (
                <option key={status} value={status}>
                  {SCHEDULE_STATUS_LABELS[status]}
                </option>
              ))}
          </select>
        </div>

        {isOccupied && (
          <div className="se-occupied-fields">
            <div className="se-field">
              <label className="se-label" htmlFor="se-course-name">Course / Event Name (optional)</label>
              <input
                id="se-course-name"
                type="text"
                name="courseName"
                value={editForm.courseName}
                onChange={onFormChange}
                className="se-control se-input"
                placeholder="e.g. Physics 101"
              />
            </div>

            <div className="se-field">
              <label className="se-label" htmlFor="se-booked-by">Who is using it?</label>
              <input
                id="se-booked-by"
                type="text"
                name="bookedBy"
                value={editForm.bookedBy}
                onChange={onFormChange}
                className="se-control se-input"
                placeholder="e.g. Ms. Tran"
                required
              />
            </div>
          </div>
        )}

        <div className="se-actions">
          <button
            type="button"
            onClick={onClose}
            className="se-button secondary"
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="se-button primary"
            disabled={busy}
            onClick={(event) => {
              if (busy) {
                event.preventDefault()
                event.stopPropagation()
              }
            }}
          >
            {busy ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ScheduleEditContent

