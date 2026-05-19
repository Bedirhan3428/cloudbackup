import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import { getKey } from './api'
import Login from './pages/Login'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Files from './pages/Files'
import Settings from './pages/Settings'
import Logs from './pages/Logs'
import SystemMap from './pages/SystemMap'
import Chat from './pages/Chat'

function Protected({ children }) {
  return getKey() ? children : <Navigate to="/login" replace />
}

export default function App() {
  const [unlocked, setUnlocked] = useState(
    () => localStorage.getItem('__v_unlocked') === 'true'
  )
  const [passwordInput, setPasswordInput] = useState('')
  const [showInput, setShowInput] = useState(false)

  const handlePasswordChange = (e) => {
    const val = e.target.value
    setPasswordInput(val)
    if (val === 'ashfir_admin') {
      localStorage.setItem('__v_unlocked', 'true')
      setUnlocked(true)
    }
  }

  if (!unlocked) {
    return (
      <div 
        style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          background: '#000',
          color: '#fff',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          margin: 0,
          padding: '20px',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ maxWidth: '600px', width: '100%', padding: '40px 20px' }}>
          {/* Vercel Icon */}
          <div style={{ marginBottom: '40px' }} onClick={() => setShowInput(!showInput)}>
            <svg width="40" height="35" viewBox="0 0 76 65" fill="#fff">
              <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
            </svg>
          </div>
          
          <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '16px', letterSpacing: '-0.02em' }}>
            DEPLOYMENT_NOT_FOUND
          </h1>
          
          <p style={{ color: '#888', fontSize: '15px', lineHeight: '1.6', marginBottom: '24px' }}>
            The deployment you tried to access does not exist or has been deleted. If you are the owner, please log in to Vercel to check the status of your deployment.
          </p>

          <hr style={{ border: 'none', borderTop: '1px solid #333', margin: '24px 0' }} />

          <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: '#666' }}>
            <div>
              <span style={{ color: '#444' }}>Code:</span> DEPLOYMENT_NOT_FOUND
            </div>
            <div>
              <span style={{ color: '#444' }}>ID:</span> sfo1::{Math.random().toString(36).substring(2, 11)}
            </div>
          </div>
        </div>

        {/* Hidden password input area - hidden or very small */}
        <div 
          style={{
            position: 'absolute',
            bottom: '20px',
            right: '20px',
            opacity: showInput ? 1 : 0.02,
            transition: 'opacity 0.2s',
          }}
        >
          <input 
            type="password"
            placeholder="..."
            value={passwordInput}
            onChange={handlePasswordChange}
            style={{
              background: '#111',
              color: '#333',
              border: '1px solid #222',
              outline: 'none',
              padding: '4px 8px',
              fontSize: '11px',
              width: '80px',
              borderRadius: '4px',
              fontFamily: 'monospace'
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Protected><Layout /></Protected>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="files" element={<Files />} />
          <Route path="settings" element={<Settings />} />
          <Route path="logs" element={<Logs />} />
          <Route path="system-map" element={<SystemMap />} />
          <Route path="chat" element={<Chat />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
