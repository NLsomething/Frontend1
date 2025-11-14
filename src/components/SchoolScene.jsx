import { memo, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import SchoolModel from './SchoolModel'

// Use the function keyword for memo's display name
const SchoolScene = memo(function SchoolScene({
  modelUrl,
  position,
  buildingId,
  // buildingLoading, // This prop is no longer needed here
  heroCollapsed,
  controlsRef,
  onBuildingClick,
  onRoomClick,
  onCameraStart,
  onCameraEnd,
  onSceneLoaded,
  allBuildings,
  selectedBuilding
}) {
  const renderCounter = useRef(0)
  renderCounter.current += 1
  console.log('[SchoolScene] render', {
    count: renderCounter.current,
    buildingId: buildingId ?? null,
    // buildingLoading: !!buildingLoading, // No longer tracking
    heroCollapsed: !!heroCollapsed,
  })

  return (
    <Canvas
      camera={{ position: [323.46, 105.84, 0.82988], fov: 50 }}
      style={{
        background: 'radial-gradient(circle at 32% 18%, rgba(140,160,180,0.4) 0%, rgba(90,110,130,0.6) 55%, rgba(60,80,100,0.8) 100%)'
      }}
    >
      {/* * REMOVED THE !buildingLoading CHECK. 
        * We render the models always. 
        * The <Suspense> inside SchoolModel will handle loading.
      */}
      {allBuildings && allBuildings.length > 0 ? (
        allBuildings.map((building) => {
          const isSelected = selectedBuilding?.id === building.id
          return (
            <SchoolModel
              key={building.id}
              modelUrl={building.model_url}
              position={[building.pos_x || 0, building.pos_y || 0, building.pos_z || 0]}
              buildingId={building.id}
              // Only allow clicking if hero is collapsed
              onBuildingClick={heroCollapsed ? onBuildingClick : null}
              // Only allow room clicks if hero collapsed AND this building is selected
              onRoomClick={heroCollapsed && isSelected ? onRoomClick : null}
              // Only notify scene load for the selected building
              onSceneLoaded={isSelected ? onSceneLoaded : null}
            />
          )
        })
      ) : (
        /* This fallback is likely for when allBuildings hasn't loaded yet */
        <SchoolModel
          modelUrl={modelUrl}
          position={position}
          buildingId={buildingId}
          onBuildingClick={heroCollapsed ? onBuildingClick : null}
          onRoomClick={heroCollapsed ? onRoomClick : null}
          onSceneLoaded={onSceneLoaded}
        />
      )}
      <OrbitControls
        ref={controlsRef}
        enableZoom={heroCollapsed}
        enablePan={false}
        enableRotate={heroCollapsed}
        minDistance={10}
        maxDistance={500}
        maxPolarAngle={Math.PI / 2}
        autoRotate={false}
        mouseButtons={{
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.PAN
        }}
        onStart={() => {
          if (typeof onCameraStart === 'function') {
            onCameraStart()
          }
        }}
        onEnd={() => {
          if (typeof onCameraEnd === 'function') {
            onCameraEnd()
          }
        }}
      />
    </Canvas>
  )
})

// Simpler, more effective memo comparison
export default memo(SchoolScene, (prevProps, nextProps) => {
  if (prevProps.heroCollapsed !== nextProps.heroCollapsed) return false
  if (prevProps.selectedBuilding?.id !== nextProps.selectedBuilding?.id) return false
  
  // This relies on `buildingsList` from HomePage being memoized
  if (prevProps.allBuildings !== nextProps.allBuildings) return false
  
  // These props are stable callbacks from useSceneManager, they should never change
  if (prevProps.onBuildingClick !== nextProps.onBuildingClick) return false
  if (prevProps.onRoomClick !== nextProps.onRoomClick) return false
  if (prevProps.onSceneLoaded !== nextProps.onSceneLoaded) return false
  
  // Prop is stable
  if (prevProps.controlsRef !== nextProps.controlsRef) return false
  
  // Props are the same, skip re-render
  return true
})
