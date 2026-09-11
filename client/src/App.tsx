import { Navigate, Route, Routes } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import CustomerDashboard from './pages/CustomerDashboard'
import AdminDashboard from './pages/AdminDashboard'
import AdminBookings from './pages/AdminBookings'
import AdminCustomers from './pages/AdminCustomers'
import AdminStaff from './pages/AdminStaff'
import AdminServices from './pages/AdminServices'
import AdminPayments from './pages/AdminPayments'
import AdminAuditLogs from './pages/AdminAuditLogs'
import StaffDashboard from './pages/StaffDashboard'
import BookAppointment from './pages/BookAppointment'
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
          <RoleProtectedRoute allowedRole="customer">
            <CustomerDashboard />
          </RoleProtectedRoute>
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
        path="/admin/customers"
        element={
          <RoleProtectedRoute allowedRole="admin">
            <AdminCustomers />
          </RoleProtectedRoute>
        }
      />

      <Route
        path="/admin/staff"
        element={
          <RoleProtectedRoute allowedRole="admin">
            <AdminStaff />
          </RoleProtectedRoute>
        }
      />

      <Route
        path="/admin/services"
        element={
          <RoleProtectedRoute allowedRole="admin">
            <AdminServices />
          </RoleProtectedRoute>
        }
      />

      <Route
        path="/admin/payments"
        element={
          <RoleProtectedRoute allowedRole="admin">
            <AdminPayments />
          </RoleProtectedRoute>
        }
      />

      <Route
        path="/admin/audit-logs"
        element={
          <RoleProtectedRoute allowedRole="admin">
            <AdminAuditLogs />
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