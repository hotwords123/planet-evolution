
class PlanetOrbit {
    constructor() {
        this.delta = [];
        this.last = null;
    }
    toJSON() {
        return {
            delta: this.delta.map(function(vec) {
                return vec.toJSON();
            }),
            last: this.last ? this.last.toJSON() : null
        };
    }
    static fromJSON(o) {
        var a = new PlanetOrbit();
        a.delta = o.delta.map(function(b) {
            return Vector.fromJSON(b);
        });
        a.last = o.last ? Pos.fromJSON(o.last) : null;
        return a;
    }
    update(pos, vec) {
        if (!this.last) {
            this.delta = [];
        } else {
            var v = new Vector(this.last, pos).minus(vec);
            if (!this.delta.length) {
                this.delta.push(v);
            } else {
                var v2 = this.delta[this.delta.length - 1].plus(v);
                if (v2.length > 2) {
                    this.delta.push(v);
                    if (this.delta.length > 2000) {
                        this.delta.shift();
                    }
                } else {
                    this.delta[this.delta.length - 1] = v2;
                }
            }
        }
        this.last = pos.copy();
    }
    clear() {
        this.delta = [];
        this.last = null;
    }
}
