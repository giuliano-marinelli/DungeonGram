import { Component, OnInit } from '@angular/core';
import * as Colyseus from "colyseus.js";
import * as BABYLON from '@babylonjs/core/Legacy/legacy';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss']
})
export class EditorComponent implements OnInit {

  message: string;
  roomChat: any;
  roomMap: any;
  players: Object;
  engine: any;
  scene: any;

  constructor() { }

  ngOnInit(): void {
    var self = this;
    var host = window.document.location.host.replace(/:.*/, '');

    var client = new Colyseus.Client(location.protocol.replace("http", "ws") + "//" + host + ':3001');
    client.joinOrCreate("chat").then((room: any) => {
      this.roomChat = room;
      this.joinedRoomChat();
    });

    const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;

    this.engine = new BABYLON.Engine(canvas, true);
    this.scene = this.createScene(); //call the createScene function

    console.log(this.scene);

    //register a render loop to repeatedly render the scene
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });

    client.joinOrCreate("state_handler").then((room: any) => {
      this.roomMap = room;
      this.joinedRoomMap();
    });

  }

  ngOnDestroy(): void {
    this.roomChat.leave();
    this.roomMap.leave();
  }

  joinedRoomChat() {
    console.log("joined chat");
    this.roomChat.onStateChange.once(function (state) {
      console.log("initial chat state:", state);
    });

    // new room state
    this.roomChat.onStateChange(function (state) {
      // this signal is triggered on each patch
    });

    // listen to patches coming from the server
    this.roomChat.onMessage("messages", function (message) {
      var p = document.createElement("p");
      p.innerText = message;
      document.querySelector("#chat-messages").appendChild(p);
      document.querySelector("#chat-messages").scrollTop = document.querySelector("#chat-messages").scrollHeight;
    });
  }

  joinedRoomMap() {
    var self = this;

    console.log("joined map");
    self.roomMap.onStateChange.once(function (state) {
      console.log("initial map state:", state);
    });

    self.players = new Object();

    // new room state
    self.roomMap.onStateChange(function (state) {
      console.log("map state:", state);
      for (let playerid in state.players) {
        if (self.players[playerid] == null) {
          self.players[playerid] = BABYLON.Mesh.CreateSphere(playerid, 16, 1, self.scene);
        } else {
          self.players[playerid].position.y = 1;
          self.players[playerid].position.x = state.players[playerid].x * 0.1;
          self.players[playerid].position.z = state.players[playerid].y * 0.1;
        }
      }
      for (let playerid in self.players) {
        if (!state.players[playerid]) {
          self.players[playerid].dispose();
        }
      }
    });
  }

  sendMessage() {
    console.log("input:", this.message);

    // send data to room
    this.roomChat.send("message", this.message);

    // clear input
    this.message = "";
  }

  createScene(): any {
    //setup the scene
    var scene = new BABYLON.Scene(this.engine);
    var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 25, 0), scene);
    camera.setTarget(BABYLON.Vector3.Zero());
    var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);

    //keyboard events
    var inputMap = {};
    scene.actionManager = new BABYLON.ActionManager(scene);
    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, function (evt) {
      inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
    }));
    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, function (evt) {
      inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
    }));

    //game/render loop
    scene.onBeforeRenderObservable.add(() => {
      if (inputMap["w"] || inputMap["ArrowUp"]) {
        // socket.send("up");
        this.roomMap.send("move", { x: 0, y: -1 });
        //sphere.position.z -= 0.1
      }
      if (inputMap["a"] || inputMap["ArrowLeft"]) {
        // socket.send("left");
        this.roomMap.send("move", { x: 1, y: 0 });
        //sphere.position.x += 0.1
      }
      if (inputMap["s"] || inputMap["ArrowDown"]) {
        // socket.send("down");
        this.roomMap.send("move", { x: 0, y: 1 });
        //sphere.position.z += 0.1
      }
      if (inputMap["d"] || inputMap["ArrowRight"]) {
        // socket.send("right");
        this.roomMap.send("move", { x: -1, y: 0 });
        //sphere.position.x -= 0.1
      }
    })
    return scene;
  };

}
