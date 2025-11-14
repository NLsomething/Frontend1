import { useState, useCallback, useMemo } from 'react';

export const usePanelManager = () => {
  const [unifiedPanelContentType, setUnifiedPanelContentType] = useState(null);
  const [centerPanelContentType, setCenterPanelContentType] = useState(null);
  const [isBuildingInfoOpen, setIsBuildingInfoOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isRoomScheduleOpen, setIsRoomScheduleOpen] = useState(false);
  const [isBuildingDropdownOpen, setIsBuildingDropdownOpen] = useState(false);
  const [isDropdownClosing, setIsDropdownClosing] = useState(false);
  const [heroCollapsed, setHeroCollapsed] = useState(false);

  // Room schedule state
  const [roomScheduleRoomCode, setRoomScheduleRoomCode] = useState(null);
  const [roomScheduleRoomName, setRoomScheduleRoomName] = useState('');
  const [roomScheduleBookable, setRoomScheduleBookable] = useState(true);
  const [roomScheduleRoomType, setRoomScheduleRoomType] = useState(null);

  const isUnifiedPanelOpen = useMemo(() => unifiedPanelContentType !== null, [unifiedPanelContentType]);
  const isCenterPanelOpen = useMemo(() => centerPanelContentType !== null, [centerPanelContentType]);

  const handleUnifiedPanelClose = useCallback(() => {
    const currentType = unifiedPanelContentType;
    
    setUnifiedPanelContentType(null);

    if (currentType === 'room-schedule') {
      setIsRoomScheduleOpen(false);
      setRoomScheduleRoomCode(null);
      setRoomScheduleRoomName('');
      setRoomScheduleBookable(true);
      setRoomScheduleRoomType(null);
    }
  }, [unifiedPanelContentType]);

  const handleCenterPanelClose = useCallback(() => {
    setCenterPanelContentType(null);
  }, []);

  const handleOpenRoomSchedulePanel = useCallback((roomMeta) => {
    if (!roomMeta) return;
    const roomCode = roomMeta.room_code || roomMeta.roomNumber || roomMeta.room_number || roomMeta.code || null;
    if (!roomCode) return;

    const displayName = roomMeta.room_name || roomMeta.roomNumber || roomMeta.room_number || roomCode;
    const isBookable = String(roomMeta.bookable).toLowerCase() === 'true' || roomMeta.bookable === true;

    setRoomScheduleRoomCode(roomCode);
    setRoomScheduleRoomName(displayName);
    setRoomScheduleBookable(isBookable);
    setRoomScheduleRoomType(roomMeta.room_type || null);
    setUnifiedPanelContentType('room-schedule');
    setIsRoomScheduleOpen(true);
  }, []);

  const handleCloseRoomSchedulePanel = useCallback(() => {
    setIsRoomScheduleOpen(false);
    setRoomScheduleRoomCode(null);
    setRoomScheduleRoomName('');
    setRoomScheduleBookable(true);
    setRoomScheduleRoomType(null);
    setUnifiedPanelContentType((prev) => (prev === 'room-schedule' ? null : prev));
  }, []);

  const handleOpenDropdown = useCallback(() => {
    setIsDropdownClosing(false);
    setIsBuildingDropdownOpen(true);
  }, []);

  const handleCloseDropdown = useCallback(() => {
    setIsDropdownClosing(true);
    setIsBuildingInfoOpen(false);
    setTimeout(() => {
      setIsBuildingDropdownOpen(false);
      setIsDropdownClosing(false);
    }, 200);
  }, []);

  return {
    state: {
      unifiedPanelContentType,
      centerPanelContentType,
      isBuildingInfoOpen,
      isScheduleOpen,
      isRoomScheduleOpen,
      isBuildingDropdownOpen,
      isDropdownClosing,
      heroCollapsed,
      roomScheduleRoomCode,
      roomScheduleRoomName,
      roomScheduleBookable,
      roomScheduleRoomType,
      isUnifiedPanelOpen,
      isCenterPanelOpen,
    },
    actions: {
      setUnifiedPanelContentType,
      setCenterPanelContentType,
      setIsBuildingInfoOpen,
      setIsScheduleOpen,
      setHeroCollapsed,
      handleUnifiedPanelClose,
      handleCenterPanelClose,
      handleOpenRoomSchedulePanel,
      handleCloseRoomSchedulePanel,
      handleOpenDropdown,
      handleCloseDropdown,
      setRoomScheduleRoomCode,
      setRoomScheduleRoomName,
      setRoomScheduleBookable,
      setRoomScheduleRoomType,
    },
  };
};
