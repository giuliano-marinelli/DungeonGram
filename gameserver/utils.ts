export class Utils {
  static uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  static randomHexColor() {
    return '#' + (Math.random() * 0xFFFFFF << 0).toString(16).padStart(6, '0');
  }

  static BresenhamLine(x0, y0, x1, y1) {
    var tiles = [];
    var dx = Math.abs(x1 - x0);
    var dy = Math.abs(y1 - y0);
    var sx = (x0 < x1) ? 1 : -1;
    var sy = (y0 < y1) ? 1 : -1;
    var err = dx - dy;

    while (true) {
      tiles.push({ x: x0, y: y0 });

      if ((x0 === x1) && (y0 === y1)) break;
      var e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x0 += sx; }
      if (e2 < dx) { err += dx; y0 += sy; }
    }

    return tiles;
  }

  static BresenhamLine2(point1, point2) {
    var coordinatesArray = new Array();
    // Translate coordinates
    var x1 = point1.x;
    var y1 = point1.y;
    var x2 = point2.x;
    var y2 = point2.y;
    // Define differences and error check
    var dx = Math.abs(x2 - x1);
    var dy = Math.abs(y2 - y1);
    var sx = (x1 < x2) ? 1 : -1;
    var sy = (y1 < y2) ? 1 : -1;
    var err = dx - dy;
    // Set first coordinates
    coordinatesArray.push({ x: x1, y: y1 });
    // Main loop
    while (!((x1 == x2) && (y1 == y2))) {
      var e2 = err << 1;
      if (e2 > -dy) {
        err -= dy;
        x1 += sx;
      }
      if (e2 < dx) {
        err += dx;
        y1 += sy;
      }
      // Set coordinates
      coordinatesArray.push({ x: x1, y: y1 });
    }
    // Return the result
    return coordinatesArray;
  }

  static distance(pointA, pointB) {
    var a = pointA.x - pointB.x;
    var b = pointA.y - pointB.y;

    return Math.sqrt(a * a + b * b);
  }

  //gets a "from" and a "to" points that makes a line and
  //return the new "to" point for rotate the line in the "point" direction
  static rotateByPoint(from, to, point) {
    var t = this.distance(from, to) / this.distance(from, point);
    return {
      x: ((1 - t) * from.x + t * point.x),
      y: ((1 - t) * from.y + t * point.y)
    }
  }

  static rotate(point1, point2, angle) {
    // var radians = (Math.PI / 180) * angle,
    var cos = Math.cos(angle),
      sin = Math.sin(angle),
      nx = (cos * (point2.x - point1.x)) + (sin * (point2.y - point1.y)) + point1.x,
      ny = (cos * (point2.y - point1.y)) - (sin * (point2.x - point1.x)) + point1.y;
    return { x: nx, y: ny };
  }
}
