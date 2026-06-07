import { useState } from 'react'
import BuilderFlow from './pages/BuilderFlow'
import LandingPage from './pages/LandingPage'

function App() {
  const [view, setView] = useState('landing')

  if (view === 'builder') {
    return <BuilderFlow />
  }

  return <LandingPage onStart={() => setView('builder')} />
}

export default App
