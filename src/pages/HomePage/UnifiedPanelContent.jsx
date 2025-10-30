import { useState, useEffect } from 'react'
import BuildingSidebar from '../../components/BuildingInfo/BuildingSidebar'
import { ROOM_REQUEST_STATUS_LABELS, ROOM_REQUEST_STATUS_STYLES } from '../../constants/requests'
import { formatDateDisplay, formatRequestRange, getDefaultDateFilter } from '../../utils'
import { COLORS } from '../../constants/colors'

// Requests Panel Content
export const RequestsPanelContent = ({
  pendingRequests,
  historicalRequests,
  requestsLoading,
  historicalDateFilter,
  rejectionReasons,
  setRejectionReasons,
  requestActionLoading,
  onDateFilterChange,
  onApprove,
  onReject,
  onRevert
}) => {
  const [showingRejectField, setShowingRejectField] = useState(null)
  const [showingRevertField, setShowingRevertField] = useState(null)

  const handleRejectClick = (request) => {
    if (showingRejectField === request.id) {
      if (window.confirm(`Are you sure you want to reject the request for Room ${request.room_number}?`)) {
        onReject(request)
        setShowingRejectField(null)
      }
    } else {
      setShowingRejectField(request.id)
    }
  }

  const handleRevertClick = (request) => {
    if (showingRevertField === request.id) {
      onRevert(request)
      setShowingRevertField(null)
    } else {
      setShowingRevertField(request.id)
    }
  }

  // Generate time slots
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
          <h2 className="text-xl font-semibold" style={{ color: COLORS.white }}>Room Requests</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6" style={{ scrollbarWidth: 'thin', scrollbarColor: '#3282B8 #222831' }}>
        {requestsLoading ? (
          <div className="flex h-full items-center justify-center text-sm" style={{ color: COLORS.whiteTransparentMid }}>
            Loading requests…
          </div>
        ) : (
          <>
            <section className="space-y-4">
              <header className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: COLORS.blue }}>Pending</h3>
                <span className="text-xs font-medium" style={{ color: COLORS.whiteTransparentMid }}>{pendingRequests.length} awaiting decision</span>
              </header>

              {pendingRequests.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm" style={{ border: `1px dashed ${COLORS.darkGray}`, color: COLORS.whiteTransparentMid }}>
                  All caught up. No pending requests.
                </div>
              ) : (
                pendingRequests.map((request) => {
                  const statusStyle = ROOM_REQUEST_STATUS_STYLES[request.status] || ROOM_REQUEST_STATUS_STYLES.pending
                  return (
                    <div key={request.id} className="rounded border px-5 py-4 shadow-sm" style={{ border: '1px solid rgba(238,238,238,0.2)', backgroundColor: COLORS.darkGray }}>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold" style={{ color: COLORS.white }}>{request.building_code} - Room {request.room_number}</p>
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

                      <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2" style={{ color: COLORS.whiteTransparentMid }}>
                        <div>
                          <span className="font-semibold" style={{ color: COLORS.white }}>Teacher:</span> {request.requester_name || request.requester_email}
                        </div>
                        {request.course_name && (
                          <div className="sm:col-span-2">
                            <span className="font-semibold" style={{ color: COLORS.white }}>Course/Event:</span> {request.course_name}
                          </div>
                        )}
                        {request.notes && (
                          <div className="sm:col-span-2">
                            <span className="font-semibold" style={{ color: COLORS.white }}>Notes:</span> {request.notes}
                          </div>
                        )}
                      </div>

                      <div className="mt-4 space-y-3">
                        {showingRejectField === request.id && (
                          <textarea
                            value={rejectionReasons[request.id] || ''}
                            onChange={(event) => setRejectionReasons((prev) => ({ ...prev, [request.id]: event.target.value }))}
                            placeholder="Add a rejection note (optional)"
                            className="w-full px-3 py-2 text-sm"
                            style={{ 
                              borderColor: '#4A5058', 
                              backgroundColor: '#4A5058',
                              color: COLORS.white,
                              border: '1px solid #4A5058',
                              borderRadius: 0
                            }}
                            rows={2}
                          />
                        )}

                        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                          <button
                            type="button"
                            onClick={() => handleRejectClick(request)}
                            className="px-4 py-2 text-sm font-semibold transition-colors duration-150"
                            style={{ 
                              border: '1px solid rgba(238,238,238,0.2)',
                              color: '#FFFFFF',
                              backgroundColor: '#ef4444'
                            }}
                            disabled={requestActionLoading}
                          >
                            {requestActionLoading ? 'Working…' : 'Reject'}
                          </button>
                          <button
                            type="button"
                            onClick={() => onApprove(request)}
                            className="px-4 py-2 text-sm font-semibold shadow transition-colors"
                            style={{ 
                              backgroundColor: COLORS.blue,
                              color: COLORS.white,
                              border: '1px solid transparent'
                            }}
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
                <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: COLORS.blue }}>Recent decisions</h3>
                <span className="text-xs font-medium" style={{ color: COLORS.whiteTransparentMid }}>Showing last {historicalRequests.length}</span>
              </header>

              {/* Date Filter */}
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
                      value={historicalDateFilter.startDate}
                      onChange={(e) => onDateFilterChange && onDateFilterChange({ ...historicalDateFilter, startDate: e.target.value })}
                      className="w-full"
                      style={{ 
                        padding: '6px 8px',
                        border: '1px solid rgba(238, 238, 238, 0.2)',
                        borderRadius: '4px',
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
                      value={historicalDateFilter.endDate}
                      onChange={(e) => onDateFilterChange && onDateFilterChange({ ...historicalDateFilter, endDate: e.target.value })}
                      className="w-full"
                      style={{ 
                        padding: '6px 8px',
                        border: '1px solid rgba(238, 238, 238, 0.2)',
                        borderRadius: '4px',
                        fontSize: '12px',
                        color: 'rgb(238, 238, 238)',
                        backgroundColor: '#4A5058',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              </div>

              {historicalRequests.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm" style={{ border: `1px dashed ${COLORS.darkGray}`, color: COLORS.whiteTransparentMid }}>
                  No decisions found for the selected date range.
                </div>
              ) : (
                historicalRequests.map((request) => {
                  const statusStyle = ROOM_REQUEST_STATUS_STYLES[request.status] || ROOM_REQUEST_STATUS_STYLES.pending
                  const canRevert = request.status === 'approved'
                  
                  return (
                    <div key={request.id} className="rounded border px-5 py-4 shadow-sm" style={{ border: '1px solid rgba(238,238,238,0.2)', backgroundColor: COLORS.darkGray }}>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold" style={{ color: COLORS.white }}>{request.building_code} - Room {request.room_number}</p>
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

                      <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2" style={{ color: COLORS.whiteTransparentMid }}>
                        <div>
                          <span className="font-semibold" style={{ color: COLORS.white }}>Teacher:</span> {request.requester_name || request.requester_email}
                        </div>
                        {request.course_name && (
                          <div className="sm:col-span-2">
                            <span className="font-semibold" style={{ color: COLORS.white }}>Course/Event:</span> {request.course_name}
                          </div>
                        )}
                        {request.notes && (
                          <div className="sm:col-span-2">
                            <span className="font-semibold" style={{ color: COLORS.white }}>Notes:</span> {request.notes}
                          </div>
                        )}
                        {request.reviewer_name && (
                          <div className="sm:col-span-2">
                            <span className="font-semibold" style={{ color: COLORS.white }}>Reviewed by:</span> {request.reviewer_name} {request.reviewed_at ? `• ${formatDateDisplay(request.reviewed_at.slice(0, 10))}` : ''}
                          </div>
                        )}
                        {request.rejection_reason && (
                          <div className="sm:col-span-2">
                            <span className="font-semibold" style={{ color: COLORS.white }}>Reason:</span> {request.rejection_reason}
                          </div>
                        )}
                      </div>

                      {canRevert && (
                        <div className="mt-4 space-y-2">
                          {showingRevertField === request.id && (
                            <>
                              <label htmlFor={`revert-reason-${request.id}`} className="block text-xs font-semibold" style={{ color: COLORS.white }}>
                                Reason for reverting (optional)
                              </label>
                              <textarea
                                id={`revert-reason-${request.id}`}
                                rows={2}
                                placeholder="Explain why this approval is being reverted..."
                                value={rejectionReasons[request.id] || ''}
                                onChange={(event) => setRejectionReasons((prev) => ({ ...prev, [request.id]: event.target.value }))}
                                className="w-full px-3 py-2 text-sm"
                                style={{ 
                                  borderColor: '#4A5058',
                                  backgroundColor: '#4A5058',
                                  color: COLORS.white,
                                  border: '1px solid #4A5058'
                                }}
                              />
                            </>
                          )}
                          <div className="flex justify-end">
                            <button
                              onClick={() => handleRevertClick(request)}
                              disabled={requestActionLoading}
                              className="px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
                              style={{ 
                                border: '1px solid rgba(238,238,238,0.2)',
                                color: '#FFFFFF',
                                backgroundColor: '#f59e0b'
                              }}
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
  )
}

// My Requests Panel Content
export const MyRequestsPanelContent = ({
  myRequests,
  filteredMyRequests,
  myRequestsLoading,
  myRequestsDateFilter,
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
            {/* Date Filter */}
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
                    onChange={(e) => onDateFilterChange && onDateFilterChange({ ...myRequestsDateFilter, startDate: e.target.value })}
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
                    onChange={(e) => onDateFilterChange && onDateFilterChange({ ...myRequestsDateFilter, endDate: e.target.value })}
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

            {/* Pending Requests */}
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
                    return (
                      <div key={request.id} className="border px-5 py-4 shadow-sm" style={{ border: '1px solid rgba(238,238,238,0.2)', backgroundColor: COLORS.darkGray }}>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold" style={{ color: COLORS.white }}>{request.building_code} - Room {request.room_number}</p>
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

            {/* Approved & Reverted Requests */}
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
                    return (
                      <div key={request.id} className="border px-5 py-4 shadow-sm" style={{ 
                        border: '1px solid rgba(238,238,238,0.2)', 
                        backgroundColor: COLORS.darkGray 
                      }}>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold" style={{ color: COLORS.white }}>{request.building_code} - Room {request.room_number}</p>
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

            {/* Rejected Requests */}
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
                    return (
                      <div key={request.id} className="border px-5 py-4 shadow-sm" style={{ 
                        border: '1px solid rgba(238,238,238,0.2)', 
                        backgroundColor: COLORS.darkGray 
                      }}>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold" style={{ color: COLORS.white }}>{request.building_code} - Room {request.room_number}</p>
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

