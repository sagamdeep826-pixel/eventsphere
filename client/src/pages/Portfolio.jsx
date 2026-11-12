import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Award, CheckCircle2, Calendar, BookOpen, Code, Sparkles, Save } from 'lucide-react';

const Portfolio = () => {
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const [form, setForm] = useState({
    college: '',
    branch: '',
    year: 3,
    interests: '',
    skills: ''
  });

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const parseArr = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    try {
      return JSON.parse(val);
    } catch {
      return [];
    }
  };

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/community/portfolio');
      setPortfolio(res.data);
      const sp = res.data.profile?.studentProfile;
      if (sp) {
        setForm({
          college: sp.college || 'State University of Technology',
          branch: sp.branch || 'Computer Science',
          year: sp.year || 3,
          interests: parseArr(sp.interests).join(', '),
          skills: parseArr(sp.skills).join(', ')
        });
      }
    } catch (err) {
      console.error('Error loading portfolio:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSaveMsg('');
      await axios.put('/api/community/profile', {
        college: form.college,
        branch: form.branch,
        year: Number(form.year),
        interests: form.interests.split(',').map((s) => s.trim()).filter(Boolean),
        skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean)
      });
      setSaveMsg('Profile skills & interests updated! AI recommendations will automatically refresh.');
      fetchPortfolio();
    } catch {
      setSaveMsg('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-gray-500">Loading student portfolio...</div>;
  if (!portfolio) return <div className="text-center py-20 text-gray-500">Please log in to view your portfolio.</div>;

  const { profile, stats, certificates, registrations } = portfolio;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-700 text-white p-8 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider bg-white/15 px-3 py-1 rounded-full">
            Verified Campus Portfolio
          </span>
          <h1 className="text-3xl font-extrabold mt-2">{profile.name}</h1>
          <p className="text-indigo-100 text-sm mt-1">
            {profile.studentProfile?.branch || 'Engineering'} • Year {profile.studentProfile?.year || 3} •{' '}
            {profile.studentProfile?.college || 'State University of Technology'}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-white/10 px-4 py-3 rounded-xl">
            <div className="text-2xl font-extrabold">{stats.totalEventsRegistered}</div>
            <div className="text-[11px] text-indigo-200">Events Joined</div>
          </div>
          <div className="bg-white/10 px-4 py-3 rounded-xl">
            <div className="text-2xl font-extrabold text-amber-300">{stats.certificatesEarned}</div>
            <div className="text-[11px] text-indigo-200">Certificates</div>
          </div>
          <div className="bg-white/10 px-4 py-3 rounded-xl">
            <div className="text-2xl font-extrabold text-emerald-300">{stats.attendedEvents}</div>
            <div className="text-[11px] text-indigo-200">Checked In</div>
          </div>
        </div>
      </div>

      {/* Earned Certificates */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div className="flex items-center space-x-2 mb-4">
          <Award className="h-5 w-5 text-amber-500" />
          <h2 className="text-xl font-bold text-gray-900">Earned Merit & Participation Certificates</h2>
        </div>

        {certificates.length === 0 ? (
          <p className="text-sm text-gray-500">
            No certificates issued yet. Attend events to earn verified digital certificates!
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="p-5 rounded-xl border-2 border-amber-200 bg-gradient-to-br from-amber-50/60 to-white flex flex-col justify-between"
              >
                <div>
                  <span className="text-xs font-extrabold uppercase px-2.5 py-0.5 rounded bg-amber-100 text-amber-900">
                    {cert.resultType}
                  </span>
                  <h3 className="font-bold text-gray-900 mt-2">{cert.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Issued on {new Date(cert.issuedAt).toLocaleDateString()} • {cert.event?.title}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-amber-100 flex justify-between items-center text-xs">
                  <span className="text-emerald-700 font-semibold inline-flex items-center">
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Verified Credential
                  </span>
                  <span className="font-mono text-gray-400">ID: {cert.id.slice(0, 8)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Skills & AI Personalization Settings */}
      <form onSubmit={handleSaveProfile} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-900">Skills & AI Recommendation Profile</h2>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center cursor-pointer"
          >
            <Save className="h-3.5 w-3.5 mr-1.5" />
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>

        {saveMsg && (
          <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-lg font-medium">{saveMsg}</div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">College</label>
            <input
              type="text"
              value={form.college}
              onChange={(e) => setForm({ ...form, college: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Branch / Major</label>
            <input
              type="text"
              value={form.branch}
              onChange={(e) => setForm({ ...form, branch: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Academic Year</label>
            <select
              value={form.year}
              onChange={(e) => setForm({ ...form, year: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            >
              <option value={1}>1st Year</option>
              <option value={2}>2nd Year</option>
              <option value={3}>3rd Year</option>
              <option value={4}>4th Year</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Interests (comma-separated)</label>
            <input
              type="text"
              value={form.interests}
              onChange={(e) => setForm({ ...form, interests: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Skills (comma-separated)</label>
            <input
              type="text"
              value={form.skills}
              onChange={(e) => setForm({ ...form, skills: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default Portfolio;
