import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Sparkles, Calendar, MapPin, ArrowRight, Compass, Users, Award } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [aiSummary, setAiSummary] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [recRes, catRes] = await Promise.all([
          axios.get('/api/ai/recommendations'),
          axios.get('/api/events/categories')
        ]);
        setRecommendations(recRes.data.recommendations || []);
        setAiSummary(recRes.data.aiSummary || '');
        setCategories(catRes.data || []);
      } catch (err) {
        console.error('Error loading home data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadHomeData();
  }, [user]);

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 text-white py-16 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl space-y-5">
            <span className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-xs px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase text-indigo-200">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>AI-Powered Smart Campus Event Portal</span>
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              Discover, Compete & Build Your Campus Portfolio
            </h1>
            <p className="text-lg text-indigo-100 leading-relaxed">
              From 36-hour national hackathons and AI masterclasses to esports championships and cultural fests — get personalized event picks, instant QR tickets, interactive seat selection, and verified certificates.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                to="/events"
                className="bg-white text-indigo-900 hover:bg-indigo-50 px-6 py-3 rounded-xl font-bold text-sm shadow-md inline-flex items-center"
              >
                <Compass className="h-4 w-4 mr-2" />
                Explore All Events
              </Link>
              <Link
                to="/compare"
                className="bg-indigo-600/60 hover:bg-indigo-600/80 border border-indigo-400/40 text-white px-6 py-3 rounded-xl font-semibold text-sm inline-flex items-center"
              >
                <Sparkles className="h-4 w-4 mr-2 text-amber-300" />
                Which Event Is Better?
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full md:w-80 shrink-0">
            <div className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/15">
              <div className="text-3xl font-extrabold text-amber-300">28+</div>
              <div className="text-xs text-indigo-100 mt-1">Live Campus Events</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/15">
              <div className="text-3xl font-extrabold text-emerald-300">9</div>
              <div className="text-xs text-indigo-100 mt-1">Event Categories</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/15">
              <div className="text-3xl font-extrabold text-sky-300">QR</div>
              <div className="text-xs text-indigo-100 mt-1">Instant Smart Tickets</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/15">
              <div className="text-3xl font-extrabold text-pink-300">AI</div>
              <div className="text-xs text-indigo-100 mt-1">Match & Compare Engine</div>
            </div>
          </div>
        </div>
      </div>

      {/* Personalized AI Recommendations */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <div className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-indigo-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                {user ? `Recommended for ${user.name}` : 'AI Curated Top Events'}
              </h2>
            </div>
            {aiSummary && <p className="text-sm text-gray-600 mt-1">{aiSummary}</p>}
          </div>
          <Link to="/events" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center">
            View all events <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading personalized recommendations...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.map((ev) => (
              <Link
                key={ev.id}
                to={`/events/${ev.slug}`}
                className="bg-white rounded-2xl border border-gray-200 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col"
              >
                {ev.posterUrl && (
                  <div className="relative h-44 w-full">
                    <img src={ev.posterUrl} alt={ev.title} className="w-full h-full object-cover" />
                    <span className="absolute top-3 right-3 bg-indigo-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-xs">
                      {ev.matchScore}% Match
                    </span>
                  </div>
                )}
                <div className="p-5 flex-grow flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-md">
                      {ev.category?.name || 'Event'}
                    </span>
                    <span className="text-xs font-semibold text-emerald-700">
                      {ev.price === 0 ? 'Free' : `$${ev.price}`}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">{ev.title}</h3>
                  <p className="text-xs text-indigo-700 bg-indigo-50/70 p-2 rounded-lg mb-3">
                    {ev.matchReason}
                  </p>
                  <div className="mt-auto space-y-1 text-xs text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="h-3.5 w-3.5 mr-1.5" />
                      {new Date(ev.schedule).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-3.5 w-3.5 mr-1.5" />
                      {ev.venue} ({ev.seatsLeft} seats left)
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Browse by Category */}
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Browse by Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/events?category=${cat.slug}`}
              className="bg-white p-4 rounded-xl border border-gray-200 hover:border-indigo-500 hover:shadow-xs transition-all group"
            >
              <div className="font-bold text-gray-900 group-hover:text-indigo-600">{cat.name}</div>
              <div className="text-xs text-gray-500 mt-1 line-clamp-2">{cat.description}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200">
          <Sparkles className="h-8 w-8 text-indigo-600 mb-3" />
          <h3 className="font-bold text-lg text-gray-900">AI Event Comparison</h3>
          <p className="text-sm text-gray-600 mt-1">
            Torn between two workshops or hackathons? Compare fit scores, schedule conflicts, and prizes side by side.
          </p>
          <Link to="/compare" className="text-indigo-600 text-sm font-semibold mt-3 inline-block">
            Try Compare Tool →
          </Link>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-200">
          <Users className="h-8 w-8 text-emerald-600 mb-3" />
          <h3 className="font-bold text-lg text-gray-900">Teammate Finder & Hub</h3>
          <p className="text-sm text-gray-600 mt-1">
            Looking for a React developer or designer for a hackathon? Connect with peers in the Community Hub.
          </p>
          <Link to="/community" className="text-emerald-600 text-sm font-semibold mt-3 inline-block">
            Open Community →
          </Link>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-200">
          <Award className="h-8 w-8 text-amber-600 mb-3" />
          <h3 className="font-bold text-lg text-gray-900">Verified Student Portfolio</h3>
          <p className="text-sm text-gray-600 mt-1">
            Automatically track your event participation, skills, and downloadable merit certificates in one place.
          </p>
          <Link to="/portfolio" className="text-amber-600 text-sm font-semibold mt-3 inline-block">
            View Portfolio →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
