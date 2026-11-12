const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const aiRoutes = require('./routes/aiRoutes');
const seatRoutes = require('./routes/seatRoutes');
const organizerRoutes = require('./routes/organizerRoutes');
const communityRoutes = require('./routes/communityRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/seats', seatRoutes);
app.use('/api/attendance', seatRoutes);
app.use('/api/organizer', organizerRoutes);
app.use('/api/community', communityRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'EventSphere API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({ error: 'Something went wrong on the server!' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 EventSphere server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
