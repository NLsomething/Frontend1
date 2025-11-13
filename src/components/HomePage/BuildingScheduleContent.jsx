import { Fragment, useMemo, useState, useEffect } from 'react'
import { SCHEDULE_STATUS, SCHEDULE_STATUS_LABELS } from '../../constants/schedule'
import '../../styles/HomePageStyle/BuildingScheduleStyle.css'
import { useHomePageStore, selectScheduleSlice } from '../../stores/useHomePageStore'
import { fetchRoomRequests } from '../../services/roomRequestService'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationContext'

const resolveRoomCode = (room) => {
	if (!room || typeof room === 'string') {
		return room || ''
	}
	return room.room_code || room.roomNumber || room.room_number || room.code || ''
}

const resolveRoomLabel = (room) => {
	if (!room) return ''
	if (typeof room === 'string') return room
	return room.room_name || room.name || room.displayName || room.room_code || room.roomNumber || ''
}

const resolveRoomKey = (room, index) => {
	if (!room) return `room-${index}`
	if (typeof room === 'string') return room
	return room.id || room.room_code || room.roomNumber || `room-${index}`
}

const resolveSlotKey = (slot) => {
	return slot.key ?? slot.id ?? slot.slot_id ?? slot.slotId ?? slot.hour ?? slot.slot_order ?? slot.label
}

const resolveSlotLabel = (slot) => {
	return slot.label || slot.slot_name || slot.name || resolveSlotKey(slot)
}

const resolveSlotType = (slot) => {
	return (slot.slotType || slot.slot_type || slot.type || '').toLowerCase()
}

const BuildingScheduleContent = ({
	selectedBuilding,
	buildingRooms = [],
	buildingRoomsLoading,
	roomsByFloor = [],
	scheduleDate,
	setScheduleDate,
	timeSlots = [],
	onCellClick,
	canEdit,
	canRequest
}) => {
	const { scheduleMap, scheduleLoading } = useHomePageStore(selectScheduleSlice)
	const [activeSlotCategory, setActiveSlotCategory] = useState('classroom')

	const normalizedSlots = useMemo(() => {
		if (!Array.isArray(timeSlots)) return []

		return timeSlots.map((slot, index) => {
			const slotType = (slot.slotType || slot.slot_type || slot.type || 'classroom').toLowerCase()
			const baseLabel = slot.displayLabel || slot.label || slot.slot_name || slot.name || `Slot ${index + 1}`
			const resolvedId = slot.id ?? slot.timeslot_id ?? slot.slot_id ?? slot.slotId ?? slot.hour ?? slot.slot_order ?? `${slotType}-${index}`
			const key = resolvedId

			return {
				...slot,
				slotType,
				displayLabel: baseLabel,
				key,
				hour: resolvedId
			}
		})
	}, [timeSlots])

	const filteredSlots = useMemo(() => {
		const matching = normalizedSlots.filter((slot) => slot.slotType === activeSlotCategory)
		return matching.length > 0 ? matching : normalizedSlots
	}, [normalizedSlots, activeSlotCategory])

	const currentRoomType = useMemo(() => {
		return activeSlotCategory === 'administrative' ? 'administrative' : 'classroom'
	}, [activeSlotCategory])

	const hasScheduleEntries = useMemo(() => {
		if (!scheduleMap || typeof scheduleMap !== 'object') {
			return false
		}
		return Object.keys(scheduleMap).length > 0
	}, [scheduleMap])

	const shouldShowScheduleLoading = scheduleLoading && !hasScheduleEntries

	const hasRooms = buildingRooms.length > 0
	const roomSubtitle = hasRooms
		? `${buildingRooms.length} Classroom${buildingRooms.length !== 1 ? 's' : ''}`
		: (buildingRoomsLoading ? '' : 'No classrooms found')

	const showRoomsLoadingPlaceholder = buildingRoomsLoading && !hasRooms

	const formatLocalDate = (date) => {
		const year = date.getFullYear()
		const month = String(date.getMonth() + 1).padStart(2, '0')
		const day = String(date.getDate()).padStart(2, '0')
		return `${year}-${month}-${day}`
	}

	const isoDate = scheduleDate ? formatLocalDate(scheduleDate) : ''

	const handleDateChange = (dateString) => {
		if (setScheduleDate) {
			if (!dateString) {
				const today = new Date()
				setScheduleDate(new Date(today.getFullYear(), today.getMonth(), today.getDate()))
				return
			}
			const [year, month, day] = dateString.split('-').map(Number)
			setScheduleDate(new Date(year, month - 1, day))
		}
	}

	const buildKey = (roomMeta, slotKey) => {
		const roomCode = typeof roomMeta === 'string'
			? roomMeta
			: (roomMeta?.room_code || roomMeta?.roomNumber || roomMeta?.room_number || roomMeta?.code || '')
		return `${roomCode}-${slotKey}`
	}

	return (
		<div className="bs-root">
			<div className="bs-header">
				<div className="bs-header-group">
					<h2 className="bs-header-title">
						{selectedBuilding ? `${selectedBuilding.building_name} Schedule` : 'Room Schedule'}
					</h2>
					{roomSubtitle && <p className="bs-header-subtitle">{roomSubtitle}</p>}
					{!canEdit && !canRequest && (
						<p className="bs-header-note">View only - No editing permissions</p>
					)}
				</div>
				<div className="bs-controls">
					<div className="bs-toggle-group">
						<button
							type="button"
							onClick={() => setActiveSlotCategory('classroom')}
							className={`bs-slot-toggle 
							${activeSlotCategory === 'classroom' ? 'active' : ''}`}
						>
							Classroom
						</button>
						<button
							type="button"
							onClick={() => setActiveSlotCategory('administrative')}
							className={`bs-slot-toggle 
							${activeSlotCategory === 'administrative' ? 'active' : ''}`}
						>
							Administrative
						</button>
					</div>
					<input
						type="date"
						value={isoDate}
						onChange={(event) => handleDateChange(event.target.value)}
						className="bs-date-input"
					/>
				</div>
			</div>

			<div className="bs-content">
				{shouldShowScheduleLoading && (
					<div className="bs-loading-overlay">
						<div className="bs-loading-content">
							<div className="bs-loading-spinner" />
							<p className="bs-loading-text">Loading schedule...</p>
						</div>
					</div>
				)}

				<div className={`bs-section-stack 
					${shouldShowScheduleLoading ? 'dimmed' : ''}`}
					>
					{showRoomsLoadingPlaceholder ? null : !hasRooms ? (
						<div className="bs-empty-state">No classroom rooms found in this building.</div>
					) : (
						<>
							{(Array.isArray(roomsByFloor) ? roomsByFloor : []).map((floor, floorIndex) => {
								if (!floor) return null
								const rooms = Array.isArray(floor.rooms) ? floor.rooms : []
								const bookableRooms = rooms.filter((room) => {
									const isBookable = String(room?.bookable).toLowerCase() === 'true' || room?.bookable === true
									if (!isBookable) return false
									if (!room?.room_type) return currentRoomType === 'classroom'
									return room.room_type.toLowerCase() === currentRoomType
								})

								if (bookableRooms.length === 0) return null

								return (
									<section
										key={floor.id ?? floor.floor_id ?? floor.name ?? floorIndex}
										className="bs-section"
									>
										<header className="bs-section-header">
											<span>{floor.name ?? floor.floor_name ?? `Floor ${floorIndex + 1}`}</span>
										</header>
										<ScheduleGrid
											rooms={bookableRooms}
											timeSlots={filteredSlots}
											scheduleMap={scheduleMap}
											onAdminAction={(room, slotKey) => {
												if (canEdit && onCellClick) {
													onCellClick(room, slotKey)
												}
											}}
											onTeacherRequest={(room, slotKey) => {
												if (canRequest && onCellClick) {
													onCellClick(room, slotKey)
												}
											}}
											buildKey={buildKey}
											canEdit={canEdit}
											canRequest={canRequest}
											isoDate={isoDate}
										/>
									</section>
								)
							})}
						</>
					)}
				</div>
			</div>
		</div>
	)
}

const ScheduleGrid = ({
	rooms = [],
	timeSlots = [],
	scheduleMap = {},
	onAdminAction,
	onTeacherRequest,
	buildKey,
	canEdit,
	canRequest,
	isoDate
}) => {
	const { user } = useAuth()
	const { notifyInfo } = useNotifications()
	const [pendingRequestsForDate, setPendingRequestsForDate] = useState([])

	useEffect(() => {
		let mounted = true
		const load = async () => {
			try {
				const { data } = await fetchRoomRequests()
				if (!mounted || !Array.isArray(data)) return
				// Filter pending requests to those that include the currently selected date (isoDate)
				const toIso = (d) => {
					if (!d) return ''
					const date = new Date(d)
					if (Number.isNaN(date.getTime())) return ''
					const y = date.getFullYear()
					const m = String(date.getMonth() + 1).padStart(2, '0')
					const day = String(date.getDate()).padStart(2, '0')
					return `${y}-${m}-${day}`
				}
				const appliesToDate = (req, iso) => {
					if (!req || !iso) return false
					const base = req.base_date
					if (!base) return false
					const weekCount = Number(req.week_count) || 1
					const baseDate = new Date(base)
					if (Number.isNaN(baseDate.getTime())) return false
					for (let w = 0; w < weekCount; w++) {
						const d = new Date(baseDate)
						d.setDate(d.getDate() + w * 7)
						if (toIso(d) === iso) return true
					}
					return false
				}
				setPendingRequestsForDate(Array.isArray(data) ? data.filter(r => r.status === 'pending' && appliesToDate(r, isoDate)) : [])
			} catch {
				// ignore fetch errors silently — pending display is best-effort
			}
		}
		load()
		return () => { mounted = false }
	}, [isoDate])

	// Build a quick index map for slot keys to determine ranges for multi-slot requests
	const slotIndexMap = useMemo(() => {
		const map = new Map()
		timeSlots.forEach((slot, idx) => {
			const key = resolveSlotKey(slot)
			map.set(String(key), idx)
			const alt = slot.id ?? slot.timeslot_id ?? slot.slot_id ?? slot.slotId ?? slot.hour ?? slot.slot_order
			if (alt !== undefined && alt !== null) map.set(String(alt), idx)
		})
		return map
	}, [timeSlots])

	const slotCoveredByPendingForUser = (roomCode, slotKey) => {
		if (!Array.isArray(pendingRequestsForDate) || pendingRequestsForDate.length === 0) return false
		const targetIdx = slotIndexMap.get(String(slotKey))

		return pendingRequestsForDate.some((request) => {
			if (request.status !== 'pending') return false
			// only block if the requester is the current user
			if (!user || request.requester_id !== user.id) return false
			const reqRoom = request.room_code || request.room_number || request.room || ''
			if (!reqRoom) return false
			if (String(reqRoom) !== String(roomCode)) return false

			const start = request.start_timeslot_id || (request.start_timeslot && request.start_timeslot.id)
			const end = request.end_timeslot_id || (request.end_timeslot && request.end_timeslot.id) || start

			if (targetIdx !== undefined) {
				const startIdx = slotIndexMap.get(String(start))
				const endIdx = slotIndexMap.get(String(end))
				if (startIdx !== undefined && endIdx !== undefined) {
					const from = Math.min(startIdx, endIdx)
					const to = Math.max(startIdx, endIdx)
					return targetIdx >= from && targetIdx <= to
				}
			}

			return String(slotKey) === String(start) || String(slotKey) === String(end)
		})
	}

	// Public pending checker - used when rendering to show pending state to all users
	const slotCoveredByAnyPending = (roomCode, slotKey) => {
		if (!Array.isArray(pendingRequestsForDate) || pendingRequestsForDate.length === 0) return false
		const targetIdx = slotIndexMap.get(String(slotKey))
		return pendingRequestsForDate.some((request) => {
			const reqRoom = request.room_code || request.room_number || request.room || ''
			if (!reqRoom) return false
			if (String(reqRoom) !== String(roomCode)) return false
			const start = request.start_timeslot_id || (request.start_timeslot && request.start_timeslot.id)
			const end = request.end_timeslot_id || (request.end_timeslot && request.end_timeslot.id) || start
			if (targetIdx !== undefined) {
				const startIdx = slotIndexMap.get(String(start))
				const endIdx = slotIndexMap.get(String(end))
				if (startIdx !== undefined && endIdx !== undefined) {
					const from = Math.min(startIdx, endIdx)
					const to = Math.max(startIdx, endIdx)
					return targetIdx >= from && targetIdx <= to
				}
			}
			return String(slotKey) === String(start) || String(slotKey) === String(end)
		})
	}
	const activeSlotType = resolveSlotType(timeSlots?.[0] || {})
	const columnWidthVar = activeSlotType === 'classroom' ? 'var(--classroom-column-width)' : 'var(--default-column-width)'
	const roomColumnWidthVar = 'var(--room-column-width)'
	const interactive = !!(canEdit || canRequest)

	return (
		<div className="bs-grid-wrapper">
			<div
				className="bs-grid"
				style={{ gridTemplateColumns: `${roomColumnWidthVar} repeat(${timeSlots.length}, minmax(${columnWidthVar}, 1fr))` }}
			>
				<div className="bs-room-header">Room</div>

				{timeSlots.map((slot) => {
					const slotHeaderKey = resolveSlotKey(slot)
					const headerLabel = resolveSlotLabel(slot)
					return (
						<div key={`header-${slotHeaderKey}`} className="bs-slot-header">
							{headerLabel}
						</div>
					)
				})}

				{rooms.map((room, roomIndex) => {
					const roomKey = resolveRoomKey(room, roomIndex)
					const roomCode = resolveRoomCode(room)
					const roomLabel = resolveRoomLabel(room)
					const roomDisplay = roomLabel || roomCode || '—'

					return (
						<Fragment key={`room-${roomKey}`}>
							<div className="bs-room-label">{roomDisplay}</div>

							{timeSlots.map((slot) => {
								const slotKey = resolveSlotKey(slot)
								const scheduleKey = buildKey ? buildKey(roomCode || roomKey, slotKey) : `${roomCode || roomKey}-${slotKey}`
								const entry = scheduleMap[scheduleKey]
								const anyPending = slotCoveredByAnyPending(roomCode || roomKey, slotKey)
								const finalStatus = entry?.status === SCHEDULE_STATUS.pending || anyPending ? SCHEDULE_STATUS.pending : entry?.status || SCHEDULE_STATUS.empty
								const label = SCHEDULE_STATUS_LABELS[finalStatus]
								const details = finalStatus === SCHEDULE_STATUS.pending ? [] : (entry?.course_name || entry?.booked_by ? [entry?.course_name, entry?.booked_by].filter(Boolean) : [])

								const handleClick = () => {
									if (canEdit && onAdminAction) {
										onAdminAction(room, slotKey)
									} else if (!canEdit && canRequest && onTeacherRequest) {
										onTeacherRequest(room, slotKey)
									}
								}

								const blockedByPending = slotCoveredByPendingForUser(roomCode || roomKey, slotKey)

								return (
									<button
										key={`${roomKey}-${slotKey}`}
										type="button"
										className={`bs-slot ${interactive ? 'interactive' : ''} status-${finalStatus}`}
										onClick={() => {
											if (blockedByPending) {
												notifyInfo('You already have a pending request for this slot.')
												return
											}
											handleClick()
										}}
										disabled={!interactive || blockedByPending}
									>
										<span className="bs-slot-label">{label}</span>
										{details.length > 0 && (
											<span className="bs-slot-details">
												{details.map((line, index) => (
													<span key={`${roomKey}-${slotKey}-detail-${index}`}>
														{line}
													</span>
												))}
											</span>
										)}
									</button>
								)
							})}
						</Fragment>
					)
				})}
			</div>
		</div>
	)
}

export default BuildingScheduleContent
