import { Suspense } from 'react'
import { useGLTF } from '@react-three/drei'

function Model() {
  const { scene } = useGLTF('/assets/3dmodel/SuburbanSchool2.glb')

  return (
    <primitive object={scene} scale={1} position={[0, 0, 0]} />
  )
}

function SchoolModel() {
  return (
    <Suspense fallback={null}>
      <Model />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <directionalLight position={[-10, 5, -5]} intensity={0.3} />
    </Suspense>
  )
}

export default SchoolModel
