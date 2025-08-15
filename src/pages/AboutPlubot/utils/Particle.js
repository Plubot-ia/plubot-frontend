import { secureRandom } from './byte-helpers';

// Particle class for canvas animation, moved outside the component to prevent re-creation on renders.
export class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.size = secureRandom() * 3 + 1;
    this.speedX = secureRandom() * 2 - 1;
    this.speedY = secureRandom() * 2 - 1;
    this.color = color;
    this.ttl = 150 + secureRandom() * 100; // time to live
    this.life = 0;
    this.opacity = 1;
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.life++;

    if (this.life > this.ttl * 0.7) {
      this.opacity = 1 - (this.life - this.ttl * 0.7) / (this.ttl * 0.3);
    }

    return this.life < this.ttl;
  }

  draw(context) {
    context.globalAlpha = this.opacity;
    context.fillStyle = this.color;
    context.beginPath();
    context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    context.fill();
    context.globalAlpha = 1;
  }
}
