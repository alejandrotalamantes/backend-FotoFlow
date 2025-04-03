const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const fileUpload = require('express-fileupload');
const routes = require('./routes');
const { sequelize } = require('./models');
const { PORT } = require('./config');

const app = express();
const server = http.createServer(app);



const { initSocket, joinRoom } = require('./socket'); // <-- asegúrate de importar joinRoom

const io = new Server(server, {
  cors: {
    origin: 'https://photobooth.soluciomax.com',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

io.on('connection', (socket) => {
  console.log('Cliente conectado');

  socket.on('join', (roomId) => {
    console.log(`Unido a la sala: ${roomId}`);
    joinRoom(socket, roomId);
  });
});

initSocket(io);

app.use(cors({
  origin: 'https://photobooth.soluciomax.com',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

app.use(express.json());
app.use(fileUpload());
app.use('/api', routes);
app.use('/uploads', express.static('uploads'));

sequelize.sync().then(() => {
  server.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
  });
});
