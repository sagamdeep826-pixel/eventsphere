import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { Users, MessageSquare, Send, Megaphone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Community = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [loading, setLoading] = useState(true);

  // New post state
  const [postEventId, setPostEventId] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('React, Teammate, Hackathon');

  // Comment input map by postId
  const [commentInputs, setCommentInputs] = useState({});

  useEffect(() => {
    axios.get('/api/events?limit=30').then((res) => {
      const evs = res.data.events || [];
      setEvents(evs);
      if (evs.length > 0) setPostEventId(evs[0].id);
    });
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [selectedEventId]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const query = selectedEventId ? `?eventId=${selectedEventId}` : '';
      const res = await axios.get(`/api/community/posts${query}`);
      setPosts(res.data.posts || []);
    } catch (err) {
      console.error('Error loading community posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (!postEventId || !content.trim()) return;

    try {
      await axios.post('/api/community/posts', {
        eventId: postEventId,
        title: title || 'Looking for Teammates',
        content,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean)
      });
      setTitle('');
      setContent('');
      fetchPosts();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to publish post');
    }
  };

  const handleAddComment = async (postId) => {
    if (!user) {
      navigate('/login');
      return;
    }
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;

    try {
      await axios.post(`/api/community/posts/${postId}/comments`, { content: text });
      setCommentInputs({ ...commentInputs, [postId]: '' });
      fetchPosts();
    } catch (err) {
      alert(err.response?.data?.error || 'Could not add comment');
    }
  };

  const parseTags = (raw) => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Campus Community & Teammate Finder</h1>
          <p className="text-sm text-gray-600 mt-1">
            Find hackathon teammates, form squads, and read official organizer announcements
          </p>
        </div>
        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="px-3.5 py-2 border border-gray-300 rounded-xl text-sm bg-white"
        >
          <option value="">All Events Feed</option>
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>{ev.title}</option>
          ))}
        </select>
      </div>

      {/* Create Post Form */}
      <form onSubmit={handleCreatePost} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
        <h3 className="font-bold text-gray-900 flex items-center">
          <Users className="h-5 w-5 mr-2 text-indigo-600" />
          Start a Teammate Search or Discussion
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select
            value={postEventId}
            onChange={(e) => setPostEventId(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
          >
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>{ev.title}</option>
            ))}
          </select>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Tags (comma-separated: React, Python, UI/UX)"
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Headline (e.g., Looking for 2 teammates with Python & ML skills!)"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
        <textarea
          rows={2}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Describe your project idea, required skills, or question..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-sm font-semibold cursor-pointer"
        >
          Publish Post
        </button>
      </form>

      {/* Posts Feed */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading community discussions...</div>
      ) : posts.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center text-gray-500">
          No community posts for this filter yet. Be the first to post!
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  {post.isAnnouncement && (
                    <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center">
                      <Megaphone className="h-3 w-3 mr-1" /> Announcement
                    </span>
                  )}
                  <span className="font-bold text-sm text-gray-900">{post.user?.name}</span>
                  <span className="text-xs text-gray-400">• {new Date(post.createdAt).toLocaleString()}</span>
                </div>
                {post.event && (
                  <Link
                    to={`/events/${post.event.slug}`}
                    className="text-xs font-semibold text-indigo-600 hover:underline"
                  >
                    {post.event.title} →
                  </Link>
                )}
              </div>

              {post.title && <h4 className="text-lg font-bold text-gray-900">{post.title}</h4>}
              <p className="text-sm text-gray-700 leading-relaxed">{post.content}</p>

              <div className="flex flex-wrap gap-1.5">
                {parseTags(post.tags).map((t, i) => (
                  <span key={i} className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-medium">
                    #{t}
                  </span>
                ))}
              </div>

              {/* Comments Section */}
              <div className="pt-3 border-t border-gray-100 space-y-2">
                {post.comments?.map((c) => (
                  <div key={c.id} className="bg-gray-50 px-3.5 py-2 rounded-xl text-xs">
                    <span className="font-bold text-gray-900 mr-2">{c.user?.name}:</span>
                    <span className="text-gray-700">{c.content}</span>
                  </div>
                ))}

                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={commentInputs[post.id] || ''}
                    onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                    placeholder="Write a reply or offer to join team..."
                    className="flex-grow text-xs px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddComment(post.id)}
                    className="bg-gray-900 hover:bg-gray-800 text-white px-3 py-2 rounded-lg text-xs font-semibold inline-flex items-center"
                  >
                    <Send className="h-3.5 w-3.5 mr-1" /> Reply
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Community;
