import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import AIChatWidget from './components/AIChatWidget';
import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import EventList from './pages/EventList';
import EventDetails from './pages/EventDetails';
import MyRegistrations from './pages/MyRegistrations';
import CompareEvents from './pages/CompareEvents';
import Community from './pages/Community';
import OrganizerDashboard from './pages/OrganizerDashboard';
import Portfolio from './pages/Portfolio';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/events" element={<EventList />} />
              <Route path="/events/:slug" element={<EventDetails />} />
              <Route path="/my-registrations" element={<MyRegistrations />} />
              <Route path="/compare" element={<CompareEvents />} />
              <Route path="/community" element={<Community />} />
              <Route path="/organizer" element={<OrganizerDashboard />} />
              <Route path="/portfolio" element={<Portfolio />} />
            </Routes>
          </main>
          <footer className="bg-white border-t border-gray-200 py-6 text-center text-xs text-gray-500">
            EventSphere © 2026 — Smart College Event Management, AI Recommendations & Digital Credentials Portal
          </footer>
          <AIChatWidget />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
