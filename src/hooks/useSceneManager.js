import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { setObjectTransparency, setRoomHighlight } from '../components/SchoolModel';
import { cinematicTopDownView } from './useCameraControls';

export const useSceneManager = ({ onBuildingClick, onRoomClick }) => {
  const controlsRef = useRef();
  const sceneRef = useRef(null);
  
  // Interaction state
  const lastDragEndAtRef = useRef(0);
  const lastBuildingClickAtRef = useRef(0);
  const lastRoomClickAtRef = useRef(0);
  const pointerRef = useRef({ downX: 0, downY: 0, moved: false });
  
  // Scene state
  const [highlightedRoom, setHighlightedRoom] = useState(null);
  const [upperLayerTransparent, setUpperLayerTransparent] = useState(false);
  
  // Ref-based pattern ensures stable callbacks
  const buildingClickHandlerRef = useRef();
  const roomClickHandlerRef = useRef();

  useEffect(() => {
    buildingClickHandlerRef.current = (building) => {
      if (Date.now() - (lastDragEndAtRef.current || 0) < 120) return;
      lastBuildingClickAtRef.current = Date.now();
      onBuildingClick(building);
    };
  }, [onBuildingClick]);

  useEffect(() => {
    roomClickHandlerRef.current = (roomObjectName) => {
      lastRoomClickAtRef.current = Date.now();
      onRoomClick(roomObjectName);
    };
  }, [onRoomClick]);

  const stableOnBuildingClick = useCallback((b) => {
    buildingClickHandlerRef.current?.(b);
  }, []);

  const stableOnRoomClick = useCallback((roomName) => {
    roomClickHandlerRef.current?.(roomName);
  }, []);

  const handleSceneLoaded = useCallback((scene) => {
    sceneRef.current = scene;
    console.log('[SceneManager] Scene loaded and stored in ref');
  }, []);

  const highlightRoomInScene = useCallback((roomObjectName, highlight) => {
    if (!sceneRef.current) return;
    
    // Unhighlight previous
    if (highlightedRoom && !highlight) {
      setRoomHighlight(sceneRef.current, highlightedRoom, false);
      setHighlightedRoom(null);
    }
    
    // Highlight new
    if (highlight && roomObjectName) {
      if (highlightedRoom && highlightedRoom !== roomObjectName) {
        setRoomHighlight(sceneRef.current, highlightedRoom, false);
      }
      setRoomHighlight(sceneRef.current, roomObjectName, true);
      setHighlightedRoom(roomObjectName);
    }
  }, [highlightedRoom]);

  const setFloorTransparency = useCallback((floorName, isExpanded) => {
    if (floorName === 'Floor 2' && sceneRef.current) {
      const opacity = isExpanded ? 0 : 1;
      setObjectTransparency(sceneRef.current, '2ndLayer', opacity);
      setUpperLayerTransparent(isExpanded);
    }
  }, []);

  // Canvas event handlers
  const canvasEventHandlers = useMemo(() => ({
    onMouseDown: (e) => {
      pointerRef.current.downX = e.clientX;
      pointerRef.current.downY = e.clientY;
      pointerRef.current.moved = false;
    },
    onMouseMove: (e) => {
      const dx = Math.abs(e.clientX - pointerRef.current.downX);
      const dy = Math.abs(e.clientY - pointerRef.current.downY);
      if (dx > 6 || dy > 6) pointerRef.current.moved = true;
    },
    onMouseUp: () => {
      if (pointerRef.current.moved) {
        lastDragEndAtRef.current = Date.now();
      }
    },
  }), []);

  // Memoize scene props object to prevent unnecessary re-renders
  const scenePropsObject = useMemo(() => ({
    controlsRef,
    onSceneLoaded: handleSceneLoaded,
    onBuildingClick: stableOnBuildingClick,
    onRoomClick: stableOnRoomClick,
    onCameraStart: () => {},
    onCameraEnd: () => {},
  }), [controlsRef, handleSceneLoaded, stableOnBuildingClick, stableOnRoomClick]);

  // Memoize the entire return object
  return useMemo(() => ({
    refs: {
      controlsRef,
      sceneRef,
      lastDragEndAtRef,
      lastBuildingClickAtRef,
      lastRoomClickAtRef,
      pointerRef,
    },
    state: {
      upperLayerTransparent,
      highlightedRoom,
    },
    actions: {
      highlightRoomInScene,
      setFloorTransparency,
      focusOnBuilding: (building) => {
        if (building) {
          cinematicTopDownView(controlsRef, {
            centerPoint: [building.pos_x || 0, 0, building.pos_z || 0],
            duration: 1500,
          });
        }
      },
    },
    sceneProps: scenePropsObject,
    canvasProps: canvasEventHandlers,
  }), [
    upperLayerTransparent,
    highlightedRoom,
    highlightRoomInScene,
    setFloorTransparency,
    scenePropsObject,
    canvasEventHandlers,
  ]);
};
