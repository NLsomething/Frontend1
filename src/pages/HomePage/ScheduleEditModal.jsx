import { SCHEDULE_STATUS, SCHEDULE_STATUS_LABELS } from '../../constants/schedule'

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
      <div className="w-full max-w-lg bg-white p-6 shadow-2xl">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Edit Schedule</h3>
          <p className="text-sm text-slate-500">
            Room {editState.room}
          </p>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Start time</label>
              <select
                value={editState.startHour ?? ''}
                onChange={onRangeChange('startHour')}
                className="w-full border border-slate-300 px-3 py-2 text-sm text-slate-700"
              >
                {timeSlots.map((slot) => (
                  <option key={`start-${slot.hour}`} value={slot.hour}>
                    {slot.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">End time</label>
              <select
                value={editState.endHour ?? ''}
                onChange={onRangeChange('endHour')}
                className="w-full border border-slate-300 px-3 py-2 text-sm text-slate-700"
              >
                {timeSlots.map((slot) => (
                  <option key={`end-${slot.hour}`} value={slot.hour}>
                    {slot.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Status</label>
            <select
              name="status"
              value={editForm.status}
              onChange={onFormChange}
              className="w-full border border-slate-300 px-3 py-2 text-sm text-slate-700"
            >
              {Object.values(SCHEDULE_STATUS)
                .filter(status => status !== SCHEDULE_STATUS.pending)
                .map((status) => (
                  <option key={status} value={status}>
                    {SCHEDULE_STATUS_LABELS[status]}
                  </option>
                ))}
            </select>
          </div>

          {editForm.status !== SCHEDULE_STATUS.maintenance && (
            <>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Course / Event Name (optional)</label>
                <input
                  type="text"
                  name="courseName"
                  value={editForm.courseName}
                  onChange={onFormChange}
                  className="w-full border border-slate-300 px-3 py-2 text-sm text-slate-700"
                  placeholder="e.g. Physics 101"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Who is using it?</label>
                <input
                  type="text"
                  name="bookedBy"
                  value={editForm.bookedBy}
                  onChange={onFormChange}
                  className="w-full border border-slate-300 px-3 py-2 text-sm text-slate-700"
                  placeholder="e.g. Ms. Tran"
                  required={editForm.status === SCHEDULE_STATUS.occupied}
                />
              </div>
            </>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#096ecc] px-4 py-2 text-sm font-semibold text-white shadow hover:bg-[#085cac]"
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

