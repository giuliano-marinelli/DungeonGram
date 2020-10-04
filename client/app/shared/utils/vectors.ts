import * as BABYLON from '@babylonjs/core/Legacy/legacy';
export class Vectors {
  static distance(pointA, pointB) {
    var a = pointA.x - pointB.x;
    var b = pointA.y - pointB.y;

    return Math.sqrt(a * a + b * b);
  }

  static middlePoint(poinnA, pointB) {
    var a = (poinnA.x + pointB.x) / 2;
    var b = (poinnA.y + pointB.y) / 2;

    return { x: a, y: b };
  }

  static angle(poinnA, pointB) {
    return -Math.atan2(pointB.y - poinnA.y, pointB.x - poinnA.x);
  }

  static directionToRotate(direction) {
    switch (direction.x) {
      case 1:
        switch (direction.y) {
          case 1:
            return 1;
          case 0:
            return 2;
          case -1:
            return 3;
        }
        break;
      case 0:
        switch (direction.y) {
          case 1:
            return 0;
          case 0:
            return 1;
          case -1:
            return 4;
        }
        break;
      case -1:
        switch (direction.y) {
          case 1:
            return 7;
          case 0:
            return 6;
          case -1:
            return 5;
        }
        break;
    }
  }

  static distanceBetweenDirections(directionA, directionB) {
    var directions = [0, 1, 2, 3, 4, 5, 6, 7]
    var i = directions.indexOf(directionA);
    var distance = 0;
    for (var j = 0; j < directions.length; j++) {
      if (i > 7) i = 0;
      if (distance > 4) distance = -3;
      if (directions[i] == directionB) {
        return distance;
      } else {
        distance++;
        i++;
      }
    }
  }

  static rotateByArc(Center, A, arc) {
    //calculate radius
    var radius = BABYLON.Vector2.Distance(Center, A);

    //calculate angle from arc
    var angle = arc / radius;

    var B = this.rotateByRadians(Center, A, angle);

    return B;
  }

  static rotateByRadians(Center, A, angle) {
    //Move calculation to 0,0
    var v = A.add(Center.negate());

    //rotate x and y
    var x = v.x * Math.cos(angle) + v.y * Math.sin(angle);
    var y = v.y * Math.cos(angle) - v.x * Math.sin(angle);

    //move back to center
    var B = new BABYLON.Vector2(x, y).add(Center);

    return B;
  }

  static getRadiusPoints(centerPoint, subdivisions) {
    var points = [];
    for (var i = 0; i <= Math.PI * 2; i += Math.PI / subdivisions) {
      var point = this.rotateByArc(new BABYLON.Vector2(centerPoint.x, centerPoint.y), new BABYLON.Vector2(1, 0), i)
      points.push(point);
    }
    return points;
  }

}
