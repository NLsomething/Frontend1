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
  editForm: {
    status: SCHEDULE_STATUS.occupied,
    courseName: '',
    bookedBy: ''
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
  'requestForm',
  'editForm'
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

// Shallow equality check for selector optimization
const shallowEqual = (objA, objB) => {
  if (Object.is(objA, objB)) return true
  
  if (typeof objA !== 'object' || objA === null || typeof objB !== 'object' || objB === null) {
    return false
  }

  const keysA = Object.keys(objA)
  const keysB = Object.keys(objB)

  if (keysA.length !== keysB.length) return false

  for (let i = 0; i < keysA.length; i++) {
    if (!Object.prototype.hasOwnProperty.call(objB, keysA[i]) || !Object.is(objA[keysA[i]], objB[keysA[i]])) {
      return false
    }
  }

  return true
}

// Create a memoized selector factory
const createMemoizedSelector = (selector) => {
  let lastState = null
  let lastResult = null

  return (state) => {
    const newResult = selector(state)
    
    if (lastState === state && lastResult !== null) {
      return lastResult
    }
    
    if (lastResult !== null && shallowEqual(lastResult, newResult)) {
      return lastResult
    }
    
    lastState = state
    lastResult = newResult
    return newResult
  }
}

export const selectScheduleSlice = createMemoizedSelector((state) => ({
  scheduleMap: state.scheduleMap,
  scheduleLoading: state.scheduleLoading
}))

export const selectScheduleHandlers = createMemoizedSelector((state) => ({
  loadSchedules: state.loadSchedules,
  saveSchedule: state.saveSchedule,
  buildScheduleKey: state.buildScheduleKey
}))

export const selectRequestsSlice = createMemoizedSelector((state) => ({
  requests: state.requests,
  requestsLoading: state.requestsLoading,
  requestActionLoading: state.requestActionLoading,
  pendingRequests: state.pendingRequests,
  rejectionReasons: state.rejectionReasons,
  requestsPanelOpen: state.requestsPanelOpen,
  historicalRequests: state.historicalRequests,
  historicalDateFilter: state.historicalDateFilter,
  myRequests: state.myRequests,
  myRequestsLoading: state.myRequestsLoading,
  myRequestsPanelOpen: state.myRequestsPanelOpen,
  filteredMyRequests: state.filteredMyRequests,
  myRequestsDateFilter: state.myRequestsDateFilter,
  requestState: state.requestState,
  requestForm: state.requestForm,
  editForm: state.editForm
}))

export const selectRequestsHandlers = createMemoizedSelector((state) => ({
  setRejectionReasons: state.setRejectionReasons,
  loadRequests: state.loadRequests,
  approveRequest: state.approveRequest,
  rejectRequest: state.rejectRequest,
  revertRequest: state.revertRequest,
  setRequestsPanelOpen: state.setRequestsPanelOpen,
  setHistoricalDateFilter: state.setHistoricalDateFilter,
  loadMyRequests: state.loadMyRequests,
  setMyRequestsPanelOpen: state.setMyRequestsPanelOpen,
  setMyRequestsDateFilter: state.setMyRequestsDateFilter,
  submitRequest: state.submitRequest,
  setRequestState: state.setRequestState,
  setRequestForm: state.setRequestForm,
  resetRequestModal: state.resetRequestModal
}))
