import { useNavigate } from 'react-router-dom'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import SchoolModel from '../components/SchoolModel'

// Style classes
const styles = {
  screen: "relative w-full h-screen overflow-hidden",
  canvasContainer: "w-full h-full",
  logoutBtn: "absolute top-6 right-6 z-10 bg-[#096ecc] hover:bg-[#1f5ca9] text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-all duration-200 hover:scale-105",
  canvasInstructions: "absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10 text-white bg-black/50 backdrop-blur-sm px-6 py-3 rounded-full text-sm font-medium shadow-lg"
}

function HomePage() {
  const navigate = useNavigate()

  return (
    <div className={styles.screen}>
      <button
        onClick={() => navigate('/')}
        className={styles.logoutBtn}
      >
        Back to Login
      </button>

      <div className={styles.canvasContainer}>
        <Canvas 
          camera={{ position: [25, 15, 25], fov: 50 }}
          style={{ background: 'linear-gradient(to bottom, #e8f4ff, #ffffff)' }}
        >
          <SchoolModel />
          <OrbitControls 
            enableZoom={true}
            enablePan={true}
            enableRotate={true}
            minDistance={10}
            maxDistance={60}
            maxPolarAngle={Math.PI / 2}
          />
        </Canvas>
      </div>

      <p className={styles.canvasInstructions}>
        🖱️ Click and drag to rotate • Scroll to zoom • Right-click to pan
      </p>
    </div>
  )
}

export default HomePage