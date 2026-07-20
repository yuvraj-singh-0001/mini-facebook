require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

mongoose.set('bufferCommands', false);

// Global error handlers - server ko crash hone se bachao
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION (server will not crash):', err.message);
});
process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION (server will not crash):', reason);
});

const authRoutes = require('./src/routes/router');
const http = require('http');
const setupSocket = require('./src/socket');

const app = express();
const server = http.createServer(app);

// Setup Socket.io
setupSocket(server);

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'https://vaaknow.com',
  'https://www.vaaknow.com'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
const BODY_LIMIT = process.env.BODY_LIMIT || '30mb';
app.use(express.json({ limit: BODY_LIMIT }));
app.use(express.urlencoded({ limit: BODY_LIMIT, extended: true }));

function requireDbConnection(req, res, next) {
  const state = mongoose.connection.readyState;
  // 1 = connected, 2 = connecting (wait briefly)
  if (state === 1) return next();
  if (state === 2) {
    // DB is still connecting (server just started) — wait up to 5s
    const startWait = Date.now();
    const poll = setInterval(() => {
      if (mongoose.connection.readyState === 1) {
        clearInterval(poll);
        return next();
      }
      if (Date.now() - startWait > 5000) {
        clearInterval(poll);
        return res.status(503).json({
          message: 'Database connection is not ready. Please retry in a moment.'
        });
      }
    }, 200);
  } else {
    return res.status(503).json({
      message: 'Database connection is not ready. Please retry in a moment.'
    });
  }
}

// Routes
app.use('/api', requireDbConnection, authRoutes);

// Test Route
app.get('/', (req, res) => {
  res.send('Mini-Facebook API is running');
});

const PORT = process.env.PORT || 5002;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// MongoDB connection event listeners
mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected - queries will fail until reconnected');
});
mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected successfully');
});
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err.message);
});

// Database connection
// (MongoDB Atlas connection)
const BadWord = require('./src/models/BadWord');

mongoose.connect(process.env.MONGODB_URI, {
  maxPoolSize: 10,
  minPoolSize: 2,
  socketTimeoutMS: 25000,      // 25 sec - Atlas slow queries handle karo
  connectTimeoutMS: 20000,     // 20 sec initial connect timeout
  serverSelectionTimeoutMS: 15000, // 15 sec server select timeout
  heartbeatFrequencyMS: 10000,
  retryWrites: true,
  retryReads: true,
})
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Reseed bad words to support categories only if empty
    try {
      const count = await BadWord.countDocuments();
      if (count === 0) {
        await BadWord.deleteMany({}); // Clear old words
        const categorizedWords = [
          ...[
            "porn", "sex", "nude", "nanga", "sexy", "mms", "boobs", "dick", "pussy", "chut", "gaand",
            "bur", "gannd", "gand", "land", "laude", "pel", "pela",
            "sunny leone", "mia khalifa", "angela white", "lana rhoades", "mia malkova", "eva elfie",
            "abella danger", "nicole aniston", "johnny sins", "jordi el nino pollo", "kieran lee",
            "manuel ferrara", "priyaanjalisex", "condom", "condoms", "कंडोम",
            "segs", "corn", "s3x", "p0rn", "nsfw", "18plus", "hookup", "xxxx", "xxx", "uncensored", "adultcontent",
            "fingerplay", "beerhub", "spank", "foreplay", "sexplay", "body play", "makeout", "fingering",
            "rubbing", "licking", "squeezing", "nudity", "boobfruit", "drive you", "bdsm", "bondage",
            "chhata kal kar kholunga", "kink", "tab chocolate", "bj", "blowjob", "boobjob"
          ].map(word => ({ word, category: 'adult_content' })),
          ...[
            "kutta", "kamina", "saala", "harami", "bhikhari", "chutiya", "bhenchod", "madarchod", "gaandu", "lund",
            "peldunga", "ganndmarunga", "randi", "sala", "sali", "chod", "maharchod", "madharchod",
            "phenchod", "machod", "bhosdike", "bhen de tatte", "lulli de keede", "lodi", "machod chutiya", "ganndu saale de tatttu", "tatti"
          ].map(word => ({ word, category: 'abusive_and_slangs' })),
          ...[
            "fuck", "shit", "asshole", "bitch", "bastard"
          ].map(word => ({ word, category: 'english_curses' })),
          ...[
            "linkinbio", "dmme", "backupacc", "premiumcontent", "onlyf", "swipeup", "linkincomments", "privatecontent", "premiumacc"
          ].map(word => ({ word, category: 'spam' }))
        ];
        await BadWord.insertMany(categorizedWords);
        console.log('Categorized bad words seeded.');
      }
    } catch (err) {
      console.error('Failed to seed bad words:', err);
    }
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });
