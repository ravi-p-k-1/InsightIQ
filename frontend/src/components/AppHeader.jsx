import { NavLink } from 'react-router-dom'
import brandImageUrl from '../../insightiq-image.png'

function AppHeader() {
  return (
    <header className="app-header">
      <NavLink className="app-header__brand" to="/">
        <img src={brandImageUrl} alt="InsightIQ" />
      </NavLink>
      <nav className="app-header__nav" aria-label="Primary navigation">
        <NavLink to="/">Dashboard</NavLink>
        <NavLink to="/history">History</NavLink>
      </nav>
    </header>
  )
}

export default AppHeader
