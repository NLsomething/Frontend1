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
  [ROOM_REQUEST_STATUS.pending]: 'bg-amber-50 text-amber-600 border-amber-200',
  [ROOM_REQUEST_STATUS.approved]: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  [ROOM_REQUEST_STATUS.rejected]: 'bg-rose-50 text-rose-600 border-rose-200',
  [ROOM_REQUEST_STATUS.reverted]: 'bg-slate-100 text-slate-700 border-slate-300'
}

export const MAX_ROOM_REQUEST_WEEKS = 12
