import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  LogOut,
  Compass,
  LayoutDashboard,
  Sparkles,
  Users,
  Award,
  Ticket
} from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinkClass = (path) =>
    `inline-flex items-center px-2.5 py-1.5 text-sm font-medium rounded-lg transition-colors ${
      location.pathname === path
        ? 'bg-indigo-50 text-indigo-700'
        : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50'
    }`;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="bg-indigo-600 text-white p-2 rounded-lg">
                <Calendar className="h-6 w-6" />
              </div>
              <span className="font-bold text-xl text-gray-900 tracking-tight">EventSphere</span>
            </Link>
            <div className="hidden md:flex ml-8 space-x-2">
              <Link to="/events" className={navLinkClass('/events')}>
                <Compass className="h-4 w-4 mr-1.5" />
                Explore
              </Link>
              <Link to="/compare" className={navLinkClass('/compare')}>
                <Sparkles className="h-4 w-4 mr-1.5" />
                AI Compare
              </Link>
              <Link to="/community" className={navLinkClass('/community')}>
                <Users className="h-4 w-4 mr-1.5" />
                Community
              </Link>
              {user && (
                <>
                  <Link to="/my-registrations" className={navLinkClass('/my-registrations')}>
                    <Ticket className="h-4 w-4 mr-1.5" />
                    My Tickets
                  </Link>
                  <Link to="/portfolio" className={navLinkClass('/portfolio')}>
                    <Award className="h-4 w-4 mr-1.5" />
                    Portfolio
                  </Link>
                </>
              )}
              {user && ['ORGANIZER', 'ADMIN'].includes(user.role) && (
                <Link to="/organizer" className={navLinkClass('/organizer')}>
                  <LayoutDashboard className="h-4 w-4 mr-1.5" />
                  Organizer Hub
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-semibold text-gray-900">{user.name}</div>
                  <div className="text-xs text-indigo-600 font-medium uppercase">{user.role}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-full transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-sm font-medium text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg shadow-sm transition-colors"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
