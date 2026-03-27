import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './components/Home/HomePage';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import AdminPanel from './components/Admin/AdminPanel';
import HotelPanel from './components/Hotel/HotelPanel';
import NGOPanel from './components/NGO/NGOPanel';
import VolunteerPanel from './components/Volunteer/VolunteerPanel';
import NeedyPanel from './components/Needy/NeedyPanel';
import CompostPanel from './components/Compost/CompostPanel';
import ProtectedRoute from './components/Common/ProtectedRoute';

const App = ({ darkMode, setDarkMode }) => (
  <Router>
    <Routes>
      <Route path="/" element={<HomePage darkMode={darkMode} setDarkMode={setDarkMode} />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedTypes={['ADMIN']}>
            <AdminPanel darkMode={darkMode} setDarkMode={setDarkMode} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hotel/*"
        element={
          <ProtectedRoute allowedTypes={['HOTEL']}>
            <HotelPanel darkMode={darkMode} setDarkMode={setDarkMode} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ngo/*"
        element={
          <ProtectedRoute allowedTypes={['NGO']}>
            <NGOPanel darkMode={darkMode} setDarkMode={setDarkMode} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/volunteer/*"
        element={
          <ProtectedRoute allowedTypes={['VOLUNTEER']}>
            <VolunteerPanel darkMode={darkMode} setDarkMode={setDarkMode} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/needy/*"
        element={
          <ProtectedRoute allowedTypes={['NEEDY']}>
            <NeedyPanel darkMode={darkMode} setDarkMode={setDarkMode} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/compost/*"
        element={
          <ProtectedRoute allowedTypes={['COMPOST_AGENCY']}>
            <CompostPanel darkMode={darkMode} setDarkMode={setDarkMode} />
          </ProtectedRoute>
        }
      />
    </Routes>
  </Router>
);

export default App;

