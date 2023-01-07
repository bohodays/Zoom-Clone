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

function publicRooms() {
  const { sockets : 
    { adapter: {
      sids, 
      rooms
      }
    } 
  } = io;
  const publicRooms = [];
  rooms.forEach((_, key) => {
    if (sids.get(key) === undefined) {
      publicRooms.push(key)
    }
  })
  return publicRooms;
}

function countRoom(roomName) {
  return io.sockets.adapter.rooms.get(roomName)?.size;
}

io.on('connection', (socket) => {
  socket['nickname'] = 'Anon';
  socket.onAny((event) => {
    console.log(`Socket Event: ${event}`);
  });
  socket.on('enter_room', (roomName, done) => {
    socket.join(roomName);
    done();
    socket.to(roomName).emit('welcome', socket.nickname, countRoom(roomName));
    io.sockets.emit('room_change', publicRooms());
  })
  socket.on('disconnecting', () => {
    socket.rooms.forEach((room) => socket.to(room).emit('bye', socket.nickname, countRoom(room) - 1));
  })
  socket.on('disconnect', () => {
    io.sockets.emit('room_change', publicRooms());
  })
  socket.on('new_message', (msg, room, done) => {
    socket.to(room).emit('new_message', `${socket.nickname}: ${msg}`);
    done();
  })
  socket.on('nickname', (nickname) => {
    socket['nickname'] = nickname;
  })
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

