import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import './App.css'

function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/home" element={<HomePage />} />
          </Routes>
        </Router>
      </AuthProvider>
    </NotificationProvider>
  )
}

export default App
