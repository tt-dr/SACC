import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AdminLayout from './components/AdminLayout'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import { AdminDataProvider } from './context/AdminDataContext'
import CollectionManagementPage from './pages/CollectionManagementPage'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'

// 开发模式下 Vite base 为 /，Router basename 与之对齐；
// 生产模式下两者均为 /admin/
const isProduction = import.meta.env.PROD

function App() {
  return (
    <BrowserRouter basename={isProduction ? '/admin' : '/'}>
      <AuthProvider>
        <AdminDataProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AdminLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="users" element={<CollectionManagementPage moduleKey="users" />} />
                <Route path="docs" element={<CollectionManagementPage moduleKey="docs" />} />
                <Route path="news" element={<CollectionManagementPage moduleKey="news" />} />
                <Route path="projects" element={<CollectionManagementPage moduleKey="projects" />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate replace to="/" />} />
          </Routes>
        </AdminDataProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
