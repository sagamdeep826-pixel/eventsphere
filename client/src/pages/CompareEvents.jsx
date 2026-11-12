import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Sparkles, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

const CompareEvents = () => {
  const [events, setEvents] = useState([]);
  const [eventAId, setEventAId] = useState('');
  const [eventBId, setEventBId] = useState('');
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get('/api/events?limit=30').then((res) => {
      const list = res.data.events || [];
      setEvents(list);
      if (list.length >= 2) {
        setEventAId(list[0].id);
        setEventBId(list[1].id);
      }
    });
  }, []);

  const handleCompare = async (e) => {
    if (e) e.preventDefault();
    if (!eventAId || !eventBId) return;
    if (eventAId === eventBId) {
      alert('Please select two different events to compare.');
      return;
    }
    try {
      setLoading(true);
      const res = await axios.post('/api/ai/compare', { eventAId, eventBId });
      setComparison(res.data);
    } catch (err) {
      console.error('Compare error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div>
        <div className="inline-flex items-center space-x-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
          <Sparkles className="h-4 w-4" />
          <span>AI Decision Engine</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Which Event Is Better For Me?</h1>
        <p className="text-sm text-gray-600 mt-1">
          Select any two campus events to analyze fit score, schedule conflicts, entry fees, and rewards side by side.
        </p>
      </div>

      {/* Selector Card */}
      <form onSubmit={handleCompare} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">First Event (Event A)</label>
            <select
              value={eventAId}
              onChange={(e) => setEventAId(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm bg-white"
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title} ({ev.category?.name} • {ev.price === 0 ? 'Free' : `$${ev.price}`})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Second Event (Event B)</label>
            <select
              value={eventBId}
              onChange={(e) => setEventBId(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm bg-white"
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title} ({ev.category?.name} • {ev.price === 0 ? 'Free' : `$${ev.price}`})
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm inline-flex items-center cursor-pointer"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          {loading ? 'Analyzing Fit & Schedules...' : 'Compare Events with AI'}
        </button>
      </form>

      {/* Results */}
      {comparison && (
        <div className="space-y-6">
          {/* AI Verdict Banner */}
          <div className="bg-gradient-to-r from-indigo-900 to-purple-900 text-white p-6 rounded-2xl shadow-md">
            <div className="flex items-center space-x-2 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="h-4 w-4" />
              <span>AI Recommendation Verdict</span>
            </div>
            <h2 className="text-xl font-bold mb-2">
              Recommended Pick: {comparison.recommendedTitle}
            </h2>
            <p className="text-indigo-100 text-sm leading-relaxed">{comparison.verdict}</p>

            {comparison.hasScheduleConflict && (
              <div className="mt-4 inline-flex items-center bg-amber-400/20 border border-amber-300/40 text-amber-200 px-3 py-1.5 rounded-lg text-xs font-semibold">
                <AlertTriangle className="h-4 w-4 mr-1.5" />
                Schedule Conflict Detected: Both events occur within 3 hours of each other.
              </div>
            )}
          </div>

          {/* Side-by-Side Score Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[comparison.eventA, comparison.eventB].map((ev) => {
              const isWinner = ev.id === comparison.recommendedEventId;
              return (
                <div
                  key={ev.id}
                  className={`bg-white p-6 rounded-2xl border-2 ${
                    isWinner ? 'border-indigo-600 shadow-md' : 'border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold uppercase px-2.5 py-1 rounded bg-indigo-50 text-indigo-700">
                      {ev.category}
                    </span>
                    <span className="text-sm font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                      {ev.fitScore}% Profile Fit
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    {ev.title}
                    {isWinner && <CheckCircle2 className="h-5 w-5 text-indigo-600 shrink-0" />}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(ev.schedule).toLocaleString()} • {ev.venue}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Comparison Matrix Table */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="py-3.5 px-4 font-bold text-gray-700">Dimension</th>
                  <th className="py-3.5 px-4 font-bold text-indigo-900">{comparison.eventA.title}</th>
                  <th className="py-3.5 px-4 font-bold text-indigo-900">{comparison.eventB.title}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {comparison.dimensions?.map((dim, i) => (
                  <tr key={i} className="hover:bg-gray-50/60">
                    <td className="py-3 px-4 font-semibold text-gray-700">{dim.label}</td>
                    <td className="py-3 px-4 text-gray-600">{dim.eventA}</td>
                    <td className="py-3 px-4 text-gray-600">{dim.eventB}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompareEvents;
