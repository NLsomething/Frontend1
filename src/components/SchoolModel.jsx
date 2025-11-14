/* eslint-disable react-refresh/only-export-components */
import { Suspense, useEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

/**
 * Set transparency for a named object in the scene
 * @param {THREE.Object3D} scene - The scene to search
 * @param {string} objectName - Name of the object in Blender
 * @param {number} opacity - Opacity value (0 = fully transparent, 1 = fully opaque)
 */
export const setObjectTransparency = (scene, objectName, opacity) => {
  if (!scene) return

  scene.traverse((child) => {
    if (child.name === objectName) {
      console.log(`Found object: ${objectName}`, child)
      
      // Disable raycast (click detection) when fully transparent
      const isFullyTransparent = opacity === 0
      
      if (child.material) {
        // Handle single material
        if (Array.isArray(child.material)) {
          // Clone each material to avoid affecting other objects
          child.material = child.material.map((mat) => {
            const clonedMat = mat.clone()
            clonedMat.transparent = true
            clonedMat.opacity = opacity
            clonedMat.needsUpdate = true
            return clonedMat
          })
        } else {
          // Clone the material to avoid affecting other objects
          child.material = child.material.clone()
          child.material.transparent = true
          child.material.opacity = opacity
          child.material.needsUpdate = true
        }
      }
      
      // Disable raycast for this object when transparent
      if (isFullyTransparent) {
        child.raycast = () => {} // Disable raycasting
      } else {
        // Re-enable raycast by deleting the override
        delete child.raycast
      }
      
      // Also traverse children of this object
      child.traverse((subChild) => {
        if (subChild !== child) {
          if (subChild.material) {
            if (Array.isArray(subChild.material)) {
              subChild.material = subChild.material.map((mat) => {
                const clonedMat = mat.clone()
                clonedMat.transparent = true
                clonedMat.opacity = opacity
                clonedMat.needsUpdate = true
                return clonedMat
              })
            } else {
              subChild.material = subChild.material.clone()
              subChild.material.transparent = true
              subChild.material.opacity = opacity
              subChild.material.needsUpdate = true
            }
          }
          
          // Disable/enable raycast for children too
          if (isFullyTransparent) {
            subChild.raycast = () => {}
          } else {
            delete subChild.raycast
          }
        }
      })
    }
  })
}

/**
 * Highlight a room by changing its emissive color
 * @param {THREE.Object3D} scene - The scene to search
 * @param {string} roomName - Name of the room object in Blender
 * @param {boolean} highlight - Whether to highlight (true) or unhighlight (false)
 */
export const setRoomHighlight = (scene, roomName, highlight) => {
  if (!scene) return

  scene.traverse((child) => {
    if (child.name === roomName) {
      console.log(`${highlight ? 'Highlighting' : 'Unhighlighting'} room: ${roomName}`, child)
      
      if (child.material) {
        // Handle single material
        if (Array.isArray(child.material)) {
          child.material = child.material.map((mat) => {
            const clonedMat = mat.clone()
            if (highlight) {
              clonedMat.emissive = new THREE.Color(0x00ff00) // Green glow
              clonedMat.emissiveIntensity = 0.5
            } else {
              clonedMat.emissive = new THREE.Color(0x000000) // No glow
              clonedMat.emissiveIntensity = 0
            }
            clonedMat.needsUpdate = true
            return clonedMat
          })
        } else {
          child.material = child.material.clone()
          if (highlight) {
            child.material.emissive = new THREE.Color(0x00ff00) // Green glow
            child.material.emissiveIntensity = 0.5
          } else {
            child.material.emissive = new THREE.Color(0x000000) // No glow
            child.material.emissiveIntensity = 0
          }
          child.material.needsUpdate = true
        }
      }
      
      // Also traverse children of this object
      child.traverse((subChild) => {
        if (subChild.material && subChild !== child) {
          if (Array.isArray(subChild.material)) {
            subChild.material = subChild.material.map((mat) => {
              const clonedMat = mat.clone()
              if (highlight) {
                clonedMat.emissive = new THREE.Color(0x00ff00)
                clonedMat.emissiveIntensity = 0.5
              } else {
                clonedMat.emissive = new THREE.Color(0x000000)
                clonedMat.emissiveIntensity = 0
              }
              clonedMat.needsUpdate = true
              return clonedMat
            })
          } else {
            subChild.material = subChild.material.clone()
            if (highlight) {
              subChild.material.emissive = new THREE.Color(0x00ff00)
              subChild.material.emissiveIntensity = 0.5
            } else {
              subChild.material.emissive = new THREE.Color(0x000000)
              subChild.material.emissiveIntensity = 0
            }
            subChild.material.needsUpdate = true
          }
        }
      })
    }
  })
}

function Model({ modelUrl, position, onClick, onSceneLoaded }) {
  const { scene } = useGLTF(modelUrl)

  useEffect(() => {
    if (scene && onSceneLoaded) {
      onSceneLoaded(scene)
    }
  }, [scene, onSceneLoaded])

  const handlePointerMove = (e) => {
    // Check if hovering over a room object
    let obj = e.object
    let isRoom = false
    let depth = 0
    const maxDepth = 10
    
    while (obj && depth < maxDepth) {
      if (obj.name && (obj.name.startsWith('MB-') || 
          (obj.name.startsWith('MB') && obj.name.length > 2) || 
          obj.name.match(/^\d{3}$/))) {
        isRoom = true
        break
      }
      obj = obj.parent
      depth++
    }
    
    document.body.style.cursor = isRoom ? 'pointer' : 'auto'
  }

  return (
    <primitive 
      object={scene} 
      scale={1} 
      position={position}
      onClick={onClick}
      onPointerMove={handlePointerMove}
      onPointerOut={() => {
        document.body.style.cursor = 'auto'
      }}
    />
  )
}

function SchoolModel({ modelUrl, position, buildingId, onBuildingClick, onRoomClick, onSceneLoaded }) {
  const handleClick = (e) => {
    e.stopPropagation()
    
    // Check if a room object was clicked by traversing up the parent chain
    let clickedObject = e.object
    let roomName = null
    
    // Traverse up to find a room object (objects starting with MB or 3-digit numbers)
    const maxDepth = 10 // Prevent infinite loops
    let depth = 0
    
    while (clickedObject && depth < maxDepth) {
      const name = clickedObject.name
      
      if (name) {
        // Check if this is a room object
        // Matches: MB201, MB-WC5, 201, etc.
        if (name.startsWith('MB-') || 
            (name.startsWith('MB') && name.length > 2) || 
            name.match(/^\d{3}$/)) {
          roomName = name
          console.log('[SchoolModel] Found room object:', roomName, 'at depth:', depth)
          break
        }
      }
      
      clickedObject = clickedObject.parent
      depth++
    }
    
    // If a room was clicked, call the room click handler and stop
    if (roomName && onRoomClick) {
      console.log('[SchoolModel] Room clicked:', roomName)
      onRoomClick(roomName)
      return // Don't trigger building click
    }
    
    // Otherwise, treat as building click
    if (onBuildingClick && buildingId !== undefined && buildingId !== null) {
      console.log('[SchoolModel] Building clicked')
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

  return (
    <Suspense fallback={
      <mesh position={position} onClick={handleClick}>
        <boxGeometry args={[10, 10, 10]} />
        <meshStandardMaterial color="orange" />
      </mesh>
    }>
      <Model 
        modelUrl={modelUrl} 
        position={position} 
        onClick={handleClick}
        onSceneLoaded={onSceneLoaded}
      />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <directionalLight position={[-10, 5, -5]} intensity={0.3} />
    </Suspense>
  )
}

export default SchoolModel
