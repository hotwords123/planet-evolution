
class Particle {
    constructor(x, y, v, r, rate) {
        this.pos = new Pos(x, y);
        this.v = v;
        this.r = r;
        this.rate = rate;
        this.opacity = 1;
    }
    get x() { return this.pos.x; }
    get y() { return this.pos.y; }
    set x(val) { this.pos.x = val; }
    set y(val) { this.pos.y = val; }
    update(t) {
        this.pos.plus_eq(this.v.multiply(t));
        this.v.multiply_eq(Math.pow(0.75, t));
        this.opacity -= this.rate * t;
    }
}
