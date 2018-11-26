
class Planet {
    constructor(x, y, r, m, v) {
//      this.id = makeId(16);
        this.pos = new Pos(x, y);
        this.r = r;
        this.mass = m;
        this.v = v || new Vector(0, 0);
        this.F = new Vector(0, 0);
        this.a = new Vector(0, 0);
    }
    toJSON() {
        return {
            x: this.x,
            y: this.y,
            r: this.r,
            m: this.mass,
            v: this.v.toJSON()
        };
    }
    static fromJSON(o) {
        return new Planet(o.x, o.y, o.r, o.m, Vector.fromJSON(o.v));
    }
    get x() { return this.pos.x; }
    get y() { return this.pos.y; }
    set x(val) { this.pos.x = val; }
    set y(val) { this.pos.y = val; }
}
