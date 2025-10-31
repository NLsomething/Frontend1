import ScheduleGrid from './ScheduleGrid'
import { COLORS } from '../../constants/colors'

export const BuildingSchedulePanelContent = ({
  selectedBuilding,
  buildingRooms,
  buildingRoomsLoading,
  roomsByFloor,
  scheduleDate,
  setScheduleDate,
  timeSlots,
  scheduleMap,
  scheduleLoading,
  onCellClick,
  canEdit,
  canRequest
}) => {
  // Convert Date object to local date string for input (avoiding timezone issues)
  const formatLocalDate = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  const isoDate = scheduleDate ? formatLocalDate(scheduleDate) : ''
  
  // Handle date change from input
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
  
  // Build schedule key
  const buildKey = (roomNumber, slotHour) => `${roomNumber}-${slotHour}`

  return (
    <div className="flex h-full w-full flex-col" style={{ backgroundColor: COLORS.panelBackground }}>
      <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${COLORS.whiteTransparentMinimal}` }}>
        <div>
          <h2 className="text-xl font-semibold" style={{ color: COLORS.white }}>
            {selectedBuilding ? `${selectedBuilding.building_name} Schedule` : 'Room Schedule'}
          </h2>
          <p className="text-sm" style={{ color: COLORS.whiteTransparentMid }}>
            {buildingRoomsLoading ? 'Loading rooms...' : buildingRooms.length > 0 ? `${buildingRooms.length} Classroom${buildingRooms.length !== 1 ? 's' : ''} • 7:00 AM – 8:00 PM` : 'No classrooms found'}
          </p>
          {!canEdit && !canRequest && (
            <p className="text-xs" style={{ color: COLORS.whiteTransparentLow }}>View only - No editing permissions</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={isoDate}
            onChange={(event) => handleDateChange(event.target.value)}
            className="dark-date-input"
            style={{ 
              padding: '6px 8px',
              border: '1px solid rgba(238, 238, 238, 0.2)',
              borderRadius: 0,
              fontSize: '12px',
              color: 'rgb(238, 238, 238)',
              backgroundColor: 'rgb(57, 62, 70)',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto relative" style={{ padding: '20px', paddingTop: '20px', paddingBottom: '20px', scrollbarWidth: 'thin', scrollbarColor: `${COLORS.scrollbarThumb} ${COLORS.scrollbarTrack}` }}>
        <style>
          {`
            .dark-date-input::-webkit-calendar-picker-indicator {
              filter: invert(1);
              cursor: pointer;
            }
            ::-webkit-scrollbar {
              width: 8px;
            }
            ::-webkit-scrollbar-track {
              background: ${COLORS.scrollbarTrack};
            }
            ::-webkit-scrollbar-thumb {
              background: ${COLORS.scrollbarThumb};
              border-radius: 0px;
            }
            ::-webkit-scrollbar-thumb:hover {
              background: ${COLORS.scrollbarThumbHover};
            }
          `}
        </style>
        
        {/* Loading indicator at panel level */}
        {scheduleLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center backdrop-blur-sm" style={{ backgroundColor: `${COLORS.panelBackground}EE` }}>
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent" style={{ borderColor: COLORS.blue }}></div>
              <p className="text-sm font-medium" style={{ color: COLORS.white }}>Loading schedule...</p>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '27px', opacity: scheduleLoading ? 0.4 : 1, transition: 'opacity 0.2s ease-out' }}>
          {buildingRoomsLoading ? (
            <div className="flex h-full w-full items-center justify-center text-sm" style={{ border: `1px dashed ${COLORS.whiteTransparentBorder}`, backgroundColor: COLORS.screenBackground, color: COLORS.whiteTransparentMid, borderRadius: 0 }}>
              Loading classroom rooms...
            </div>
          ) : buildingRooms.length === 0 ? (
            <div className="flex h-full w-full items-center justify-center text-sm" style={{ border: `1px dashed ${COLORS.whiteTransparentBorder}`, backgroundColor: COLORS.screenBackground, color: COLORS.whiteTransparentMid, borderRadius: 0 }}>
              No classroom rooms found in this building.
            </div>
          ) : (
            <>
              {roomsByFloor.map((floor, floorIndex) => {
                const bookableRooms = floor.rooms.filter(room => String(room.bookable).toLowerCase() === 'true' || room.bookable === true)
                if (bookableRooms.length === 0) return null
                return (
                  <section key={floor.id} className="shadow-sm overflow-hidden" style={{ marginLeft: '0', border: '1px solid rgba(238,238,238,0.2)', backgroundColor: COLORS.screenBackground, borderTop: floorIndex === 0 ? '1px solid rgba(238,238,238,0.2)' : undefined, borderRadius: 0 }}>
                    <header className="flex items-center justify-between font-semibold uppercase tracking-wide" style={{ padding: '10px 21px', fontSize: '12px', backgroundColor: COLORS.darkGray, color: COLORS.white }}>
                      <span>{floor.name} • {bookableRooms.length} Room{bookableRooms.length !== 1 ? 's' : ''}</span>
                    </header>
                    <ScheduleGrid
                      rooms={bookableRooms.map(room => room.room_code)}
                      timeSlots={timeSlots}
                      scheduleMap={scheduleMap}
                      onAdminAction={(room, hour) => canEdit && onCellClick && onCellClick(room, hour)}
                      onTeacherRequest={(room, hour) => canRequest && onCellClick && onCellClick(room, hour)}
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

