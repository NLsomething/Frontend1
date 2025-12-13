import { useState, useMemo, useCallback } from 'react';
import { fetchRoomsByBuildingId } from '../services/roomService';
import { groupRoomsByFloor } from '../utils';
import { useNotifications } from '../context/NotificationContext';

export const useBuildingManager = () => {
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [buildingRooms, setBuildingRooms] = useState([]);
  const [buildingRoomsLoading, setBuildingRoomsLoading] = useState(false);
  const { notifyError } = useNotifications();

  const normalizeRoomCode = useCallback((value) => {
    if (value === undefined || value === null) return null;
    const text = String(value).trim();
    return text.length ? text : null;
  }, []);

  const getRoomCodeAliases = useCallback((value) => {
    const normalized = normalizeRoomCode(value);
    if (!normalized) return [];

    const aliases = new Set();
    const addWithCaseVariants = (text) => {
      if (!text) return;
      aliases.add(text);
      aliases.add(text.toUpperCase());
      aliases.add(text.toLowerCase());
    };

    addWithCaseVariants(normalized);

    // Tolerate room codes stored with model prefixes (MB-/MB)
    if (normalized.startsWith('MB-')) {
      addWithCaseVariants(normalized.substring(3));
    } else if (normalized.startsWith('MB') && normalized.length > 2) {
      addWithCaseVariants(normalized.substring(2));
    }

    // Tolerate Blender duplicate suffixes (e.g. VPBGH.001 -> VPBGH)
    const withoutNumericSuffix = normalized.replace(/\.\d+$/, '');
    if (withoutNumericSuffix !== normalized) {
      addWithCaseVariants(withoutNumericSuffix);

      // Also apply MB prefix stripping after removing suffix
      if (withoutNumericSuffix.startsWith('MB-')) {
        addWithCaseVariants(withoutNumericSuffix.substring(3));
      } else if (withoutNumericSuffix.startsWith('MB') && withoutNumericSuffix.length > 2) {
        addWithCaseVariants(withoutNumericSuffix.substring(2));
      }
    }

    // Tolerate ROOM### codes for Floor 1 classrooms (ROOM101 <-> 101)
    const base = withoutNumericSuffix;
    const roomPrefixMatch = base.match(/^ROOM\s*(\d{3})$/i);
    if (roomPrefixMatch) {
      const digits = roomPrefixMatch[1];
      aliases.add(digits);
      aliases.add(digits.toUpperCase());
      aliases.add(digits.toLowerCase());
    }

    if (/^\d{3}$/.test(base)) {
      const withPrefix = `ROOM${base}`;
      aliases.add(withPrefix);
      aliases.add(withPrefix.toUpperCase());
      aliases.add(withPrefix.toLowerCase());

      const withSpacedPrefix = `Room ${base}`;
      aliases.add(withSpacedPrefix);
      aliases.add(withSpacedPrefix.toUpperCase());
      aliases.add(withSpacedPrefix.toLowerCase());
    }

    return Array.from(aliases);
  }, [normalizeRoomCode]);

  const buildingId = useMemo(() => selectedBuilding?.id ?? null, [selectedBuilding]);
  
  // Memoized derived data
  const roomsByFloor = useMemo(() => groupRoomsByFloor(buildingRooms), [buildingRooms]);
  
  const roomLookupByCode = useMemo(() => {
    const map = new Map();
    buildingRooms.forEach((room) => {
      const code = room?.room_code || room?.roomNumber || room?.room_number || room?.code;

      const aliases = getRoomCodeAliases(code);
      if (!aliases.length) return;

      aliases.forEach((key) => map.set(key, room));

      // Also keep raw original value if it differs (defensive)
      if (code) {
        map.set(String(code), room);
      }
    });
    return map;
  }, [buildingRooms, getRoomCodeAliases]);

  // Action to fetch rooms for a building
  const fetchRoomsForBuilding = useCallback(async (building) => {
    if (!building?.id) {
      setBuildingRooms([]);
      return;
    }
    
    setBuildingRoomsLoading(true);
    try {
      const { data, error } = await fetchRoomsByBuildingId(building.id);
      if (error) {
        notifyError('Failed to load rooms', {
          description: `Could not fetch rooms for ${building.building_name}.`
        });
        setBuildingRooms([]);
      } else {
        setBuildingRooms(data || []);
      }
    } catch (err) {
      notifyError('Failed to load rooms', { description: err.message });
      setBuildingRooms([]);
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
