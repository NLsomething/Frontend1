import { create } from 'zustand'
import { SCHEDULE_STATUS } from '../constants/schedule'

const scheduleDefaults = {
  scheduleMap: {},
  scheduleLoading: false,
  loadSchedules: null,
  saveSchedule: null,
  buildScheduleKey: null
}

const requestsDefaults = {
  requests: [],
  requestsLoading: false,
  requestActionLoading: false,
  pendingRequests: [],
  rejectionReasons: {},
  requestsPanelOpen: false,
  historicalRequests: [],
  historicalDateFilter: null,
  myRequests: [],
  myRequestsLoading: false,
  myRequestsPanelOpen: false,
  filteredMyRequests: [],
  myRequestsDateFilter: null,
  requestState: {
    isOpen: false,
    isEditMode: false,
    room: null,
    roomId: null,
    roomName: null,
    startHour: null,
    endHour: null,
    existingEntry: null
  },
  requestForm: {
    status: SCHEDULE_STATUS.occupied,
    courseName: '',
    bookedBy: '',
    weekCount: 1,
    notes: ''
  },
  setRejectionReasons: null,
  loadRequests: null,
  approveRequest: null,
  rejectRequest: null,
  revertRequest: null,
  setRequestsPanelOpen: null,
  setHistoricalDateFilter: null,
  loadMyRequests: null,
  setMyRequestsPanelOpen: null,
  setMyRequestsDateFilter: null,
  submitRequest: null,
  setRequestState: null,
  setRequestForm: null,
  resetRequestModal: null
}

const REQUESTS_DATA_KEYS = [
  'requests',
  'requestsLoading',
  'requestActionLoading',
  'pendingRequests',
  'rejectionReasons',
  'requestsPanelOpen',
  'historicalRequests',
  'historicalDateFilter',
  'myRequests',
  'myRequestsLoading',
  'myRequestsPanelOpen',
  'filteredMyRequests',
  'myRequestsDateFilter',
  'requestState',
  'requestForm'
]

const REQUESTS_HANDLER_KEYS = [
  'setRejectionReasons',
  'loadRequests',
  'approveRequest',
  'rejectRequest',
  'revertRequest',
  'setRequestsPanelOpen',
  'setHistoricalDateFilter',
  'loadMyRequests',
  'setMyRequestsPanelOpen',
  'setMyRequestsDateFilter',
  'submitRequest',
  'setRequestState',
  'setRequestForm',
  'resetRequestModal'
]

const defaultState = {
  ...scheduleDefaults,
  ...requestsDefaults
}

const createSliceSetter = (keys, set) => (payload) => {
  if (!payload) return
  set((state) => {
    let changed = false
    const next = {}

    keys.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(payload, key)) {
        const value = payload[key]
        if (state[key] !== value) {
          changed = true
        }
        next[key] = value
      }
    })

    return changed ? { ...state, ...next } : state
  })
}

export const useHomePageStore = create((set) => ({
  ...defaultState,
  setScheduleData: ({ scheduleMap, scheduleLoading }) => set((state) => ({
    scheduleMap,
    scheduleLoading: typeof scheduleLoading === 'boolean' ? scheduleLoading : state.scheduleLoading
  })),
  setScheduleHandlers: ({ loadSchedules, saveSchedule, buildScheduleKey }) => set(() => ({
    loadSchedules,
    saveSchedule,
    buildScheduleKey
  })),
  setRequestsData: (payload) => createSliceSetter(REQUESTS_DATA_KEYS, set)(payload),
  setRequestsHandlers: (payload) => createSliceSetter(REQUESTS_HANDLER_KEYS, set)(payload),
  resetHomePageState: () => set(() => ({ ...defaultState }))
}))

// Cached selectors: return the same object reference when underlying values
// haven't changed. This prevents external store snapshots from returning
// fresh objects each call which can trigger React's "getSnapshot should
// be cached" warning and infinite update loops.
export const selectScheduleSlice = (() => {
  let lastState = null
  let lastResult = null
  return (state) => {
    if (
      lastState &&
      lastState.scheduleMap === state.scheduleMap &&
      lastState.scheduleLoading === state.scheduleLoading
    ) {
      return lastResult
    }
    lastState = {
      scheduleMap: state.scheduleMap,
      scheduleLoading: state.scheduleLoading
    }
    lastResult = { ...lastState }
    return lastResult
  }
})()

export const selectScheduleHandlers = (() => {
  let lastState = null
  let lastResult = null
  return (state) => {
    if (
      lastState &&
      lastState.loadSchedules === state.loadSchedules &&
      lastState.saveSchedule === state.saveSchedule &&
      lastState.buildScheduleKey === state.buildScheduleKey
    ) {
      return lastResult
    }
    lastState = {
      loadSchedules: state.loadSchedules,
      saveSchedule: state.saveSchedule,
      buildScheduleKey: state.buildScheduleKey
    }
    lastResult = { ...lastState }
    return lastResult
  }
})()

export const selectRequestsSlice = (() => {
  let lastState = null
  let lastResult = null
  return (state) => {
    // Compare shallowly by reference for each key we care about
    const keys = [
      'requests',
      'requestsLoading',
      'requestActionLoading',
      'pendingRequests',
      'rejectionReasons',
      'requestsPanelOpen',
      'historicalRequests',
      'historicalDateFilter',
      'myRequests',
      'myRequestsLoading',
      'myRequestsPanelOpen',
      'filteredMyRequests',
      'myRequestsDateFilter',
      'requestState',
      'requestForm'
    ]

    if (lastState) {
      let same = true
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i]
        if (lastState[k] !== state[k]) {
          same = false
          break
        }
      }
      if (same) return lastResult
    }

    lastState = {}
    keys.forEach((k) => (lastState[k] = state[k]))
    lastResult = { ...lastState }
    return lastResult
  }
})()

export const selectRequestsHandlers = (() => {
  let lastState = null
  let lastResult = null
  return (state) => {
    const keys = [
      'setRejectionReasons',
      'loadRequests',
      'approveRequest',
      'rejectRequest',
      'revertRequest',
      'setRequestsPanelOpen',
      'setHistoricalDateFilter',
      'loadMyRequests',
      'setMyRequestsPanelOpen',
      'setMyRequestsDateFilter',
      'submitRequest',
      'setRequestState',
      'setRequestForm',
      'resetRequestModal'
    ]

    if (lastState) {
      let same = true
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i]
        if (lastState[k] !== state[k]) {
          same = false
          break
        }
      }
      if (same) return lastResult
    }

    lastState = {}
    keys.forEach((k) => (lastState[k] = state[k]))
    lastResult = { ...lastState }
    return lastResult
  }
})()
