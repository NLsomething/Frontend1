import { useState } from 'react'
import { ROOM_REQUEST_STATUS_LABELS, ROOM_REQUEST_STATUS_STYLES } from '../../constants/requests'
import { formatDateDisplay, formatRequestRange, getDefaultDateFilter, getRequestRoomLabel } from '../../utils'
import '../../styles/HomePageStyle/MyRequestsPanelStyle.css'

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

const MyRequestsPanelContent = ({
  myRequests = [],
  filteredMyRequests = [],
  myRequestsLoading,
  myRequestsDateFilter,
  onDateFilterChange,
  timeSlots = []
}) => {
  const [statusFilter, setStatusFilter] = useState('all')
  const [buildingFilter, setBuildingFilter] = useState('all')
  
  const activeDateFilter = myRequestsDateFilter || getDefaultDateFilter()

  const buildingCodes = [...new Set(myRequests
    .map(req => req.building_code)
    .filter(code => code)
  )].sort()

  const filterByStatusBuildingAndDate = filteredMyRequests.filter(req => {
    const statusMatch = statusFilter === 'all' || req.status === statusFilter
    const buildingMatch = buildingFilter === 'all' || req.building_code === buildingFilter
    return statusMatch && buildingMatch
  })

  const pendingRequests = filterByStatusBuildingAndDate.filter((request) => request.status === 'pending')
  const approvedOrRevertedRequests = filterByStatusBuildingAndDate.filter((request) => request.status === 'approved' || request.status === 'reverted')
  const rejectedRequests = filterByStatusBuildingAndDate.filter((request) => request.status === 'rejected')

  const handleFilterReset = () => {
    if (!onDateFilterChange) return
    onDateFilterChange(getDefaultDateFilter())
  }

  const handleFilterInputChange = (key) => (event) => {
    if (!onDateFilterChange) return
    const value = event.target.value
    if (!value) {
      const today = new Date()
      onDateFilterChange({ ...activeDateFilter, [key]: toIsoDate(today) })
      return
    }
    onDateFilterChange({ ...activeDateFilter, [key]: value })
  }

  return (
    <div className="mr-panel">
      <div className="mr-content">
        {myRequestsLoading ? (
          <div className="mr-loading">Loading your requests…</div>
        ) : myRequests.length === 0 ? (
          <div className="mr-empty">
            <div className="mr-empty-card">
              <p className="mr-empty-title">No requests yet</p>
              <p className="mr-empty-subtitle">Submit a request by clicking on an empty slot in the schedule.</p>
            </div>
          </div>
        ) : (
          <div className="mr-stack">
            <section className="mr-filter-card">
              <div className="mr-filter-header">
                <span className="mr-filter-label">Filter</span>
                <button
                  type="button"
                  onClick={handleFilterReset}
                  className="mr-filter-button"
                  disabled={!onDateFilterChange}
                >
                  Reset to Last 7 Days
                </button>
              </div>
              <div className="mr-filter-grid">
                <div className="mr-filter-field">
                  <label className="mr-input-label" htmlFor="mr-filter-from">From</label>
                  <input
                    id="mr-filter-from"
                    type="date"
                    value={activeDateFilter.startDate || ''}
                    onChange={handleFilterInputChange('startDate')}
                    className="mr-filter-input"
                  />
                </div>
                <div className="mr-filter-field">
                  <label className="mr-input-label" htmlFor="mr-filter-to">To</label>
                  <input
                    id="mr-filter-to"
                    type="date"
                    value={activeDateFilter.endDate || ''}
                    onChange={handleFilterInputChange('endDate')}
                    className="mr-filter-input"
                  />
                </div>
                <div className="mr-filter-field">
                  <label className="mr-input-label" htmlFor="mr-building-filter">Building</label>
                  <select
                    id="mr-building-filter"
                    value={buildingFilter}
                    onChange={(e) => setBuildingFilter(e.target.value)}
                    className="mr-filter-select"
                  >
                    <option value="all">All</option>
                    {buildingCodes.map(code => (
                      <option key={code} value={code}>{code}</option>
                    ))}
                  </select>
                </div>
                <div className="mr-filter-field">
                  <label className="mr-input-label" htmlFor="mr-status-filter">Status</label>
                  <select
                    id="mr-status-filter"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="mr-filter-select"
                  >
                    <option value="all">All</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="reverted">Reverted</option>
                  </select>
                </div>
              </div>
            </section>

            {pendingRequests.length > 0 && (
              <section className="mr-section">
                <header className="mr-section-header pending">
                  <h3 className="mr-section-title">Pending</h3>
                  <span className="mr-section-count">{pendingRequests.length} awaiting reviews</span>
                </header>
                <div className="mr-card-list">
                  {pendingRequests.map((request) => {
                    const statusStyle = ROOM_REQUEST_STATUS_STYLES[request.status] || ROOM_REQUEST_STATUS_STYLES.pending
                    const roomLabel = getRequestRoomLabel(request)
                    const statusStyles = resolveStatusStyles(statusStyle)
                    return (
                      <div key={request.id} className="mr-card">
                        <div className="mr-card-header">
                          <div className="mr-card-meta">
                            <p className="mr-room">{roomLabel} - {request.building_code}</p>
                            <p className="mr-meta">
                              {formatDateDisplay(request.base_date)} • {formatRequestRange(request, timeSlots)} • {request.week_count}{' '}
                              week{request.week_count > 1 ? 's' : ''}
                            </p>
                          </div>
                          <span className="mr-status-badge" style={statusStyles}>
                            {ROOM_REQUEST_STATUS_LABELS[request.status]}
                          </span>
                        </div>
                        <div className="mr-card-details">
                          {request.course_name && (
                            <div className="mr-detail">
                              <span className="mr-detail-label">Course/Event:</span>
                              <span>{request.course_name}</span>
                            </div>
                          )}
                          {request.notes && (
                            <div className="mr-detail">
                              <span className="mr-detail-label">Notes:</span>
                              <span>{request.notes}</span>
                            </div>
                          )}
                          <div className="mr-submitted">
                            Submitted {formatDateDisplay(request.created_at.slice(0, 10))}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {approvedOrRevertedRequests.length > 0 && (
              <section className="mr-section">
                <header className="mr-section-header approved">
                  <h3 className="mr-section-title">Approved &amp; Reverted</h3>
                  <span className="mr-section-count">{approvedOrRevertedRequests.length} requests</span>
                </header>
                <div className="mr-card-list">
                  {approvedOrRevertedRequests.map((request) => {
                    const statusStyle = ROOM_REQUEST_STATUS_STYLES[request.status]
                    const statusStyles = resolveStatusStyles(statusStyle)
                    const isReverted = request.status === 'reverted'
                    const roomLabel = getRequestRoomLabel(request)
                    return (
                      <div key={request.id} className="mr-card">
                        <div className="mr-card-header">
                          <div className="mr-card-meta">
                            <p className="mr-room">{roomLabel} - {request.building_code}</p>
                            <p className="mr-meta">
                              {formatDateDisplay(request.base_date)} • {formatRequestRange(request, timeSlots)} • {request.week_count}{' '}
                              week{request.week_count > 1 ? 's' : ''}
                            </p>
                          </div>
                          <span className="mr-status-badge" style={statusStyles}>
                            {ROOM_REQUEST_STATUS_LABELS[request.status]}
                          </span>
                        </div>
                        <div className="mr-card-details">
                          {request.course_name && (
                            <div className="mr-detail">
                              <span className="mr-detail-label">Course/Event:</span>
                              <span>{request.course_name}</span>
                            </div>
                          )}
                          {request.notes && (
                            <div className="mr-detail">
                              <span className="mr-detail-label">Notes:</span>
                              <span>{request.notes}</span>
                            </div>
                          )}
                          {request.reviewer_name && (
                            <div className="mr-detail">
                              <span className="mr-detail-label">{isReverted ? 'Reverted by:' : 'Approved by:'}</span>
                              <span>
                                {request.reviewer_name}
                                {request.reviewed_at ? ` • ${formatDateDisplay(request.reviewed_at.slice(0, 10))}` : ''}
                              </span>
                            </div>
                          )}
                          {isReverted && request.rejection_reason && (
                            <div className="mr-reason reverted">
                              <span className="mr-reason-label">Reason for revert:</span>
                              <span className="mr-reason-text">{request.rejection_reason}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {rejectedRequests.length > 0 && (
              <section className="mr-section">
                <header className="mr-section-header rejected">
                  <h3 className="mr-section-title">Rejected</h3>
                  <span className="mr-section-count">{rejectedRequests.length} declined</span>
                </header>
                <div className="mr-card-list">
                  {rejectedRequests.map((request) => {
                    const statusStyle = ROOM_REQUEST_STATUS_STYLES[request.status]
                    const statusStyles = resolveStatusStyles(statusStyle)
                    const roomLabel = getRequestRoomLabel(request)
                    return (
                      <div key={request.id} className="mr-card">
                        <div className="mr-card-header">
                          <div className="mr-card-meta">
                            <p className="mr-room">{roomLabel} - {request.building_code}</p>
                            <p className="mr-meta">
                              {formatDateDisplay(request.base_date)} • {formatRequestRange(request, timeSlots)} • {request.week_count}{' '}
                              week{request.week_count > 1 ? 's' : ''}
                            </p>
                          </div>
                          <span className="mr-status-badge" style={statusStyles}>
                            {ROOM_REQUEST_STATUS_LABELS[request.status]}
                          </span>
                        </div>
                        <div className="mr-card-details">
                          {request.course_name && (
                            <div className="mr-detail">
                              <span className="mr-detail-label">Course/Event:</span>
                              <span>{request.course_name}</span>
                            </div>
                          )}
                          {request.notes && (
                            <div className="mr-detail">
                              <span className="mr-detail-label">Notes:</span>
                              <span>{request.notes}</span>
                            </div>
                          )}
                          {request.reviewer_name && (
                            <div className="mr-detail">
                              <span className="mr-detail-label">Reviewed by:</span>
                              <span>
                                {request.reviewer_name}
                                {request.reviewed_at ? ` • ${formatDateDisplay(request.reviewed_at.slice(0, 10))}` : ''}
                              </span>
                            </div>
                          )}
                          {request.rejection_reason && (
                            <div className="mr-reason rejected">
                              <span className="mr-reason-label">Reason for rejection:</span>
                              <span className="mr-reason-text">{request.rejection_reason}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyRequestsPanelContent
