# Zoom

Zoom Clone using NodeJS, WebRTC and Websockets.

<br>

### WebRTC (Real Time Communication)

- WebRTC는 peer-to-peer 커뮤니케이션이 가능하다.
- peer-to-peer가 아닌 것
  - 하나의 서버에 web socket들이 연결되어 있으면 내가 'hello'라는 메시지를 보내면 서버에서 그 메시지를 받아서 모두에게 전달한다.
  - 언제나 서버를 이용해야 한다.
- peer-to-peer 커뮤니케이션이 가능하다는 것은 내 영상과 오디오, 텍스트가 서버로 가지 않는다는 뜻이다. 이는 서버가 필요없다는 뜻이고, 이를 통해 실시간(Real Time) 속도가 엄청 빠르다. 유저와 유저가 연결된다.
- 서버가 완전히 배제되는 것은 아니다. Signaling이라는 것이 필요한데, 이를 위해서는 서버가 필요하다. Signaling 작업이 끝나면 peer-to-peer 연결이 된다.
  - Signaling
    - 유저와 유저를 연결시키는 역할을 한다. 우리 브라우저로 하여금 서버가 상대가 어디에 있는지 알게한다.
    - 브라우저는 서버에게 인터넷에서의 그들의 위치와 settings, configuration, 방화벽이나 라우터가 있는지 등등의 정보를 서버에게 전달한다.

<br>

### STUN 서버

- STUN 서버는 컴퓨터가 공용 IP주소를 찾게 해준다.
- 나의 장치에 공용주소를 알려주는 서버다.
- 공용주소를 통해 다른 네트워크에 있는 장치들이 서로를 찾을 수 있다.
