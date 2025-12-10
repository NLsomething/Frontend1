import { useState, useMemo, useCallback } from 'react';
import { fetchRoomsByBuildingId } from '../services/roomService';
import { groupRoomsByFloor } from '../utils';
import { useNotifications } from '../context/NotificationContext';

export const useBuildingManager = () => {
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [buildingRooms, setBuildingRooms] = useState([]);
  const [buildingRoomsLoading, setBuildingRoomsLoading] = useState(false);
  const { notifyError } = useNotifications();

  const buildingId = useMemo(() => selectedBuilding?.id ?? null, [selectedBuilding]);
  
  // Memoized derived data
  const roomsByFloor = useMemo(() => groupRoomsByFloor(buildingRooms), [buildingRooms]);
  
  const roomLookupByCode = useMemo(() => {
    const map = new Map();
    buildingRooms.forEach((room) => {
      const code = room?.room_code || room?.roomNumber || room?.room_number || room?.code;
      if (code) {
        map.set(code, room);
      }
    });
    return map;
  }, [buildingRooms]);

  // Action to fetch rooms for a building
  const fetchRoomsForBuilding = useCallback(async (building) => {
    if (!building?.id) {
      setBuildingRooms([]);
      return [];
    }
    
    setBuildingRoomsLoading(true);
    try {
      const { data, error } = await fetchRoomsByBuildingId(building.id);
      if (error) {
        notifyError('Failed to load rooms', {
          description: `Could not fetch rooms for ${building.building_name}.`
        });
        setBuildingRooms([]);
        return [];
      } else {
        const rooms = data || [];
        setBuildingRooms(rooms);
        return rooms;
      }
    } catch (err) {
      notifyError('Failed to load rooms', { description: err.message });
      setBuildingRooms([]);
      return [];
    } finally {
      setBuildingRoomsLoading(false);
    }
  }, [notifyError]);

  // Action to set the selected building and fetch its rooms
  const selectBuilding = useCallback((building) => {
    if (building?.id === selectedBuilding?.id) {
      // If clicking the same building, deselect it
      setSelectedBuilding(null);
      setBuildingRooms([]);
    } else {
      setSelectedBuilding(building);
      if (building) {
        fetchRoomsForBuilding(building);
      } else {
        setBuildingRooms([]);
      }
    }
  }, [selectedBuilding, fetchRoomsForBuilding]);

  return {
    selectedBuilding,
    buildingId,
    buildingRooms,
    buildingRoomsLoading,
    roomsByFloor,
    roomLookupByCode,
    actions: {
      selectBuilding,
      fetchRoomsForBuilding,
      setSelectedBuilding,
      setBuildingRooms,
    },
  };
};
