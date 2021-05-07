import * as dotenv from 'dotenv';
import * as path from 'path';
//server
import express from 'express';
import morgan from 'morgan';
import serveIndex from 'serve-index';
import cors from 'cors';
//database
import setMongo from '../database/mongo';
import setRoutes from './routes';
//colyseus
import { createServer } from 'http';
import { Server } from 'colyseus';
import { monitor } from '@colyseus/monitor';
//colyseus rooms
import { ChatRoom } from "./rooms/chat";
import { GameRoom } from "./rooms/game";

//define port based on enviroment variable or 3000 in case it is absent
const port = process.env.PORT || 3000

//create express app
const app = express();
dotenv.config();

//configure express paths and others (cors,...)
//app.set('port', port); //is not used because it is added by the gameserver
app.use('/', express.static(path.join(__dirname, '../public'))); //make angular compiled folder public
app.use('/uploads', express.static('uploads')); //make uploads folder public
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb', parameterLimit: 500000 }));
if (process.env.NODE_ENV?.trim() !== 'test') {
  app.use(morgan('dev'));
}

//attach colyseus web socket server on http express server.
const gameServer = new Server({
  server: createServer(app),
  express: app,
  pingInterval: 5000,
  pingMaxRetries: 240
});

//define colyseus rooms
gameServer.define("game", GameRoom).filterBy(["campaign"]);
gameServer.define("chat", ChatRoom).enableRealtimeListing().filterBy(["campaign"]);

//add colyseus paths to express app (it brokes the express routes, so is not included by default)
if (process.env.GAMESERVER_MODE == "yes") {
  app.use('/', serveIndex(path.join(__dirname, "static"), { 'icons': true }))
  app.use('/', express.static(path.join(__dirname, "static")));
}

//(optional) attach web monitoring panel
const basicAuth = require('express-basic-auth');
app.use('/colyseus', basicAuth({
  //list of users and passwords
  users: {
    "admin": "15742891",
  },
  //sends WWW-Authenticate header, which will prompt the user to fill credentials in
  challenge: true
}), monitor());

//set message on colyseus server shut down
gameServer.onShutdown(function () {
  console.log(`DungeonGram gameserver is going down.`);
});

//colyseus listen on the defined port
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
