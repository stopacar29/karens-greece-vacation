import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Schedule from './pages/Schedule';
import Flights from './pages/Flights';
import HotelHouse from './pages/HotelHouse';
import Travel from './pages/Travel';
import Guests from './pages/Guests';
import FamilyGallery from './pages/FamilyGallery';
import TravelInformation from './pages/TravelInformation';

export default function App() {
  return (
    <div className="app">
      <nav className="nav">
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>Home</NavLink>
        <NavLink to="/schedule" className={({ isActive }) => (isActive ? 'active' : '')}>Schedule</NavLink>
        <NavLink to="/flights" className={({ isActive }) => (isActive ? 'active' : '')}>Flights</NavLink>
        <NavLink to="/hotel-house" className={({ isActive }) => (isActive ? 'active' : '')}>Hotel / House</NavLink>
        <NavLink to="/activities" className={({ isActive }) => (isActive ? 'active' : '')}>Activities</NavLink>
        <NavLink to="/family-gallery" className={({ isActive }) => (isActive ? 'active' : '')}>Family Gallery</NavLink>
        <NavLink to="/travel-information" className={({ isActive }) => (isActive ? 'active' : '')}>Travel Information</NavLink>
        <NavLink to="/guests" className={({ isActive }) => (isActive ? 'active' : '')}>Guests</NavLink>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/flights" element={<Flights />} />
        <Route path="/hotel-house" element={<HotelHouse />} />
        <Route path="/activities" element={<Travel />} />
        <Route path="/travel" element={<Navigate to="/activities" replace />} />
        <Route path="/family-gallery" element={<FamilyGallery />} />
        <Route path="/travel-information" element={<TravelInformation />} />
        <Route path="/guests" element={<Guests />} />
      </Routes>
    </div>
  );
}
