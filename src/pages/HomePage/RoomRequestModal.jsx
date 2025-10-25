import { MAX_ROOM_REQUEST_WEEKS } from '../../constants/requests'
import { formatDateDisplay } from '../../utils'

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
      <div className="w-full max-w-lg bg-white p-6 shadow-2xl">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Request Room Usage</h3>
          <p className="text-sm text-slate-500">
            Room {requestState.room} • {formatDateDisplay(isoDate)}
          </p>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Start time</label>
              <select
                value={requestState.startHour ?? ''}
                onChange={onRangeChange('startHour')}
                className="w-full border border-slate-300 px-3 py-2 text-sm text-slate-700"
              >
                {timeSlots.map((slot) => (
                  <option key={`request-start-${slot.hour}`} value={slot.hour}>
                    {slot.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">End time</label>
              <select
                value={requestState.endHour ?? ''}
                onChange={onRangeChange('endHour')}
                className="w-full border border-slate-300 px-3 py-2 text-sm text-slate-700"
              >
                {timeSlots.map((slot) => (
                  <option key={`request-end-${slot.hour}`} value={slot.hour}>
                    {slot.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Weeks</label>
            <select
              name="weekCount"
              value={requestForm.weekCount}
              onChange={onFormChange}
              className="w-full border border-slate-300 px-3 py-2 text-sm text-slate-700"
            >
              {Array.from({ length: MAX_ROOM_REQUEST_WEEKS }, (_, index) => index + 1).map((week) => (
                <option key={`weeks-${week}`} value={week}>
                  {week} week{week > 1 ? 's' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Course / Event Name (optional)</label>
            <input
              type="text"
              name="courseName"
              value={requestForm.courseName}
              onChange={onFormChange}
              className="w-full border border-slate-300 px-3 py-2 text-sm text-slate-700"
              placeholder="e.g. Physics Workshop"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Who will use the room?</label>
            <input
              type="text"
              name="bookedBy"
              value={requestForm.bookedBy}
              onChange={onFormChange}
              className="w-full border border-slate-300 px-3 py-2 text-sm text-slate-700"
              placeholder="e.g. Grade 11 Physics"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Additional notes (optional)</label>
            <textarea
              name="notes"
              value={requestForm.notes}
              onChange={onFormChange}
              className="w-full border border-slate-300 px-3 py-2 text-sm text-slate-700"
              rows={3}
              placeholder="Share any extra context for the building manager."
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#096ecc] px-4 py-2 text-sm font-semibold text-white shadow hover:bg-[#085cac]"
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

