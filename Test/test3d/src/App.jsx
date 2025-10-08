import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei'
import SchoolModel from './components/SchoolModel'
import './App.css'

function App() {
  return (
    <div className="app-container">
      <div className="header">
        <h1>Suburban School 3D Viewer</h1>
        <p>Use mouse to rotate, zoom, and pan the camera</p>
      </div>
      
      <Canvas
        shadows
        camera={{ 
          position: [20, 15, 20], 
          fov: 60,
          near: 0.1,
          far: 1000
        }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={1} 
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <pointLight position={[-10, -10, -10]} intensity={0.3} />
        
        {/* 3D Model */}
        <SchoolModel />
        
        {/* Ground shadow */}
        <ContactShadows 
          position={[0, -0.5, 0]} 
          opacity={0.4} 
          scale={20} 
          blur={2} 
          far={4}
        />
        
        {/* Environment for better lighting */}
        <Environment preset="city" />
        
        {/* Camera Controls - Normal rotation */}
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={8}
          maxDistance={80}
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 2.1}
          target={[0, 2, 0]}
          autoRotate={false}
          rotateSpeed={0.8}
        />
      </Canvas>
    </div>
  )
}

export default App
