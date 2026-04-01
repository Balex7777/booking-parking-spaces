import { Routes, Route } from 'react-router-dom'
import HomePage from '../pages/HomePage'
import ParkingsPage from '../pages/ParkingsPage'
import ParkingDetailPage from '../pages/ParkingDetailPage'
import MyBookingsPage from '../pages/MyBookingsPage'
import RatesPage from '../pages/RatesPage'
import ContactsPage from '../pages/ContactsPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/parkings" element={<ParkingsPage />} />
      <Route path="/parkings/:id" element={<ParkingDetailPage />} />
      <Route path="/my-bookings" element={<MyBookingsPage />} />
      <Route path="/rates" element={<RatesPage />} />
      <Route path="/contacts" element={<ContactsPage />} />
    </Routes>
  )
}
