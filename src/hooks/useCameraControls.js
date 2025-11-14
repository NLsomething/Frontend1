import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const CAMERA_CONFIG = {
  baseSpeed: 0.7,
  referenceDistance: 50,
  getScaledSpeed: (distance) => {
    return CAMERA_CONFIG.baseSpeed * (distance / CAMERA_CONFIG.referenceDistance)
  }
}

/**
 * Smooth camera animation utility with easing
 * @param {object} controlsRef - OrbitControls ref
 * @param {object} options - Animation options
 * @param {THREE.Vector3} options.targetPosition - Where camera should move
 * @param {THREE.Vector3} options.lookAtPosition - Where camera should look
 * @param {number} options.duration - Animation duration in ms
 * @param {function} options.onComplete - Callback when animation completes
 */
export const animateCameraTo = (controlsRef, options) => {
  if (!controlsRef.current) return

  const {
    targetPosition,
    lookAtPosition,
    duration = 1500,
    onComplete
  } = options

  const camera = controlsRef.current.object
  const controls = controlsRef.current
  
  const startPos = camera.position.clone()
  const endPos = new THREE.Vector3(...targetPosition)
  
  const startTarget = controls.target.clone()
  const endTarget = lookAtPosition 
    ? new THREE.Vector3(...lookAtPosition)
    : new THREE.Vector3(0, 0, 0)
  
  const startTime = Date.now()
  let animationId = null

  // Disable auto-rotate during animation and keep it disabled after
  controls.autoRotate = false

  const animate = () => {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / duration, 1)
    
    // Smooth ease-in-out function (cubic)
    const eased = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2
    
    // Interpolate camera position
    camera.position.lerpVectors(startPos, endPos, eased)
    
    // Interpolate look-at target
    controls.target.lerpVectors(startTarget, endTarget, eased)
    
    controls.update()
    
    if (progress < 1) {
      animationId = requestAnimationFrame(animate)
    } else {
      // Animation complete - don't re-enable auto-rotate
      if (onComplete) {
        onComplete()
      }
    }
  }
  
  animate()
  
  // Return cancel function
  return () => {
    if (animationId) {
      cancelAnimationFrame(animationId)
    }
    // Don't restore auto-rotate on cancel either
  }
}

/**
 * Cinematic top-down view - moves camera to overhead position
 * @param {object} controlsRef - OrbitControls ref
 * @param {object} options - View options
 * @param {number} options.height - Camera height above center (default: 100)
 * @param {Array} options.centerPoint - Point to look at (default: [0, 0, 0])
 * @param {number} options.duration - Animation duration in ms (default: 2000)
 */
export const cinematicTopDownView = (controlsRef, options = {}) => {
  const {
    height = 440,
    centerPoint = [0, 0, 0],
    duration = 1500
  } = options

  if (!controlsRef.current) return

  const camera = controlsRef.current.object
  const controls = controlsRef.current
  
  // Get current camera position relative to target
  const currentPos = camera.position.clone()
  const currentTarget = controls.target.clone()
  
  // Calculate current horizontal direction (azimuth angle)
  const direction = new THREE.Vector3()
  direction.subVectors(currentPos, currentTarget)
  direction.y = 0 // Project onto XZ plane
  direction.normalize()
  
  // Calculate horizontal distance from center
  const horizontalDistance = Math.sqrt(
    Math.pow(currentPos.x - currentTarget.x, 2) + 
    Math.pow(currentPos.z - currentTarget.z, 2)
  )
  
  // Use a small horizontal offset to maintain the viewing angle
  const offsetDistance = Math.max(5, horizontalDistance * 0.1)
  
  // Calculate new position: directly above the center, but slightly offset in the current direction
  const newPosition = [
    centerPoint[0] + direction.x * offsetDistance,
    height,
    centerPoint[2] + direction.z * offsetDistance
  ]

  return animateCameraTo(controlsRef, {
    targetPosition: newPosition,
    lookAtPosition: centerPoint,
    duration,
    onComplete: () => {
      console.log('Top-down view complete')
    }
  })
}

/**
 * Custom hook for camera keyboard and mouse controls
 * @param {object} controlsRef - Ref to OrbitControls
 * @param {boolean} enabled - Whether controls are enabled
 * @returns {void}
 */
export const useCameraControls = (controlsRef, enabled) => {
  const isPanning = useRef(false)
  const lastPanPosition = useRef({ x: 0, y: 0 })

  // Keyboard controls (WASD movement)
  useEffect(() => {
    const keysPressed = new Set()
    const minX = -300
    const maxX = 300
    const minZ = -300
    const maxZ = 300

    const handleKeyDown = (event) => {
      if (!enabled) return
      
      const target = event.target
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return
      }

      const key = event.key.toLowerCase()
      
      if (!['w', 'a', 's', 'd'].includes(key)) return

      event.preventDefault()
      keysPressed.add(key)

      if (controlsRef.current && controlsRef.current.autoRotate) {
        controlsRef.current.autoRotate = false
      }
    }

    const handleKeyUp = (event) => {
      const key = event.key.toLowerCase()
      keysPressed.delete(key)
    }

    const updateMovement = () => {
      if (!controlsRef.current || keysPressed.size === 0 || !enabled) {
        requestAnimationFrame(updateMovement)
        return
      }

      const orbitTarget = controlsRef.current.target
      const camera = controlsRef.current.object

      const distance = camera.position.distanceTo(orbitTarget)
      const dynamicSpeed = CAMERA_CONFIG.getScaledSpeed(distance)

      const forward = new THREE.Vector3()
      const right = new THREE.Vector3()
      
      camera.getWorldDirection(forward)
      forward.y = 0
      forward.normalize()
      
      right.crossVectors(forward, new THREE.Vector3(0, 1, 0))
      right.normalize()

      const movement = new THREE.Vector3()

      if (keysPressed.has('w')) {
        movement.addScaledVector(forward, dynamicSpeed)
      }
      if (keysPressed.has('s')) {
        movement.addScaledVector(forward, -dynamicSpeed)
      }
      if (keysPressed.has('a')) {
        movement.addScaledVector(right, -dynamicSpeed)
      }
      if (keysPressed.has('d')) {
        movement.addScaledVector(right, dynamicSpeed)
      }

      if (movement.length() > 0) {
        if (keysPressed.size > 1) {
          movement.normalize().multiplyScalar(dynamicSpeed)
        }
        
        const newTarget = orbitTarget.clone().add(movement)
        
        newTarget.x = Math.max(minX, Math.min(maxX, newTarget.x))
        newTarget.z = Math.max(minZ, Math.min(maxZ, newTarget.z))
        
        const actualMovement = newTarget.clone().sub(orbitTarget)
        
        camera.position.add(actualMovement)
        orbitTarget.copy(newTarget)
        controlsRef.current.update()
      }

      requestAnimationFrame(updateMovement)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    const animationId = requestAnimationFrame(updateMovement)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      cancelAnimationFrame(animationId)
    }
  }, [enabled, controlsRef])

  // Mouse panning controls (right-click drag)
  useEffect(() => {
    const handleMouseDown = (event) => {
      if (!enabled) return
      
      if (event.button === 2) {
        event.preventDefault()
        isPanning.current = true
        lastPanPosition.current = { x: event.clientX, y: event.clientY }
        
        if (controlsRef.current) {
          controlsRef.current.autoRotate = false
        }
      }
    }

    const handleMouseMove = (event) => {
      if (!isPanning.current || !controlsRef.current || !enabled) return

      const deltaX = event.clientX - lastPanPosition.current.x
      const deltaY = event.clientY - lastPanPosition.current.y
      lastPanPosition.current = { x: event.clientX, y: event.clientY }

      const controls = controlsRef.current
      const camera = controls.object

      const distance = camera.position.distanceTo(controls.target)
      const dynamicPanSpeed = CAMERA_CONFIG.getScaledSpeed(distance)

      const right = new THREE.Vector3()
      const forward = new THREE.Vector3()
      
      camera.getWorldDirection(forward)
      forward.y = 0
      forward.normalize()
      
      right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize()

      const horizontalOffset = right.multiplyScalar(-deltaX * dynamicPanSpeed * 0.1)
      const forwardOffset = forward.multiplyScalar(deltaY * dynamicPanSpeed * 0.1)

      const offset = new THREE.Vector3().add(horizontalOffset).add(forwardOffset)

      controls.target.add(offset)
      camera.position.add(offset)
      controls.update()
    }

    const handleMouseUp = (event) => {
      if (event.button === 2) {
        isPanning.current = false
      }
    }

    const handleContextMenu = (event) => {
      event.preventDefault()
    }

    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('contextmenu', handleContextMenu)

    return () => {
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('contextmenu', handleContextMenu)
    }
  }, [enabled, controlsRef])
}

