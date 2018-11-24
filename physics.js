
class Pos {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    copy() {
        return new Pos(this.x, this.y);
    }
    toVector() {
        return new Vector(this.x, this.y);
    }
    plus(b) {
        return new Pos(this.x + b.x, this.y + b.y);
    }
    plus_eq(b) {
        this.x += b.x; this.y += b.y;
    }
    minus(b) {
        if (b instanceof Vector) {
            return new Pos(this.x - b.x, this.y - b.y);
        } else {
            return new Vector(this.x - b.x, this.y - b.y);
        }
    }
}

class Vector {
    constructor(x, y) {
        if (x instanceof Pos && y instanceof Pos) {
            this.x = y.x - x.x;
            this.y = y.y - x.y;
        } else {
            this.x = x;
            this.y = y;
        }
    }
    copy() {
        return new Vector(this.x, this.y);
    }
    toPos() {
        return new Pos(this.x, this.y);
    }
    get unit() {
        let l = this.length;
        return new Vector(this.x / l, this.y / l);
    }
    get length2() {
        return this.x * this.x + this.y * this.y;
    }
    get length() {
        return Math.sqrt(this.length2);
    }
    plus(b) {
        return new Vector(this.x + b.x, this.y + b.y);
    }
    plus_eq(b) {
        this.x += b.x; this.y += b.y;
    }
    minus(b) {
        return new Vector(this.x - b.x, this.y - b.y);
    }
    multiply(b) {
        return new Vector(this.x * b, this.y * b);
    }
    multiply_eq(b) {
        this.x *= b; this.y *= b;
    }
    divide(b) {
        return new Vector(this.x / b, this.y / b);
    }
    divide_eq(b) {
        this.x /= b; this.y /= b;
    }
    inv() {
        return new Vector(-this.x, -this.y);
    }
    clear() {
        this.x = 0; this.y = 0;
    }
}

function makeGravity(G, m1, m2, p1, p2) {
    let vec = new Vector(p1, p2);
    let size = G * m1 * m2 / vec.length2;
    return vec.unit.multiply(size);
}
