
import * as BABYLON from '@babylonjs/core/Legacy/legacy';
export class Shapes {

  static createTriangle(id, scene) {
    var triangle = new BABYLON.Mesh(id, scene);
    var vertexData = new BABYLON.VertexData();
    vertexData.positions = [
      1, 0, -0.5,
      1, 0, 0.5,
      0, 0, 0,
    ];
    vertexData.indices = [0, 1, 2];
    vertexData.normals = [1, 1, 1, 1, 1, 1, 1, 1, 1];
    vertexData.applyToMesh(triangle);

    triangle.position = new BABYLON.Vector3(0, 0, 0);
    // triangle.rotation.x = -Math.PI * 2 / 4;
    // triangle.rotation.y = Math.PI * 2 / 8 * 2;
    return triangle;
  }

}
