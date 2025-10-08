import { useGLTF } from '@react-three/drei'
import { useEffect } from 'react'

function SchoolModel() {
  const { scene } = useGLTF('/3dmodel/SuburbanSchool2.glb')
  
  useEffect(() => {
    // Traverse the scene and enable shadows
    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
  }, [scene])

  return (
    <primitive 
      object={scene} 
      scale={1}
      position={[0, 0, 0]}
      rotation={[0, 0, 0]}
    />
  )
}

// Preload the model
useGLTF.preload('/3dmodel/SuburbanSchool2.glb')

export default SchoolModel
