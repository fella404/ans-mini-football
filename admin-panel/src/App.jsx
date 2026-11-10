import { Navigate, Route, Routes } from "react-router-dom";
import AdminLayout from "./components/admin/AdminLayout";
import BookingsPage from "./pages/admin/BookingsPage";
import DashboardPage from "./pages/admin/DashboardPage";
import FieldsPage from "./pages/admin/FieldsPage";
import LoginPage from "./pages/admin/LoginPage";
import SchedulePage from "./pages/admin/SchedulePage";
import SettingsPage from "./pages/admin/SettingsPage";
import StaffPage from "./pages/admin/StaffPage";
import ProtectedRoute from "./routes/ProtectedRoute";

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/pesanan" element={<BookingsPage />} />
          <Route path="/jadwal" element={<SchedulePage />} />
          <Route path="/lapangan" element={<FieldsPage />} />
          <Route path="/staff" element={<StaffPage />} />
          <Route path="/pengaturan" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
