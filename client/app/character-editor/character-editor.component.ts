import { Component, OnInit } from '@angular/core';
import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import { ShadowOnlyMaterial } from '@babylonjs/materials';
import "@babylonjs/loaders/glTF/2.0/glTFLoader";
import { Animator } from '../shared/utils/animator';

declare var $;

@Component({
  selector: 'app-character-editor',
  templateUrl: './character-editor.component.html',
  styleUrls: ['./character-editor.component.scss']
})
export class CharacterEditorComponent implements OnInit {
  //babylon
  canvas: HTMLCanvasElement;
  engine: any;
  scene: any;

  //editor
  scenario?: any;
  wears: any = {
    arms: {
      biceps: [],
      elbows: [],
      forearms: [],
      hands: ["mittens"],
      shoulders: []
    },
    head: {
      beard: [],
      ears: ["human.ears", "half.elf.ears", "elf.ears"],
      eyebrows: [],
      hair: ["mohicano"],
      helmet: [],
      scars: []
    },
    legs: {
      knees: ["metal.kneepads"],
      feet: ["leather.boots"]
    },
    torso: {
      accessory: [],
      back: [],
      chest: ["padded.armor.chest", "breastplate"],
      hips: ["padded.armor.hips"]
    },
    skin: {
      color: []
    }
  };
  colorPalette: ['#FF0000', '#fffadd'];

  constructor() { }

  ngOnInit(): void {
    this.canvas = document.getElementById("renderCanvasCharacterEditor") as HTMLCanvasElement;

    this.engine = new BABYLON.Engine(this.canvas, true);
    this.scene = new BABYLON.Scene(this.engine);
    this.scene.actionManager = new BABYLON.ActionManager(this.scene);

    //register a render loop to repeatedly render the scene
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });

    //resize canvas on resize window
    window.onresize = () => {
      this.engine.resize();
    };

    this.scenario = new Scenario({ canvas: this.canvas, scene: this.scene, wears: this.wears });

    setTimeout(() => {
      $('[data-toggle-tooltip="tooltip"]').tooltip({ html: true });
      $('[name="colorPicker"]').each(function (index, value) {
        console.log(value, $(value).attr("data-container"));
        $(value).colorpicker({
          // inline: true,
          container: "#" + $(value).attr("data-container")
        });
      });
    }, 1000);
  }

  onImageError($event, defaultImage?) {
    if (defaultImage) {
      this.imageExists(defaultImage, (exists) => {
        if (exists)
          $event.target.src = defaultImage;
        else
          $event.target.src = "assets/images/character-editor/default.png";
      });
    } else {
      $event.target.src = "assets/images/character-editor/default.png";
    }
  }

  imageExists(url, callback) {
    var img = new Image();
    img.onload = function () { callback(true); };
    img.onerror = function () { callback(false); };
    img.src = url;
  }

}


export class Scenario {
  parameters?: any;
  camera?: any;
  lights?: any = {};
  ground?: any;
  character?: any;
  wears?: any = {};
  wearsSelected?: any = {};

  constructor(parameters) {
    this.parameters = parameters;
    this.initCamera();
    this.initLights();
    this.initGround();
    this.initCharacter();
    this.initWears();
  }

  initCamera() {
    //creates, angles, distances and targets the camera
    this.camera = new BABYLON.ArcRotateCamera("Camera", 0, 0, 0, new BABYLON.Vector3(0, 0.75, 0), this.parameters.scene);
    this.camera.wheelPrecision = 40;
    //this positions the camera
    this.camera.setPosition(new BABYLON.Vector3(0, 1.5, 5));
    //this attaches the camera to the canvas
    this.camera.attachControl(this.parameters.canvas, true);
    //detach right click from camera control
    this.camera.inputs.attached.pointers.buttons[2] = null;

    this.camera.onViewMatrixChangedObservable.add(() => {
      if (this.camera.radius <= 3)
        this.camera._target = new BABYLON.Vector3(0, 1.5, 0);
      else
        this.camera._target = new BABYLON.Vector3(0, 0.75, 0);
    });
  }

  initLights() {
    //init lights
    this.lights.baseLight = new BABYLON.DirectionalLight("baseLight", new BABYLON.Vector3(-1, -2, -1), this.parameters.scene);
    this.lights.baseLight.position = new BABYLON.Vector3(50, 100, 50);
    this.lights.baseLight.intensity = 1;
    this.lights.baseLight.specular = new BABYLON.Color3(0, 0, 0);

    this.lights.secondLight = new BABYLON.DirectionalLight("secondLight", new BABYLON.Vector3(1, -2, 1), this.parameters.scene);
    this.lights.secondLight.position = new BABYLON.Vector3(-50, 100, -50);
    this.lights.secondLight.intensity = 1;
    this.lights.secondLight.specular = new BABYLON.Color3(0, 0, 0);

    //init shadow generator for base light
    new BABYLON.ShadowGenerator(4096, this.lights.baseLight);
    this.lights.baseLight._shadowGenerator.useBlurExponentialShadowMap = true;
    this.lights.baseLight._shadowGenerator.darkness = 0.5;

    //init background color
    this.parameters.scene.clearColor = new BABYLON.Color3(0.1, 0.1, 0.1);
  }

  initGround() {
    this.ground = BABYLON.MeshBuilder.CreateGround('ground', { width: 100, height: 100 }, this.parameters.scene);
    this.ground.position = BABYLON.Vector3.Zero();
    this.ground.material = new ShadowOnlyMaterial('shadowOnly', this.parameters.scene)
    this.ground.receiveShadows = true;
  }

  initCharacter() {
    this.character = new Character({ ...this.parameters, ... { scenario: this } });
  }

  initWears() {
    for (let category in this.parameters.wears) {
      for (let subcategory in this.parameters.wears[category]) {
        this.parameters.wears[category][subcategory].forEach((wear) => {
          BABYLON.SceneLoader.ImportMesh("", "assets/meshes/wear/" + category + "/" + subcategory + "/", wear + ".babylon", this.parameters.scene, (meshes, particleSystems, skeletons, animationsGroups) => {
            if (!this.wears[category]) {
              this.wears[category] = {};
              this.wearsSelected[category] = {};
            }
            if (!this.wears[category][subcategory]) this.wears[category][subcategory] = {};
            this.wears[category][subcategory][wear] = meshes[0];
            var material = new BABYLON.StandardMaterial(wear + "Material", this.parameters.scene);
            material.diffuseColor = BABYLON.Color3.FromHexString("#493136");
            this.wears[category][subcategory][wear].material = material;
            this.wears[category][subcategory][wear].visibility = 0;
          });
        });
      }
    }
  }

  wearChange(category, subcategory, wear, color) {
    for (let anotherWear in this.wears[category][subcategory]) {
      this.wears[category][subcategory][anotherWear].visibility = 0;
      this.character?.animator?.unparent(this.wears[category][subcategory][anotherWear]);
    }
    if (this.wears[category][subcategory][wear]) {
      // this.wears['armor'].attachToBone(this.character.skeleton.bones.find((bone) => { return bone.id == 'mixamorig:Spine2' }), this.character.mesh);
      this.character?.animator?.parent(this.wears[category][subcategory][wear]);
      this.wears[category][subcategory][wear].visibility = 1;
      this.wearsSelected[category][subcategory] = this.wears[category][subcategory][wear];
      if (subcategory != "ears")
        this.wearsSelected[category][subcategory].material.diffuseColor = BABYLON.Color3.FromHexString(color.hex);
      else
        this.wearsSelected[category][subcategory].material.diffuseColor = this.character.mesh.material.diffuseColor;
    }

    // switch (category) {
    //   case 'head':
    //     Animator.cameraSpinTo(this.camera, "target", new BABYLON.Vector3(0, 1.5, 0), 1000);
    //     Animator.cameraSpinTo(this.camera, "radius", 2, 1000);
    //     break;
    //   default:
    //     Animator.cameraSpinTo(this.camera, "target", new BABYLON.Vector3(0, 0.75, 0), 1000);
    //     Animator.cameraSpinTo(this.camera, "radius", 5, 1000);
    //     break;
    // }
  }

  wearColorChange($event, category, subcategory) {
    console.log("change color", category, subcategory);
    if (category == "skin" && subcategory == "color") {
      if (this.wearsSelected["head"] && this.wearsSelected["head"]["ears"])
        this.wearsSelected["head"]["ears"].material.diffuseColor = BABYLON.Color3.FromHexString($event.color.hex);
      this.character.mesh.material.diffuseColor = BABYLON.Color3.FromHexString($event.color.hex);
    } else {
      if (this.wearsSelected[category] && this.wearsSelected[category][subcategory])
        this.wearsSelected[category][subcategory].material.diffuseColor = BABYLON.Color3.FromHexString($event.color.hex);
    }
  }

}

export class Character {
  parameters?: any;
  mesh?: any;
  skeleton?: any;
  animator?: any;

  constructor(parameters) {
    this.parameters = parameters
    this.init();
  }

  init() {
    BABYLON.SceneLoader.ImportMesh("", "assets/meshes/base/", "base.babylon", this.parameters.scene, (meshes, particleSystems, skeletons, animationsGroups) => {
      this.mesh = meshes[0];
      this.skeleton = skeletons[0];

      var material = new BABYLON.StandardMaterial("characterMaterial", this.parameters.scene);
      material.diffuseColor = BABYLON.Color3.FromHexString("#dc9b78");
      this.mesh.material = material;

      this.animator = new Animator(this.mesh, this.skeleton, { actual: 'Idle' });

      this.parameters.scenario.lights.baseLight._shadowGenerator.addShadowCaster(this.mesh);
    });
  }
}
