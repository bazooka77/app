import express from 'express';
import { WebSocket, WebSocketServer } from 'ws';
import db from './db/sqlite.js';

const SERVER_PORT = process.env.SERVER_PORT;

if (!SERVER_PORT) {
  throw new Error('Forgot to initialize some variables');
}

Array.prototype.random = function () {
  return this[Math.floor(Math.random() * this.length)];
};

Array.prototype.shuffle = function () {
  for (let i = this.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [this[i], this[j]] = [this[j], this[i]];
  }
  return this;
};

WebSocket.prototype.init = function () {
  this.channels = new Map();
  this.on('message', (message) => {
    try {
      const { channel, data } = JSON.parse(message.toString());
      this.propagate(channel, data);
    } catch (e) {
      console.error(e);
    }
  });
};

WebSocket.prototype.register = function (channel, callback) {
  this.channels.set(channel, callback);
};

WebSocket.prototype.propagate = function (channel, data) {
  const callback = this.channels.get(channel);
  if (callback) {
    callback(data);
  } else if (this.peer) {
    // redirect message to peer
    return this.peer.send(JSON.stringify({ channel, data }));
  }
};

const app = express();
const port = SERVER_PORT;

app.use(express.static('./public', { extensions: ['html'] }));

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Listening on port ${port}`);
});

const wss = new WebSocketServer({ server });

app.get('/online', (_, res) => {
  res.send({ online: wss.clients.size });
});

app.post('/feedback', express.json(), async (req, res) => {
  await db.insertFeedback({ feedback: req.body.feedback });
  res.sendStatus(200);
});

const sleep = (x) => new Promise((r) => setTimeout(() => r(), x));

async function findPeer(user, interests, interestUserMap, userInterestMap) {
  // ...your function code...
}

function addUser(user, interests, interestUserMap, userInterestMap) {
  // ...your function code...
}

function deleteUser(user, interestUserMap, userInterestMap) {
  // ...your function code...
}

wss.textUserInterestMap = new Map();
wss.textInterestUserMap = new Map();
wss.videoUserInterestMap = new Map();
wss.videoInterestUserMap = new Map();
wss.on('connection', (ws, req) => {
  console.log('new connection');

  ws.init();

  ws.register('peopleOnline', () => {
    ws.send(JSON.stringify({ channel: 'peopleOnline', data: wss.clients.size }));
  });

  ws.register('match', async ({ data, interests }) => {
    interests = interests.map((x) => x.trim().toLowerCase());
    ws.interestUserMap =
      data === 'video' ? wss.videoInterestUserMap : wss.textInterestUserMap;
    ws.userInterestMap =
      data === 'video' ? wss.videoUserInterestMap : wss.textUserInterestMap;
    const [peer, commonInterests] = await findPeer(
      ws,
      interests,
      ws.interestUserMap,
      ws.userInterestMap
    );
    // if peer exists
    if (ws.peer) return;

    if (!peer) {
      console.log('No peers found');
      console.log(
        `Pushing ${req.socket.remoteAddress}:${req.socket.remotePort} to queue`
      );
      return addUser(ws, interests, ws.interestUserMap, ws.userInterestMap);
    }

    console.log('peer available:');
    console.log(
      `matching ${req.socket.remoteAddress}:${req.socket.remotePort} now`
    );
    deleteUser(peer, peer.interestUserMap, peer.userInterestMap);
    // set peer
    ws.peer = peer;
    peer.peer = ws;

    ws.send(JSON.stringify({ channel: 'connected', data: commonInterests }));
    ws.peer.send(
      JSON.stringify({ channel: 'connected', data: commonInterests })
    );
    if (data === 'video') {
      ws.send(JSON.stringify({ channel: 'begin', data: '' }));
    }
  });

  ws.register('disconnect', async () => {
    if (!ws.peer) return;
    ws.peer.peer = undefined;
    ws.peer.send(JSON.stringify({ channel: 'disconnect', data: '' }));
    ws.peer = undefined;
  });

  ws.on('close', () => {
    console.log(
      `${req.socket.remoteAddress}:${req.socket.remotePort} disconnected`
    );
    if (ws.peer) {
      ws.peer.send(JSON.stringify({ channel: 'disconnect', data: '' }));
      ws.peer.peer = undefined;
    }
    if (!ws.interestUserMap || !ws.userInterestMap) return;
    deleteUser(ws, ws.interestUserMap, ws.userInterestMap);
  });
});