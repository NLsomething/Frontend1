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

function SchoolModel({ modelUrl, position, buildingId, onBuildingClick }) {
  const handleClick = (e) => {
    e.stopPropagation()
    if (onBuildingClick && buildingId !== undefined && buildingId !== null) {
      // Pass the primitive id to the handler; HomePage will resolve the object
      onBuildingClick(buildingId)
    }
  }

  // Don't render anything if no model URL
  if (!modelUrl) {
    console.log('[SchoolModel] No model URL or building id:', { buildingId: !!buildingId, modelUrl })
    return (
      <>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <directionalLight position={[-10, 5, -5]} intensity={0.3} />
      </>
    )
  }

  console.log('[SchoolModel] Loading model from:', modelUrl)

  return (
    <Suspense fallback={
      <mesh position={position} onClick={handleClick}>
        <boxGeometry args={[10, 10, 10]} />
        <meshStandardMaterial color="orange" />
      </mesh>
    }>
      <Model modelUrl={modelUrl} position={position} onClick={handleClick} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <directionalLight position={[-10, 5, -5]} intensity={0.3} />
    </Suspense>
  )
}

export default SchoolModel
