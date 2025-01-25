require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http'); 
const { Server } = require('socket.io'); 
const { validateApiKey } = require('./middlewares/authMiddleware');
const apiKeyController = require('./controllers/apiKeyController');

const app = express();
const server = http.createServer(app); 
const io = new Server(server, {
  cors: {
    origin: 'https://alysson-b.github.io',
    credentials: true,
    origin: ['http://127.0.0.1:5500', 'http://localhost:5500'], 
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-KEY', 'user-id'], 
  },
});

const allowedOrigins = ['http://127.0.0.1:5500', 'http://localhost:5500'];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Origin not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-KEY', 'user-id'], 
  })
);

app.use(bodyParser.json());

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const courseRoutes = require('./routes/courseRoutes');
const moduleRoutes = require('./routes/moduleRoutes');
const quizRoutes = require('./routes/quizRoutes');
const questionRoutes = require('./routes/questionRoutes');
const simulationRoutes = require('./routes/simulationRoutes');

app.use('/auth', authRoutes);
app.post('/generate-api-key', validateApiKey, apiKeyController.gerarApiKey);
app.use('/usuarios', validateApiKey, userRoutes);
app.use('/cursos', validateApiKey, courseRoutes);
app.use('/modulos', validateApiKey, moduleRoutes);
app.use('/provas', validateApiKey, quizRoutes);
app.use('/questoes', validateApiKey, questionRoutes);
app.use('/simulados', validateApiKey, simulationRoutes);

app.get('/', (req, res) => {
  res.send('Backend funcionando!');
});

io.on('connection', (socket) => {
  console.log('Usuário conectado:', socket.id);

  socket.on('joinTest', (testId) => {
    socket.join(testId);
    console.log(`Usuário entrou no teste: ${testId}`);
  });

  socket.on('disconnect', () => {
    console.log('Usuário desconectado:', socket.id);
  });
});

const notifyTestUpdate = (testId) => {
  io.to(testId).emit('testUpdated', { testId });
};

module.exports = { app, notifyTestUpdate };

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Ambiente: ${process.env.NODE_ENV || 'desenvolvimento'}`);
  console.log(`Servidor disponível em: http://localhost:${PORT}`);
});

console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_KEY:', process.env.SUPABASE_KEY);
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('JWT_SECRET:', process.env.JWT_SECRET);
