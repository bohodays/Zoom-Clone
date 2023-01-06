import http from 'http';
import WebSocket from 'ws';
import express from 'express';

const app = express();

app.set('view engine', 'pug');
app.set('views', __dirname + '/views');
app.use('/public', express.static(__dirname + '/public'))
app.get('/', (req, res) => res.render('home'));
app.get('/*', (req, res) => res.redirect('/'));

const handleListen = () => console.log(`Listen on http://localhost:3000`);

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const sockets = [];

wss.on('connection', (socket) => {
  sockets.push(socket);
  console.log("Connected to Brower");
  socket.on('close', () => {
    console.log("브라우저 연결 끊김");
  })
  socket.on('message', (message) => {
    sockets.forEach((aScocket) => {
      aScocket.send(message.toString());
    })
  });
  socket.send("hello!!!");
})

server.listen(3000, handleListen);

