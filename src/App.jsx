import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

// Layouts
import AuthLayout from './components/AuthLayout';
import MainLayout from './components/MainLayout';

// Core Components
import RoleDispatcher from './components/RoleDispatcher';

// Pages
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import ChildDashboardPage from './pages/ChildDashboardPage';
import CookDashboardPage from './pages/CookDashboardPage';
import DriverDashboardPage from './pages/DriverDashboardPage';
import MealPlannerPage from './pages/MealPlannerPage';
import ShoppingListPage from './pages/ShoppingListPage';
import ActivityPlannerPage from './pages/ActivityPlannerPage';
import ChoreManagementPage from './pages/ChoreManagementPage';
import FamilyManagementPage from './pages/FamilyManagementPage';

function App() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Route>

      {/* Secure route for dispatching users after login */}
      <Route path="/dispatch" element={<ProtectedRoute><RoleDispatcher /></ProtectedRoute>} />

      {/* Parent/Admin Routes */}
      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route path="/" element={<Navigate to="/dispatch" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/meal-planner" element={<MealPlannerPage />} />
        <Route path="/shopping-list" element={<ShoppingListPage />} />
        <Route path="/activity-planner" element={<ActivityPlannerPage />} />
        <Route path="/chore-management" element={<ChoreManagementPage />} />
        <Route path="/family-management" element={<FamilyManagementPage />} />
      </Route>
      
      {/* Role-Specific Dashboards */}
      {/* I've removed the <MainLayout> wrapper from the cook and driver dashboards. */}
      {/* This makes them standalone pages, just like the child's dashboard. */}
      <Route path="/child-dashboard" element={<ProtectedRoute><ChildDashboardPage /></ProtectedRoute>} />
      <Route path="/cook-dashboard" element={<ProtectedRoute><CookDashboardPage /></ProtectedRoute>} />
      <Route path="/driver-dashboard" element={<ProtectedRoute><DriverDashboardPage /></ProtectedRoute>} />
    </Routes>
  );
}

export default App;
