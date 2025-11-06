import { useState } from 'react'
import { ROOM_REQUEST_STATUS_LABELS, ROOM_REQUEST_STATUS_STYLES } from '../../constants/requests'
import { formatDateDisplay, formatRequestRange, getDefaultDateFilter, getRequestRoomLabel } from '../../utils'
import '../../styles/HomePageStyle/RequestsPanelStyle.css'

const toIsoDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const resolveStatusStyles = (statusStyle) => {
  if (!statusStyle || typeof statusStyle !== 'object') return undefined
  const styles = {}
  if (statusStyle.backgroundColor) styles.backgroundColor = statusStyle.backgroundColor
  if (statusStyle.color) styles.color = statusStyle.color
  if (statusStyle.borderColor) styles.borderColor = statusStyle.borderColor
  return styles
}

const RequestsPanelContent = ({
  pendingRequests = [],
  historicalRequests = [],
  requestsLoading,
  historicalDateFilter,
  rejectionReasons = {},
  setRejectionReasons,
  requestActionLoading,
  onDateFilterChange,
  onApprove,
  onReject,
  onRevert,
  timeSlots = []
}) => {
  const [showingRejectField, setShowingRejectField] = useState(null)
  const [showingRevertField, setShowingRevertField] = useState(null)

  const activeHistoricalFilter = historicalDateFilter || getDefaultDateFilter()
  const pendingCount = pendingRequests.length
  const historicalCount = historicalRequests.length

  const updateReason = (id, value) => {
    if (typeof setRejectionReasons !== 'function') return
    setRejectionReasons((previous = {}) => ({ ...previous, [id]: value }))
  }

  const getReasonValue = (id) => rejectionReasons[id] || ''

  const handleRejectClick = (request) => {
    if (showingRejectField === request.id) {
      if (typeof onReject !== 'function') return
      const confirmMessage = `Are you sure you want to reject the request for Room ${request.room_number}?`
      if (typeof window === 'undefined' || window.confirm(confirmMessage)) {
        onReject(request)
        setShowingRejectField(null)
        if (Array.isArray(timeSlots)) {
          timeSlots.forEach((slot) => {
            if (slot && typeof slot === 'object') {
              slot.selected = false
            }
          })
        }
      }
    } else {
      setShowingRejectField(request.id)
    }
  }

  const handleRevertClick = (request) => {
    if (showingRevertField === request.id) {
      if (typeof onRevert !== 'function') return
      onRevert(request)
      setShowingRevertField(null)
    } else {
      setShowingRevertField(request.id)
    }
  }

  const handleHistoryReset = () => {
    if (typeof onDateFilterChange === 'function') {
      onDateFilterChange(getDefaultDateFilter())
    }
  }

  const handleHistoryInputChange = (key) => (event) => {
    if (typeof onDateFilterChange !== 'function') return
    const value = event.target.value
    if (!value) {
      const today = new Date()
      onDateFilterChange({ ...activeHistoricalFilter, [key]: toIsoDate(today) })
      return
    }
    onDateFilterChange({ ...activeHistoricalFilter, [key]: value })
  }

  return (
    <div className="rq-panel">
      <div className="rq-header">
        <h2 className="rq-title">Room Requests</h2>
      </div>

      <div className="rq-content">
        {requestsLoading ? (
          <div className="rq-loading">Loading requests…</div>
        ) : (
          <div className="rq-stack">
            <section className="rq-section">
              <header className="rq-section-header" data-status="pending">
                <h3 className="rq-section-title">Pending</h3>
                <span className="rq-section-count">{pendingCount} awaiting decision</span>
              </header>

              {pendingCount === 0 ? (
                <div className="rq-empty-card">All caught up. No pending requests.</div>
              ) : (
                <div className="rq-card-list">
                  {pendingRequests.map((request) => {
                    const statusStyle = ROOM_REQUEST_STATUS_STYLES[request.status] || ROOM_REQUEST_STATUS_STYLES.pending
                    const roomLabel = getRequestRoomLabel(request)
                    const statusStyles = resolveStatusStyles(statusStyle)

                    return (
                      <article key={request.id} className="rq-card">
                        <div className="rq-card-header">
                          <div className="rq-card-meta">
                            <p className="rq-card-title">{request.building_code} {roomLabel}</p>
                            <p className="rq-card-subtitle">
                              {formatDateDisplay(request.base_date)} • {formatRequestRange(request, timeSlots)} • {request.week_count} week
                              {request.week_count > 1 ? 's' : ''}
                            </p>
                          </div>
                          <span className="rq-status-badge" style={statusStyles}>
                            {ROOM_REQUEST_STATUS_LABELS[request.status]}
                          </span>
                        </div>

                        <div className="rq-meta-grid">
                          <div className="rq-meta-entry">
                            <span className="rq-meta-label">Teacher:</span>
                            <span>{request.requester_name || request.requester_email}</span>
                          </div>
                          {request.course_name && (
                            <div className="rq-meta-entry" data-span="full">
                              <span className="rq-meta-label">Course/Event:</span>
                              <span>{request.course_name}</span>
                            </div>
                          )}
                          {request.notes && (
                            <div className="rq-meta-entry" data-span="full">
                              <span className="rq-meta-label">Notes:</span>
                              <span>{request.notes}</span>
                            </div>
                          )}
                        </div>

                        <div className="rq-card-actions">
                          {showingRejectField === request.id && (
                            <textarea
                              value={getReasonValue(request.id)}
                              onChange={(event) => updateReason(request.id, event.target.value)}
                              placeholder="Add a rejection note (optional)"
                              className="rq-textarea"
                              rows={2}
                            />
                          )}
                          <div className="rq-button-row">
                            <button
                              type="button"
                              onClick={() => handleRejectClick(request)}
                              className="rq-button"
                              data-variant="reject"
                              disabled={requestActionLoading}
                            >
                              {requestActionLoading ? 'Working…' : 'Reject'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (typeof onApprove === 'function') {
                                  onApprove(request)
                                }
                              }}
                              className="rq-button"
                              data-variant="approve"
                              disabled={requestActionLoading}
                            >
                              {requestActionLoading ? 'Working…' : 'Approve'}
                            </button>
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </section>

            <section className="rq-section">
              <header className="rq-section-header" data-status="history">
                <h3 className="rq-section-title">Recent decisions</h3>
                <span className="rq-history-count">Showing last {historicalCount}</span>
              </header>

              <div className="rq-filter-card">
                <div className="rq-filter-header">
                  <span className="rq-filter-label">Filter by Date</span>
                  <button
                    type="button"
                    onClick={handleHistoryReset}
                    className="rq-filter-button"
                    disabled={typeof onDateFilterChange !== 'function'}
                  >
                    Reset to Last 7 Days
                  </button>
                </div>
                <div className="rq-filter-grid">
                  <div className="rq-filter-field">
                    <label className="rq-input-label" htmlFor="rq-history-from">From</label>
                    <input
                      id="rq-history-from"
                      type="date"
                      value={activeHistoricalFilter.startDate || ''}
                      onChange={handleHistoryInputChange('startDate')}
                      className="rq-filter-input"
                    />
                  </div>
                  <div className="rq-filter-field">
                    <label className="rq-input-label" htmlFor="rq-history-to">To</label>
                    <input
                      id="rq-history-to"
                      type="date"
                      value={activeHistoricalFilter.endDate || ''}
                      onChange={handleHistoryInputChange('endDate')}
                      className="rq-filter-input"
                    />
                  </div>
                </div>
              </div>

              {historicalCount === 0 ? (
                <div className="rq-empty-card">No decisions found for the selected date range.</div>
              ) : (
                <div className="rq-card-list">
                  {historicalRequests.map((request) => {
                    const statusStyle = ROOM_REQUEST_STATUS_STYLES[request.status] || ROOM_REQUEST_STATUS_STYLES.pending
                    const statusStyles = resolveStatusStyles(statusStyle)
                    const canRevert = request.status === 'approved'
                    const roomLabel = getRequestRoomLabel(request)

                    return (
                      <article key={request.id} className="rq-card">
                        <div className="rq-card-header">
                          <div className="rq-card-meta">
                            <p className="rq-card-title">{request.building_code} {roomLabel}</p>
                            <p className="rq-card-subtitle">
                              {formatDateDisplay(request.base_date)} • {formatRequestRange(request, timeSlots)} • {request.week_count} week
                              {request.week_count > 1 ? 's' : ''}
                            </p>
                          </div>
                          <span className="rq-status-badge" style={statusStyles}>
                            {ROOM_REQUEST_STATUS_LABELS[request.status]}
                          </span>
                        </div>

                        <div className="rq-meta-grid">
                          <div className="rq-meta-entry">
                            <span className="rq-meta-label">Teacher:</span>
                            <span>{request.requester_name || request.requester_email}</span>
                          </div>
                          {request.course_name && (
                            <div className="rq-meta-entry" data-span="full">
                              <span className="rq-meta-label">Course/Event:</span>
                              <span>{request.course_name}</span>
                            </div>
                          )}
                          {request.notes && (
                            <div className="rq-meta-entry" data-span="full">
                              <span className="rq-meta-label">Notes:</span>
                              <span>{request.notes}</span>
                            </div>
                          )}
                          {request.reviewer_name && (
                            <div className="rq-meta-entry" data-span="full">
                              <span className="rq-meta-label">Reviewed by:</span>
                              <span>
                                {request.reviewer_name}
                                {request.reviewed_at ? ` • ${formatDateDisplay(request.reviewed_at.slice(0, 10))}` : ''}
                              </span>
                            </div>
                          )}
                          {request.rejection_reason && (
                            <div className="rq-meta-entry" data-span="full">
                              <span className="rq-meta-label">Reason:</span>
                              <span>{request.rejection_reason}</span>
                            </div>
                          )}
                        </div>

                        {canRevert && (
                          <div className="rq-card-actions">
                            {showingRevertField === request.id && (
                              <div className="rq-revert-actions">
                                <label htmlFor={`rq-revert-reason-${request.id}`} className="rq-revert-label">
                                  Reason for reverting (optional)
                                </label>
                                <textarea
                                  id={`rq-revert-reason-${request.id}`}
                                  rows={2}
                                  placeholder="Explain why this approval is being reverted..."
                                  value={getReasonValue(request.id)}
                                  onChange={(event) => updateReason(request.id, event.target.value)}
                                  className="rq-textarea"
                                />
                              </div>
                            )}
                            <div className="rq-button-row">
                              <button
                                type="button"
                                onClick={() => handleRevertClick(request)}
                                disabled={requestActionLoading}
                                className="rq-button"
                                data-variant="revert"
                              >
                                Revert Approval
                              </button>
                            </div>
                          </div>
                        )}
                      </article>
                    )
                  })}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  )
}

export default RequestsPanelContent
