import { Fragment, useMemo, useState } from 'react'
import { SCHEDULE_STATUS, SCHEDULE_STATUS_LABELS } from '../../constants/schedule'
import '../../styles/HomePageStyle/BuildingScheduleStyle.css'
import { useHomePageStore, selectScheduleSlice } from '../../stores/useHomePageStore'

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
							className="bs-slot-toggle"
							{...(activeSlotCategory === 'administrative' ? { active: '' } : {})}
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
	canRequest
}) => {
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
								const status = entry?.status || SCHEDULE_STATUS.empty
								const label = SCHEDULE_STATUS_LABELS[status]
								const details = entry?.course_name || entry?.booked_by ? [entry?.course_name, entry?.booked_by].filter(Boolean) : []

								const handleClick = () => {
									if (canEdit && onAdminAction) {
										onAdminAction(room, slotKey)
									} else if (!canEdit && canRequest && onTeacherRequest) {
										onTeacherRequest(room, slotKey)
									}
								}

								return (
									<button
										key={`${roomKey}-${slotKey}`}
										type="button"
										className={`bs-slot ${interactive ? 'interactive' : ''} status-${status}`}
										onClick={handleClick}
										disabled={!interactive}
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
