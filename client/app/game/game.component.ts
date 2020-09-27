import { Component, OnInit } from '@angular/core';
import * as Colyseus from "colyseus.js";
import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import {
  GridMaterial
} from '@babylonjs/materials';

//game main schema
import { World } from '../shared/schemas/world';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit {
  //babylon
  engine: any;
  canvas: HTMLCanvasElement;

  //game
  gameRoom: any;
  scene: any;
  mainCamera: any;
  shadowGenerator: any;

  //game schemas
  schemas: any;
  world: any;

  constructor() { }

  ngOnInit(): void {
    this.canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;

    this.engine = new BABYLON.Engine(this.canvas, true);
    this.scene = this.createScene(); //call the createScene function

    var host = window.document.location.host.replace(/:.*/, '');
    var client = new Colyseus.Client(location.protocol.replace("http", "ws") + "//" + host + ':3001');
    client.joinOrCreate("game").then((room: any) => {
      this.gameRoom = room;
      this.initGame();
    });

    //resize canvas on resize window
    window.onresize = () => {
      this.engine.resize();
    };
  }

  createScene(): any {
    //setup the scene
    var scene = new BABYLON.Scene(this.engine);

    // this.mainCamera = new BABYLON.FreeCamera("mainCamera", new BABYLON.Vector3(0, 30, 0), scene);
    // this.mainCamera.setTarget(BABYLON.Vector3.Zero());
    // this.mainCamera.attachControl(this.canvas, true);

    // var zoom = 15;
    // this.mainCamera = new BABYLON.TargetCamera("mainCamera", new BABYLON.Vector3(zoom, zoom, -zoom), scene);
    // this.mainCamera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
    // this.mainCamera.orthoTop = zoom;
    // this.mainCamera.orthoBottom = -zoom;
    // this.mainCamera.orthoLeft = -zoom;
    // this.mainCamera.orthoRight = zoom;
    // this.mainCamera.setTarget(new BABYLON.Vector3(0, 0, 0));

    // var light = new BABYLON.PointLight("mainLight", new BABYLON.Vector3(0, 1, 0), scene);
    // light.intensity = 0.1;

    // this.shadowGenerator = new BABYLON.ShadowGenerator(1024, light);
    // this.shadowGenerator.useExponentialShadowMap = true;

    // var gridMaterial = new GridMaterial("gridMaterial", scene);
    // gridMaterial.mainColor = new BABYLON.Color3(1, 1, 1);
    // gridMaterial.lineColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    // gridMaterial.gridRatio = 1;

    // var ground = BABYLON.Mesh.CreateGround("ground", 100, 100, 2, scene);
    // ground.material = gridMaterial;
    // ground.receiveShadows = true;

    //keyboard events
    // var inputMap = {};
    // scene.actionManager = new BABYLON.ActionManager(scene);
    // scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, function (evt) {
    //   inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
    // }));
    // scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, function (evt) {
    //   inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
    // }));

    //game/render loop
    // scene.onBeforeRenderObservable.add(() => {
    //   if (inputMap["w"] || inputMap["ArrowUp"]) {
    //     // socket.send("up");
    //     this.gameRoom.send("move", { x: 0, y: -1 });
    //     //sphere.position.z -= 0.1
    //   }
    //   if (inputMap["a"] || inputMap["ArrowLeft"]) {
    //     // socket.send("left");
    //     this.gameRoom.send("move", { x: 1, y: 0 });
    //     //sphere.position.x += 0.1
    //   }
    //   if (inputMap["s"] || inputMap["ArrowDown"]) {
    //     // socket.send("down");
    //     this.gameRoom.send("move", { x: 0, y: 1 });
    //     //sphere.position.z += 0.1
    //   }
    //   if (inputMap["d"] || inputMap["ArrowRight"]) {
    //     // socket.send("right");
    //     this.gameRoom.send("move", { x: -1, y: 0 });
    //     //sphere.position.x -= 0.1
    //   }
    // })
    return scene;
  };

  initGame() {
    console.log("Joined Game");
    this.gameRoom.onStateChange.once(() => {
      this.world = new World(this.gameRoom.state.world, this.scene, this.gameRoom, this.canvas);
      // this.schemas = new Object();
      // this.schemas.tilemap = new TileMap(this.gameRoom.state.tilemap, this.scene, this.gameRoom);
      // this.schemas.players = {};
      // this.gameRoom.state.players.onAdd = (player, id) => {
      //   this.schemas.players[id] = new Player(player, id, this.scene);
      // }
      // this.gameRoom.state.players.triggerAll();

      //register a render loop to repeatedly render the scene
      this.engine.runRenderLoop(() => {
        this.scene.render();
      });
    });
  }

}
