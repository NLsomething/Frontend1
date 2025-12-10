import { useState, useRef, useEffect } from 'react'
import '../../styles/HomePageStyle/SearchBuildingStyle.css'
import { useNotifications } from '../../context/NotificationContext.jsx'

const SearchBuilding = ({ buildings, onRoomSelect, onOpen }) => {
  const [searchInput, setSearchInput] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef(null)
  const { notifyError } = useNotifications()

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        setIsFocused(false)
      }
    }

    if (isFocused) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isFocused])

  const parseSearchInput = (input) => {
    const trimmed = input.trim()
    
    if (trimmed.includes('/')) {
      const [roomCode, buildingCode] = trimmed.split('/').map(s => s.trim())
      return { roomCode, buildingCode }
    }
    
    return { roomCode: null, buildingCode: trimmed }
  }

  const handleSearch = async () => {
    if (!searchInput.trim()) {
      return
    }

    setIsSearching(true)

    try {
      const { roomCode, buildingCode } = parseSearchInput(searchInput)

      if (!buildingCode) {
        notifyError?.('Invalid search', { description: 'Please enter a building code like "MB" or a room/building like "101/MB".' })
        setIsSearching(false)
        return
      }

      // Find building
      const building = buildings.find(
        b => b.building_code.toLowerCase() === buildingCode.toLowerCase()
      )

      if (!building) {
        notifyError?.('Building not found', { description: `No building matches "${buildingCode}".` })
        setIsSearching(false)
        return
      }

      await onRoomSelect(building, roomCode)

      // Reset and blur
      setSearchInput('')
      setIsFocused(false)
      if (inputRef.current) {
        inputRef.current.blur()
      }
    } catch (error) {
      console.error('Error searching:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    }
  }

  const handleInputFocus = () => {
    setIsFocused(true)
    if (onOpen) onOpen()
  }

  const getPlaceholder = () => {
    return isFocused ? 'MB or 101/MB' : 'Search building'
  }

  return (
    <div className="sb-root">
      <div className={`sb-search-bar ${isFocused ? 'focused' : ''}`}>
        <input
          ref={inputRef}
          type="text"
          placeholder={getPlaceholder()}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={handleKeyPress}
          onFocus={handleInputFocus}
          onBlur={() => {
            setTimeout(() => setIsFocused(false), 100)
          }}
          className="sb-input"
          disabled={isSearching}
        />
        <button
          type="button"
          onClick={handleSearch}
          className="sb-search-icon-btn"
          disabled={isSearching || !searchInput.trim()}
          aria-label="Search"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
        </button>
      </div>
    </div>
  )
}

export default SearchBuilding

