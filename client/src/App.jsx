
import { useState } from 'react'
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'

import Signup from './pages/Signup'
import UserPage from './pages/UserPage'
import BottomNav from './components/BottomNav'
import './App.css'

function App() {
  const [user, setUser] = useState(null)

  const handleLogout = () => {
    setUser(null)
    // Optional: Add server logout call if using sessions/cookies
  }



  return (
    <BrowserRouter>
      <div className="app-container mobile-view">
        {/* Desktop Header could be conditioned or hidden via CSS */}
        {/* For now we keep it simple and rely on BottomNav for main navigation */}

        <main className="mobile-main">
          <Routes>
            <Route path="/" element={<Home user={user} type="news" />} />
            <Route path="/activities" element={<Home user={user} type="activity" />} />
            <Route path="/login" element={<Login onLogin={setUser} />} />
            <Route path="/signup" element={<Signup onLogin={setUser} />} />
            <Route path="/user" element={user ? <UserPage user={user} /> : <Login onLogin={setUser} />} />
          </Routes>
        </main>

        <BottomNav />
      </div>
    </BrowserRouter>
  )
}

export default App
