import { Route, Routes } from 'react-router-dom'
import AppHeader from './components/AppHeader'
import DashboardPage from './pages/DashboardPage'
import HistoryDetailPage from './pages/HistoryDetailPage'
import HistoryPage from './pages/HistoryPage'

function App() {
  return (
    <>
      <AppHeader />
      <main className="dashboard">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/history/:id" element={<HistoryDetailPage />} />
        </Routes>
      </main>
    </>
  )
}

export default App
