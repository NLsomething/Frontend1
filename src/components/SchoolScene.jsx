import { memo, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import SchoolModel from './SchoolModel'

const SchoolScene = memo(function SchoolScene({
  modelUrl,
  position,
  buildingId,
  buildingLoading,
  heroCollapsed,
  controlsRef,
  onBuildingClick,
  onCameraStart,
  onCameraEnd
}) {
  const renderCounter = useRef(0)
  renderCounter.current += 1
  // Debugging: log prop changes to help trace unnecessary re-renders
  // Remove or guard these logs in production
  try {
    console.log('[SchoolScene] render', {
      count: renderCounter.current,
      buildingId: buildingId ?? null,
      buildingLoading: !!buildingLoading,
      heroCollapsed: !!heroCollapsed,
      hasOnBuildingClick: typeof onBuildingClick === 'function'
    })
  } catch {
    // ignore
  }
  return (
    <Canvas
      camera={{ position: [40, 25, 40], fov: 50 }}
      style={{
        background: 'radial-gradient(circle at 32% 18%, rgba(140,160,180,0.4) 0%, rgba(90,110,130,0.6) 55%, rgba(60,80,100,0.8) 100%)'
      }}
    >
      {!buildingLoading && (
        <SchoolModel
          modelUrl={modelUrl}
          position={position}
          buildingId={buildingId}
          onBuildingClick={heroCollapsed ? onBuildingClick : null}
        />
      )}
      <OrbitControls
        ref={controlsRef}
        enableZoom={heroCollapsed}
        enablePan={false}
        enableRotate={heroCollapsed}
        minDistance={10}
        maxDistance={100}
        maxPolarAngle={Math.PI / 2}
        autoRotate
        autoRotateSpeed={2}
        mouseButtons={{
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.PAN
        }}
        onStart={() => {
          if (typeof onCameraStart === 'function') {
            onCameraStart()
          }
          if (controlsRef?.current && heroCollapsed) {
            controlsRef.current.autoRotate = false
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

export default SchoolScene
