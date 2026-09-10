import { Navigate, Route, Routes } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import CustomerDashboard from './pages/CustomerDashboard'
import AdminDashboard from './pages/AdminDashboard'
import AdminBookings from './pages/AdminBookings'
import StaffDashboard from './pages/StaffDashboard'
import BookAppointment from './pages/BookAppointment'
import ProtectedRoute from './components/ProtectedRoute'
import RoleProtectedRoute from './components/RoleProtectedRoute'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/customer"
        element={
          <ProtectedRoute>
            <CustomerDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/book"
        element={
          <RoleProtectedRoute allowedRole="customer">
            <BookAppointment />
          </RoleProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <RoleProtectedRoute allowedRole="admin">
            <AdminDashboard />
          </RoleProtectedRoute>
        }
      />

      <Route
        path="/admin/bookings"
        element={
          <RoleProtectedRoute allowedRole="admin">
            <AdminBookings />
          </RoleProtectedRoute>
        }
      />

      <Route
        path="/staff"
        element={
          <RoleProtectedRoute allowedRole="staff">
            <StaffDashboard />
          </RoleProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App