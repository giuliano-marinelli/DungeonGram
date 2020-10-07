import express from 'express';
import serveIndex from 'serve-index';
import * as path from 'path';
import cors from 'cors';
import { createServer } from 'http';
import { Server, LobbyRoom, RelayRoom } from 'colyseus';
import { monitor } from '@colyseus/monitor';
//import room handlers
import { ChatRoom } from "./rooms/chat";
import { GameRoom } from "./rooms/game";

const port = Number(process.env.PORT || 3001) + Number(process.env.NODE_APP_INSTANCE || 0);
const app = express();

// app.use(cors());
app.use(express.json());

// Attach WebSocket Server on HTTP Server.
const gameServer = new Server({
  server: createServer(app),
  express: app,
  pingInterval: 0,
});

gameServer.define("game", GameRoom);
gameServer.define("chat", ChatRoom).enableRealtimeListing();

app.use('/', serveIndex(path.join(__dirname, "static"), { 'icons': true }))
app.use('/', express.static(path.join(__dirname, "static")));

//(optional) attach web monitoring panel
const basicAuth = require('express-basic-auth');
app.use('/colyseus', basicAuth({
  //list of users and passwords
  users: {
    "admin": "admin",
  },
  //sends WWW-Authenticate header, which will prompt the user to fill credentials in
  challenge: true
}), monitor());

gameServer.onShutdown(function () {
  console.log(`DungeonGram gameserver is going down.`);
});

gameServer.listen(port);

console.log(`DungeonGram gameserver listening on port ${port}`);
