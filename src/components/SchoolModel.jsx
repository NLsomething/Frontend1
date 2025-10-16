import { Suspense } from 'react'
import { useGLTF } from '@react-three/drei'

function Model({ modelUrl, position, onClick }) {
  const { scene } = useGLTF(modelUrl)

  return (
    <primitive 
      object={scene} 
      scale={1} 
      position={position}
      onClick={onClick}
      onPointerOver={() => {
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto'
      }}
    />
  )
}

function SchoolModel({ building, onBuildingClick }) {
  const modelUrl = building?.model_url || '/assets/3dmodel/SuburbanSchool2.glb'
  const position = [
    building?.pos_x ?? 0,
    building?.pos_y ?? 0,
    building?.pos_z ?? 0
  ]

  const handleClick = (e) => {
    e.stopPropagation()
    if (onBuildingClick && building) {
      onBuildingClick(building)
    }
  }

  const handleGroundClick = (e) => {
    e.stopPropagation()
    // Clicking on ground/empty space deselects the building
    if (onBuildingClick) {
      onBuildingClick(null)
    }
  }

  return (
    <Suspense fallback={null}>
      <Model modelUrl={modelUrl} position={position} onClick={handleClick} />
      
      {/* Invisible ground plane to detect clicks outside the building */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -0.1, 0]}
        onClick={handleGroundClick}
      >
        <planeGeometry args={[200, 200]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <directionalLight position={[-10, 5, -5]} intensity={0.3} />
    </Suspense>
  )
}

export default SchoolModel
