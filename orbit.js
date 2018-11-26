
class PlanetOrbit {
    constructor(arr) {
        if (arr) {
            this.arr = arr.map(function(pos) {
                return pos.copy();
            });
        } else {
            this.arr = [];
        }
    }
    toJSON() {
        return this.arr.map(function(pos) {
            return pos.toJSON();
        });
    }
    static fromJSON(o) {
        return new PlanetOrbit(o.map(function(p) {
            return Pos.fromJSON(p);
        }));
    }
    get length() {
        return this.arr.length;
    }
    get last() {
        return this.arr[this.length - 1];
    }
    update(pos, force) {
        if (force || !this.arr.length || new Vector(this.last, pos).length > 2) {
            this.arr.push(pos.copy());
            if (this.arr.length > 2000) {
                this.arr.shift();
            }
        }
    }
    clear() {
        this.arr = [];
    }
}
