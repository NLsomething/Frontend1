import { useState, useRef, useEffect } from 'react'
import '../../styles/HomePageStyle/SearchBuildingStyle.css'

const SearchBuilding = ({ buildings, onRoomSelect, onOpen }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [roomCode, setRoomCode] = useState('')
  const [buildingCode, setBuildingCode] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const dropdownRef = useRef(null)
  const roomCodeInputRef = useRef(null)
  const buildingCodeInputRef = useRef(null)

  // Handle click outside (closes the inline panel)
  const isSearchDisabled = isSearching || !buildingCode.trim()

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
    <div className="sb-root" ref={dropdownRef}>
      {/* Base button (hidden when open) */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => {
            setIsOpen(true)
            if (onOpen) onOpen()
          }}
          className="sb-button"
        >
          Search Building
        </button>
      )}

      {/* Inline expanding panel anchored to the button, expands to the left */}
      <div
        className={`sb-panel
        ${isOpen ? 'opened' : ''}`}
        aria-hidden={!isOpen}
      >
        <div className="sb-inner">
          {/* Room Code Input (Optional) */}
          <div className="sb-input-wrapper">
            <input
              ref={roomCodeInputRef}
              type="text"
              placeholder="Room Code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              onKeyDown={handleRoomCodeKeyPress}
              className="sb-input"
              autoFocus
            />
          </div>

          {/* Building Code Dropdown */}
          <div className="sb-input-wrapper">
            <select
              ref={buildingCodeInputRef}
              value={buildingCode}
              onChange={(e) => setBuildingCode(e.target.value)}
              className="sb-select"
            >
              <option value="" disabled hidden>Building Code</option>
              {buildingCodes.map(code => (
                <option key={code} value={code}>{code}</option>
              ))}
            </select>
            {/* Custom dropdown arrow (single) */}
            <span className="sb-arrow" aria-hidden="true">
              <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.06l3.71-2.83a.75.75 0 1 1 .92 1.18l-4.17 3.18a.75.75 0 0 1-.92 0L5.25 8.41a.75.75 0 0 1-.02-1.2z"/>
              </svg>
            </span>
          </div>

          {/* Search Button */}
          <button
            type="button"
            onClick={handleSearch}
            className="sb-search-btn"
            disabled={isSearchDisabled}
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default SearchBuilding

