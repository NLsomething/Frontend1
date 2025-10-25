import ScheduleGrid from './ScheduleGrid'

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
  // Convert Date object to ISO string for input
  const isoDate = scheduleDate ? scheduleDate.toISOString().split('T')[0] : ''
  
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
      <div className="flex h-full w-full flex-col bg-white/95 backdrop-blur-sm border-r border-slate-200 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              {selectedBuilding ? `${selectedBuilding.building_name} Schedule` : 'Room Schedule'}
            </h2>
            <p className="text-sm text-slate-500">
              {buildingRoomsLoading ? 'Loading rooms...' : buildingRooms.length > 0 ? `${buildingRooms.length} Classroom${buildingRooms.length !== 1 ? 's' : ''} • 7:00 AM – 8:00 PM` : 'No classrooms found'}
            </p>
            {!canEdit && !canRequest && (
              <p className="text-xs text-slate-400">View only - No editing permissions</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={isoDate}
              onChange={(event) => handleDateChange(event.target.value)}
              className="border border-slate-300 px-3 py-1 text-sm tracking-tight text-slate-600"
            />
            <button
              onClick={onClose}
              className="border border-slate-300 px-3 py-1 text-sm font-medium text-slate-600 transition-colors duration-150 hover:bg-slate-100"
            >
              Close
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
          {buildingRoomsLoading ? (
            <div className="flex h-full w-full items-center justify-center rounded border border-dashed border-slate-300 bg-white text-sm text-slate-500">
              Loading classroom rooms...
            </div>
          ) : buildingRooms.length === 0 ? (
            <div className="flex h-full w-full items-center justify-center rounded border border-dashed border-slate-300 bg-white text-sm text-slate-500">
              No classroom rooms found in this building.
            </div>
          ) : (
            <>
              {roomsBySection.map(section => (
                <div key={section.id} className="space-y-4">
                  {/* Section Header */}
                  <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4 rounded-t-lg">
                    <h3 className="text-lg font-bold text-white uppercase tracking-wide">
                      {section.name}
                    </h3>
                    {scheduleLoading && <span className="text-xs font-medium text-blue-100">Loading…</span>}
                  </div>
                  
                  {/* Floors within this section */}
                  {section.floors.map(floor => (
                    <section key={floor.id} className="border border-slate-200 shadow-sm overflow-hidden ml-4">
                      <header className="flex items-center justify-between bg-slate-50 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
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
              ))}
            </>
          )}
        </div>
      </div>
    </aside>
  )
}

export default BuildingSchedulePanel

