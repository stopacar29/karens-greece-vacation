import { Routes, Route, NavLink } from 'react-router-dom';
import Home from './pages/Home';
import Schedule from './pages/Schedule';
import Travel from './pages/Travel';
import Guests from './pages/Guests';
import Import from './pages/Import';

export default function App() {
  return (
    <div className="app">
      <nav className="nav">
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>Home</NavLink>
        <NavLink to="/schedule" className={({ isActive }) => (isActive ? 'active' : '')}>Schedule</NavLink>
        <NavLink to="/travel" className={({ isActive }) => (isActive ? 'active' : '')}>Travel</NavLink>
        <NavLink to="/guests" className={({ isActive }) => (isActive ? 'active' : '')}>Guests</NavLink>
        <NavLink to="/import" className={({ isActive }) => (isActive ? 'active' : '')}>Import</NavLink>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/travel" element={<Travel />} />
        <Route path="/guests" element={<Guests />} />
        <Route path="/import" element={<Import />} />
      </Routes>
    </div>
  );
}
