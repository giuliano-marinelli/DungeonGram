import * as BABYLON from '@babylonjs/core/Legacy/legacy';

export class Tile {
  //schema
  id?: string;
  x?: number;
  y?: number;
  //game objects
  mesh?: any;

  constructor(schema, scene, room, parameters?) {
    this.id = parameters?.id;

    schema.onChange = (changes) => {
      changes.forEach((change) => {
        switch (change.field) {
          case 'x': case 'y':
            this[change.field] = change.value;
            break;
        }
      });
    }
    schema.triggerAll();

    this.doMesh(schema, scene, room, parameters.baseTileMesh);
  }

  doMesh(schema, scene, room, baseTileMesh) {
    this.mesh = baseTileMesh.createInstance(this.id);

    //positioning mesh
    this.mesh.position.y = 0;
    this.mesh.position.x = schema.x;
    this.mesh.position.z = schema.y;

    //set action on mouse in/out
    this.mesh.actionManager = new BABYLON.ActionManager(scene);
    // this.mesh.actionManager.registerAction(new BABYLON.SetValueAction(BABYLON.ActionManager.OnPointerOutTrigger, this.mesh.material, "emissiveColor", this.mesh.material.emissiveColor));
    // this.mesh.actionManager.registerAction(new BABYLON.SetValueAction(BABYLON.ActionManager.OnPointerOverTrigger, this.mesh.material, "emissiveColor", BABYLON.Color3.White()));
    this.mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickUpTrigger, () => {
      console.log('Tile : (', this.x, ',', this.y, ')', schema);
      room?.send('move', { x: this.x, y: this.y });
    }));
  }
}
