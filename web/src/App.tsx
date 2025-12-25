// Main App component - routes
import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import Topic from './pages/Topic'
import Lesson from './pages/Lesson'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-base">
      <Header />
      <main className="flex-1 flex flex-col">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/topics/:topic" element={<Topic />} />
          <Route path="/topics/:topic/stages/:stageId" element={<Lesson />} />
        </Routes>
      </main>
    </div>
  )
}

