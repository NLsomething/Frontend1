import { Suspense } from 'react'
import { useGLTF } from '@react-three/drei'

function Model({ modelUrl, position }) {
  const { scene } = useGLTF(modelUrl)

  return (
    <primitive object={scene} scale={1} position={position} />
  )
}

function SchoolModel({ building }) {
  const modelUrl = building?.model_url || '/assets/3dmodel/SuburbanSchool2.glb'
  const position = [
    building?.pos_x ?? 0,
    building?.pos_y ?? 0,
    building?.pos_z ?? 0
  ]

  return (
    <Suspense fallback={null}>
      <Model modelUrl={modelUrl} position={position} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <directionalLight position={[-10, 5, -5]} intensity={0.3} />
    </Suspense>
  )
}

export default SchoolModel
