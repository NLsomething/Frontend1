/* eslint-disable react-refresh/only-export-components */
import { Suspense, useEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { COLORS } from '../constants/colors'

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
export const setRoomHighlight = (
  scene,
  roomName,
  highlight,
  highlightColorHex = 0x00ff00,
  emissiveIntensity = 1.5,
  alwaysOnTop = false
) => {
  if (!scene) return

  const highlightColor = new THREE.Color(highlightColorHex)

  const cloneAndHighlightMaterial = (material) => {
    const applyTo = (mat) => {
      const cloned = mat.clone()

      // Prefer emissive highlight when available
      if ('emissive' in cloned) {
        cloned.emissive = highlightColor
        if ('emissiveIntensity' in cloned) {
          cloned.emissiveIntensity = emissiveIntensity
        }
        // Also push base color so it reads brighter under some lighting setups.
        if ('color' in cloned) {
          cloned.color = highlightColor
        }
      } else if ('color' in cloned) {
        // Fallback: some materials don't support emissive
        cloned.color = highlightColor
      }

      // Prevent transparent surfaces / depth sorting from hiding the highlight when orbiting the camera.
      if (alwaysOnTop) {
        // Ensure the highlighted meshes render after transparent occluders (floor/rooms).
        // Making the material transparent (opacity 1) puts it in the transparent render list;
        // renderOrder is then used to force it to the very end.
        cloned.transparent = true
        cloned.opacity = 1
        cloned.blending = THREE.AdditiveBlending
        if ('side' in cloned) cloned.side = THREE.DoubleSide
        cloned.depthTest = false
        cloned.depthWrite = false
        // Keep tone mapping from dimming emissive too much on some renderers.
        if ('toneMapped' in cloned) cloned.toneMapped = false
      }

      cloned.needsUpdate = true
      return cloned
    }

    return Array.isArray(material) ? material.map(applyTo) : applyTo(material)
  }

  const restoreOriginalMaterial = (obj) => {
    if (obj?.userData?.__originalMaterial) {
      obj.material = obj.userData.__originalMaterial
      delete obj.userData.__originalMaterial
    }

    if (obj?.userData?.__prevRenderOrder !== undefined) {
      obj.renderOrder = obj.userData.__prevRenderOrder
      delete obj.userData.__prevRenderOrder
    }

    if (obj?.userData?.__prevFrustumCulled !== undefined) {
      obj.frustumCulled = obj.userData.__prevFrustumCulled
      delete obj.userData.__prevFrustumCulled
    }
  }

  const applyHighlightToObject = (obj) => {
    if (!obj) return
    if (!obj.material) return

    if (highlight) {
      if (!obj.userData.__originalMaterial) {
        obj.userData.__originalMaterial = obj.material
      }

      if (alwaysOnTop) {
        if (obj.userData.__prevRenderOrder === undefined) {
          obj.userData.__prevRenderOrder = obj.renderOrder
        }
        obj.renderOrder = 9999

        if (obj.userData.__prevFrustumCulled === undefined) {
          obj.userData.__prevFrustumCulled = obj.frustumCulled
        }
        obj.frustumCulled = false
      }

      obj.material = cloneAndHighlightMaterial(obj.material)
      return
    }

    restoreOriginalMaterial(obj)
  }

  let target = null
  scene.traverse((child) => {
    if (child?.name === roomName) {
      target = child
    }
  })

  if (!target) return

  console.log(`${highlight ? 'Highlighting' : 'Unhighlighting'} room: ${roomName}`, target)

  // Apply highlight to the named object and all of its descendants
  target.traverse((obj) => {
    // Only apply highlight to meshes; ignore helper outlines/lines.
    if (obj?.isMesh && !obj?.userData?.__isOutline) {
      applyHighlightToObject(obj)
    }
  })
}

export const applyModelOutlines = (scene, {
  color = COLORS.black,
  opacity = 0.22,
} = {}) => {
  if (!scene) return

  const isRouteOrNodeName = (name) => {
    if (!name) return false
    return /^Route\d+$/i.test(name) || /^Node\d+$/i.test(name) || /^Route/i.test(name) || /^Node/i.test(name)
  }

  const isRouteOrNodeByAncestors = (obj) => {
    let cur = obj
    let depth = 0
    while (cur && depth < 12) {
      if (isRouteOrNodeName(cur?.name)) return true
      cur = cur.parent
      depth += 1
    }
    return false
  }

  scene.traverse((obj) => {
    if (!obj?.isMesh) return
    if (!obj.geometry) return
    if (isRouteOrNodeByAncestors(obj)) return

    // Avoid outlining the outline itself (defensive).
    if (obj.userData?.__isOutline) return

    // Remove any existing outline children (from older versions).
    if (Array.isArray(obj.children) && obj.children.length > 0) {
      const toRemove = obj.children.filter((child) => child?.userData?.__isOutline)
      toRemove.forEach((child) => {
        try {
          obj.remove(child)
          child.geometry?.dispose?.()
          child.material?.dispose?.()
        } catch {
          // ignore
        }
      })
    }

    // Inverted-hull outline: avoids internal "wire" lines.
    // We reuse the same geometry reference for performance.
    const outlineMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      side: THREE.BackSide,
      depthWrite: false,
      depthTest: true,
    })

    const outlineMesh = new THREE.Mesh(obj.geometry, outlineMaterial)
    outlineMesh.name = '__outline'
    outlineMesh.userData.__isOutline = true
    outlineMesh.raycast = () => {}
    // Expand so it peeks out around the object (thicker outline).
    outlineMesh.scale.setScalar(1.03)
    outlineMesh.renderOrder = (obj.renderOrder || 0) - 1

    obj.add(outlineMesh)
    obj.userData.__hasOutline = true
  })
}

export const concealRouteAndNodeObjects = (scene) => {
  if (!scene) return

  // Pick a "base" material from the model so concealed meshes blend in.
  let baseMaterial = null

  const trySetBaseFrom = (obj) => {
    if (baseMaterial) return
    const mat = obj?.material
    if (!mat) return
    baseMaterial = mat
  }

  // Prefer a known floor-like object name when present.
  scene.traverse((obj) => {
    if (baseMaterial) return
    const name = obj?.name
    if (name === 'Floor' || name === '1stLayer' || name === '2ndLayer') {
      trySetBaseFrom(obj)
    }
  })

  // Fallback to first mesh material found.
  if (!baseMaterial) {
    scene.traverse((obj) => {
      if (baseMaterial) return
      if (obj?.isMesh && obj?.material) {
        trySetBaseFrom(obj)
      }
    })
  }

  if (!baseMaterial) return

  const cloneBaseMaterial = () => {
    if (Array.isArray(baseMaterial)) return baseMaterial.map((m) => m.clone())
    return baseMaterial.clone()
  }

  const isRouteOrNode = (name) => {
    if (!name) return false
    return /^Route\d+$/i.test(name) || /^Node\d+$/i.test(name) || /^Route/i.test(name) || /^Node/i.test(name)
  }

  scene.traverse((obj) => {
    if (!obj) return
    if (!isRouteOrNode(obj.name)) return

    obj.traverse((child) => {
      if (!child?.isMesh || !child.material) return

      if (!child.userData.__originalMaterialForRouteConceal) {
        child.userData.__originalMaterialForRouteConceal = child.material
      }

      if (child.userData.__prevRaycastForRouteConceal === undefined) {
        child.userData.__prevRaycastForRouteConceal = child.raycast
      }

      child.material = cloneBaseMaterial()

      // Reduce z-fighting if these helpers are coplanar with the floor.
      const applyPolyOffset = (mat) => {
        if (!mat) return
        mat.polygonOffset = true
        mat.polygonOffsetFactor = 1
        mat.polygonOffsetUnits = 1
        mat.needsUpdate = true
      }
      if (Array.isArray(child.material)) child.material.forEach(applyPolyOffset)
      else applyPolyOffset(child.material)

      // Don't let helper geometry steal clicks.
      child.raycast = () => {}
    })
  })
}

export const revealRouteAndNodeObjects = (scene) => {
  if (!scene) return

  scene.traverse((obj) => {
    if (!obj?.isMesh) return

    if (obj.userData?.__originalMaterialForRouteConceal) {
      obj.material = obj.userData.__originalMaterialForRouteConceal
      delete obj.userData.__originalMaterialForRouteConceal
    }

    if (obj.userData?.__prevRaycastForRouteConceal !== undefined) {
      const prev = obj.userData.__prevRaycastForRouteConceal
      if (prev) obj.raycast = prev
      else delete obj.raycast
      delete obj.userData.__prevRaycastForRouteConceal
    }
  })
}

export const applyTemporaryOpacity = (scene, {
  opacity = 0.25,
  shouldAffect,
  excludeNames = [],
  storageKey = '__tempOpacityPrevMaterial',
} = {}) => {
  if (!scene) return
  const exclude = new Set((excludeNames || []).filter(Boolean).map(String))

  const isExcludedByAncestors = (obj) => {
    let cur = obj
    let depth = 0
    while (cur && depth < 12) {
      if (exclude.has(cur?.name)) return true
      cur = cur.parent
      depth += 1
    }
    return false
  }

  const cloneWithOpacity = (material) => {
    const applyTo = (mat) => {
      const cloned = mat.clone()
      cloned.transparent = true
      cloned.opacity = opacity
      // Avoid depth-buffer artifacts with transparent geometry when orbiting the camera.
      cloned.depthWrite = false
      cloned.needsUpdate = true
      return cloned
    }
    return Array.isArray(material) ? material.map(applyTo) : applyTo(material)
  }

  scene.traverse((obj) => {
    if (!obj?.isMesh) return
    if (!obj.material) return
    if (obj.userData?.[storageKey] !== undefined) return
    if (isExcludedByAncestors(obj)) return
    if (typeof shouldAffect === 'function' && !shouldAffect(obj)) return

    obj.userData[storageKey] = obj.material
    obj.material = cloneWithOpacity(obj.material)
  })
}

export const restoreTemporaryOpacity = (scene, storageKey = '__tempOpacityPrevMaterial') => {
  if (!scene) return
  scene.traverse((obj) => {
    if (!obj?.isMesh) return
    if (obj.userData?.[storageKey] === undefined) return
    obj.material = obj.userData[storageKey]
    delete obj.userData[storageKey]
  })
}

function Model({ modelUrl, position, onClick, onSceneLoaded }) {
  const { scene } = useGLTF(modelUrl)

  useEffect(() => {
    if (!scene) return

    // Outline the model for better readability (excluding Node/Route helpers).
    // Apply for every loaded model (not only the selected building).
    applyModelOutlines(scene)

    // Keep path helpers concealed by default.
    concealRouteAndNodeObjects(scene)

    if (onSceneLoaded) {
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
