import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Award,
  MessageSquare,
  Star,
  Armchair,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const EventDetails = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [similarEvents, setSimilarEvents] = useState([]);
  const [seatData, setSeatData] = useState({ hasLayout: false, seats: [], layout: null });
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  // Team modal / fields
  const [teamName, setTeamName] = useState('');
  const [teamMembers, setTeamMembers] = useState('');

  // Seat allocation
  const [allocatingSeat, setAllocatingSeat] = useState(false);
  const [seatMessage, setSeatMessage] = useState('');

  // Feedback form
  const [rating, setRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Community post form
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');

  useEffect(() => {
    fetchAllEventDetails();
  }, [slug]);

  const fetchAllEventDetails = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/events/slug/${slug}`);
      const ev = res.data;
      setEvent(ev);

      const [simRes, seatRes, fbRes] = await Promise.all([
        axios.get(`/api/events/${ev.id}/similar`).catch(() => ({ data: [] })),
        axios.get(`/api/seats/event/${ev.id}`).catch(() => ({ data: { hasLayout: false, seats: [] } })),
        axios.get(`/api/community/feedback/${ev.id}`).catch(() => ({ data: { feedbacks: [] } }))
      ]);

      setSimilarEvents(simRes.data || []);
      setSeatData(seatRes.data || { hasLayout: false, seats: [] });
      setFeedbacks(fbRes.data.feedbacks || []);
    } catch (err) {
      console.error('Error fetching event:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    if (e) e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      setRegistering(true);
      const membersArr = teamMembers
        ? teamMembers.split(',').map((s) => s.trim()).filter(Boolean)
        : undefined;
      await axios.post('/api/registrations', {
        eventId: event.id,
        teamName: event.isTeamEvent ? teamName || `${user.name}'s Team` : undefined,
        teamMembers: event.isTeamEvent ? membersArr : undefined
      });
      alert('Registration confirmed! Your QR ticket has been generated.');
      fetchAllEventDetails();
    } catch (err) {
      alert(err.response?.data?.error || 'Registration failed');
    } finally {
      setRegistering(false);
    }
  };

  const handleSeatSelection = async (seatLabel = null, autoAllocate = false) => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      setAllocatingSeat(true);
      setSeatMessage('');
      const res = await axios.post('/api/seats/allocate', {
        eventId: event.id,
        seatLabel,
        autoAllocate
      });
      setSeatMessage(res.data.message);
      const updatedSeats = await axios.get(`/api/seats/event/${event.id}`);
      setSeatData(updatedSeats.data);
    } catch (err) {
      setSeatMessage(err.response?.data?.error || 'Could not allocate seat');
    } finally {
      setAllocatingSeat(false);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      await axios.post('/api/community/feedback', {
        eventId: event.id,
        rating,
        tags: ['content', 'organization'],
        comment: feedbackComment
      });
      setFeedbackMsg('Thank you! Your feedback has been recorded.');
      setFeedbackComment('');
      const fbRes = await axios.get(`/api/community/feedback/${event.id}`);
      setFeedbacks(fbRes.data.feedbacks || []);
    } catch (err) {
      setFeedbackMsg(err.response?.data?.error || 'Failed to submit feedback');
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (!postContent.trim()) return;
    try {
      await axios.post('/api/community/posts', {
        eventId: event.id,
        title: postTitle || 'Looking for Teammates / Discussion',
        content: postContent,
        tags: ['Teammate', event.category?.name || 'Event']
      });
      setPostTitle('');
      setPostContent('');
      fetchAllEventDetails();
    } catch (err) {
      alert(err.response?.data?.error || 'Could not create post');
    }
  };

  if (loading) return <div className="text-center py-20 text-gray-500">Loading event details...</div>;
  if (!event) return <div className="text-center py-20 text-gray-500">Event not found.</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Main Event Card */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
        {event.posterUrl && (
          <img src={event.posterUrl} alt={event.title} className="w-full h-72 object-cover" />
        )}
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-3 py-1 rounded-full">
              {event.category?.name}
            </span>
            <span className="bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1 rounded-full">
              {event.isOnline ? 'Online Event' : 'In-Person'}
            </span>
            {event.isTeamEvent && (
              <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-3 py-1 rounded-full">
                Team Event ({event.minTeamSize}–{event.maxTeamSize} members)
              </span>
            )}
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>
              <p className="text-sm text-gray-500 mt-1">
                Organized by <span className="font-semibold text-gray-700">{event.organizer?.name}</span>
              </p>
            </div>
            <button
              onClick={handleRegister}
              disabled={registering || event.seatsLeft <= 0}
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:bg-gray-400 shrink-0 shadow-sm cursor-pointer"
            >
              {event.seatsLeft <= 0 ? 'Sold Out' : registering ? 'Registering...' : 'Register & Claim QR Ticket'}
            </button>
          </div>

          {/* Team Details Input if Team Event */}
          {event.isTeamEvent && event.seatsLeft > 0 && (
            <div className="mt-5 p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-indigo-950 mb-1">Team Name (optional)</label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g., Team CyberKnights"
                  className="w-full px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-indigo-950 mb-1">
                  Teammates (comma-separated names/emails)
                </label>
                <input
                  type="text"
                  value={teamMembers}
                  onChange={(e) => setTeamMembers(e.target.value)}
                  placeholder="Priya, Marcus"
                  className="w-full px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-6 p-4 bg-gray-50 rounded-xl text-sm text-gray-700">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-2.5 text-indigo-600 shrink-0" />
              <span>{new Date(event.schedule).toLocaleString()}</span>
            </div>
            <div className="flex items-center">
              <MapPin className="h-5 w-5 mr-2.5 text-indigo-600 shrink-0" />
              <span>{event.venue}</span>
            </div>
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2.5 text-indigo-600 shrink-0" />
              <span className="font-semibold">{event.price === 0 ? 'Free Entry' : `$${event.price}`}</span>
            </div>
            <div className="flex items-center">
              <Users className="h-5 w-5 mr-2.5 text-indigo-600 shrink-0" />
              <span>{event.seatsLeft} / {event.maxSeats} seats left</span>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">About This Event</h3>
              <p className="mt-1 text-gray-600 leading-relaxed">{event.description}</p>
            </div>
            {event.rules && (
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Rules & Guidelines</h3>
                <p className="mt-1 text-sm text-gray-600">{event.rules}</p>
              </div>
            )}
            {event.prize && (
              <div className="flex items-center bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-xl text-sm font-medium">
                <Award className="h-5 w-5 mr-2 text-amber-600 shrink-0" />
                <span>Prizes & Perks: <strong>{event.prize}</strong></span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Phase 4: Interactive Venue Seat Map */}
      {seatData.hasLayout && (
        <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center space-x-2">
                <Armchair className="h-5 w-5 text-indigo-600" />
                <h2 className="text-xl font-bold text-gray-900">
                  Interactive Seat Selection — {seatData.layout?.name}
                </h2>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Register first, then click any available seat or use Smart Auto-Allocate. Row A is wheelchair-accessible.
              </p>
            </div>
            <button
              onClick={() => handleSeatSelection(null, true)}
              disabled={allocatingSeat}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg shrink-0 cursor-pointer"
            >
              Smart Auto-Allocate Best Seat
            </button>
          </div>

          {seatMessage && (
            <div className="mb-4 px-4 py-2.5 rounded-lg bg-indigo-50 text-indigo-800 text-sm font-medium flex items-center">
              <CheckCircle2 className="h-4 w-4 mr-2 shrink-0" />
              {seatMessage}
            </div>
          )}

          <div className="w-full bg-gray-900 text-gray-300 text-center text-xs uppercase tracking-widest py-1.5 rounded-md mb-6">
            Stage / Podium Screen
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 max-w-2xl mx-auto">
            {seatData.seats.map((seat) => (
              <button
                key={seat.id}
                disabled={seat.isBooked || allocatingSeat}
                onClick={() => handleSeatSelection(seat.seatLabel, false)}
                title={
                  seat.isBooked
                    ? `Seat ${seat.seatLabel} (Booked)`
                    : `Select Seat ${seat.seatLabel}${seat.isAccessible ? ' (Accessible)' : ''}`
                }
                className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                  seat.isBooked
                    ? 'bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed'
                    : seat.isAccessible
                    ? 'bg-sky-50 text-sky-800 border-sky-300 hover:bg-sky-600 hover:text-white cursor-pointer'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-600 hover:text-white cursor-pointer'
                }`}
              >
                {seat.seatLabel}
              </button>
            ))}
          </div>

          <div className="flex justify-center gap-6 mt-6 text-xs text-gray-600">
            <span className="flex items-center"><span className="w-3 h-3 rounded-xs bg-emerald-100 border border-emerald-400 mr-1.5" /> Available</span>
            <span className="flex items-center"><span className="w-3 h-3 rounded-xs bg-sky-100 border border-sky-400 mr-1.5" /> Accessible Row</span>
            <span className="flex items-center"><span className="w-3 h-3 rounded-xs bg-gray-200 border border-gray-300 mr-1.5" /> Booked</span>
          </div>
        </div>
      )}

      {/* Event Community & Teammate Finder + Feedback */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Teammate & Discussion Board */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <MessageSquare className="h-5 w-5 text-indigo-600" />
            <h3 className="text-lg font-bold text-gray-900">Event Discussion & Teammate Finder</h3>
          </div>

          <form onSubmit={handleCreatePost} className="space-y-2.5 mb-6">
            <input
              type="text"
              value={postTitle}
              onChange={(e) => setPostTitle(e.target.value)}
              placeholder="Post title (e.g., Need 1 frontend dev for our team)"
              className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg"
            />
            <textarea
              rows={2}
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="Share skills, ask questions, or find teammates..."
              className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg"
            />
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-lg"
            >
              Post to Event Feed
            </button>
          </form>

          <div className="space-y-3 max-h-72 overflow-y-auto">
            {(!event.communityPosts || event.communityPosts.length === 0) ? (
              <p className="text-xs text-gray-500">No posts yet. Start the conversation!</p>
            ) : (
              event.communityPosts.map((post) => (
                <div key={post.id} className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span className="font-bold text-gray-800">{post.user?.name || 'Student'}</span>
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                  {post.title && <div className="font-semibold text-sm text-gray-900 mt-1">{post.title}</div>}
                  <p className="text-xs text-gray-600 mt-1">{post.content}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Event Ratings & Feedback */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Star className="h-5 w-5 text-amber-500" />
            <h3 className="text-lg font-bold text-gray-900">Rate & Review Event</h3>
          </div>

          {feedbackMsg && (
            <div className="mb-3 p-2.5 bg-emerald-50 text-emerald-800 text-xs rounded-lg font-medium">
              {feedbackMsg}
            </div>
          )}

          <form onSubmit={handleFeedbackSubmit} className="space-y-3 mb-6">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-gray-700">Your Rating:</span>
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  type="button"
                  key={num}
                  onClick={() => setRating(num)}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                    rating >= num ? 'bg-amber-400 text-amber-950' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {num} ★
                </button>
              ))}
            </div>
            <textarea
              rows={2}
              value={feedbackComment}
              onChange={(e) => setFeedbackComment(e.target.value)}
              placeholder="Share your experience with the venue, speakers, or organization..."
              className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg"
            />
            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-4 py-2 rounded-lg"
            >
              Submit Feedback
            </button>
          </form>

          <div className="space-y-2.5 max-h-60 overflow-y-auto">
            {feedbacks.length === 0 ? (
              <p className="text-xs text-gray-500">No reviews yet.</p>
            ) : (
              feedbacks.map((fb) => (
                <div key={fb.id} className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-gray-800">{fb.user?.name || 'Attendee'}</span>
                    <span className="text-amber-600 font-bold">{'★'.repeat(fb.rating)}</span>
                  </div>
                  {fb.comment && <p className="text-xs text-gray-600 mt-1">{fb.comment}</p>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Similar Events */}
      {similarEvents.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">Similar Events You Might Like</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {similarEvents.slice(0, 3).map((sim) => (
              <Link
                key={sim.id}
                to={`/events/${sim.slug}`}
                className="bg-white p-4 rounded-xl border border-gray-200 hover:shadow-md transition-all"
              >
                <span className="text-xs font-semibold text-indigo-600">{sim.category?.name}</span>
                <h4 className="font-bold text-gray-900 mt-1 line-clamp-1">{sim.title}</h4>
                <p className="text-xs text-gray-500 mt-1">{new Date(sim.schedule).toLocaleDateString()} • {sim.venue}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetails;
