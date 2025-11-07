import { useEffect, useMemo } from 'react'
import { USER_ROLES } from '../../constants/roles'
import { useScheduleManagement } from '../../hooks/useScheduleManagement'
import { useRoomRequests } from '../../hooks/useRoomRequests'
import { useHomePageStore } from '../../stores/useHomePageStore'

const HomePageStateProvider = ({
  isoDate,
  role,
  timeSlots,
  buildingRooms,
  isScheduleOpen,
  isRoomScheduleOpen,
  user,
  profile,
  canManageRequests,
  canRequestRoom
}) => {
  const setScheduleData = useHomePageStore((state) => state.setScheduleData)
  const setScheduleHandlers = useHomePageStore((state) => state.setScheduleHandlers)
  const setRequestsData = useHomePageStore((state) => state.setRequestsData)
  const setRequestsHandlers = useHomePageStore((state) => state.setRequestsHandlers)
  const resetHomePageState = useHomePageStore((state) => state.resetHomePageState)

  const canViewSchedule = useMemo(() => (
    role === USER_ROLES.teacher ||
    role === USER_ROLES.student ||
    role === USER_ROLES.administrator ||
    role === USER_ROLES.buildingManager
  ), [role])

  const {
    scheduleMap,
    scheduleLoading,
    loadSchedules,
    buildScheduleKey,
    saveSchedule
  } = useScheduleManagement(isoDate, canViewSchedule, {
    timeSlots,
    rooms: buildingRooms
  })

  const {
    requests,
    requestsLoading,
  requestActionLoading,
    pendingRequests,
    rejectionReasons,
    setRejectionReasons,
    loadRequests,
    approveRequest,
    rejectRequest,
    revertRequest,
    requestsPanelOpen,
    setRequestsPanelOpen,
    historicalRequests,
    historicalDateFilter,
    setHistoricalDateFilter,
    myRequests,
    myRequestsLoading,
    loadMyRequests,
    myRequestsPanelOpen,
    setMyRequestsPanelOpen,
    filteredMyRequests,
    myRequestsDateFilter,
  setMyRequestsDateFilter,
    requestState,
    setRequestState,
    requestForm,
    setRequestForm,
    submitRequest,
    resetRequestModal
  } = useRoomRequests(canManageRequests, canRequestRoom, user, profile, {
    timeSlots,
    rooms: buildingRooms
  })

  useEffect(() => {
    setScheduleData({ scheduleMap, scheduleLoading })
  }, [scheduleMap, scheduleLoading, setScheduleData])

  useEffect(() => {
    setScheduleHandlers({ loadSchedules, saveSchedule, buildScheduleKey })
  }, [loadSchedules, saveSchedule, buildScheduleKey, setScheduleHandlers])

  useEffect(() => {
    setRequestsData({
      requests,
      requestsLoading,
  requestActionLoading,
      pendingRequests,
      rejectionReasons,
      requestsPanelOpen,
      historicalRequests,
      historicalDateFilter,
      myRequests,
      myRequestsLoading,
      myRequestsPanelOpen,
      filteredMyRequests,
      myRequestsDateFilter,
      requestState,
      requestForm
    })
  }, [
    requests,
    requestsLoading,
  requestActionLoading,
    pendingRequests,
    rejectionReasons,
    requestsPanelOpen,
    historicalRequests,
    historicalDateFilter,
    myRequests,
    myRequestsLoading,
    myRequestsPanelOpen,
    filteredMyRequests,
    myRequestsDateFilter,
    requestState,
    requestForm,
    setRequestsData
  ])

  useEffect(() => {
    setRequestsHandlers({
      setRejectionReasons,
      loadRequests,
      approveRequest,
      rejectRequest,
      revertRequest,
      setRequestsPanelOpen,
      setHistoricalDateFilter,
      loadMyRequests,
      setMyRequestsPanelOpen,
      setMyRequestsDateFilter,
      submitRequest,
      setRequestState,
      setRequestForm,
      resetRequestModal
    })
  }, [
    setRequestsHandlers,
    setRejectionReasons,
    loadRequests,
    approveRequest,
    rejectRequest,
    revertRequest,
    setRequestsPanelOpen,
    setHistoricalDateFilter,
    loadMyRequests,
    setMyRequestsPanelOpen,
    setMyRequestsDateFilter,
    submitRequest,
    setRequestState,
    setRequestForm,
    resetRequestModal
  ])

  useEffect(() => {
    if (!canViewSchedule || typeof loadSchedules !== 'function') {
      return
    }

    loadSchedules()
  }, [canViewSchedule, loadSchedules])

  useEffect(() => {
    if (!isScheduleOpen || typeof loadSchedules !== 'function') {
      return
    }

    loadSchedules()

    const interval = setInterval(() => {
      loadSchedules(true)
    }, 15000)

    return () => {
      clearInterval(interval)
    }
  }, [isScheduleOpen, loadSchedules])

  useEffect(() => {
    if (!isRoomScheduleOpen || typeof loadSchedules !== 'function') {
      return
    }

    loadSchedules()

    const interval = setInterval(() => {
      loadSchedules(true)
    }, 15000)

    return () => {
      clearInterval(interval)
    }
  }, [isRoomScheduleOpen, loadSchedules])

  useEffect(() => () => {
    resetHomePageState()
  }, [resetHomePageState])

  return null
}

export default HomePageStateProvider
