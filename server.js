const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const contactRoutes = require('./routes/contact');
const adminRoutes = require('./routes/admin');
const portfolioRoutes = require('./routes/portfolio');

const { generalLimiter } = require('./middleware/rateLimit');
const securityMiddleware = require('./middleware/security');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Security & Performance ──────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    }
  }
}));
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(compression());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(generalLimiter);
app.use(securityMiddleware);

// ── Static Files (your HTML pages) ─────────────────
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1d',
  etag: true
}));

// ── API Routes ──────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/contact',   contactRoutes);
app.use('/api/admin',     adminRoutes);
app.use('/api/portfolio', portfolioRoutes);

// ── Page Routes ─────────────────────────────────────
app.get('/admin',           (req, res) => res.sendFile(path.join(__dirname, 'public/admin.html')));
app.get('/login',           (req, res) => res.sendFile(path.join(__dirname, 'public/login.html')));
app.get('/command-center',  (req, res) => res.sendFile(path.join(__dirname, 'public/command-center.html')));

// ── 404 Handler ─────────────────────────────────────
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public/index.html'));
});

// ── Global Error Handler ─────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
  });
});

app.listen(PORT, () => {
  console.log(`🚀 VEELIX server running on http://localhost:${PORT}`);
});