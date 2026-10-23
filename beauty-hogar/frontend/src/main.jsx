import React from 'react'
import ReactDOM from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import { SplashScreen } from '@capacitor/splash-screen'
import { App as CapApp } from '@capacitor/app'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'

// Inicialización para entorno Móvil Nativo (Capacitor Android / iOS)
if (Capacitor.isNativePlatform()) {
  StatusBar.setBackgroundColor({ color: '#2C0140' }).catch(() => {})
  StatusBar.setStyle({ style: Style.Dark }).catch(() => {})
  SplashScreen.hide().catch(() => {})

  CapApp.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back()
    } else {
      CapApp.exitApp()
    }
  })
} else if ('serviceWorker' in navigator && import.meta.env.PROD) {
  // Registro de Service Worker para instalación PWA en navegadores
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
)
