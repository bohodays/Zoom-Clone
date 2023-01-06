import http from 'http';
import SocketIO from 'socket.io';
import express from 'express';

const app = express();

app.set('view engine', 'pug');
app.set('views', __dirname + '/views');
app.use('/public', express.static(__dirname + '/public'))
app.get('/', (req, res) => res.render('home'));
app.get('/*', (req, res) => res.redirect('/'));

const handleListen = () => console.log(`Listen on http://localhost:3000`);

const server = http.createServer(app);
const io = SocketIO(server);

io.on('connection', (socket) => {
  console.log(socket);
})

// const wss = new WebSocket.Server({ server });
// const sockets = [];
// wss.on('connection', (socket) => {
//   sockets.push(socket);
//   socket["nickname"] = "Anon";
//   console.log("Connected to Brower");
//   socket.on('close', () => {
//     console.log("브라우저 연결 끊김");
//   })
//   socket.on('message', (msg) => {
//     const message = JSON.parse(msg);
//     switch (message.type) {
//       case "new_message":
//         sockets.forEach((aScocket) => {
//           aScocket.send(`${socket.nickname}: ${message.payload}`);
//         })
//       case "nickname":
//         socket["nickname"] = message.payload;
//     }
//   });
// })

server.listen(3000, handleListen);

