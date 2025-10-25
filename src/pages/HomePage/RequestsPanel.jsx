import { ROOM_REQUEST_STATUS_LABELS, ROOM_REQUEST_STATUS_STYLES } from '../../constants/requests'
import { formatDateDisplay, formatRequestRange, filterHistoricalRequests, getDefaultDateFilter } from '../../utils'

const RequestsPanel = ({
  isOpen,
  requests,
  pendingRequests,
  historicalRequests,
  requestsLoading,
  historicalDateFilter,
  onClose,
  onDateFilterChange,
  onApprove,
  onReject,
  onRevert
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
          onClick={() => {
            if (requestActionLoading) return
            onClose()
          }}
        />
      )}

      <aside
        className={`absolute top-0 right-0 z-40 h-full w-full max-w-4xl transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        aria-hidden={!isOpen}
      >
        <div className="flex h-full w-full flex-col bg-white/95 backdrop-blur-sm border-l border-slate-200 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Room Requests</h2>
              <p className="text-sm text-slate-500">Review and respond to teacher submissions</p>
            </div>
            <button
              onClick={onClose}
              className="border border-slate-300 px-3 py-1 text-sm font-medium text-slate-600 transition-colors duration-150 hover:bg-slate-100"
            >
              Close
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {requestsLoading ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                Loading requests…
              </div>
            ) : (
              <>
                <section className="space-y-4">
                  <header className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Pending</h3>
                    <span className="text-xs font-medium text-slate-400">{pendingRequests.length} awaiting decision</span>
                  </header>

                  {pendingRequests.length === 0 ? (
                    <div className="rounded border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500">
                      All caught up. No pending requests.
                    </div>
                  ) : (
                    pendingRequests.map((request) => {
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

                          <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                            <div>
                              <span className="font-semibold text-slate-700">Teacher:</span> {request.requester_name || request.requester_email}
                            </div>
                            {request.booked_by && (
                              <div>
                                <span className="font-semibold text-slate-700">Usage:</span> {request.booked_by}
                              </div>
                            )}
                            {request.course_name && (
                              <div className="sm:col-span-2">
                                <span className="font-semibold text-slate-700">Course/Event:</span> {request.course_name}
                              </div>
                            )}
                            {request.notes && (
                              <div className="sm:col-span-2">
                                <span className="font-semibold text-slate-700">Notes:</span> {request.notes}
                              </div>
                            )}
                          </div>

                          <div className="mt-4 space-y-3">
                            <textarea
                              value={rejectionReasons[request.id] || ''}
                              onChange={(event) => setRejectionReasons((prev) => ({ ...prev, [request.id]: event.target.value }))}
                              placeholder="Add a rejection note (optional)"
                              className="w-full border border-slate-300 px-3 py-2 text-sm text-slate-700"
                              rows={2}
                            />

                            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                              <button
                                type="button"
                                onClick={() => onReject(request)}
                                className="border border-rose-400 px-4 py-2 text-sm font-semibold text-rose-500 transition-colors duration-150 hover:bg-rose-50"
                                disabled={requestActionLoading}
                              >
                                {requestActionLoading ? 'Working…' : 'Reject'}
                              </button>
                              <button
                                type="button"
                                onClick={() => onApprove(request)}
                                className="bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700"
                                disabled={requestActionLoading}
                              >
                                {requestActionLoading ? 'Working…' : 'Approve'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </section>

                <section className="space-y-4">
                  <header className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Recent decisions</h3>
                    <span className="text-xs font-medium text-slate-400">Showing last {historicalRequests.length}</span>
                  </header>

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
                          value={historicalDateFilter.startDate}
                          onChange={(e) => onDateFilterChange && onDateFilterChange({ ...historicalDateFilter, startDate: e.target.value })}
                          className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">To</label>
                        <input
                          type="date"
                          value={historicalDateFilter.endDate}
                          onChange={(e) => onDateFilterChange && onDateFilterChange({ ...historicalDateFilter, endDate: e.target.value })}
                          className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {historicalRequests.length === 0 ? (
                    <div className="rounded border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500">
                      No decisions found for the selected date range.
                    </div>
                  ) : (
                    historicalRequests.map((request) => {
                      const statusStyle = ROOM_REQUEST_STATUS_STYLES[request.status] || ROOM_REQUEST_STATUS_STYLES.pending
                      const canRevert = request.status === 'approved'
                      
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

                          <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                            <div>
                              <span className="font-semibold text-slate-700">Teacher:</span> {request.requester_name || request.requester_email}
                            </div>
                            {request.booked_by && (
                              <div>
                                <span className="font-semibold text-slate-700">Usage:</span> {request.booked_by}
                              </div>
                            )}
                            {request.course_name && (
                              <div className="sm:col-span-2">
                                <span className="font-semibold text-slate-700">Course/Event:</span> {request.course_name}
                              </div>
                            )}
                            {request.reviewer_name && (
                              <div>
                                <span className="font-semibold text-slate-700">Reviewed by:</span> {request.reviewer_name} {request.reviewed_at ? `• ${formatDateDisplay(request.reviewed_at.slice(0, 10))}` : ''}
                              </div>
                            )}
                            {request.rejection_reason && (
                              <div className="sm:col-span-2">
                                <span className="font-semibold text-slate-700">Reason:</span> {request.rejection_reason}
                              </div>
                            )}
                          </div>

                          {canRevert && (
                            <div className="mt-4 space-y-2">
                              <label htmlFor={`revert-reason-${request.id}`} className="block text-xs font-semibold text-slate-700">
                                Reason for reverting (optional)
                              </label>
                              <textarea
                                id={`revert-reason-${request.id}`}
                                rows={2}
                                placeholder="Explain why this approval is being reverted..."
                                value={rejectionReasons[request.id] || ''}
                                onChange={(event) => setRejectionReasons((prev) => ({ ...prev, [request.id]: event.target.value }))}
                                className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                              />
                              <div className="flex justify-end">
                                <button
                                  onClick={() => onRevert(request)}
                                  disabled={requestActionLoading}
                                  className="rounded border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  Revert Approval
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </section>
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}

export default RequestsPanel

