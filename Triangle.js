import Point from "./Point.js"

class Triangle {
    constructor(x1, y1, z1, x2, y2, z2, x3, y3, z3) {
      this.A = new Point(x1, y1, z1);
      this.B = new Point(x2, y2, z2);
      this.C = new Point(x3, y3, z3);
    }
  
    // Method to calculate the distance between two points
    calculateDistance(point1, point2) {
      const dx = point2.x - point1.x;
      const dy = point2.y - point1.y;
      const dz = point2.z - point1.z;
  
      return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
  
    // Method to calculate the perimeter of the triangle
    calculatePerimeter() {
      const side1 = this.calculateDistance(this.vertex1, this.vertex2);
      const side2 = this.calculateDistance(this.vertex2, this.vertex3);
      const side3 = this.calculateDistance(this.vertex3, this.vertex1);
  
      return side1 + side2 + side3;
    }
}
export default Triangle;
