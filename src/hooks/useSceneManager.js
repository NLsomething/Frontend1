import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import {
  setObjectTransparency,
  setRoomHighlight,
  concealRouteAndNodeObjects,
  revealRouteAndNodeObjects,
  applyTemporaryOpacity,
  restoreTemporaryOpacity,
} from '../components/SchoolModel';
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
  const highlightedPathNamesRef = useRef(new Set());
  const pathOcclusionActiveRef = useRef(false);
  const [upperLayerTransparent, setUpperLayerTransparent] = useState(false);
  const [floor2Hidden, setFloor2Hidden] = useState(false);

  const PATH_OPACITY_STORAGE_KEY = '__pathOpacityPrevMaterial';
  
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
    // Ensure pathfinding helpers are concealed by default.
    concealRouteAndNodeObjects(scene);
    console.log('[SceneManager] Scene loaded and stored in ref');
  }, []);

  const setRouteNodesVisible = useCallback((visible) => {
    if (!sceneRef.current) return

    if (visible) {
      revealRouteAndNodeObjects(sceneRef.current)
    } else {
      concealRouteAndNodeObjects(sceneRef.current)
    }
  }, [])

  const clearPathHighlightsOnly = useCallback((opts = {}) => {
    if (!sceneRef.current) return
    const { concealHelpers = false } = opts

    const names = Array.from(highlightedPathNamesRef.current || [])
    names.forEach((name) => {
      setRoomHighlight(sceneRef.current, name, false)
    })
    highlightedPathNamesRef.current = new Set()

    if (concealHelpers) {
      concealRouteAndNodeObjects(sceneRef.current)
    }
  }, [])

  const disablePathOcclusion = useCallback(() => {
    if (!sceneRef.current) return
    if (!pathOcclusionActiveRef.current) return

    restoreTemporaryOpacity(sceneRef.current, PATH_OPACITY_STORAGE_KEY)
    pathOcclusionActiveRef.current = false
  }, [])

  const enablePathOcclusionForPath = useCallback(({ excludeNames = [], opacity = 0.25 } = {}) => {
    if (!sceneRef.current) return

    // Re-apply cleanly so exclude list can change without leaving stale meshes faded.
    restoreTemporaryOpacity(sceneRef.current, PATH_OPACITY_STORAGE_KEY)

    const isRouteOrNode = (name) => {
      if (!name) return false
      return /^Route\d+$/i.test(name) || /^Node\d+$/i.test(name) || /^Route/i.test(name) || /^Node/i.test(name)
    }

    const shouldAffect = (mesh) => {
      // Fade floor slab + room geometry; do not fade nodes/routes.
      let cur = mesh
      let depth = 0
      while (cur && depth < 12) {
        const name = cur?.name
        if (isRouteOrNode(name)) return false
        if (name === 'Floor' || name === '1stLayer' || name === 'Unuse1') return true
        if (typeof name === 'string' && /^MB/.test(name)) return true
        cur = cur.parent
        depth += 1
      }
      return false
    }

    applyTemporaryOpacity(sceneRef.current, {
      opacity,
      shouldAffect,
      excludeNames,
      storageKey: PATH_OPACITY_STORAGE_KEY,
    })

    pathOcclusionActiveRef.current = true
  }, [])

  const clearPathInScene = useCallback((opts = {}) => {
    if (!sceneRef.current) return

    const { concealHelpers = true } = opts
    clearPathHighlightsOnly({ concealHelpers })
    disablePathOcclusion()
  }, [clearPathHighlightsOnly, disablePathOcclusion])

  const showPathInScene = useCallback(({ nodes = [], routes = [] } = {}) => {
    if (!sceneRef.current) return

    // Keep helpers concealed overall; only the path nodes/routes will stand out via highlight.
    concealRouteAndNodeObjects(sceneRef.current)

    // Clear any previous path highlight without leaving path-mode.
    clearPathHighlightsOnly({ concealHelpers: false })

    const nextNames = new Set()
    ;(Array.isArray(nodes) ? nodes : []).forEach((name) => {
      if (name) nextNames.add(String(name))
    })
    ;(Array.isArray(routes) ? routes : []).forEach((name) => {
      if (name) nextNames.add(String(name))
    })

    nextNames.forEach((name) => {
      // Original green color, but brighter glow for path visualization.
      // Original green path highlight with stronger glow.
      setRoomHighlight(sceneRef.current, name, true, 0x00ff00, 20.0, true)
    })

    highlightedPathNamesRef.current = nextNames
  }, [clearPathHighlightsOnly])

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
    if (floorName === 'Floor 2' && sceneRef.current && !floor2Hidden) {
      const opacity = isExpanded ? 0 : 1;
      setObjectTransparency(sceneRef.current, '2ndLayer', opacity);
      setUpperLayerTransparent(isExpanded);
    }
  }, [floor2Hidden]);

  const setFloor2Visibility = useCallback((hidden) => {
    if (!sceneRef.current) return;

    const opacity = hidden ? 0 : 1;
    // Hide the entire floor 2 geometry group(s)
    setObjectTransparency(sceneRef.current, '2ndLayer', opacity);
    setObjectTransparency(sceneRef.current, 'Floor', opacity);

    // Some Floor 2 rooms are not under the Floor/2ndLayer groups; hide them explicitly.
    const isFloor2RoomName = (name) => {
      if (!name) return false;
      if (name === 'Unuse1') return true;
      if (name === 'Unuse2') return true;
      if (/^MB2(?:0[1-9]|1\d|2[0-1])$/.test(name)) return true; // MB201..MB221
      if (/^MB-2(?:0[1-9]|1\d|2[0-1])$/.test(name)) return true; // tolerate MB-201..MB-221
      if (/^MB-WC[5-8]$/.test(name)) return true; // MB-WC5..MB-WC8
      if (name === 'MB-PKTD') return true;
      if (name === 'MB-PH1') return true;
      if (name === 'MB-PH2') return true;
      if (name === 'MB-VPBGH') return true;
      if (name === 'MB-PNCS') return true;
      if (name === 'MB-HT') return true;
      return false;
    };

    const applyHiddenState = (root) => {
      root.traverse((obj) => {
        // Save/restore visibility
        if (hidden) {
          if (obj.userData && obj.userData.__prevVisibleForFloor2Hide === undefined) {
            obj.userData.__prevVisibleForFloor2Hide = obj.visible;
          }
          obj.visible = false;

          // Extra safety: prevent interactions even if something forces visibility
          if (obj.userData && obj.userData.__prevRaycastForFloor2Hide === undefined) {
            obj.userData.__prevRaycastForFloor2Hide = obj.raycast;
          }
          obj.raycast = () => {};
          return;
        }

        if (obj.userData && obj.userData.__prevVisibleForFloor2Hide !== undefined) {
          obj.visible = obj.userData.__prevVisibleForFloor2Hide;
          delete obj.userData.__prevVisibleForFloor2Hide;
        } else {
          obj.visible = true;
        }

        if (obj.userData && obj.userData.__prevRaycastForFloor2Hide !== undefined) {
          obj.raycast = obj.userData.__prevRaycastForFloor2Hide;
          delete obj.userData.__prevRaycastForFloor2Hide;
        } else {
          delete obj.raycast;
        }
      });
    };

    // Find and apply to each named room object and its descendants
    sceneRef.current.traverse((child) => {
      if (isFloor2RoomName(child?.name)) {
        applyHiddenState(child);
      }
    });

    setFloor2Hidden(Boolean(hidden));
    if (hidden) {
      // When floor 2 is hidden entirely, it can't also be in "transparent layer removed" mode.
      setUpperLayerTransparent(false);
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
      floor2Hidden,
    },
    actions: {
      highlightRoomInScene,
      setFloorTransparency,
      setFloor2Visibility,
      setRouteNodesVisible,
      showPathInScene,
      clearPathInScene,
      enablePathOcclusionForPath,
      disablePathOcclusion,
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
    floor2Hidden,
    highlightRoomInScene,
    setFloorTransparency,
    setFloor2Visibility,
    setRouteNodesVisible,
    showPathInScene,
    clearPathInScene,
    enablePathOcclusionForPath,
    disablePathOcclusion,
    scenePropsObject,
    canvasEventHandlers,
  ]);
};
