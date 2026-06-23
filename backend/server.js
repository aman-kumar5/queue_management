const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { initializeDatabase } = require('./config/db');
const { initModels } = require('./models');

const app = express();
const httpServer = http.createServer(app);

// Enable CORS for frontend client
app.use(cors({
  origin: true, // Echoes the request origin to allow credentials
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Socket.IO Setup
const io = new Server(httpServer, {
  cors: {
    origin: true,
    methods: ['GET', 'POST']
  }
});

// Middleware to inject Socket.IO into Express request objects
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Socket.IO event handler
const handleSocket = require('./socket/socketHandler');
handleSocket(io);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Queue Cure API is running' });
});

// Setup application and database
async function startServer() {
  try {
    // 1. Initialize Sequelize and Database
    const sequelize = await initializeDatabase();
    
    // 2. Initialize Models
    const { QueueSettings } = initModels(sequelize);
    
    // 3. Sync Models (creates tables if they don't exist)
    await sequelize.sync({ alter: true });
    console.log('Database tables synchronized successfully.');

    // 4. Seed initial queue settings if table is empty
    const settingsCount = await QueueSettings.count();
    if (settingsCount === 0) {
      await QueueSettings.create({
        id: 1,
        current_token: 0,
        next_token: 1,
        average_consultation_time: 10,
        patients_served: 0
      });
      console.log('Default queue settings seeded.');
    }

    // 5. Mount API Routes
    const patientRoutes = require('./routes/patientRoutes');
    const queueRoutes = require('./routes/queueRoutes');
    const authRoutes = require('./routes/authRoutes');
    app.use('/api/patients', patientRoutes);
    app.use('/api/queue', queueRoutes);
    app.use('/api/auth', authRoutes);

    // 6. Listen
    const PORT = process.env.PORT || 5000;
    httpServer.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
