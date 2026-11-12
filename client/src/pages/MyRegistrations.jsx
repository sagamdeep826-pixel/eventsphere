import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Calendar, Ticket, MapPin, Armchair, QrCode, Users } from 'lucide-react';

const MyRegistrations = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        const res = await axios.get('/api/registrations/my-registrations');
        setRegistrations(res.data.registrations || []);
      } catch (err) {
        console.error('Error fetching registrations:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRegistrations();
  }, []);

  if (loading) return <div className="text-center py-20 text-gray-500">Loading your tickets...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Smart QR Tickets</h1>
          <p className="text-sm text-gray-500 mt-1">
            Present your unique QR code at the venue entrance for instant check-in
          </p>
        </div>
        <Link
          to="/events"
          className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
        >
          + Register for more events
        </Link>
      </div>

      <div className="grid gap-6">
        {registrations.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center">
            <Ticket className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-800">No Tickets Yet</h3>
            <p className="text-sm text-gray-500 mt-1 mb-4">
              Explore upcoming campus hackathons, workshops, and cultural fests to claim your first ticket.
            </p>
            <Link
              to="/events"
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold"
            >
              Browse Events
            </Link>
          </div>
        ) : (
          registrations.map((reg) => (
            <div
              key={reg.id}
              className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden flex flex-col sm:flex-row"
            >
              <div className="p-6 flex-grow space-y-3">
                <div className="flex items-center justify-between">
                  <span className="bg-emerald-100 text-emerald-800 px-3 py-0.5 rounded-full text-xs font-bold">
                    {reg.status}
                  </span>
                  {reg.ticket?.isUsed && (
                    <span className="bg-indigo-100 text-indigo-800 px-3 py-0.5 rounded-full text-xs font-semibold">
                      Checked In ✓
                    </span>
                  )}
                </div>

                <Link
                  to={`/events/${reg.event.slug}`}
                  className="text-xl font-bold text-gray-900 hover:text-indigo-600 block"
                >
                  {reg.event.title}
                </Link>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-indigo-600" />
                    {new Date(reg.event.schedule).toLocaleString()}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-indigo-600" />
                    {reg.event.venue}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-1">
                  {reg.seat ? (
                    <span className="inline-flex items-center text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200 px-3 py-1 rounded-lg">
                      <Armchair className="h-3.5 w-3.5 mr-1.5" />
                      Seat {reg.seat.seatLabel}
                    </span>
                  ) : (
                    <Link
                      to={`/events/${reg.event.slug}`}
                      className="inline-flex items-center text-xs font-semibold text-indigo-600 hover:underline"
                    >
                      <Armchair className="h-3.5 w-3.5 mr-1" />
                      Select Venue Seat →
                    </Link>
                  )}

                  {reg.teamName && (
                    <span className="inline-flex items-center text-xs font-semibold bg-purple-50 text-purple-800 px-3 py-1 rounded-lg">
                      <Users className="h-3.5 w-3.5 mr-1.5" />
                      Team: {reg.teamName}
                    </span>
                  )}
                </div>
              </div>

              {/* QR Ticket Stub */}
              <div className="bg-gray-50 border-t sm:border-t-0 sm:border-l border-dashed border-gray-300 p-6 flex flex-col items-center justify-center sm:w-64 shrink-0">
                <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs mb-2">
                  <QrCode className="h-14 w-14 text-gray-900" />
                </div>
                <div className="text-[11px] font-mono font-bold text-gray-800 bg-gray-200/80 px-2.5 py-1 rounded select-all">
                  {reg.ticket?.qrCode || 'NO-TICKET'}
                </div>
                <span className="text-[10px] text-gray-400 mt-1">Copy code for organizer scanner</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MyRegistrations;
