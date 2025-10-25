import { Suspense, useState } from 'react'
import { useGLTF } from '@react-three/drei'

function Model({ modelUrl, position, onClick }) {
  const [error, setError] = useState(null)
  
  try {
    const { scene } = useGLTF(modelUrl)
    
    if (error) {
      console.error('[SchoolModel] Model loading error:', error)
      return null
    }

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
  } catch (err) {
    console.error('[SchoolModel] useGLTF error:', err)
    return null
  }
}

function SchoolModel({ building, onBuildingClick }) {
  const modelUrl = building?.model_url
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

  // Don't render anything if no building or no model URL
  if (!building || !modelUrl) {
    console.log('[SchoolModel] No building or model URL:', { building: !!building, modelUrl })
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
