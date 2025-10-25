import { ROOM_REQUEST_STATUS_LABELS, ROOM_REQUEST_STATUS_STYLES } from '../../constants/requests'
import { formatDateDisplay, formatRequestRange, getDefaultDateFilter } from '../../utils'

const MyRequestsPanel = ({
  isOpen,
  myRequests,
  filteredMyRequests,
  myRequestsLoading,
  myRequestsDateFilter,
  onClose,
  onDateFilterChange
}) => {
  // Generate time slots for display
  const timeSlots = Array.from({ length: 14 }, (_, index) => {
    const hour = 7 + index
    const period = hour < 12 ? 'AM' : 'PM'
    const twelveHour = ((hour + 11) % 12) + 1
    return {
      label: `${twelveHour}:00 ${period}`,
      hour
    }
  })

  return (
    <>
      {isOpen && (
        <div
          className="absolute inset-0 z-30 bg-black/10"
          onClick={onClose}
        />
      )}

      <aside
        className={`absolute top-0 right-0 z-40 h-full w-full max-w-3xl transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        aria-hidden={!isOpen}
      >
        <div className="flex h-full w-full flex-col bg-white/95 backdrop-blur-sm border-l border-slate-200 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">My Requests</h2>
              <p className="text-sm text-slate-500">View the status of your room requests</p>
            </div>
            <button
              onClick={onClose}
              className="border border-slate-300 px-3 py-1 text-sm font-medium text-slate-600 transition-colors duration-150 hover:bg-slate-100"
            >
              Close
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {myRequestsLoading ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                Loading your requests…
              </div>
            ) : myRequests.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <div className="rounded border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500 max-w-md">
                  <p className="font-medium text-slate-600 mb-2">No requests yet</p>
                  <p className="text-xs text-slate-400">Submit a request by clicking on an empty slot in the schedule.</p>
                </div>
              </div>
            ) : (
              <>
                {/* Date Filter */}
                <div className="rounded border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">Filter by Date</label>
                    <button
                      onClick={() => onDateFilterChange && onDateFilterChange(getDefaultDateFilter())}
                      className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      Reset to Last 7 Days
                    </button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">From</label>
                      <input
                        type="date"
                        value={myRequestsDateFilter.startDate}
                        onChange={(e) => onDateFilterChange && onDateFilterChange({ ...myRequestsDateFilter, startDate: e.target.value })}
                        className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">To</label>
                      <input
                        type="date"
                        value={myRequestsDateFilter.endDate}
                        onChange={(e) => onDateFilterChange && onDateFilterChange({ ...myRequestsDateFilter, endDate: e.target.value })}
                        className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Pending Requests */}
                {filteredMyRequests.filter((r) => r.status === 'pending').length > 0 && (
                  <section className="space-y-4">
                    <header className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Pending</h3>
                      <span className="text-xs font-medium text-slate-400">
                        {filteredMyRequests.filter((r) => r.status === 'pending').length} awaiting review
                      </span>
                    </header>

                    {filteredMyRequests
                      .filter((r) => r.status === 'pending')
                      .map((request) => {
                        const statusStyle = ROOM_REQUEST_STATUS_STYLES[request.status] || ROOM_REQUEST_STATUS_STYLES.pending
                        return (
                          <div key={request.id} className="border border-slate-200 bg-white px-5 py-4 shadow-sm">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-slate-800">Room {request.room_number}</p>
                                <p className="text-xs text-slate-500">
                                  {formatDateDisplay(request.base_date)} • {formatRequestRange(request, timeSlots)} • {request.week_count} week{request.week_count > 1 ? 's' : ''}
                                </p>
                              </div>
                              <span className={`rounded border px-2 py-1 text-xs font-semibold uppercase tracking-wide ${statusStyle}`}>
                                {ROOM_REQUEST_STATUS_LABELS[request.status]}
                              </span>
                            </div>

                            <div className="mt-3 grid gap-2 text-xs text-slate-600">
                              {request.booked_by && (
                                <div>
                                  <span className="font-semibold text-slate-700">Usage:</span> {request.booked_by}
                                </div>
                              )}
                              {request.course_name && (
                                <div>
                                  <span className="font-semibold text-slate-700">Course/Event:</span> {request.course_name}
                                </div>
                              )}
                              {request.notes && (
                                <div>
                                  <span className="font-semibold text-slate-700">Notes:</span> {request.notes}
                                </div>
                              )}
                              <div className="text-xs text-slate-400 mt-1">
                                Submitted {formatDateDisplay(request.created_at.slice(0, 10))}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                  </section>
                )}

                {/* Approved & Reverted Requests */}
                {filteredMyRequests.filter((r) => r.status === 'approved' || r.status === 'reverted').length > 0 && (
                  <section className="space-y-4">
                    <header className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-600">Approved & Reverted</h3>
                      <span className="text-xs font-medium text-slate-400">
                        {filteredMyRequests.filter((r) => r.status === 'approved' || r.status === 'reverted').length} requests
                      </span>
                    </header>

                    {filteredMyRequests
                      .filter((r) => r.status === 'approved' || r.status === 'reverted')
                      .map((request) => {
                        const statusStyle = ROOM_REQUEST_STATUS_STYLES[request.status]
                        const isReverted = request.status === 'reverted'
                        return (
                          <div key={request.id} className={`border px-5 py-4 shadow-sm ${isReverted ? 'border-slate-300 bg-slate-50/30' : 'border-emerald-200 bg-emerald-50/30'}`}>
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-slate-800">Room {request.room_number}</p>
                                <p className="text-xs text-slate-500">
                                  {formatDateDisplay(request.base_date)} • {formatRequestRange(request, timeSlots)} • {request.week_count} week{request.week_count > 1 ? 's' : ''}
                                </p>
                              </div>
                              <span className={`rounded border px-2 py-1 text-xs font-semibold uppercase tracking-wide ${statusStyle}`}>
                                {ROOM_REQUEST_STATUS_LABELS[request.status]}
                              </span>
                            </div>

                            <div className="mt-3 grid gap-2 text-xs text-slate-600">
                              {request.booked_by && (
                                <div>
                                  <span className="font-semibold text-slate-700">Usage:</span> {request.booked_by}
                                </div>
                              )}
                              {request.course_name && (
                                <div>
                                  <span className="font-semibold text-slate-700">Course/Event:</span> {request.course_name}
                                </div>
                              )}
                              {request.reviewer_name && (
                                <div>
                                  <span className="font-semibold text-slate-700">{isReverted ? 'Reverted by' : 'Approved by'}:</span> {request.reviewer_name}
                                  {request.reviewed_at && ` • ${formatDateDisplay(request.reviewed_at.slice(0, 10))}`}
                                </div>
                              )}
                              {isReverted && request.rejection_reason && (
                                <div className="bg-amber-50 px-3 py-2 rounded border border-amber-200 mt-2">
                                  <span className="font-semibold text-amber-700 block mb-1">Reason for revert:</span>
                                  <span className="text-amber-600">{request.rejection_reason}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                  </section>
                )}

                {/* Rejected Requests */}
                {filteredMyRequests.filter((r) => r.status === 'rejected').length > 0 && (
                  <section className="space-y-4">
                    <header className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-rose-600">Rejected</h3>
                      <span className="text-xs font-medium text-slate-400">
                        {filteredMyRequests.filter((r) => r.status === 'rejected').length} declined
                      </span>
                    </header>

                    {filteredMyRequests
                      .filter((r) => r.status === 'rejected')
                      .map((request) => {
                        const statusStyle = ROOM_REQUEST_STATUS_STYLES[request.status]
                        return (
                          <div key={request.id} className="border border-rose-200 bg-rose-50/30 px-5 py-4 shadow-sm">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-slate-800">Room {request.room_number}</p>
                                <p className="text-xs text-slate-500">
                                  {formatDateDisplay(request.base_date)} • {formatRequestRange(request, timeSlots)} • {request.week_count} week{request.week_count > 1 ? 's' : ''}
                                </p>
                              </div>
                              <span className={`rounded border px-2 py-1 text-xs font-semibold uppercase tracking-wide ${statusStyle}`}>
                                {ROOM_REQUEST_STATUS_LABELS[request.status]}
                              </span>
                            </div>

                            <div className="mt-3 grid gap-2 text-xs text-slate-600">
                              {request.booked_by && (
                                <div>
                                  <span className="font-semibold text-slate-700">Usage:</span> {request.booked_by}
                                </div>
                              )}
                              {request.course_name && (
                                <div>
                                  <span className="font-semibold text-slate-700">Course/Event:</span> {request.course_name}
                                </div>
                              )}
                              {request.reviewer_name && (
                                <div>
                                  <span className="font-semibold text-slate-700">Reviewed by:</span> {request.reviewer_name}
                                  {request.reviewed_at && ` • ${formatDateDisplay(request.reviewed_at.slice(0, 10))}`}
                                </div>
                              )}
                              {request.rejection_reason && (
                                <div className="bg-rose-100/50 px-3 py-2 rounded border border-rose-200 mt-2">
                                  <span className="font-semibold text-rose-700 block mb-1">Reason for rejection:</span>
                                  <span className="text-rose-600">{request.rejection_reason}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                  </section>
                )}
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}

export default MyRequestsPanel

