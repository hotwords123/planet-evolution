
class Particle {
    constructor(x, y, v, r, rate) {
        this.pos = new Pos(x, y);
        this.v = v;
        this.r = r;
        this.rate = rate;
        this.opacity = 1;
    }
    toJSON() {
        return {
            x: this.x,
            y: this.y,
            v: this.v.toJSON(),
            r: this.r,
            rate: this.rate,
            opacity: this.opacity
        };
    }
    static fromJSON(o) {
        var p = new Particle(o.x, o.y, Vector.fromJSON(o.v), o.r, o.rate);
        p.opacity = o.opacity;
        return p;
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
