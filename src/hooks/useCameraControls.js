import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const CAMERA_CONFIG = {
  baseSpeed: 0.6,
  referenceDistance: 50,
  getScaledSpeed: (distance) => {
    return CAMERA_CONFIG.baseSpeed * (distance / CAMERA_CONFIG.referenceDistance)
  }
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
    const minX = -60
    const maxX = 60
    const minZ = -60
    const maxZ = 60

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

