import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import { ShadowOnlyMaterial } from '@babylonjs/materials';
import "@babylonjs/loaders/glTF/2.0/glTFLoader";
import { Animator } from '../../shared/utils/animator';
import { AuthService } from '../../services/auth.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CharacterService } from 'client/app/services/character.service';
import { Character } from 'client/app/shared/models/character.model';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { GlobalComponent } from '../../shared/global/global.component';

declare var $;
declare var iziToast;
declare var ng;

@Component({
  selector: 'app-character',
  templateUrl: './character.component.html',
  styleUrls: ['./character.component.scss']
})
export class CharacterComponent implements OnInit {
  @Input() public character: Character | string;
  @Output("getCharacters") getCharacters: EventEmitter<any> = new EventEmitter();

  isLoading = true;

  characterForm: FormGroup;
  _id;
  // owner;
  name = new FormControl('', [
    Validators.required,
    Validators.minLength(1),
    Validators.maxLength(50)
  ]);
  description = new FormControl('', [
    Validators.minLength(0),
    Validators.maxLength(200)
  ]);
  wears = new FormControl([], []);
  height = new FormControl(1, [
    Validators.required
  ]);
  visionRange = new FormControl(10, [
    Validators.required,
    Validators.min(0),
    Validators.max(200)
  ]);
  private = new FormControl(false, []);
  copyOf = new FormControl(null, []);

  //babylon
  @ViewChild('renderCanvasCharacter') canvasRef: ElementRef;
  canvas: HTMLCanvasElement;
  engine: any;
  scene: any;

  //editor
  scenario?: any;
  wearsAvailable?: any = JSON.parse(JSON.stringify(GlobalComponent.wearsAvailable));

  constructor(
    private formBuilder: FormBuilder,
    public auth: AuthService,
    private characterService: CharacterService,
    public activeModal: NgbActiveModal,
    private modalService: NgbModal
  ) { }

  ngOnInit(): void {
    this.characterForm = this.formBuilder.group({
      _id: this._id,
      // owner: this.owner,
      name: this.name,
      description: this.description,
      wears: this.wears,
      height: this.height,
      visionRange: this.visionRange,
      private: this.private,
      copyOf: this.copyOf
    });
    if (this.character) this.getCharacter(); else this.isLoading = false;

    this.initEditor();
  }

  ngOnDestroy(): void {
    console.log('ngOnDestroy character.component')
    this.engine?.dispose();
  }

  setValid(control): object {
    return {
      'is-invalid': this[control].touched && !this[control].valid,
      'is-valid': this[control].touched && this[control].valid
    };
  }

  onImageError($event, defaultImage?) {
    if (defaultImage) {
      this.imageExists(defaultImage, (exists) => {
        if (exists)
          $event.target.src = defaultImage;
        else
          $event.target.src = "assets/images/character/default.png";
      });
    } else {
      $event.target.src = "assets/images/character/default.png";
    }
  }

  imageExists(url, callback) {
    var img = new Image();
    img.onload = function () { callback(true); };
    img.onerror = function () { callback(false); };
    img.src = url;
  }

  initEditor() {
    // this.canvas = document.getElementById("renderCanvasCharacter") as HTMLCanvasElement;
    setTimeout(() => {
      this.canvas = this.canvasRef?.nativeElement;

      if (this.canvas) {
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

        this.scenario = new Scenario({
          component: this,
          canvas: this.canvas,
          engine: this.engine,
          scene: this.scene,
          wears: this.wearsAvailable,
          wearsSelected: this.wears.value,
          height: this.height.value
        });

        setTimeout(() => {
          $('[data-toggle-tooltip="tooltip"]').tooltip({ html: true });
        }, 1000);
      } else {
        this.initEditor();
      }
    }, 100);
  }

  getCharacter(): void {
    var characterId = this.character instanceof Object ? this.character._id : this.character;
    this.characterService.getCharacterById(characterId).subscribe(
      data => {
        this.characterForm.patchValue(data)
      },
      error => console.log(error),
      () => this.isLoading = false
    );
  }

  async saveCharacter() {
    this.characterForm.markAllAsTouched();
    if (this.characterForm.valid) {
      var characterValue = this.characterForm.value;
      characterValue.wears = this.getSelectedWears();
      characterValue.portrait = await this.getPortrait();
      if (!this.character) {
        this.characterService.addCharacter(characterValue).subscribe(
          res => {
            iziToast.success({ message: 'Character created correctly, now you can use it on your campaigns!' });
            // this.router.navigate(['/login']);
            this.getCharacters.emit();
            this.modalService.dismissAll();
          },
          error => iziToast.error({ message: 'There was an error, character can\'t be created.' })
        );
      } else {
        this.characterService.editCharacter(characterValue).subscribe(
          res => {
            iziToast.success({ message: 'Character was changed correctly.' });
            // this.router.navigate(['/login']);
            this.getCharacters.emit();
            this.modalService.dismissAll();
          },
          error => iziToast.error({ message: 'There was an error, character can\'t be changed.' })
        );
      }
    } else {
      iziToast.error({ message: 'Some values are invalid, please check the information tab of the character.' });
    }
  }

  getSelectedWears() {
    var wearsValue = [{
      category: 'skin',
      subcategory: 'color',
      name: 'none',
      color: this.scenario.character.mesh.material.diffuseColor.toHexString().toLowerCase()
    }];

    for (var wearCategory in this.scenario.wearsSelected) {
      for (var wearSubcategory in this.scenario.wearsSelected[wearCategory]) {
        if (this.scenario.wearsSelected[wearCategory][wearSubcategory]) {
          wearsValue.push({
            category: wearCategory,
            subcategory: wearSubcategory,
            name: this.scenario.wearsSelected[wearCategory][wearSubcategory].name,
            color: this.scenario.wearsSelected[wearCategory][wearSubcategory].material.diffuseColor.toHexString().toLowerCase()
          });
        }
      }
    }

    return wearsValue;
  }

  setColorPicker(id, color) {
    var colorPicker = ng.getComponent($("#" + id)[0]);
    if (colorPicker.color != color.hex) {
      colorPicker.color = color.hex;
      colorPicker.currentColor = color.hex;
      colorPicker.ngOnChanges();
      colorPicker.handleChange(colorPicker);
    }
  }

  getPortrait() {
    return new Promise(resolve => {
      BABYLON.Tools.CreateScreenshotUsingRenderTarget(this.engine, this.scenario.photoCamera, 400, (data) => resolve(data));
    });
  }
}


export class Scenario {
  parameters?: any;
  camera?: any;
  photoCamera?: any;
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
    this.initCharacter(() => {
      this.initWears();
      this.initSelectedWears();
      this.heightChange({ srcElement: { value: this.parameters.height } });
    });
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

    this.photoCamera = new BABYLON.ArcRotateCamera("PhotoCamera", 0, 0, 0, new BABYLON.Vector3(0, 0.75, 0), this.parameters.scene);
    this.photoCamera.setPosition(new BABYLON.Vector3(0, 1.5, 5));
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

  initCharacter(success) {
    this.character = new CharacterModel({ ...this.parameters, ... { scenario: this, success: success } });
  }

  initWears() {
    for (let category in this.parameters.wears) {
      for (let subcategory in this.parameters.wears[category]) {
        this.parameters.wears[category][subcategory].forEach((wear) => {
          if (!this.wears[category]) {
            this.wears[category] = {};
            this.wearsSelected[category] = {};
          }
          if (!this.wears[category][subcategory]) this.wears[category][subcategory] = {};
          // this.importWear(category, subcategory, wear);
        });
      }
    }
  }

  importWear(category, subcategory, wear, success) {
    BABYLON.SceneLoader.ImportMesh('', "assets/meshes/wear/" + category + "/" + subcategory + "/", wear + ".babylon", this.parameters.scene, (meshes, particleSystems, skeletons, animationsGroups) => {
      this.wears[category][subcategory][wear] = meshes[0];
      this.wears[category][subcategory][wear].name = wear;
      var material = new BABYLON.StandardMaterial(wear + "Material", this.parameters.scene);
      material.diffuseColor = BABYLON.Color3.FromHexString("#493136");
      this.wears[category][subcategory][wear].material = material;
      this.wears[category][subcategory][wear].visibility = 0;
      success();
    });
  }

  initSelectedWears() {
    if (this.parameters.wearsSelected) {
      this.parameters.wearsSelected.forEach((selectedWear) => {
        if (selectedWear.name) {
          if (selectedWear.category == 'skin' && selectedWear.subcategory == 'color')
            this.wearColorChange({ color: { hex: selectedWear.color } }, selectedWear.category, selectedWear.subcategory);
          else
            this.wearChange(selectedWear.category, selectedWear.subcategory, selectedWear.name, { hex: selectedWear.color });
        }
      });
    }

    // var selectedWear = this.parameters.wearsSelected.find((selectedWear) => {
    //   return selectedWear.category == category && selectedWear.subcategory == subcategory && selectedWear.name == wear;
    // });
    // if (selectedWear) {
    //   this.wears[category][subcategory][wear].material.diffuseColor = BABYLON.Color3.FromHexString(selectedWear.color);
    //   this.character?.animator?.parent(this.wears[category][subcategory][wear]);
    // }
  }

  equipWear(category, subcategory, wear, color) {
    if (category && subcategory && wear && color) {
      $('[name="ce-' + subcategory + '-radio"][value="' + wear + '"]').attr('checked', true);
      this.parameters.component.setColorPicker('ce-' + subcategory + '-color', color);
      // this.wears['armor'].attachToBone(this.character.skeleton.bones.find((bone) => { return bone.id == 'mixamorig:Spine2' }), this.character.mesh);
      this.character?.animator?.parent(this.wears[category][subcategory][wear]);
      this.wears[category][subcategory][wear].visibility = 1;
      this.wearsSelected[category][subcategory] = this.wears[category][subcategory][wear];
      if (subcategory != "ears")
        this.wearsSelected[category][subcategory].material.diffuseColor = BABYLON.Color3.FromHexString(color.hex);
      else
        this.wearsSelected[category][subcategory].material.diffuseColor = this.character.mesh.material.diffuseColor;
    }
  }

  wearChange(category, subcategory, wear, color) {
    for (let anotherWear in this.wears[category][subcategory]) {
      this.wears[category][subcategory][anotherWear].visibility = 0;
      this.character?.animator?.unparent(this.wears[category][subcategory][anotherWear]);
    }
    this.wearsSelected[category][subcategory] = null;
    if (!this.wears[category][subcategory][wear] && this.parameters.wears[category][subcategory].find((w) => { return w == wear })) {
      this.importWear(category, subcategory, wear, () => {
        this.equipWear(category, subcategory, wear, color);
      });
    } else {
      this.equipWear(category, subcategory, wear, color);
    }

  }

  wearColorChange($event, category, subcategory) {
    this.parameters.component.setColorPicker('ce-' + subcategory + '-color', $event.color);
    if (category == "skin" && subcategory == "color") {
      if (this.wearsSelected["head"] && this.wearsSelected["head"]["ears"])
        this.wearsSelected["head"]["ears"].material.diffuseColor = BABYLON.Color3.FromHexString($event.color.hex);
      this.character.mesh.material.diffuseColor = BABYLON.Color3.FromHexString($event.color.hex);
    } else {
      if (this.wearsSelected[category] && this.wearsSelected[category][subcategory])
        this.wearsSelected[category][subcategory].material.diffuseColor = BABYLON.Color3.FromHexString($event.color.hex);
    }
  }

  heightChange($event) {
    $('[name="height"][value="' + $event.srcElement.value + '"]')[0].checked = true;
    this.character.mesh.scaling.y = parseFloat($event.srcElement.value);
  }
}

export class CharacterModel {
  parameters?: any;
  mesh?: any;
  skeleton?: any;
  animator?: any;

  constructor(parameters) {
    this.parameters = parameters
    this.init(this.parameters.success);
  }

  init(success) {
    BABYLON.SceneLoader.ImportMesh("", "assets/meshes/base/", "base.babylon", this.parameters.scene, (meshes, particleSystems, skeletons, animationsGroups) => {
      this.mesh = meshes[0];
      this.skeleton = skeletons[0];

      var material = new BABYLON.StandardMaterial("characterMaterial", this.parameters.scene);
      material.diffuseColor = BABYLON.Color3.FromHexString("#dc9b78");
      this.mesh.material = material;

      this.animator = new Animator(this.mesh, this.skeleton, { actual: 'Idle' });

      this.parameters.scenario.lights.baseLight._shadowGenerator.addShadowCaster(this.mesh);

      success();
    });
  }
}
