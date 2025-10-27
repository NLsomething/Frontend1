import ScheduleGrid from './ScheduleGrid'
import { COLORS } from '../../constants/colors'

const BuildingSchedulePanel = ({
  isOpen,
  selectedBuilding,
  buildingRooms,
  buildingRoomsLoading,
  roomsBySection,
  scheduleDate,
  setScheduleDate,
  timeSlots,
  scheduleMap,
  scheduleLoading,
  onClose,
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
      const [year, month, day] = dateString.split('-').map(Number)
      setScheduleDate(new Date(year, month - 1, day))
    }
  }
  
  // Build schedule key
  const buildKey = (roomNumber, slotHour) => `${roomNumber}-${slotHour}`

  return (
    <aside
      className={`absolute top-0 left-0 z-20 h-full w-full max-w-5xl transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      aria-hidden={!isOpen}
    >
      <div className="flex h-full w-full flex-col backdrop-blur-sm border-r shadow-2xl" style={{ backgroundColor: COLORS.panelBackground, borderColor: `${COLORS.whiteTransparentMinimal}` }}>
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
                borderRadius: '4px',
                fontSize: '12px',
                color: 'rgb(238, 238, 238)',
                backgroundColor: 'rgb(57, 62, 70)',
                boxSizing: 'border-box'
              }}
            />
            <button
              onClick={onClose}
              className="px-3 py-1 text-sm font-medium transition-colors duration-150 rounded"
              style={{ border: '1px solid rgba(238,238,238,0.2)', color: COLORS.white, backgroundColor: COLORS.darkGray }}
            >
              Close
            </button>
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
                border-radius: 4px;
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '27px', opacity: scheduleLoading ? 0.4 : 1, transition: 'opacity 0.2s ease-in-out' }}>
          {buildingRoomsLoading ? (
            <div className="flex h-full w-full items-center justify-center rounded text-sm" style={{ border: `1px dashed ${COLORS.whiteTransparentBorder}`, backgroundColor: COLORS.screenBackground, color: COLORS.whiteTransparentMid }}>
              Loading classroom rooms...
            </div>
          ) : buildingRooms.length === 0 ? (
            <div className="flex h-full w-full items-center justify-center rounded text-sm" style={{ border: `1px dashed ${COLORS.whiteTransparentBorder}`, backgroundColor: COLORS.screenBackground, color: COLORS.whiteTransparentMid }}>
              No classroom rooms found in this building.
            </div>
          ) : (
            <>
              {roomsBySection.map(section => (
                <div key={section.id} style={{ display: 'flex', flexDirection: 'column' }}>
                  {/* Section Header */}
                  <div className="rounded-t-lg" style={{ padding: '14px 21px', backgroundColor: COLORS.blue }}>
                    <h3 className="font-bold uppercase tracking-wide" style={{ fontSize: '15px', color: COLORS.white }}>
                      {section.name}
                    </h3>
                  </div>
                  
                  {/* Floors within this section */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {section.floors.map((floor, floorIndex) => (
                    <section key={floor.id} className="shadow-sm overflow-hidden" style={{ marginLeft: '0', border: '1px solid rgba(238,238,238,0.2)', backgroundColor: COLORS.screenBackground, borderTop: floorIndex === 0 ? '1px solid rgba(238,238,238,0.2)' : undefined }}>
                      <header className="flex items-center justify-between font-semibold uppercase tracking-wide" style={{ padding: '10px 21px', fontSize: '12px', backgroundColor: COLORS.darkGray, color: COLORS.white }}>
                        <span>{floor.name} • {floor.rooms.length} Room{floor.rooms.length !== 1 ? 's' : ''}</span>
                      </header>
                      <ScheduleGrid
                        rooms={floor.rooms.map(room => room.room_code)}
                        timeSlots={timeSlots}
                        scheduleMap={scheduleMap}
                        onAdminAction={(room, hour) => canEdit && onCellClick && onCellClick(room, hour)}
                        onTeacherRequest={(room, hour) => canRequest && onCellClick && onCellClick(room, hour)}
                        buildKey={buildKey}
                        canEdit={canEdit}
                        canRequest={canRequest}
                      />
                    </section>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
          </div>
        </div>
      </div>
    </aside>
  )
}

export default BuildingSchedulePanel

