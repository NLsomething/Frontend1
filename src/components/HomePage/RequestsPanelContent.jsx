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
  const [statusFilter, setStatusFilter] = useState('all')
  const [buildingFilter, setBuildingFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')

  const activeHistoricalFilter = historicalDateFilter || getDefaultDateFilter()
  
  const allRequests = [...pendingRequests, ...historicalRequests]
  
  const buildingCodes = [...new Set(allRequests
    .map(req => req.building_code)
    .filter(code => code)
  )].sort()
  
  const filteredPendingRequests = pendingRequests.filter(req => {
    const statusMatch = statusFilter === 'all' || req.status === statusFilter
    const buildingMatch = buildingFilter === 'all' || req.building_code === buildingFilter
    const roleMatch = roleFilter === 'all' || req.requester_role === roleFilter
    return statusMatch && buildingMatch && roleMatch
  })
  const pendingCount = filteredPendingRequests.length
  
  const filteredHistoricalRequests = historicalRequests.filter(req => {
    const statusMatch = statusFilter === 'all' || req.status === statusFilter
    const buildingMatch = buildingFilter === 'all' || req.building_code === buildingFilter
    const roleMatch = roleFilter === 'all' || req.requester_role === roleFilter
    return statusMatch && buildingMatch && roleMatch
  })
  const historicalCount = filteredHistoricalRequests.length

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

  const handleFilterReset = () => {
    setStatusFilter('all')
    setBuildingFilter('all')
    setRoleFilter('all')
    if (typeof onDateFilterChange === 'function') {
      onDateFilterChange(getDefaultDateFilter())
    }
  }

  return (
    <div className="rq-panel">
      <div className="rq-content">
        {requestsLoading ? (
          <div className="rq-loading">Loading requests…</div>
        ) : (
          <div className="rq-stack">
            <div className="rq-filter-card rq-top-filter">
              <div className="rq-filter-header">
                <span className="rq-filter-label">Filter</span>
                <button
                  type="button"
                  onClick={handleFilterReset}
                  className="rq-filter-button"
                >
                  Reset All
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
                <div className="rq-filter-field">
                  <label className="rq-input-label" htmlFor="rq-building-filter">Building</label>
                  <select
                    id="rq-building-filter"
                    value={buildingFilter}
                    onChange={(e) => setBuildingFilter(e.target.value)}
                    className="rq-filter-select"
                  >
                    <option value="all">All</option>
                    {buildingCodes.map(code => (
                      <option key={code} value={code}>{code}</option>
                    ))}
                  </select>
                </div>
                <div className="rq-filter-field">
                  <label className="rq-input-label" htmlFor="rq-role-filter">Role</label>
                  <select
                    id="rq-role-filter"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="rq-filter-select"
                  >
                    <option value="all">All</option>
                    <option value="teacher">Teacher</option>
                    <option value="student">Student</option>
                  </select>
                </div>
                <div className="rq-filter-field">
                  <label className="rq-input-label" htmlFor="rq-status-filter">Status</label>
                  <select
                    id="rq-status-filter"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rq-filter-select"
                  >
                    <option value="all">All</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="reverted">Reverted</option>
                  </select>
                </div>
              </div>
            </div>

            <section className="rq-section">
              <header className="rq-section-header pending">
                <h3 className="rq-section-title">Pending</h3>
                <span className="rq-section-count">{pendingCount} awaiting decision</span>
              </header>

              {pendingCount === 0 ? (
                <div className="rq-empty-card">All caught up. No pending requests.</div>
              ) : (
                <div className="rq-card-list">
                  {filteredPendingRequests.map((request) => {
                    const statusStyle = ROOM_REQUEST_STATUS_STYLES[request.status] || ROOM_REQUEST_STATUS_STYLES.pending
                    const roomLabel = getRequestRoomLabel(request)
                    const statusStyles = resolveStatusStyles(statusStyle)

                    return (
                      <article key={request.id} className="rq-card">
                        <div className="rq-card-header">
                          <div className="rq-card-meta">
                            <p className="rq-card-title">{roomLabel} - {request.building_code}</p>
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
                          <div className="rq-meta-entry full">
                            <div className="rq-meta-column">
                              <div>
                                <span className="rq-meta-label">Name:</span>
                                <span>{request.requester_name || request.requester_email}</span>
                              </div>
                              {request.requester_role && (
                                <div style={{ marginTop: '4px' }}>
                                  <span className="rq-meta-label">Role:</span>
                                  <span> {request.requester_role}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          {request.course_name && (
                            <div className="rq-meta-entry full">
                              <span className="rq-meta-label">Course/Event:</span>
                              <span>{request.course_name}</span>
                            </div>
                          )}
                          {request.notes && (
                            <div className="rq-meta-entry full">
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
                              className="rq-button reject"
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
                              className="rq-button approve"
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
              <header className="rq-section-header history">
                <h3 className="rq-section-title">Recent decisions</h3>
                <span className="rq-history-count">Showing last {historicalCount}</span>
              </header>

              {historicalCount === 0 ? (
                <div className="rq-empty-card">No decisions found for the selected filters.</div>
              ) : (
                <div className="rq-card-list">
                  {filteredHistoricalRequests.map((request) => {
                    const statusStyle = ROOM_REQUEST_STATUS_STYLES[request.status] || ROOM_REQUEST_STATUS_STYLES.pending
                    const statusStyles = resolveStatusStyles(statusStyle)
                    const canRevert = request.status === 'approved'
                    const roomLabel = getRequestRoomLabel(request)

                    return (
                      <article key={request.id} className="rq-card">
                        <div className="rq-card-header">
                          <div className="rq-card-meta">
                            <p className="rq-card-title">{roomLabel} - {request.building_code}</p>
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
                          <div className="rq-meta-entry full">
                            <div className="rq-meta-column">
                              <div>
                                <span className="rq-meta-label">Name:</span>
                                <span>{request.requester_name || request.requester_email}</span>
                              </div>
                              {request.requester_role && (
                                <div style={{ marginTop: '4px' }}>
                                  <span className="rq-meta-label">Role:</span>
                                  <span> {request.requester_role}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          {request.course_name && (
                            <div className="rq-meta-entry full">
                              <span className="rq-meta-label">Course/Event:</span>
                              <span>{request.course_name}</span>
                            </div>
                          )}
                          {request.notes && (
                            <div className="rq-meta-entry full">
                              <span className="rq-meta-label">Notes:</span>
                              <span>{request.notes}</span>
                            </div>
                          )}
                          {request.reviewer_name && (
                            <div className="rq-meta-entry full">
                              <span className="rq-meta-label">Reviewed by:</span>
                              <span>
                                {request.reviewer_name}
                                {request.reviewed_at ? ` • ${formatDateDisplay(request.reviewed_at.slice(0, 10))}` : ''}
                              </span>
                            </div>
                          )}
                          {request.rejection_reason && (
                            <div className="rq-meta-entry full">
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
                                className="rq-button revert"
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
