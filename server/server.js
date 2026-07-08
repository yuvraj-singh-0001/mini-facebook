require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./src/routes/router');
const http = require('http');
const setupSocket = require('./src/socket');

const app = express();
const server = http.createServer(app);

// Setup Socket.io
setupSocket(server);

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api', authRoutes);

// Test Route
app.get('/', (req, res) => {
  res.send('Mini-Facebook API is running');
});

const PORT = process.env.PORT || 5002;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Database connection
// (MongoDB Atlas connection)
const BadWord = require('./src/models/BadWord');

mongoose.connect(process.env.MONGODB_URI, {
  maxPoolSize: 20,
  minPoolSize: 5,
  socketTimeoutMS: 60000,
  connectTimeoutMS: 30000,
  serverSelectionTimeoutMS: 10000,
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
