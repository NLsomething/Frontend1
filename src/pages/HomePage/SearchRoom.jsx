import { useState, useRef, useEffect } from 'react'
import { COLORS } from '../../constants/colors'

const SearchRoom = ({ buildings, onRoomSelect }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [roomCode, setRoomCode] = useState('')
  const [buildingCode, setBuildingCode] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const dropdownRef = useRef(null)
  const roomCodeInputRef = useRef(null)
  const buildingCodeInputRef = useRef(null)

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSearch = async () => {
    if (!buildingCode.trim()) {
      return
    }

    setIsSearching(true)

    try {
      // Find building by code
      const building = buildings.find(b => b.building_code.toLowerCase() === buildingCode.trim().toLowerCase())
      
      if (!building) {
        console.error('Building not found')
        setIsSearching(false)
        return
      }

      // If room code is provided, search for specific room
      if (roomCode.trim()) {
        // Call the parent handler to search for the room
        await onRoomSelect(building, roomCode.trim())
      } else {
        // Just open building info without navigating to a specific room
        await onRoomSelect(building, null)
      }
      
      // Reset and close
      setRoomCode('')
      setBuildingCode('')
      setIsOpen(false)
    } catch (error) {
      console.error('Error searching:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleRoomCodeKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      // Move focus to building code input
      if (buildingCodeInputRef.current) {
        buildingCodeInputRef.current.focus()
      }
    }
  }

  const handleBuildingCodeKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      // If building code is filled, trigger search
      if (buildingCode.trim()) {
        handleSearch()
      } else {
        // Otherwise move to room code
        if (roomCodeInputRef.current) {
          roomCodeInputRef.current.focus()
        }
      }
    }
  }

  // Get unique building codes
  const buildingCodes = buildings
    .map(b => b.building_code)
    .filter((code, index, self) => self.indexOf(code) === index)
    .sort()

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="uppercase tracking-[0.28em] text-[0.6rem] px-5 py-2.5 border border-[#EEEEEE]/30 bg-[#393E46]/80 text-[#EEEEEE] shadow-lg backdrop-blur-sm transition-colors duration-200 hover:bg-[#3282B8]"
      >
        Search Building
      </button>

      {isOpen && (
        <div 
          className="absolute top-full right-0 mt-2 z-50 flex flex-col gap-3 p-4 min-w-[500px] rounded"
          style={{
            backgroundColor: COLORS.darkGray,
            border: '1px solid rgba(238,238,238,0.2)',
            boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)'
          }}
        >
          <div className="flex gap-3">
            {/* Room Code Input (Optional) */}
            <input
              ref={roomCodeInputRef}
              type="text"
              placeholder="Room Code (optional)"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              onKeyPress={handleRoomCodeKeyPress}
              className="flex-1 px-3 py-2 text-sm rounded"
              style={{
                border: '1px solid rgba(238,238,238,0.2)',
                color: COLORS.white,
                backgroundColor: '#4A5058'
              }}
              autoFocus
            />

            {/* Building Code Input with Autocomplete */}
            <div className="relative w-40">
              <input
                ref={buildingCodeInputRef}
                type="text"
                placeholder="Building Code *"
                value={buildingCode}
                onChange={(e) => setBuildingCode(e.target.value)}
                onKeyPress={handleBuildingCodeKeyPress}
                list="building-codes"
                className="w-full px-3 py-2 text-sm rounded"
                style={{
                  border: '1px solid rgba(238,238,238,0.2)',
                  color: COLORS.white,
                  backgroundColor: '#4A5058'
                }}
              />
              <datalist id="building-codes">
                {buildingCodes.map(code => (
                  <option key={code} value={code} />
                ))}
              </datalist>
            </div>

            {/* Search Button */}
            <button
              type="button"
              onClick={handleSearch}
              disabled={isSearching || !buildingCode.trim()}
              className="px-6 py-2 text-sm font-semibold rounded transition-all duration-200"
              style={{
                backgroundColor: isSearching || !buildingCode.trim() ? '#4A5058' : COLORS.blue,
                color: COLORS.white,
                border: '1px solid transparent',
                cursor: (isSearching || !buildingCode.trim()) ? 'not-allowed' : 'pointer',
                opacity: (isSearching || !buildingCode.trim()) ? 0.5 : 1
              }}
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchRoom

