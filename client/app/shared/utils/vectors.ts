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
}
