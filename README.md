# Classroom Insight — Frontend

A React single-page application for booking and managing classroom schedules at a university campus. It pairs an interactive **3D WebGL model of the campus** with a full scheduling, room-request, and user-management workflow backed by **Supabase**.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Architecture Overview](#architecture-overview)
4. [Pages](#pages)
5. [Components](#components)
6. [Hooks](#hooks)
7. [Store](#store)
8. [Services](#services)
9. [Context](#context)
10. [Constants](#constants)
11. [Utilities & Library](#utilities--library)
12. [Styles](#styles)
13. [Role System](#role-system)
14. [Data Flow](#data-flow)
15. [Environment Variables](#environment-variables)
16. [Running Locally](#running-locally)

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI framework | React 19 (JSX, hooks) |
| Routing | React Router v7 |
| 3D rendering | Three.js + `@react-three/fiber` + `@react-three/drei` |
| State management | Zustand v5 |
| Backend / Auth / DB | Supabase (PostgreSQL + Auth) |
| Styling | Tailwind CSS v4 + plain CSS modules per page |
| Build tool | Vite (rolldown-vite variant) + SWC |
| Linting | ESLint 9 with `react-hooks` and `react-refresh` plugins |

---

## Project Structure

```
Frontend1/
├── index.html                    # Vite HTML entry point
├── vite.config.js                # Vite config (react-swc plugin)
├── package.json
├── eslint.config.js
├── postcss.config.js             # Tailwind CSS PostCSS config
├── docs/
│   └── SERVER_DEBUG_GUIDE.md     # Supabase / server debug notes
└── src/
    ├── main.jsx                  # ReactDOM.createRoot entry
    ├── App.jsx                   # Router + lazy-loaded pages
    ├── App.css                   # Global reset / base styles
    ├── index.css                 # Tailwind directives
    ├── assets/
    │   ├── images/loginbg.jpg    # Login page background image
    │   └── map_data.json         # Pathfinding graph + route map for the campus
    ├── context/
    │   ├── AuthContext.jsx       # Auth state (user, session, role, profile)
    │   └── NotificationContext.jsx # In-app toast notifications
    ├── constants/
    │   ├── roles.js              # USER_ROLES enum + display labels
    │   ├── schedule.js           # SCHEDULE_STATUS enum + styles
    │   ├── requests.js           # ROOM_REQUEST_STATUS enum + styles
    │   ├── colors.js             # Shared color tokens
    │   └── quotes.js             # Inspirational quotes for the login page
    ├── lib/
    │   ├── supabaseClient.js     # Supabase client singleton
    │   └── pathfinding/
    │       ├── shortestPath.js   # Dijkstra algorithm + route-object helper
    │       └── navigationMapping.js # Gate node constants + room→node resolver
    ├── services/                 # All Supabase data-access functions
    │   ├── authService.js        # signUp, signIn, signOut, resetPassword, …
    │   ├── authExtensions.js     # checkEmailExists helper
    │   ├── profileService.js     # getProfile, createProfile
    │   ├── buildingService.js    # fetchBuildings, fetchBuildingByCode/Id
    │   ├── floorService.js       # fetchFloorsByBuildingId
    │   ├── roomService.js        # fetchRoomsByBuildingId, fetchRoomById
    │   ├── timeslotService.js    # fetchTimeslots
    │   ├── scheduleService.js    # getSchedulesByDate, upsertScheduleEntry, deleteScheduleEntry
    │   ├── roomRequestService.js # createRoomRequest, fetchRoomRequests, updateRoomRequestStatus
    │   └── userManagementService.js # getAllUsers (RPC), updateUserRole, deleteUser (RPC), updateUsername
    ├── stores/
    │   └── useHomePageStore.js   # Zustand store: schedule map + room-request modal state
    ├── hooks/
    │   ├── index.js              # Re-exports all hooks
    │   ├── useCoreData.js        # Fetches buildings + timeslots on mount
    │   ├── usePanelManager.js    # All UI panel open/close state (sidebar, dropdown, modals)
    │   ├── useBuildingManager.js # Selected building, rooms, floor grouping, code aliases
    │   ├── useSceneManager.js    # 3D scene interaction: highlights, transparency, pathfinding visuals
    │   ├── useCameraControls.js  # Camera keyboard (WASD) + cinematic fly-to animations
    │   ├── useRoomSchedule.js    # Fetch + merge schedule entries for a single room
    │   ├── useRoomRequests.js    # Full room-request CRUD lifecycle (submit, approve, reject, …)
    │   └── useScheduleManagement.js # Building-wide schedule map; save/delete slot entries
    ├── pages/
    │   ├── LoginPage.jsx         # Email + password sign-in
    │   ├── RegisterPage.jsx      # Account creation
    │   ├── ForgotPasswordPage.jsx # Request password-reset email
    │   ├── ResetPasswordPage.jsx  # Set new password via reset token
    │   ├── HomePage.jsx          # Main dashboard (3D campus + all panels)
    │   └── UserManagementPage.jsx # Admin: list / edit / delete users
    ├── components/
    │   ├── ProtectedRoute.jsx    # Route guard (redirects unauthenticated users)
    │   ├── SchoolScene.jsx       # @react-three/fiber Canvas wrapper
    │   ├── SchoolModel.jsx       # Three.js GLB loader + highlight / transparency helpers
    │   └── HomePage/             # HomePage sub-components (all rendered from HomePage.jsx)
    │       ├── HomePageStateProvider.jsx   # Wires Zustand store handlers from hooks
    │       ├── SearchBuilding.jsx          # Global room search bar
    │       ├── BuildingInfoModal.jsx       # Floor accordion with room list
    │       ├── UnifiedPanel.jsx            # Right-side sliding panel container
    │       ├── UnifiedPanelCenter.jsx      # Centered modal (request / edit form)
    │       ├── BuildingScheduleContent.jsx # Full schedule grid for a building
    │       ├── RoomScheduleContent.jsx     # Schedule grid for a single room
    │       ├── ScheduleRequestContent.jsx  # "Request this slot" form
    │       ├── ScheduleEditContent.jsx     # Admin/manager: edit a schedule entry
    │       ├── RequestsPanelContent.jsx    # Manager: pending-request review list
    │       └── MyRequestsPanelContent.jsx  # Student/teacher: personal request history
    ├── styles/
    │   ├── Shared.css
    │   ├── LoginPageStyle.css
    │   ├── RegisterPageStyle.css
    │   ├── ForgotPasswordPageStyle.css
    │   ├── ResetPasswordPageStyle.css
    │   ├── HomePageStyle.css              # Root homepage layout
    │   ├── UserManagementPageStyle.css
    │   └── HomePageStyle/                 # One CSS file per HomePage sub-component
    │       ├── BuildingInfoStyle.css
    │       ├── BuildingScheduleStyle.css
    │       ├── RoomScheduleStyle.css
    │       ├── ScheduleRequestStyle.css
    │       ├── ScheduleEditStyle.css
    │       ├── RequestsPanelStyle.css
    │       ├── MyRequestsPanelStyle.css
    │       ├── SearchBuildingStyle.css
    │       ├── UnifiedPanelStyle.css
    │       └── UnifiedPanelCenterStyle.css
    └── utils/
        ├── index.js          # Re-exports all utils
        ├── dateUtils.js      # toIsoDateString and other date helpers
        ├── scheduleUtils.js  # Schedule entry helpers
        ├── homePageUtils.js  # groupRoomsByFloor and other HomePage helpers
        ├── classnames.js     # cn() — lightweight className merger (like clsx)
        ├── debug.js          # Development debug helpers
        └── debugServer.js    # Server-side debug helpers
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  App.jsx (BrowserRouter)                                    │
│  ├── NotificationProvider  ← global toast context          │
│  └── AuthProvider          ← global auth context           │
│      └── Routes (lazy)                                      │
│          ├── /            → LoginPage                       │
│          ├── /register    → RegisterPage                    │
│          ├── /forgot-password → ForgotPasswordPage          │
│          ├── /reset-password  → ResetPasswordPage           │
│          ├── /home        → HomePage  ◄── main dashboard    │
│          └── /users       → UserManagementPage              │
└─────────────────────────────────────────────────────────────┘
```

`HomePage` is the application core. It composes:

```
HomePage.jsx
 ├── useCoreData()            ─ buildings, timeslots (on mount)
 ├── usePanelManager()        ─ all open/close panel state
 ├── useBuildingManager()     ─ selected building + room lookup
 ├── useSceneManager()        ─ 3D scene ref + highlight/path actions
 ├── useCameraControls()      ─ WASD + cinematic camera
 ├── useHomePageStore (Zustand) ─ schedule map + request modal
 │
 ├── <HomePageStateProvider>  ─ wires Zustand setters from hooks
 ├── <SchoolScene>            ─ Three.js 3D campus model
 │    └── <SchoolModel>       ─ GLB + raycasting
 ├── Welcome Modal            ─ first-visit controls guide
 ├── <PageHeader-inline>      ─ brand + nav buttons + SearchBuilding
 ├── Building Dropdown        ─ per-building controls (info / schedule / find-path)
 │    └── <BuildingInfoModal> ─ floor accordion → room list
 ├── <UnifiedPanel>           ─ right panel: schedule / room-schedule / requests
 └── <UnifiedPanelCenter>     ─ centered modal: request form / edit form
```

---

## Pages

### `LoginPage.jsx`
Two-column layout (branding left, form right). Validates email existence via `checkEmailExists()` before attempting `signIn()`. Redirects to `/home` on success.

### `RegisterPage.jsx`
Standard registration form. Calls `signUp()`. On success shows a "check your email" confirmation.

### `ForgotPasswordPage.jsx`
Single email field. Calls `resetPassword()` which sends a Supabase magic-link email with a redirect to `/reset-password`.

### `ResetPasswordPage.jsx`
Reads the reset token from the URL fragment set by Supabase. Calls `updatePassword()`.

### `HomePage.jsx`
The main application page — see [Architecture Overview](#architecture-overview). Key responsibilities:
- Renders the 3D campus scene and handles click events on buildings and rooms
- Controls all panel visibility via `usePanelManager`
- Runs Dijkstra pathfinding on `map_data.json` and visualises the route in the scene
- Coordinates schedule loading, editing, and room-booking requests
- Role-based UI: different header buttons shown to admins, managers, teachers, students

### `UserManagementPage.jsx`
Admin-only table of all users fetched via an RPC call (`get_all_users`). Supports inline editing of username and role, and user deletion via `delete_user` RPC.

---

## Components

### `SchoolScene.jsx`
Thin `@react-three/fiber` `<Canvas>` wrapper. Sets lighting, camera, orbit controls, and mounts `<SchoolModel>`.

### `SchoolModel.jsx`
Loads a `.glb` campus model file. Registers a `raycaster` for click detection on building and room mesh objects. Exports imperative helpers used by `useSceneManager`:
- `setObjectTransparency(scene, name, opacity)` — make named objects transparent
- `setRoomHighlight(scene, name, on, color, intensity, isPath)` — add/remove emissive glow
- `concealRouteAndNodeObjects(scene)` / `revealRouteAndNodeObjects(scene)` — hide/show pathfinding helper objects
- `applyTemporaryOpacity` / `restoreTemporaryOpacity` — dim non-path geometry during path visualisation

### `ProtectedRoute.jsx`
HOC that redirects to `/` if the user is not authenticated.

### `HomePageStateProvider.jsx`
A render-less component that runs `useScheduleManagement` and `useRoomRequests`, then pushes their state and handlers into the Zustand store via `setScheduleHandlers` / `setRequestsHandlers`. This keeps the heavyweight schedule logic out of `HomePage.jsx` while still making it available anywhere via the store.

### `SearchBuilding.jsx`
Autocomplete search input. Accepts building name/code and room code. On selection it calls `onRoomSelect(building, roomCode)` which triggers navigation in `HomePage`.

### `BuildingInfoModal.jsx`
Accordion list of floors and rooms for the currently selected building. Clicking a room opens the room schedule panel.

### `UnifiedPanel.jsx`
Slide-in right panel. Conditionally renders one of:
- `BuildingScheduleContent` — full schedule grid for a building
- `RoomScheduleContent` — single room schedule
- `RequestsPanelContent` — building-manager's request review
- `MyRequestsPanelContent` — student/teacher's own request history

### `UnifiedPanelCenter.jsx`
Centered overlay modal. Renders either:
- `ScheduleRequestContent` — submit a room-booking request
- `ScheduleEditContent` — admin/manager: directly edit a schedule slot

### Content components
| Component | Purpose |
|---|---|
| `BuildingScheduleContent` | Grid of all rooms × timeslots for a building on a given date |
| `RoomScheduleContent` | Grid of timeslots for one room; opens request/edit forms |
| `ScheduleRequestContent` | Form: choose start/end timeslot, course name, week count, notes |
| `ScheduleEditContent` | Form: set status (occupied/maintenance/empty), course name, booked-by |
| `RequestsPanelContent` | List of pending requests with approve / reject / revert actions |
| `MyRequestsPanelContent` | Personal request history with status badges |

---

## Hooks

### `useCoreData`
Parallel-fetches buildings and timeslots on mount. Returns `{ buildings, timeSlots, loading, error }`.

### `usePanelManager`
Pure React state for all panel open/close logic:
- Unified right panel (`unifiedPanelContentType`: `'schedule'`, `'room-schedule'`, `'requests'`, `'my-requests'`)
- Center modal (`centerPanelContentType`: `'schedule-request'`, `'schedule-edit'`)
- Building dropdown open/close with slide-out animation
- Building info accordion (`isBuildingInfoOpen`)
- Room schedule panel state (`roomScheduleRoomCode`, `roomScheduleRoomName`, …)
- Welcome modal visibility (`heroCollapsed`)

### `useBuildingManager`
- Holds `selectedBuilding` and `buildingRooms`
- `roomLookupByCode` — a `Map` keyed by all code aliases (handles `MB-`, `MB`, numeric, `ROOM###` variants)
- `roomsByFloor` — rooms grouped by floor name
- `fetchRoomsForBuilding(building)` — fetches and caches rooms

### `useSceneManager`
Provides stable callbacks for the 3D scene:
- `highlightRoomInScene(name, on)` — emissive glow on/off
- `setFloorTransparency(floorName, isExpanded)` — make 2nd floor see-through
- `setFloor2Visibility(hidden)` — completely hide floor 2 geometry
- `showPathInScene({ nodes, routes })` — highlight a Dijkstra route
- `clearPathInScene()` — remove path and restore opacity
- `enablePathOcclusionForPath({ opacity, excludeNames })` — dim non-path objects
- `focusOnBuilding(building)` — cinematic camera fly-to

### `useCameraControls`
WASD keyboard movement for the orbit-controls camera. Also exports `cinematicTopDownView()` used by `focusOnBuilding`.

### `useRoomSchedule`
Fetches schedule entries for a single room + date and overlays pending requests as `'pending'` status entries.

### `useScheduleManagement`
Building-wide schedule map. Handles slot-range saves (expands start→end into individual slot entries) and deletions. Also overlays pending requests as phantom `'pending'` entries.

### `useRoomRequests`
Full request lifecycle hook (mounted inside `HomePageStateProvider`):
- `submitRequest` — creates a `room_requests` row
- `loadRequests` / `loadMyRequests` — fetches all or personal requests
- `approveRequest` / `rejectRequest` / `revertRequest` — status transitions with Supabase update
- Pushes all state + handlers into the Zustand store

---

## Store

### `useHomePageStore` (Zustand)
Central cross-component state bridge. Contains two slices:

**Schedule slice**
- `scheduleMap` — `{ [roomCode-slotId]: scheduleEntry }` for the current date
- `scheduleLoading`
- Handler refs: `loadSchedules`, `saveSchedule`, `buildScheduleKey`

**Requests slice**
- `requests`, `pendingRequests`, `historicalRequests` — full list data
- `myRequests`, `filteredMyRequests` — personal request data
- `requestState` — currently open request modal parameters (`room`, `roomId`, `startHour`, `endHour`, `isEditMode`, …)
- `requestForm` — form values (courseName, notes, weekCount, …)
- Handler refs: `submitRequest`, `approveRequest`, `rejectRequest`, …

The store also exports memoised selector factories (`selectScheduleSlice`, `selectRequestsSlice`, etc.) to prevent unnecessary re-renders.

---

## Services

All services follow the same pattern: call Supabase, return `{ data, error }`.

| File | Functions |
|---|---|
| `authService.js` | `signUp`, `signIn`, `signOut`, `getSession`, `getCurrentUser`, `resetPassword`, `updatePassword`, `onAuthStateChange` |
| `authExtensions.js` | `checkEmailExists` |
| `profileService.js` | `getProfile`, `createProfile` |
| `buildingService.js` | `fetchBuildings`, `fetchBuildingByCode`, `fetchBuildingById` |
| `floorService.js` | `fetchFloorsByBuildingId` |
| `roomService.js` | `fetchRoomsByBuildingId`, `fetchRoomById` |
| `timeslotService.js` | `fetchTimeslots` |
| `scheduleService.js` | `getSchedulesByDate`, `upsertScheduleEntry`, `deleteScheduleEntry` |
| `roomRequestService.js` | `createRoomRequest`, `fetchRoomRequests`, `updateRoomRequestStatus` |
| `userManagementService.js` | `getAllUsers` (RPC), `updateUserRole`, `deleteUser` (RPC), `updateUsername` |

---

## Context

### `AuthContext`
Exposes: `user`, `session`, `loading`, `profile`, `role`, `profileLoading`, `refreshProfile`, `signOut`.

- Subscribes to `supabase.auth.onAuthStateChange` for real-time session updates.
- Shallow-compares user IDs to avoid redundant re-renders.
- `role` is resolved from `profile.role` first, then `user.user_metadata.role` as fallback.

### `NotificationContext`
In-app toast system with `success`, `error`, and `info` variants. Each toast auto-dismisses after 4.5 s. Exposes: `notifySuccess`, `notifyError`, `notifyInfo`, `dismissNotification`.

---

## Constants

| File | Exports |
|---|---|
| `roles.js` | `USER_ROLES` (`administrator`, `building_manager`, `teacher`, `student`) and `USER_ROLE_LABELS` |
| `schedule.js` | `SCHEDULE_STATUS` (`empty`, `occupied`, `maintenance`, `pending`) and label/style maps |
| `requests.js` | `ROOM_REQUEST_STATUS` (`pending`, `approved`, `rejected`, `reverted`) and label/style maps; `MAX_ROOM_REQUEST_WEEKS = 12` |
| `colors.js` | Shared colour tokens (blue, rejectedRed, …) |
| `quotes.js` | Array of quotes + `getRandomQuote()` used on the login page |

---

## Utilities & Library

### `utils/classnames.js`
`cn(...inputs)` — simple className joiner, supports strings and conditionals (similar to `clsx`).

### `utils/dateUtils.js`
`toIsoDateString(date)` — converts a `Date` to `YYYY-MM-DD`.

### `utils/homePageUtils.js`
`groupRoomsByFloor(rooms)` — groups a flat room array into `{ floorName: [rooms] }`.

### `utils/scheduleUtils.js`
Helpers for deriving display properties from schedule entries.

### `lib/supabaseClient.js`
Reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from env, throws if missing, exports the singleton `supabase` client.

### `lib/pathfinding/shortestPath.js`
- `dijkstraPath(graph, start, end)` — returns ordered node array or `null` if no path.
- `pathNodesToRouteObjects(nodes, routeMap)` — maps consecutive node pairs to 3D object names for scene highlighting.

### `lib/pathfinding/navigationMapping.js`
- `START_GATE_NODES` — maps gate ids (`main`, `back`, `rear`) to graph node names.
- `resolveDestinationNode({ roomCode, roomName })` — looks up the graph node for a given room.

### `assets/map_data.json`
JSON with two keys:
- `graph` — adjacency list `{ nodeA: { nodeB: weight, … }, … }` used by Dijkstra.
- `route_map` — `{ "nodeA|nodeB": "RouteObjectName", … }` used to find 3D objects to highlight.

---

## Role System

| Role | Key | Permissions |
|---|---|---|
| `administrator` | `administrator` | Full access: edit schedules, manage requests, manage users |
| `building_manager` | `building_manager` | Edit schedules, manage room requests |
| `teacher` | `teacher` | View schedules, submit room-booking requests |
| `student` | `student` | View schedules, submit room-booking requests |

Permission flags computed in `HomePage.jsx`:
```js
const canEditSchedule   = role === 'administrator' || role === 'building_manager'
const canManageRequests = canEditSchedule
const canRequestRoom    = role === 'teacher' || role === 'student'
```

---

## Data Flow

### Viewing a room schedule
```
User clicks room in 3D scene
  → SchoolModel raycaster fires onRoomClick(objectName)
  → useSceneManager.stableOnRoomClick → HomePage.handleSceneRoomClick
  → roomLookupByCode resolves DB room from object name
  → panelActions.handleOpenRoomSchedulePanel(room)
  → UnifiedPanel renders RoomScheduleContent
  → useRoomSchedule(roomCode, date) fetches schedule + pending overlays
  → grid displayed
```

### Submitting a booking request
```
User clicks slot in RoomScheduleContent
  → setRequestState({ room, startHour, endHour, isOpen: true })
  → Zustand store update
  → panelActions.setCenterPanelContentType('schedule-request')
  → UnifiedPanelCenter renders ScheduleRequestContent
  → User fills form → handleRequestSubmit()
  → roomRequestService.createRoomRequest() → Supabase insert
  → loadSchedules() refreshes the schedule map
```

### Pathfinding
```
User selects a room (roomScheduleRoomCode set)
  → "Find path" button appears
  → User picks a start gate (main / back / rear)
  → START_GATE_NODES[gateId] → startNode
  → resolveDestinationNode(roomCode) → endNode
  → dijkstraPath(graph, start, end) → pathNodes[]
  → pathNodesToRouteObjects(pathNodes, routeMap) → routeNames[]
  → useSceneManager.showPathInScene({ nodes, routes })
  → Three.js scene highlights route objects with green glow
```

---

## Environment Variables

Create a `.env` file (or set in your hosting provider) with:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Both are required; the app throws on startup if either is missing.

---

## Running Locally

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Lint
npm run lint

# Production build
npm run build

# Preview production build
npm run preview
```
