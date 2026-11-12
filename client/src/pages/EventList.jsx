import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useSearchParams } from 'react-router-dom';
import { Calendar, MapPin, Search, Filter } from 'lucide-react';

const EventList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [priceFilter, setPriceFilter] = useState('');
  const [modeFilter, setModeFilter] = useState('');
  const [sortBy, setSortBy] = useState('date_asc');

  useEffect(() => {
    axios.get('/api/events/categories').then((res) => setCategories(res.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [searchTerm, selectedCategory, priceFilter, modeFilter, sortBy]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.set('q', searchTerm);
      if (selectedCategory) params.set('category', selectedCategory);
      if (priceFilter) params.set('price', priceFilter);
      if (modeFilter) params.set('online', modeFilter);
      if (sortBy) params.set('sort', sortBy);
      params.set('limit', '30');

      const res = await axios.get(`/api/events?${params.toString()}`);
      setEvents(res.data.events || []);
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Explore Campus Events</h1>
          <p className="text-sm text-gray-500 mt-1">Search and filter across hackathons, workshops, fests, and sports</p>
        </div>
        <div className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Search events, organizers, or topics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 mb-8 flex flex-wrap items-center gap-3">
        <div className="flex items-center text-sm font-medium text-gray-700 mr-2">
          <Filter className="h-4 w-4 mr-1.5 text-indigo-600" />
          Filters:
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            setSearchParams(e.target.value ? { category: e.target.value } : {});
          }}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>

        <select
          value={priceFilter}
          onChange={(e) => setPriceFilter(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white"
        >
          <option value="">Any Price</option>
          <option value="free">Free Only</option>
          <option value="paid">Paid Events</option>
        </select>

        <select
          value={modeFilter}
          onChange={(e) => setModeFilter(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white"
        >
          <option value="">All Modes</option>
          <option value="false">In-Person Venue</option>
          <option value="true">Online / Remote</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white ml-auto"
        >
          <option value="date_asc">Date: Soonest First</option>
          <option value="date_desc">Date: Latest First</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading events...</div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-600 font-medium">No events match your current filters.</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('');
              setPriceFilter('');
              setModeFilter('');
              setSearchParams({});
            }}
            className="mt-3 text-sm text-indigo-600 font-semibold hover:underline"
          >
            Reset all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Link
              key={event.id}
              to={`/events/${event.slug}`}
              className="bg-white rounded-xl shadow-xs border border-gray-200 hover:shadow-md transition-all overflow-hidden flex flex-col"
            >
              {event.posterUrl && (
                <img src={event.posterUrl} alt={event.title} className="w-full h-40 object-cover" />
              )}
              <div className="p-5 flex-grow">
                <div className="flex justify-between items-start mb-3">
                  <span className="bg-indigo-100 text-indigo-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                    {event.category?.name}
                  </span>
                  <span className="text-xs font-medium text-gray-500">
                    {new Date(event.schedule).toLocaleDateString()}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">{event.title}</h2>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>
                <div className="space-y-1.5 text-xs text-gray-500">
                  <div className="flex items-center">
                    <MapPin className="h-3.5 w-3.5 mr-2 shrink-0" />
                    <span className="truncate">{event.venue}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-3.5 w-3.5 mr-2 shrink-0" />
                    {new Date(event.schedule).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {event.isTeamEvent && (
                      <span className="ml-2 bg-purple-50 text-purple-700 px-2 py-0.5 rounded">
                        Team ({event.minTeamSize}-{event.maxTeamSize})
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex justify-between items-center">
                <span className="font-bold text-indigo-600">
                  {event.price === 0 ? 'Free' : `$${event.price}`}
                </span>
                <span className="text-xs font-medium text-gray-600">
                  {event.seatsLeft} / {event.maxSeats} seats left
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventList;
