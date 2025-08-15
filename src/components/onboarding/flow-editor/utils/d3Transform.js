/**
 * D3 Transform Utilities
 * Helper functions for creating d3-zoom compatible transform objects
 */

/**
 * Creates a d3-zoom compatible transform object
 * @param {number} x - X translation
 * @param {number} y - Y translation
 * @param {number} zoom - Scale factor
 * @returns {Object} Transform object with d3-zoom methods
 */
export const createTransform = (x, y, zoom) => ({
  k: zoom,
  x,
  y,
  apply(point) {
    return [point[0] * this.k + this.x, point[1] * this.k + this.y];
  },
  applyX(xValue) {
    return xValue * this.k + this.x;
  },
  applyY(yValue) {
    return yValue * this.k + this.y;
  },
  invert(point) {
    return [(point[0] - this.x) / this.k, (point[1] - this.y) / this.k];
  },
  invertX(xValue) {
    return (xValue - this.x) / this.k;
  },
  invertY(yValue) {
    return (yValue - this.y) / this.k;
  },
  rescaleX(xScale) {
    return xScale.copy().domain(
      xScale
        .range()
        .map((value) => this.invertX(value))
        .map((value) => xScale.invert(value)),
    );
  },
  rescaleY(yScale) {
    return yScale.copy().domain(
      yScale
        .range()
        .map((value) => this.invertY(value))
        .map((value) => yScale.invert(value)),
    );
  },
  scale(kValue) {
    return kValue === 1 ? this : { ...this, k: kValue * this.k };
  },
  translate(xValue, yValue) {
    return xValue === 0 && yValue === 0
      ? this
      : {
          ...this,
          x: this.x + this.k * xValue,
          y: this.y + this.k * yValue,
        };
  },
  toString() {
    return `translate(${this.x},${this.y}) scale(${this.k})`;
  },
});
