import { Component, OnDestroy, OnInit } from '@angular/core';
import * as Colyseus from "colyseus.js";
import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import {
  GridMaterial
} from '@babylonjs/materials';
import { AssetService } from '../services/asset.service';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss']
})
export class EditorComponent implements OnInit, OnDestroy {

  isLoading = true;

  //chat
  roomChat: any;
  message: string;

  //babylon
  engine: any;
  canvas: HTMLCanvasElement;

  //map
  roomMap: any;
  scene: any;
  mainCamera: any;
  shadowGenerator: any;
  players: Object;

  //assets
  assets: [];

  constructor(private assetService: AssetService) { }

  ngOnInit(): void {
    var self = this;

    this.getAssets();

    var host = window.document.location.host.replace(/:.*/, '');

    var client = new Colyseus.Client(location.protocol.replace("http", "ws") + "//" + host + ':3001');
    client.joinOrCreate("chat").then((room: any) => {
      this.roomChat = room;
      this.joinedRoomChat();
    });

    this.canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;

    this.engine = new BABYLON.Engine(this.canvas, true, { stencil: true, doNotHandleContextLost: true });
    this.engine.enableOfflineSupport = false;
    this.scene = this.createScene(); //call the createScene function

    //resize canvas on resize window
    window.onresize = () => {
      this.engine.resize();
    };

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

  getAssets() {
    this.assetService.getAssets().subscribe(
      data => {
        this.assets = data;
        console.log(this.assets);
      },
      error => console.log(error),
      () => this.isLoading = false
    );
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

  sendMessage() {
    console.log("input:", this.message);

    // send data to room
    this.roomChat.send("message", this.message);

    // clear input
    this.message = "";
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
          self.shadowGenerator.addShadowCaster(self.players[playerid]);
          // if (playerid == self.roomMap.sessionId) {
          //   self.mainCamera.lockedTarget = self.players[playerid];
          // }
        }
        self.players[playerid].position.y = 0.5;
        self.players[playerid].position.x = state.players[playerid].x * 0.1;
        self.players[playerid].position.z = state.players[playerid].y * 0.1;
      }
      for (let playerid in self.players) {
        if (!state.players[playerid]) {
          self.players[playerid].dispose();
        }
      }
    });
  }

  createScene(): any {
    //setup the scene
    var scene = new BABYLON.Scene(this.engine);

    this.mainCamera = new BABYLON.FreeCamera("mainCamera", new BABYLON.Vector3(0, 30, 0), scene);
    this.mainCamera.setTarget(BABYLON.Vector3.Zero());
    // this.mainCamera.attachControl(this.canvas, true);

    var light = new BABYLON.DirectionalLight("mainLight", new BABYLON.Vector3(-1, -2, 1), scene);
    light.intensity = 0.5;

    this.shadowGenerator = new BABYLON.ShadowGenerator(1024, light);
    this.shadowGenerator.useExponentialShadowMap = true;

    var gridMaterial = new GridMaterial("gridMaterial", scene);
    gridMaterial.mainColor = new BABYLON.Color3(1, 1, 1);
    gridMaterial.lineColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    gridMaterial.gridRatio = 1;

    var ground = BABYLON.Mesh.CreateGround("ground", 100, 100, 2, scene);
    ground.material = gridMaterial;
    ground.receiveShadows = true;

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
