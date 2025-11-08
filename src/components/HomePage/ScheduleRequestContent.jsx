import { MAX_ROOM_REQUEST_WEEKS } from '../../constants/requests'
import { formatDateDisplay } from '../../utils'
import '../../styles/HomePageStyle/ScheduleRequestStyle.css'

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

  const busy = submitting

  return (
    <div className="sr-panel">
      <div className="sr-header">
        <h3 className="sr-title">Request Room Usage</h3>
        <p className="sr-subtitle">
          Room {requestState.room} • {formatDateDisplay(isoDate)}
        </p>
      </div>

      <form
        className={`sr-form
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
        <div className="sr-grid">
          <div className="sr-field">
            <label className="sr-label" htmlFor="sr-start-hour">Start time</label>
            <select
              id="sr-start-hour"
              value={requestState.startHour ?? ''}
              onChange={onRangeChange('startHour')}
              className="sr-control sr-select"
            >
              {timeSlots.map((slot, index) => {
                const value = slot.id ?? slot.slot_id ?? slot.slotId ?? slot.hour ?? slot.slot_order ?? index
                const label = slot.slot_name || slot.label || slot.name || `Slot ${index + 1}`
                return (
                  <option key={`request-start-${value}`} value={value}>
                    {label}
                  </option>
                )
              })}
            </select>
          </div>

          <div className="sr-field">
            <label className="sr-label" htmlFor="sr-end-hour">End time</label>
            <select
              id="sr-end-hour"
              value={requestState.endHour ?? ''}
              onChange={onRangeChange('endHour')}
              className="sr-control sr-select"
            >
              {timeSlots.map((slot, index) => {
                const value = slot.id ?? slot.slot_id ?? slot.slotId ?? slot.hour ?? slot.slot_order ?? index
                const label = slot.slot_name || slot.label || slot.name || `Slot ${index + 1}`
                return (
                  <option key={`request-end-${value}`} value={value}>
                    {label}
                  </option>
                )
              })}
            </select>
          </div>
        </div>

        <div className="sr-field">
          <label className="sr-label" htmlFor="sr-week-count">Weeks</label>
          <select
            id="sr-week-count"
            name="weekCount"
            value={requestForm.weekCount}
            onChange={onFormChange}
            className="sr-control sr-select"
          >
            {Array.from({ length: MAX_ROOM_REQUEST_WEEKS }, (_, index) => index + 1).map((week) => (
              <option key={`weeks-${week}`} value={week}>
                {week} week{week > 1 ? 's' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="sr-field">
          <label className="sr-label" htmlFor="sr-course-name">Course / Event Name (optional)</label>
          <input
            id="sr-course-name"
            type="text"
            name="courseName"
            value={requestForm.courseName}
            onChange={onFormChange}
            className="sr-control sr-input"
            placeholder="e.g. Physics Workshop"
          />
        </div>

        <div className="sr-field">
          <label className="sr-label" htmlFor="sr-notes">Additional notes (optional)</label>
          <textarea
            id="sr-notes"
            name="notes"
            value={requestForm.notes}
            onChange={onFormChange}
            className="sr-control sr-textarea"
            rows={3}
            placeholder="Share any extra context for the building manager."
          />
        </div>

        <div className="sr-actions">
          <button
            type="button"
            onClick={onClose}
            className="sr-button secondary"
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="sr-button primary"
            disabled={busy}
            onClick={(event) => {
              if (busy) {
                event.preventDefault()
                event.stopPropagation()
              }
            }}
          >
            {busy ? 'Submitting…' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ScheduleRequestContent

