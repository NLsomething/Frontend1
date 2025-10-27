import { COLORS } from './colors'

export const ROOM_REQUEST_STATUS = {
  pending: 'pending',
  approved: 'approved',
  rejected: 'rejected',
  reverted: 'reverted'
}

export const ROOM_REQUEST_STATUS_LABELS = {
  [ROOM_REQUEST_STATUS.pending]: 'Pending',
  [ROOM_REQUEST_STATUS.approved]: 'Approved',
  [ROOM_REQUEST_STATUS.rejected]: 'Rejected',
  [ROOM_REQUEST_STATUS.reverted]: 'Reverted'
}

export const ROOM_REQUEST_STATUS_STYLES = {
  [ROOM_REQUEST_STATUS.pending]: {
    backgroundColor: COLORS.blue,
    color: '#FFFFFF',
    borderColor: COLORS.blue
  },
  [ROOM_REQUEST_STATUS.approved]: {
    backgroundColor: 'rgb(5, 150, 105)',
    color: '#FFFFFF',
    borderColor: 'rgb(5, 150, 105)'
  },
  [ROOM_REQUEST_STATUS.rejected]: {
    backgroundColor: COLORS.rejectedRed,
    color: '#FFFFFF',
    borderColor: COLORS.rejectedRed
  },
  [ROOM_REQUEST_STATUS.reverted]: {
    backgroundColor: '#d97706',
    color: '#FFFFFF',
    borderColor: '#d97706'
  }
}

export const MAX_ROOM_REQUEST_WEEKS = 12
