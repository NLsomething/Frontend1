import { ROOM_REQUEST_STATUS_LABELS, ROOM_REQUEST_STATUS_STYLES } from '../../constants/requests'
import { formatDateDisplay, formatRequestRange, getDefaultDateFilter, getRequestRoomLabel } from '../../utils'
import { COLORS } from '../../constants/colors'

const MyRequestsPanelContent = ({
  myRequests,
  filteredMyRequests,
  myRequestsLoading,
  myRequestsDateFilter,
  onDateFilterChange,
  timeSlots = []
}) => {
  return (
    <div className="flex h-full w-full flex-col" style={{ backgroundColor: COLORS.black }}>
      <style>
        {`
          input[type="date"]::-webkit-calendar-picker-indicator {
            filter: invert(1);
          }
          input[type="date"]::-webkit-inner-spin-button {
            filter: invert(1);
          }
        `}
      </style>
      <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${COLORS.darkGray}` }}>
        <div>
          <h2 className="text-xl font-semibold" style={{ color: COLORS.white }}>My Requests</h2>
          <p className="text-sm" style={{ color: COLORS.whiteTransparentMid }}>View the status of your room requests</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6" style={{ scrollbarWidth: 'thin', scrollbarColor: '#3282B8 #222831' }}>
        {myRequestsLoading ? (
          <div className="flex h-full items-center justify-center text-sm" style={{ color: COLORS.whiteTransparentMid }}>
            Loading your requests…
          </div>
        ) : myRequests.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="px-6 py-12 text-center text-sm max-w-md" style={{ border: `1px dashed ${COLORS.darkGray}`, color: COLORS.whiteTransparentMid }}>
              <p className="font-medium mb-2" style={{ color: COLORS.white }}>No requests yet</p>
              <p className="text-xs" style={{ color: COLORS.whiteTransparentMid }}>Submit a request by clicking on an empty slot in the schedule.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="p-4" style={{ border: '1px solid rgba(238,238,238,0.2)', backgroundColor: COLORS.darkGray }}>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.white }}>Filter by Date</label>
                <button
                  onClick={() => onDateFilterChange && onDateFilterChange(getDefaultDateFilter())}
                  className="text-xs font-medium hover:underline"
                  style={{ color: COLORS.blue }}
                >
                  Reset to Last 7 Days
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium" style={{ color: COLORS.white }}>From</label>
                  <input
                    type="date"
                    value={myRequestsDateFilter.startDate}
                    onChange={(e) => {
                      const v = e.target.value
                      if (!onDateFilterChange) return
                      if (!v) {
                        const t = new Date()
                        const iso = `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`
                        onDateFilterChange({ ...myRequestsDateFilter, startDate: iso })
                      } else {
                        onDateFilterChange({ ...myRequestsDateFilter, startDate: v })
                      }
                    }}
                    className="w-full"
                    style={{ 
                      padding: '6px 8px',
                      border: '1px solid rgba(238, 238, 238, 0.2)',
                      borderRadius: '0px',
                      fontSize: '12px',
                      color: 'rgb(238, 238, 238)',
                      backgroundColor: '#4A5058',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium" style={{ color: COLORS.white }}>To</label>
                  <input
                    type="date"
                    value={myRequestsDateFilter.endDate}
                    onChange={(e) => {
                      const v = e.target.value
                      if (!onDateFilterChange) return
                      if (!v) {
                        const t = new Date()
                        const iso = `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`
                        onDateFilterChange({ ...myRequestsDateFilter, endDate: iso })
                      } else {
                        onDateFilterChange({ ...myRequestsDateFilter, endDate: v })
                      }
                    }}
                    className="w-full"
                    style={{ 
                      padding: '6px 8px',
                      border: '1px solid rgba(238, 238, 238, 0.2)',
                      borderRadius: '0px',
                      fontSize: '12px',
                      color: 'rgb(238, 238, 238)',
                      backgroundColor: '#4A5058',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            </div>

            {filteredMyRequests.filter((r) => r.status === 'pending').length > 0 && (
              <section className="space-y-4">
                <header className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: COLORS.blue }}>Pending</h3>
                  <span className="text-xs font-medium" style={{ color: COLORS.whiteTransparentMid }}>
                    {filteredMyRequests.filter((r) => r.status === 'pending').length} awaiting review
                  </span>
                </header>

                {filteredMyRequests
                  .filter((r) => r.status === 'pending')
                  .map((request) => {
                    const statusStyle = ROOM_REQUEST_STATUS_STYLES[request.status] || ROOM_REQUEST_STATUS_STYLES.pending
                    const roomLabel = getRequestRoomLabel(request)
                    return (
                      <div key={request.id} className="border px-5 py-4 shadow-sm" style={{ border: '1px solid rgba(238,238,238,0.2)', backgroundColor: COLORS.darkGray }}>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold" style={{ color: COLORS.white }}>
                              {request.building_code} {roomLabel}
                            </p>
                            <p className="text-xs" style={{ color: COLORS.whiteTransparentLow }}>
                              {formatDateDisplay(request.base_date)} • {formatRequestRange(request, timeSlots)} • {request.week_count} week{request.week_count > 1 ? 's' : ''}
                            </p>
                          </div>
                          <span 
                            className={`border px-2 py-1 text-xs font-semibold uppercase tracking-wide ${typeof statusStyle === 'string' ? statusStyle : ''}`}
                            style={typeof statusStyle === 'object' ? { ...statusStyle, border: `1px solid ${statusStyle.borderColor}` } : {}}
                          >
                            {ROOM_REQUEST_STATUS_LABELS[request.status]}
                          </span>
                        </div>

                        <div className="mt-3 grid gap-2 text-xs" style={{ color: COLORS.whiteTransparentMid }}>
                          {request.course_name && (
                            <div>
                              <span className="font-semibold" style={{ color: COLORS.white }}>Course/Event:</span> {request.course_name}
                            </div>
                          )}
                          {request.notes && (
                            <div>
                              <span className="font-semibold" style={{ color: COLORS.white }}>Notes:</span> {request.notes}
                            </div>
                          )}
                          <div className="text-xs mt-1" style={{ color: COLORS.whiteTransparentMid }}>
                            Submitted {formatDateDisplay(request.created_at.slice(0, 10))}
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </section>
            )}

            {filteredMyRequests.filter((r) => r.status === 'approved' || r.status === 'reverted').length > 0 && (
              <section className="space-y-4">
                <header className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: '#10b981' }}>Approved & Reverted</h3>
                  <span className="text-xs font-medium" style={{ color: COLORS.whiteTransparentMid }}>
                    {filteredMyRequests.filter((r) => r.status === 'approved' || r.status === 'reverted').length} requests
                  </span>
                </header>

                {filteredMyRequests
                  .filter((r) => r.status === 'approved' || r.status === 'reverted')
                  .map((request) => {
                    const statusStyle = ROOM_REQUEST_STATUS_STYLES[request.status]
                    const isReverted = request.status === 'reverted'
                    const roomLabel = getRequestRoomLabel(request)
                    return (
                      <div key={request.id} className="border px-5 py-4 shadow-sm" style={{ 
                        border: '1px solid rgba(238,238,238,0.2)', 
                        backgroundColor: COLORS.darkGray 
                      }}>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold" style={{ color: COLORS.white }}>
                              {request.building_code} {roomLabel}
                            </p>
                            <p className="text-xs" style={{ color: COLORS.whiteTransparentLow }}>
                              {formatDateDisplay(request.base_date)} • {formatRequestRange(request, timeSlots)} • {request.week_count} week{request.week_count > 1 ? 's' : ''}
                            </p>
                          </div>
                          <span 
                            className={`border px-2 py-1 text-xs font-semibold uppercase tracking-wide ${typeof statusStyle === 'string' ? statusStyle : ''}`}
                            style={typeof statusStyle === 'object' ? { ...statusStyle, border: `1px solid ${statusStyle.borderColor}` } : {}}
                          >
                            {ROOM_REQUEST_STATUS_LABELS[request.status]}
                          </span>
                        </div>

                        <div className="mt-3 grid gap-2 text-xs" style={{ color: COLORS.whiteTransparentMid }}>
                          {request.course_name && (
                            <div>
                              <span className="font-semibold" style={{ color: COLORS.white }}>Course/Event:</span> {request.course_name}
                            </div>
                          )}
                          {request.notes && (
                            <div>
                              <span className="font-semibold" style={{ color: COLORS.white }}>Notes:</span> {request.notes}
                            </div>
                          )}
                          {request.reviewer_name && (
                            <div>
                              <span className="font-semibold" style={{ color: COLORS.white }}>{isReverted ? 'Reverted by' : 'Approved by'}:</span> {request.reviewer_name}
                              {request.reviewed_at && ` • ${formatDateDisplay(request.reviewed_at.slice(0, 10))}`}
                            </div>
                          )}
                          {isReverted && request.rejection_reason && (
                            <div className="px-3 py-2 border mt-2" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: '#f59e0b' }}>
                              <span className="font-semibold block mb-1" style={{ color: '#f59e0b' }}>Reason for revert:</span>
                              <span style={{ color: '#fbbf24' }}>{request.rejection_reason}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
              </section>
            )}

            {filteredMyRequests.filter((r) => r.status === 'rejected').length > 0 && (
              <section className="space-y-4">
                <header className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: '#ef4444' }}>Rejected</h3>
                  <span className="text-xs font-medium" style={{ color: COLORS.whiteTransparentMid }}>
                    {filteredMyRequests.filter((r) => r.status === 'rejected').length} declined
                  </span>
                </header>

                {filteredMyRequests
                  .filter((r) => r.status === 'rejected')
                  .map((request) => {
                    const statusStyle = ROOM_REQUEST_STATUS_STYLES[request.status]
                    const roomLabel = getRequestRoomLabel(request)
                    return (
                      <div key={request.id} className="border px-5 py-4 shadow-sm" style={{ 
                        border: '1px solid rgba(238,238,238,0.2)', 
                        backgroundColor: COLORS.darkGray 
                      }}>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold" style={{ color: COLORS.white }}>
                              {request.building_code} {roomLabel}
                            </p>
                            <p className="text-xs" style={{ color: COLORS.whiteTransparentLow }}>
                              {formatDateDisplay(request.base_date)} • {formatRequestRange(request, timeSlots)} • {request.week_count} week{request.week_count > 1 ? 's' : ''}
                            </p>
                          </div>
                          <span 
                            className={`border px-2 py-1 text-xs font-semibold uppercase tracking-wide ${typeof statusStyle === 'string' ? statusStyle : ''}`}
                            style={typeof statusStyle === 'object' ? { ...statusStyle, border: `1px solid ${statusStyle.borderColor}` } : {}}
                          >
                            {ROOM_REQUEST_STATUS_LABELS[request.status]}
                          </span>
                        </div>

                        <div className="mt-3 grid gap-2 text-xs" style={{ color: COLORS.whiteTransparentMid }}>
                          {request.course_name && (
                            <div>
                              <span className="font-semibold" style={{ color: COLORS.white }}>Course/Event:</span> {request.course_name}
                            </div>
                          )}
                          {request.notes && (
                            <div>
                              <span className="font-semibold" style={{ color: COLORS.white }}>Notes:</span> {request.notes}
                            </div>
                          )}
                          {request.reviewer_name && (
                            <div>
                              <span className="font-semibold" style={{ color: COLORS.white }}>Reviewed by:</span> {request.reviewer_name}
                              {request.reviewed_at && ` • ${formatDateDisplay(request.reviewed_at.slice(0, 10))}`}
                            </div>
                          )}
                          {request.rejection_reason && (
                            <div className="px-3 py-2 border mt-2" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: '#ef4444' }}>
                              <span className="font-semibold block mb-1" style={{ color: '#ef4444' }}>Reason for rejection:</span>
                              <span style={{ color: '#f87171' }}>{request.rejection_reason}</span>
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
  )
}

export default MyRequestsPanelContent
