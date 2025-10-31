import { useState, useRef, useEffect } from 'react'
import { COLORS } from '../../constants/colors'

const SearchBuilding = ({ buildings, onRoomSelect, onOpen }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [roomCode, setRoomCode] = useState('')
  const [buildingCode, setBuildingCode] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const dropdownRef = useRef(null)
  const roomCodeInputRef = useRef(null)
  const buildingCodeInputRef = useRef(null)

  // Handle click outside (closes the inline panel)
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


  // Get unique building codes
  const buildingCodes = buildings
    .map(b => b.building_code)
    .filter((code, index, self) => self.indexOf(code) === index)
    .sort()

  return (
    <div className="relative h-full flex items-stretch" ref={dropdownRef}>
      {/* Base button (hidden when open) */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => {
            setIsOpen(true)
            if (onOpen) onOpen()
          }}
          className="uppercase tracking-[0.28em] text-[0.6rem] px-6 h-full inline-flex items-center border-y-0 border-l border-r border-[#2f3a4a] bg-transparent text-[#EEEEEE] transition-all duration-200 hover:bg-[#2f3a4a]"
        >
          Search Building
        </button>
      )}

      {/* Inline expanding panel anchored to the button, expands to the left */}
      <div
        className="absolute top-0 right-0 z-50 h-full uppercase tracking-[0.28em] text-[0.6rem] border-y-0 border-l border-r border-[#2f3a4a] bg-[#2f3a4a] text-[#EEEEEE]"
        style={{
          width: '440px',
          transform: isOpen ? 'scaleX(1)' : 'scaleX(0)',
          transformOrigin: 'right center',
          transition: 'transform 180ms ease, opacity 180ms ease',
          opacity: isOpen ? 1 : 0
        }}
        aria-hidden={!isOpen}
      >
        <div
          className="h-full flex items-center gap-3 px-3"
        >
          {/* Room Code Input (Optional) */}
          <div className="relative" style={{ width: '152px' }}>
            <input
              ref={roomCodeInputRef}
              type="text"
              placeholder="Room Code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              onKeyPress={handleRoomCodeKeyPress}
              className="w-full px-3 py-2 text-[0.6rem]"
              style={{
                fontFamily: 'inherit',
                border: '1px solid rgba(238,238,238,0.2)',
                color: COLORS.white,
                backgroundColor: '#4A5058'
              }}
              autoFocus
            />
          </div>

          {/* Building Code Dropdown */}
          <div className="relative" style={{ width: '152px' }}>
            <select
              ref={buildingCodeInputRef}
              value={buildingCode}
              onChange={(e) => setBuildingCode(e.target.value)}
              className="w-full pr-7 px-3 py-2 text-[0.6rem]"
              style={{
                fontFamily: 'inherit',
                border: '1px solid rgba(238,238,238,0.2)',
                color: COLORS.white,
                backgroundColor: '#4A5058',
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="" disabled hidden>Building Code</option>
              {buildingCodes.map(code => (
                <option key={code} value={code}>{code}</option>
              ))}
            </select>
            {/* Custom dropdown arrow (single) */}
            <span
              className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-[#EEEEEE]/70"
              aria-hidden="true"
            >
              <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.06l3.71-2.83a.75.75 0 1 1 .92 1.18l-4.17 3.18a.75.75 0 0 1-.92 0L5.25 8.41a.75.75 0 0 1-.02-1.2z"/>
              </svg>
            </span>
          </div>

          {/* Search Button */}
          <button
            type="button"
            onClick={handleSearch}
            disabled={isSearching || !buildingCode.trim()}
            className="px-3 py-2 text-[0.6rem] font-semibold transition-all duration-200"
            style={{
              fontFamily: 'inherit',
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
    </div>
  )
}

export default SearchBuilding

