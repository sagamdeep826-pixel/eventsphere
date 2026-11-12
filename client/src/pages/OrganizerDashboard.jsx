import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LayoutDashboard,
  Users,
  DollarSign,
  QrCode,
  Award,
  PlusCircle,
  TrendingUp,
  MessageSquare,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const OrganizerDashboard = () => {
  const [data, setData] = useState({ summary: {}, events: [] });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // QR Scanner state
  const [qrInput, setQrInput] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [scanning, setScanning] = useState(false);

  // Create Event modal / toggle
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    schedule: '',
    venue: 'Main Auditorium',
    isOnline: false,
    isTeamEvent: false,
    minTeamSize: 1,
    maxTeamSize: 1,
    maxSeats: 50,
    price: 0,
    rules: 'Bring valid student ID.',
    prize: '$1,000 + Certificates',
    categoryId: ''
  });

  useEffect(() => {
    fetchDashboard();
    axios.get('/api/events/categories').then((res) => {
      const cats = res.data || [];
      setCategories(cats);
      if (cats.length > 0) setNewEvent((prev) => ({ ...prev, categoryId: cats[0].id }));
    });
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/organizer/dashboard');
      setData(res.data);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleScanTicket = async (e) => {
    e.preventDefault();
    if (!qrInput.trim()) return;
    try {
      setScanning(true);
      setScanResult(null);
      const res = await axios.post('/api/attendance/verify', { qrCode: qrInput.trim() });
      setScanResult({ success: true, ...res.data });
      setQrInput('');
      fetchDashboard();
    } catch (err) {
      setScanResult({
        success: false,
        status: err.response?.data?.status || 'ERROR',
        message: err.response?.data?.message || err.response?.data?.error || 'Verification failed'
      });
    } finally {
      setScanning(false);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/organizer/events', newEvent);
      setShowCreateForm(false);
      setNewEvent({
        ...newEvent,
        title: '',
        description: '',
        schedule: ''
      });
      fetchDashboard();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create event');
    }
  };

  const handleBulkIssueCertificates = async (eventId, title) => {
    try {
      const res = await axios.post(`/api/organizer/events/${eventId}/certificates`, {});
      alert(res.data.message || `Issued certificates for ${title}`);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to issue certificates');
    }
  };

  if (loading) return <div className="text-center py-20 text-gray-500">Loading Organizer Hub...</div>;

  const { summary, events } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Organizer Command Center</h1>
          <p className="text-sm text-gray-600 mt-1">
            AI demand forecasting, live QR ticket scanner, feedback intelligence & certificate issuance
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm inline-flex items-center shadow-xs cursor-pointer"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          {showCreateForm ? 'Close Form' : 'Create New Event'}
        </button>
      </div>

      {/* Create Event Form */}
      {showCreateForm && (
        <form onSubmit={handleCreateEvent} className="bg-white p-6 rounded-2xl border border-indigo-200 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-gray-900">Publish a New Campus Event</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <input
              type="text"
              required
              placeholder="Event Title"
              value={newEvent.title}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <select
              value={newEvent.categoryId}
              onChange={(e) => setNewEvent({ ...newEvent, categoryId: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input
              type="datetime-local"
              required
              value={newEvent.schedule}
              onChange={(e) => setNewEvent({ ...newEvent, schedule: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <input
              type="text"
              required
              placeholder="Venue"
              value={newEvent.venue}
              onChange={(e) => setNewEvent({ ...newEvent, venue: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <input
              type="number"
              placeholder="Max Seats"
              value={newEvent.maxSeats}
              onChange={(e) => setNewEvent({ ...newEvent, maxSeats: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <input
              type="number"
              placeholder="Price ($)"
              value={newEvent.price}
              onChange={(e) => setNewEvent({ ...newEvent, price: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <input
              type="text"
              placeholder="Prize / Perks"
              value={newEvent.prize}
              onChange={(e) => setNewEvent({ ...newEvent, prize: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <textarea
            rows={2}
            required
            placeholder="Event Description & Agenda"
            value={newEvent.description}
            onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg text-sm font-bold"
          >
            Publish Event
          </button>
        </form>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200">
          <div className="text-xs font-bold text-gray-500 uppercase">Managed Events</div>
          <div className="text-3xl font-extrabold text-gray-900 mt-1">{summary.totalEvents || 0}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200">
          <div className="text-xs font-bold text-gray-500 uppercase">Total Registrations</div>
          <div className="text-3xl font-extrabold text-indigo-600 mt-1">{summary.totalRegistrations || 0}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200">
          <div className="text-xs font-bold text-gray-500 uppercase">Verified Check-Ins</div>
          <div className="text-3xl font-extrabold text-emerald-600 mt-1">
            {summary.totalCheckIns || 0} <span className="text-sm font-normal text-gray-500">({summary.attendanceRate || 0}%)</span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200">
          <div className="text-xs font-bold text-gray-500 uppercase">Revenue & Avg Rating</div>
          <div className="text-3xl font-extrabold text-amber-600 mt-1">
            ${summary.totalRevenue || 0} <span className="text-sm font-semibold text-gray-600">• {summary.averageRating}★</span>
          </div>
        </div>
      </div>

      {/* Live QR Attendance Scanner */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div className="flex items-center space-x-2 mb-3">
          <QrCode className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-gray-900">QR Ticket Verification Scanner</h2>
        </div>
        <form onSubmit={handleScanTicket} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={qrInput}
            onChange={(e) => setQrInput(e.target.value)}
            placeholder="Paste or scan attendee QR ticket code (e.g., TICKET-...)"
            className="flex-grow px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-mono"
          />
          <button
            type="submit"
            disabled={scanning}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm cursor-pointer"
          >
            {scanning ? 'Verifying...' : 'Verify & Check-In'}
          </button>
        </form>

        {scanResult && (
          <div
            className={`mt-4 p-4 rounded-xl border flex items-start gap-3 ${
              scanResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-red-50 border-red-200 text-red-900'
            }`}
          >
            {scanResult.success ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            )}
            <div className="text-sm">
              <div className="font-bold">{scanResult.status}: {scanResult.message}</div>
              {scanResult.attendee && (
                <div className="text-xs mt-1">
                  Attendee: <strong>{scanResult.attendee.name}</strong> ({scanResult.attendee.email}) • Event:{' '}
                  <strong>{scanResult.event?.title}</strong>
                  {scanResult.seat && ` • Seat: ${scanResult.seat.seatLabel}`}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Events with AI Demand Prediction & Feedback Insights */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Event Demand Predictions & Feedback Intelligence</h2>
        <div className="grid grid-cols-1 gap-4">
          {events.map((ev) => {
            const dp = ev.insights?.demandPrediction || {};
            const fi = ev.insights?.feedbackIntelligence || {};
            return (
              <div key={ev.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <span className="text-xs font-bold text-indigo-600 uppercase">{ev.category?.name}</span>
                    <h3 className="text-lg font-bold text-gray-900">{ev.title}</h3>
                    <p className="text-xs text-gray-500">
                      {new Date(ev.schedule).toLocaleString()} • {ev.venue}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full ${
                        dp.demandLevel === 'HIGH'
                          ? 'bg-emerald-100 text-emerald-800'
                          : dp.demandLevel === 'MODERATE'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {dp.demandLevel} DEMAND ({dp.projectedFillRate}% Projected Fill)
                    </span>
                    <button
                      onClick={() => handleBulkIssueCertificates(ev.id, ev.title)}
                      className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg inline-flex items-center cursor-pointer"
                    >
                      <Award className="h-3.5 w-3.5 mr-1" /> Issue Certificates
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-100">
                    <div className="flex items-center text-xs font-bold text-indigo-900 uppercase mb-1">
                      <TrendingUp className="h-4 w-4 mr-1.5 text-indigo-600" />
                      AI Demand Prediction
                    </div>
                    <div className="text-xs text-gray-700 mb-2">
                      Booked: <strong>{dp.currentBooked}/{dp.maxSeats}</strong> ({dp.currentFillRate}% current →{' '}
                      <strong>{dp.projectedFillRate}% projected</strong>)
                    </div>
                    <p className="text-xs text-indigo-950 font-medium">{dp.recommendation}</p>
                  </div>

                  <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-100">
                    <div className="flex items-center text-xs font-bold text-amber-900 uppercase mb-1">
                      <MessageSquare className="h-4 w-4 mr-1.5 text-amber-600" />
                      Feedback Intelligence ({fi.sentiment})
                    </div>
                    <p className="text-xs text-gray-700">{fi.summary}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OrganizerDashboard;
