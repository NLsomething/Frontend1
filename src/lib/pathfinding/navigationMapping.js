const normalizeKey = (value) => {
  if (value === null || value === undefined) return ''
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[_\-]+/g, ' ')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
}

// Start points (gates)
export const START_GATE_NODES = Object.freeze({
  back: 'Node1',
  rear: 'Node49',
  main: 'Node38',
})

// Destination mapping from your spec (room/place label -> node)
// Keys are normalized via normalizeKey().
const DESTINATION_NODE_BY_KEY = Object.freeze({
  // Floor 1
  [normalizeKey('Innovation Space')]: 'Node34',
  [normalizeKey('Youth Union Office')]: 'Node32',
  [normalizeKey('WC1')]: 'Node31',
  [normalizeKey('WC2')]: 'Node29',
  [normalizeKey('WC3')]: 'Node28',
  [normalizeKey('WC4')]: 'Node27',
  [normalizeKey('School Office')]: 'Node43',
  [normalizeKey('Library')]: 'Node44',
  [normalizeKey('Room 101')]: 'Node23',
  [normalizeKey('Room 102')]: 'Node22',
  [normalizeKey('Room 103')]: 'Node21',
  [normalizeKey('Room 104')]: 'Node11',
  [normalizeKey('Room 105')]: 'Node10',
  [normalizeKey('Room 106')]: 'Node9',
  [normalizeKey('Room 107')]: 'Node8',
  [normalizeKey('Room 108')]: 'Node7',
  [normalizeKey('Room 109')]: 'Node6',
  [normalizeKey('School Youth Union Office')]: 'Node52',
  [normalizeKey('Center for Electronics and Informatics')]: 'Node50',
  [normalizeKey('Office of the Center for Electronics and Informatics')]: 'Node12',
  [normalizeKey('Room 110')]: 'Node13',
  [normalizeKey('Room 111')]: 'Node14',
  [normalizeKey('Faculty of Information Technology')]: 'Node20',
  [normalizeKey('Faculty of Multimedia')]: 'Node19',
  [normalizeKey('Faculty of Computer Networks and Communications')]: 'Node18',
  [normalizeKey('Faculty of Computer Science')]: 'Node17',
  [normalizeKey('Faculty of Software Engineering')]: 'Node16',
  [normalizeKey('Faculty of Information Systems')]: 'Node15',
  [normalizeKey('Computer Engineering Office')]: 'Node25',

  // Floor 2
  [normalizeKey('Meeting room 2 Research room')]: 'Node66',
  [normalizeKey('Meeting room 2 + Research room')]: 'Node66',
  // Research Room shares the same destination node as Principal's Office (per updated spec).
  [normalizeKey('Research room')]: 'Node67',
  [normalizeKey('Research Room')]: 'Node67',
  [normalizeKey("Principal's Office")]: 'Node67',
  [normalizeKey('Principal Office')]: 'Node67',
  [normalizeKey('Meeting room 1')]: 'Node68',
  [normalizeKey('WC5')]: 'Node69',
  [normalizeKey('WC6')]: 'Node72',
  [normalizeKey('WC7')]: 'Node73',
  [normalizeKey('WC8')]: 'Node74',
  [normalizeKey('Room 201')]: 'Node71',
  [normalizeKey('School hall')]: 'Node61',
  [normalizeKey('Electrical room')]: 'Node76',
  [normalizeKey('Room 217')]: 'Node96',
  [normalizeKey('Room 218')]: 'Node97',
  [normalizeKey('Room 219')]: 'Node98',
  [normalizeKey('Room 220')]: 'Node99',
  [normalizeKey('Room 221')]: 'Node100',
  [normalizeKey('Room 213')]: 'Node88',
  [normalizeKey('Room 214')]: 'Node89',
  [normalizeKey('Room 216')]: 'Node92',
  [normalizeKey('Room 215')]: 'Node95',
  [normalizeKey('Room 212')]: 'Node78',
  [normalizeKey('Room 211')]: 'Node79',
  [normalizeKey('Room 210')]: 'Node80',
  [normalizeKey('Room 203')]: 'Node85',
  [normalizeKey('Room 202')]: 'Node84',
  [normalizeKey('Room 209')]: 'Node87',
  [normalizeKey('Room 208')]: 'Node82',
  [normalizeKey('Room 206')]: 'Node83',
  [normalizeKey('Room 204')]: 'Node102',
  // Room 205 and Room 207 share Node101.
  [normalizeKey('Room 205')]: 'Node101',
  [normalizeKey('Room 207')]: 'Node101',
  [normalizeKey('Room 207 Room 205')]: 'Node101',
  [normalizeKey('Room 207 + Room 205')]: 'Node101',
})

const resolveByNumericRoom = (value) => {
  if (!value) return null
  const match = String(value).match(/\b(\d{3})\b/)
  if (!match) return null
  const num = match[1]
  return DESTINATION_NODE_BY_KEY[normalizeKey(`Room ${num}`)] || null
}

export const resolveDestinationNode = ({ roomCode, roomName }) => {
  // Try numeric first (works for room codes like "101", "MB101", "Room 101")
  const numericCandidate = resolveByNumericRoom(roomCode) || resolveByNumericRoom(roomName)
  if (numericCandidate) return numericCandidate

  const candidates = [roomCode, roomName].filter(Boolean)
  for (const raw of candidates) {
    const key = normalizeKey(raw)
    const found = DESTINATION_NODE_BY_KEY[key]
    if (found) return found
  }

  return null
}

export const __private__ = { normalizeKey }
