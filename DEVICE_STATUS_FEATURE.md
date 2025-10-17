# Device Status Integration

## Overview
Added device status display and control functionality to the room 2D layout preview. The system now shows lock status for students/teachers and provides device control for administrators/building managers.

## Changes Made

### 1. New Service: `deviceService.js`
Created a new service to handle device-related operations:
- `fetchDevicesByRoomId(roomId)` - Fetch all devices for a specific room
- `updateDeviceOutput(deviceId, newOutput)` - Toggle device output (lock/unlock)
- `updateDeviceStatus(deviceId, newStatus)` - Update device status (operational/maintenance/broken)

### 2. Updated `BuildingInfoModal.jsx`
Added device functionality to the building info modal:

**State Management:**
- Added `devices` and `devicesLoading` states
- Added `selectedRoomId` to track the current room

**Functions:**
- `loadDevices(roomId)` - Fetches devices for the selected room
- `handleDeviceToggle(device)` - Toggles e-lock between locked/unlocked

**UI Changes:**
- Added "Room Status" section below the 2D preview image
- Role-based display:
  - **Students & Teachers**: Simple status indicator showing if room is locked or unlocked
  - **Administrators & Building Managers**: List of all devices with individual lock/unlock controls

### 3. Updated `HomePage.jsx`
- Added `userRole={role}` prop to BuildingInfoModal component

## User Experience

### For Students and Teachers:
When viewing a room's 2D layout, they see a simple status indicator:
- 🟢 Green badge: "Room is Unlocked"
- 🔴 Red badge: "Room is Locked"

### For Administrators and Building Managers:
When viewing a room's 2D layout, they see:
- List of all devices in the room
- Each device shows:
  - Device name (e.g., "E-Lock 102")
  - Device type and status (e.g., "e-lock • operational")
  - Lock/Unlock button for e-lock devices
- Clicking the button toggles the lock state immediately

## Database Schema Reference
The implementation uses the `devices` table:
```sql
CREATE TABLE public.devices (
  id uuid PRIMARY KEY,
  room_id uuid REFERENCES rooms(id),
  device_name text NOT NULL,
  device_type text NOT NULL,
  status text CHECK (status IN ('operational', 'maintenance', 'broken')),
  device_output text
);
```

## Features
- ✅ Real-time device status display
- ✅ Role-based UI (students/teachers see simple status, admins see controls)
- ✅ Lock/unlock toggle for e-lock devices
- ✅ Visual feedback with color-coded status indicators
- ✅ Automatic state refresh after device updates
- ✅ Error handling with notifications
- ✅ Loading states for better UX

## Next Steps (Optional Enhancements)
- Add device status filtering (show only operational devices)
- Add device maintenance scheduling
- Add audit log for device state changes
- Add real-time device status updates via websockets
- Add support for other device types beyond e-locks
