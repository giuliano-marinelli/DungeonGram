import * as BABYLON from '@babylonjs/core/Legacy/legacy';
export class Vectors {
  static Vector3: any = {
    MiddlePoint: (pointA, pointB) => {
      var x = (pointA.x + pointB.x) / 2;
      var y = (pointA.y + pointB.y) / 2;
      var z = (pointA.z + pointB.z) / 2;

      return new BABYLON.Vector3(x, y, z);
    },
    Angle: (pointA, pointB) => {
      return -Math.atan2(pointB.z - pointA.z, pointB.x - pointA.x);
    }
  };

  static distance(pointA, pointB) {
    var a = pointA.x - pointB.x;
    var b = pointA.y - pointB.y;

    return Math.sqrt(a * a + b * b);
  }

  static middlePoint(pointA, pointB) {
    var a = (pointA.x + pointB.x) / 2;
    var b = (pointA.y + pointB.y) / 2;

    return { x: a, y: b };
  }

  static angle(pointA, pointB) {
    return -Math.atan2(pointB.y - pointA.y, pointB.x - pointA.x);
  }

  static directedAngle(vector1, vector2) {
    var angle = Math.atan2(vector2.y, vector2.x) - Math.atan2(vector1.y, vector1.x);
    if (angle < 0) { angle += 2 * Math.PI; }
    return angle;
  }

  static angleToDirection(angle) {
    return new BABYLON.Vector3(Math.sin(angle), 0, Math.cos(angle));
  }

  static ratationDiff(pointA, pointB) {

  }

  static directionToRotate(direction) {
    var dirX = Math.round(direction.x);
    var dirY = Math.round(direction.y);
    switch (dirX) {
      case 1:
        switch (dirY) {
          case 1:
            return 1;
          case 0:
            return 2;
          case -1:
            return 3;
        }
        break;
      case 0:
        switch (dirY) {
          case 1:
            return 0;
          case 0:
            return 1;
          case -1:
            return 4;
        }
        break;
      case -1:
        switch (dirY) {
          case 1:
            return 7;
          case 0:
            return 6;
          case -1:
            return 5;
        }
        break;
      default: {
        return 0;
      }
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

  static getCornerGridPoint(point) {
    var x = Math.round(point.x * 2) / 2;
    x = x % 1 == 0 ? x + 0.5 : x;
    var z = Math.round(point.z * 2) / 2;
    z = z % 1 == 0 ? z + 0.5 : z;

    return new BABYLON.Vector3(x, 0, z);
  }

  static getCenterGridPoint(point) {
    var x = Math.round(point.x);
    var z = Math.round(point.z);

    return new BABYLON.Vector3(x, 0, z);
  }

  static getGridPoint(point, precision) {
    var divisor;
    switch (precision) {
      case 'center': divisor = 1; break;
      case 'corner': divisor = 2; break;
      case 'grid': divisor = 2; break;
      case 'half_grid': divisor = 2; break;
      case 'quarter_grid': divisor = 4; break;
    }
    var x = point.x;
    var z = point.z;
    if (precision != 'none') {
      x = Math.round(point.x * divisor) / divisor;
      if (precision == 'grid' || precision == 'corner') x = x % 1 == 0 ? x + 0.5 : x;
      z = Math.round(point.z * divisor) / divisor;
      if (precision == 'grid' || precision == 'corner') z = z % 1 == 0 ? z + 0.5 : z;
    }
    return new BABYLON.Vector3(x, 0, z);
  }
}
