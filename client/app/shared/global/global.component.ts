import { Component } from '@angular/core';
import { Shapes } from '../utils/shapes';
import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import isBase64 from 'is-base64';

@Component({
  selector: 'app-global',
  templateUrl: './global.component.html',
  styleUrls: ['./global.component.scss']
})
export class GlobalComponent {

  //global object for the loading of wear assets in different scenes
  public static wearsAvailable: any = {
    arms: {
      biceps: [],
      elbows: [],
      forearms: [],
      hands: ["mittens"],
      shoulders: []
    },
    head: {
      beard: ["big.mostacho.beard", "chinless.beard", "disheveled.beard", "full.beard", "long.beard"],
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
    },
    info: {
      character: []
    }
  };

  static assetsTasks(assetsManager, assets, scene, options?) {
    var collidersVisibility = options?.test ? 0.5 : 0; //all the colliders are not visible by default

    //add base mesh for characters
    assetsManager.addMeshTask("base task", "", "assets/meshes/base/", "base.babylon").onSuccess = (task) => {
      task.loadedMeshes[0].setEnabled(false);
      assets.base = task.loadedMeshes[0];
      assets.baseMaterial = new BABYLON.StandardMaterial("base", scene);
      assets.base.material = assets.baseMaterial;
    };

    //add each wear mesh for characters
    for (let category in GlobalComponent.wearsAvailable) {
      for (let subcategory in GlobalComponent.wearsAvailable[category]) {
        GlobalComponent.wearsAvailable[category][subcategory].forEach((wear) => {
          assetsManager.addMeshTask(wear + " task", "", "assets/meshes/wear/" + category + "/" + subcategory + "/", wear + ".babylon").onSuccess = (task) => {
            task.loadedMeshes[0].setEnabled(false);
            if (!assets[category]) assets[category] = {};
            if (!assets[category][subcategory]) assets[category][subcategory] = {};
            assets[category][subcategory][wear] = task.loadedMeshes[0];
            assets[category][subcategory][wear + 'Material'] = new BABYLON.StandardMaterial(wear + "Material", scene);
            assets[category][subcategory][wear].material = assets[category][subcategory][wear + 'Material'];
          };
        });
      }
    }

    //add base mesh for 2D characters
    assets.base2D = BABYLON.MeshBuilder.CreatePlane('', { height: 2, width: 1 });
    assets.base2D.setEnabled(false);
    assets.base2D.setPivotPoint(new BABYLON.Vector3(0, -1, 0));
    assets.base2D.position.y = 1;
    assets.base2D.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
    assets.base2DFrontMaterial = new BABYLON.StandardMaterial("base2DFront", scene);
    assets.base2DBackMaterial = new BABYLON.StandardMaterial("base2DBack", scene);

    if (!options?.characterMode) {
      //add character base mesh
      assets.character = BABYLON.MeshBuilder.CreateBox('', { height: 2, width: 1, depth: 1 });
      assets.character.setEnabled(false);
      assets.character.setPivotPoint(new BABYLON.Vector3(0, -1, 0));
      assets.character.position.y = 1;
      assets.character.visibility = collidersVisibility;

      //add character signs mesh
      assets.characterSigns = BABYLON.MeshBuilder.CreatePlane('', { height: 1, width: 1});
      assets.characterSigns.setEnabled(false);
      assets.characterSigns.visibility = collidersVisibility;
      if (options?.test) {
        assets.characterSignsMaterial = new BABYLON.StandardMaterial("characterSigns", scene);
        assets.characterSignsMaterial.diffuseColor = BABYLON.Color3.Purple();
        assets.characterSigns.material = assets.characterSignsMaterial;
      }

      //add character selection mesh and material
      assets.characterSelection = BABYLON.MeshBuilder.CreateCylinder('', { height: 0.05, diameter: 1.75 }, scene);
      assets.characterSelection.setEnabled(false);
      assets.characterSelectionMaterial = new BABYLON.StandardMaterial("characterSelection", scene);
      assets.characterSelectionTexture = new BABYLON.Texture("assets/images/game/selection_circle.png", scene);
      assets.characterSelectionMaterial.diffuseTexture = assets.characterSelectionTexture;
      assets.characterSelectionMaterial.diffuseTexture.hasAlpha = true;
      assets.characterSelectionMaterial.useAlphaFromDiffuseTexture = true;
      assets.characterSelectionMaterial.alpha = 0.5;
      assets.characterSelection.material = assets.characterSelectionMaterial;

      //add character collider mesh (and material if testing)
      assets.characterCollider = BABYLON.MeshBuilder.CreateCylinder('', { height: 2, diameter: 0.5 }, scene);
      assets.characterCollider.setEnabled(false);
      assets.characterCollider.setPivotPoint(new BABYLON.Vector3(0, -1, 0));
      assets.characterCollider.position.y = 1;
      assets.characterCollider.visibility = collidersVisibility;
      if (options?.test) {
        assets.characterColliderMaterial = new BABYLON.StandardMaterial("characterCollider", scene);
        assets.characterColliderMaterial.diffuseColor = BABYLON.Color3.Blue();
        assets.characterCollider.material = assets.characterColliderMaterial;
      }

      //add character collider physics mesh and material (if testing)
      if (options?.test) {
        assets.characterColliderPhysics = BABYLON.MeshBuilder.CreateBox('', { height: 2, width: 0.9, depth: 0.9 }, scene);
        assets.characterColliderPhysics.setEnabled(false);
        assets.characterColliderPhysics.visibility = collidersVisibility;
        assets.characterColliderPhysicsMaterial = new BABYLON.StandardMaterial("characterColliderPhysics", scene);
        assets.characterColliderPhysicsMaterial.diffuseColor = BABYLON.Color3.Gray();
        assets.characterColliderPhysics.material = assets.characterColliderPhysicsMaterial;
      }

      //add wall mesh and material
      assets.wall = BABYLON.MeshBuilder.CreateBox('', { height: 1, width: 1, depth: 0.01 }, scene);
      assets.wall.setEnabled(false);
      assets.wallMaterial = new BABYLON.StandardMaterial("wall", scene);
      assets.wallMaterial.diffuseColor = BABYLON.Color3.Gray();
      assets.wall.material = assets.wallMaterial;

      //add wall collider physics mesh and material (if testing)
      if (options?.test) {
        assets.wallCollider = BABYLON.MeshBuilder.CreateBox('', { height: 0.1, width: 0.5, depth: 0.5 }, scene)
        assets.wallCollider.setEnabled(false);
        assets.wallCollider.visibility = collidersVisibility;
        assets.wallColliderMaterial = new BABYLON.StandardMaterial("wallCollider", scene);
        assets.wallColliderMaterial.diffuseColor = BABYLON.Color3.Red();
        assets.wallCollider.material = assets.wallColliderMaterial;
      }

      //add wall highlight mesh and material
      assets.wallHighlight = BABYLON.MeshBuilder.CreateBox('', { height: 1, width: 1, depth: 0.01 }, scene);
      assets.wallHighlight.setEnabled(false);
      assets.wallHighlight.isPickable = false;
      assets.wallHighlightMaterial = new BABYLON.StandardMaterial("wallHighlight", scene);
      assets.wallHighlightMaterial.diffuseColor = BABYLON.Color3.Gray();
      assets.wallHighlightMaterial.alpha = 0;
      assets.wallHighlight.material = assets.wallHighlightMaterial;

      //add door mesh and material
      assets.door = BABYLON.MeshBuilder.CreateBox('', { height: 1, width: 1, depth: 0.1 }, scene);
      assets.door.setEnabled(false);
      assets.doorMaterial = new BABYLON.StandardMaterial("door", scene);
      assets.doorTexture = new BABYLON.Texture("assets/images/game/door.png", scene);
      assets.doorMaterial.diffuseTexture = assets.doorTexture;
      assets.door.material = assets.doorMaterial;

      //add door collider mesh (and material if testing)
      assets.doorCollider = BABYLON.MeshBuilder.CreateCylinder('', { height: 1, diameter: 2 }, scene);
      assets.doorCollider.setEnabled(false);
      assets.doorCollider.visibility = collidersVisibility;
      if (options?.test) {
        assets.doorColliderMaterial = new BABYLON.StandardMaterial("doorCollider", scene);
        assets.doorColliderMaterial.diffuseColor = BABYLON.Color3.Red();
        assets.doorCollider.material = assets.doorColliderMaterial;
      }

      //add temporal wall mesh and material
      assets.temporalWall = BABYLON.MeshBuilder.CreateBox('', { height: 1, width: 0.1, depth: 0.1 }, scene);
      assets.temporalWall.setEnabled(false);
      assets.temporalWallMaterial = new BABYLON.StandardMaterial("temporalWall", scene);
      assets.temporalWallMaterial.diffuseColor = BABYLON.Color3.Yellow();
      assets.temporalWall.material = assets.temporalWallMaterial;

      //add path mesh and material
      assets.pathPoint = BABYLON.MeshBuilder.CreateSphere('', { segments: 16, diameter: 0.4 }, scene);
      assets.pathPoint.setEnabled(false);
      assets.pathPointMaterial = new BABYLON.StandardMaterial("pathPoint", scene);
      assets.pathPointMaterial.emissiveColor = BABYLON.Color3.White();
      assets.pathPoint.material = assets.pathPointMaterial;

      //add rule mesh and material
      assets.rulePoint = BABYLON.MeshBuilder.CreateSphere('', { segments: 16, diameter: 0.2 }, scene);
      assets.rulePoint.setEnabled(false);
      assets.rulePointMaterial = new BABYLON.StandardMaterial("rulePoint", scene);
      assets.rulePointMaterial.diffuseColor = BABYLON.Color3.Yellow();
      assets.rulePoint.material = assets.rulePointMaterial;

      //add figures meshes and materials
      assets.triangleFigure = Shapes.createTriangle("triangle", scene);
      assets.circleFigure = BABYLON.MeshBuilder.CreateDisc("circle", { radius: 1 }, scene);
      assets.squareFigure = BABYLON.MeshBuilder.CreatePlane("square", { size: 1 }, scene);
      assets.triangleFigure.setEnabled(false);
      assets.circleFigure.setEnabled(false);
      assets.squareFigure.setEnabled(false);

      assets.figureMaterial = new BABYLON.StandardMaterial("figure", scene);
      assets.figureMaterial.diffuseColor = BABYLON.Color3.Red();
      assets.figureMaterial.emissiveColor = BABYLON.Color3.Red();
      assets.figureMaterial.alpha = 0.5;

      assets.triangleFigure.material = assets.figureMaterial;
      assets.circleFigure.material = assets.figureMaterial;
      assets.squareFigure.material = assets.figureMaterial;
    }
  }

  static createFormData(object: any): FormData {
    var formData: any = new FormData();
    var jsonData = {};

    Object.entries(object).forEach(([key, value]) => {
      if (value && (value instanceof File || value instanceof Blob /*|| isBase64(value, { allowMime: true })*/))
        formData.append(key, value);
      else
        jsonData[key] = value;
    });
    formData.append("data", JSON.stringify(jsonData));

    return formData;
  }

  static cropImage(data, x, y, width, height) {
    // we return a Promise that gets resolved with our canvas element
    return new Promise((resolve) => {
      // this image will hold our source image data
      const inputImage = new Image();
      // we want to wait for our image to load
      inputImage.onload = () => {
        const outputImage = document.createElement("canvas");
        outputImage.width = width;
        outputImage.height = height;
        const ctx = outputImage.getContext("2d");
        ctx.drawImage(inputImage, x, y, width, height, 0, 0, width, height);
        resolve(outputImage.toDataURL());
      };
      // start loading our image
      inputImage.src = data;
    });
  }

  //convert base64 url to file
  static dataURLtoFile(dataurl, filename): File {
    var arr = dataurl.split(','),
      mime = arr[0].match(/:(.*?);/)[1],
      bstr = atob(arr[1]),
      n = bstr.length,
      u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    return new File([u8arr], filename, { type: mime });
  }

}
