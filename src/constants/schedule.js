export const SCHEDULE_STATUS = {
  empty: 'empty',
  occupied: 'occupied',
  maintenance: 'maintenance'
}

export const SCHEDULE_STATUS_LABELS = {
  [SCHEDULE_STATUS.empty]: 'Empty',
  [SCHEDULE_STATUS.occupied]: 'Occupied',
  [SCHEDULE_STATUS.maintenance]: 'Maintenance'
}

export const SCHEDULE_STATUS_STYLES = {
  [SCHEDULE_STATUS.empty]: 'bg-slate-50/80 text-slate-500 border-slate-200',
  [SCHEDULE_STATUS.occupied]: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  [SCHEDULE_STATUS.maintenance]: 'bg-amber-50 text-amber-600 border-amber-200'
}

export const DEFAULT_SCHEDULE_DATE_OFFSET_DAYS = 0
