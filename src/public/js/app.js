const socket = io();

const myFace = document.getElementById('myFace');
const muteBtn = document.querySelector('#mute')
const cameraBtn = document.querySelector('#camera')

const call = document.querySelector('#call')

call.hidden = true;

let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnection;
let myDataChannel;

const camerasSelect = document.getElementById('cameras');

// 유저의 장치에서 카메라를 가져와서 선택 목록에 넣어주는 함수
async function getCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((device) => device.kind === 'videoinput');
    const currentCamera = myStream.getVideoTracks()[0];
    cameras.forEach((camera) => {
      const option = document.createElement('option');
      option.value = camera.deviceId;
      option.innerText = camera.label;
      if (currentCamera.label === camera.label) {
        option.selected = true;
      }
      camerasSelect.appendChild(option);
    });
  } catch (e) {
    console.log(e);
  }
}

// 유저의 카메라를 가져오는 함수
async function getMedia(deviceId) {
  const initialConstrains = {
    audio: true,
    video: { facingMode: "user" },
  };
  const cameraConstraints = {
    audio: true,
    video: { deviceId: { exact: deviceId } }
  };
  try {
    myStream = await navigator.mediaDevices.getUserMedia(
      deviceId ? cameraConstraints : initialConstrains
    )
    myFace.srcObject = myStream;
    if (!deviceId) {
      await getCameras();
    }
  } catch (e) {
    console.log(e);
  }
}

// 유저의 음소거를 제어하는 함수
function handleMuteClick() {
  myStream.getAudioTracks().forEach((track) => (track.enabled = !track.enabled));
  if (!muted) {
    muteBtn.innerText = "Unmute"
    muted = true;
  } else {
    muteBtn.innerText = "Mute"
    muted = false;
  }
}

// 유저의 카메라를 온오프를 제어하는 함수
function handleCameraClick() {
  myStream.getVideoTracks().forEach((track) => (track.enabled = !track.enabled));
  if (!cameraOff) {
    cameraBtn.innerText = 'Turn Camera Off'
    cameraOff = true;
  } else {
    cameraBtn.innerText = 'True Camera On'
    cameraOff = false;
  }
}

// 카메라를 변경하는 함수
async function handleCameraChange() {
  await getMedia(camerasSelect.value);
  if (myPeerConnection) {
    const videoTrack = myStream.getVideoTracks()[0];
    // Sender를 통해 다른 브라우저로 보내진 비디오와 오디오 데이터를 컨트롤할 수 있다.
    const videoSender = myPeerConnection.getSenders().find((sender) => sender.track.kind === 'video');
    videoSender.replaceTrack(videoTrack);
  }
}

muteBtn.addEventListener('click', handleMuteClick);
cameraBtn.addEventListener('click', handleCameraClick);
camerasSelect.addEventListener('input', handleCameraChange);


// Welcome Form (join a room)

const welcome = document.querySelector('#welcome');
const welcomeForm = welcome.querySelector('form');

async function initCall() {
  welcome.hidden = true;
  call.hidden = false;
  await getMedia();
  makeConnection();
}

async function handleWelcomeSubmit(event) {
  event.preventDefault();
  const input = welcomeForm.querySelector('input');
  await initCall();                                       // 아래의 'join_room'에 보내면 속도가 너무 빨라서 다음단계에서 myPeerConnection을 인식하지 못하기 때문에 분리해야 한다.
  socket.emit('join_room', input.value);
  roomName = input.value;
  input.value = '';
}

welcomeForm.addEventListener('submit', handleWelcomeSubmit);


// Socket Code

// Peer A
// Firefox가 방에 참가하면 Brave 브라우저에서 실행되는 코드다.
socket.on('welcome', async () => {
  myDataChannel = myPeerConnection.createDataChannel('chat');
  myDataChannel.addEventListener('message', console.log)
  const offer = await myPeerConnection.createOffer();       // offer 생성. 이 offer를 바탕으로 상대방과 연결을 구성해야 한다.
  myPeerConnection.setLocalDescription(offer);
  console.log('sent the offer!');
  socket.emit('offer', offer, roomName);
})

// Peer B
// Firefox 브라우저에서 실행될 코드
socket.on('offer', async (offer) => {
  myPeerConnection.addEventListener('datachannel', (event) => {
    myDataChannel = event.channel;
    myDataChannel.addEventListener('message', console.log);
  })
  console.log('received the offer');
  myPeerConnection.setRemoteDescription(offer);
  const answer = await myPeerConnection.createAnswer();
  myPeerConnection.setLocalDescription(answer);
  socket.emit('answer', answer, roomName);
  console.log('sent the answer');
})

// Peer A
socket.on('answer', (answer) => {
  console.log('received the answer');
  myPeerConnection.setRemoteDescription(answer);
})

socket.on('ice', (ice) => {
  console.log('received candidate');
  myPeerConnection.addIceCandidate(ice);
})

//  RTC Code

function makeConnection() {
  // 각각의 트랙을 PeerConnection에 넣어야 한다.
  myPeerConnection = new RTCPeerConnection(
    {
      iceServers: [
        {
          urls: [                                             // 구글이 제공해주는 stun 사용. 실제 서비스에서는 사용하면 안됨
            "stun:stun.l.google.com:19302",
            "stun:stun1.l.google.com:19302",
            "stun:stun2.l.google.com:19302",
            "stun:stun3.l.google.com:19302",
            "stun:stun4.l.google.com:19302",
          ],
        }
      ]
    }
  );
  myPeerConnection.addEventListener('icecandidate', handleIce);
  myPeerConnection.addEventListener('addstream', handleAddStream);
  myStream.getTracks().forEach((track) => myPeerConnection.addTrack(track, myStream));
}


function handleIce(data) {
  console.log("sent candidate");
  socket.emit('ice', data.condidate, roomName);
}

function handleAddStream(data) {
  const peerFace = document.querySelector('#peerFace');
  peerFace.srcObject = data.stream;
}
// 실시간 채팅 관련 코드 (socket.io)
// const welcome = document.querySelector('#welcome');
// const form = welcome.querySelector('form');
// const room = document.querySelector('#room');

// room.hidden = true;

// let roomName;

// function addMessage(message) {
//   const ul = room.querySelector('ul');
//   const li = document.createElement('li');
//   li.innerText = message;
//   ul.append(li);
// }

// function handleMessageSubmit(event) {
//   event.preventDefault();
//   const input = room.querySelector('#msg input');
//   const value = input.value;
//   socket.emit('new_message', input.value, roomName, () => {
//     addMessage(`You: ${value}`);
//   });
//   input.value = '';
// }

// function handleNickSubmit(evnet) {
//   event.preventDefault();
//   const input = room.querySelector('#name input');
//   socket.emit('nickname', input.value);
// }

// function showRoom() {
//   welcome.hidden = true;
//   room.hidden = false;
//   const h3 = room.querySelector('h3');
//   h3.innerText = `Room ${roomName}`;
//   const msgForm = room.querySelector('#msg');
//   const nameForm = room.querySelector('#name');
//   msgForm.addEventListener('submit', handleMessageSubmit);
//   nameForm.addEventListener('submit', handleNickSubmit);
// }

// function handleRoomSubmit(event) {
//   event.preventDefault();
//   const input = form.querySelector('input');
//   socket.emit('enter_room', input.value, showRoom);
//   roomName = input.value;
//   input.value = '';
// }

// form.addEventListener('submit', handleRoomSubmit);

// socket.on('welcome', (user, newCount) => {
//   const h3 = room.querySelector('h3');
//   h3.innerText = `Room ${roomName} (${newCount})`;
//   addMessage(`${user} joined!`);
// })

// socket.on('bye', (left, newCount) => {
//   const h3 = room.querySelector('h3');
//   h3.innerText = `Room ${roomName} (${newCount})`;
//   addMessage(`${left} left! ㅠㅠ`);
// })

// socket.on('new_message', addMessage);

// socket.on('room_change', (rooms) => {
//   const roomList = welcome.querySelector('ul');
//   roomList.innerHTML = '';
//   if (rooms.length === 0) {
//     return;
//   }
//   rooms.forEach((room) => {
//     const li = document.createElement('li');
//     li.innerText = room;
//     roomList.append(li);
//   });
// });
