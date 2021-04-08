import * as dotenv from 'dotenv';
import * as path from 'path';
//server
import express from 'express';
import morgan from 'morgan';
import serveIndex from 'serve-index';
//database
import setMongo from '../database/mongo';
import setRoutes from './routes';
//colyseus
import { createServer } from 'http';
import { Server } from 'colyseus';
import { monitor } from '@colyseus/monitor';
//import rooms
import { ChatRoom } from "./rooms/chat";
import { GameRoom } from "./rooms/game";

const port = process.env.PORT || 3000;
const app = express();
dotenv.config();

// app.set('port', port);
// app.use('/', express.static(path.join(__dirname, "static")));
// app.use('/', serveIndex(path.join(__dirname, "static"), { 'icons': true }))
app.use('/', express.static(path.join(__dirname, '../public'))); //make angular compiled folde public
app.use('/uploads', express.static('uploads')); //make uploads folder public
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

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

//attach WebSocket Server on HTTP Server.
const gameServer = new Server({
  server: createServer(app),
  express: app,
  pingInterval: 0,
});
gameServer.define("game", GameRoom).filterBy(["campaign"]);
gameServer.define("chat", ChatRoom).enableRealtimeListing().filterBy(["campaign"]);
gameServer.onShutdown(function () {
  console.log(`DungeonGram gameserver is going down.`);
});
gameServer.listen(Number(port));

async function main(): Promise<any> {
  try {
    //set mongoose access
    await setMongo();
    setRoutes(app);
    app.get('/*', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/index.html'));
    });
    if (!module.parent) {
      app.listen(app.get('port'), () => console.log(`DungeonGram server listening on port ${port}`));
    }
  } catch (err) {
    console.error(err);
  }
}

main();

export { app };
