
class Planet {
    constructor(x, y, r, v) {
//      this.id = makeId(16);
        this.pos = new Pos(x, y);
        this.r = r;
        this.v = v || new Vector(0, 0);
        this.F = new Vector(0, 0);
    }
    get x() { return this.pos.x; }
    get y() { return this.pos.y; }
    set x(val) { this.pos.x = val; }
    set y(val) { this.pos.y = val; }
    get mass() {
        return 100 * this.r * this.r;
    }
    get a() {
        return this.F.divide(this.mass);
    }
}
