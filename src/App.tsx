import { HashRouter, Route, Routes } from 'react-router'
import { Home } from './pages/Home'
import { Room } from './pages/Room'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/room/:gameId/:roomId" element={<Room />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </HashRouter>
  )
}
