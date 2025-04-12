require('dotenv').config(); // <-- Cargar .env antes de usar config
const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const fileUpload = require('express-fileupload');
const { Server } = require('socket.io');

const { sequelize } = require('./models');
const { PORT, HOST } = require('./config');
const routes = require('./routes');
const { initSocket, joinRoom } = require('./socket');

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',      
  'https://4a42-189-182-198-181.ngrok-free.app', // <- tu ngrok u otra URL
  'https://photobooth.soluciomax.com' // <- si accedes desde producción
];

// === Configurar Socket.IO ===
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

io.on('connection', (socket) => {
  console.log('🟢 Cliente conectado');

  socket.on('join', (roomId) => {
    console.log(`📥 Unido a la sala: ${roomId}`);
    joinRoom(socket, roomId);
  });
});

initSocket(io);

// === Middlewares ===
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn('❌ Origen no permitido por CORS:', origin);
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// === Rutas ===
app.use('/api', routes); // <-- todas las rutas centralizadas aquí
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



// === Iniciar servidor ===
sequelize.sync().then(() => {
  server.listen(PORT, () => {
    const protocol = process.env.NODE_ENV === 'production' ? 'http' : 'http';
    console.log(`🚀 Servidor corriendo en ${protocol}://${HOST}:${PORT}`);
  });
});

