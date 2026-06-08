import { NavLink } from 'react-router-dom'

function AppHeader() {
  return (
    <header className="app-header">
      <NavLink className="app-header__brand" to="/">
        InsightIQ
      </NavLink>
      <nav className="app-header__nav" aria-label="Primary navigation">
        <NavLink to="/">Dashboard</NavLink>
        <NavLink to="/history">History</NavLink>
      </nav>
    </header>
  )
}

export default AppHeader
