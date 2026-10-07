import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Nav from './components/Nav'
import LandingPage from './pages/LandingPage'
import BuilderFlow from './pages/BuilderFlow'
import MyMeditationsPage from './pages/MyMeditationsPage'
import AuthPage from './pages/AuthPage'
import ScriptTest from './pages/ScriptTest'
import PrivacyPage from './pages/PrivacyPage'

function NavLayout({ children }) {
  return (
    <div className="flex min-h-svh flex-col">
      <Nav />
      <div className="flex-1">{children}</div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<NavLayout><LandingPage /></NavLayout>} />
          <Route path="/build" element={<BuilderFlow />} />
          <Route path="/my-meditations" element={<NavLayout><MyMeditationsPage /></NavLayout>} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/privacy" element={<NavLayout><PrivacyPage /></NavLayout>} />
          <Route path="/script-test" element={<ScriptTest />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
