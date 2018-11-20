
var Simulator = {

    G: 2,
    MAX_DIST: 50000,

    lastTime: null,
    interval: null,
    
    planets: [],

    addPlanet(obj) {
        this.planets.push(new Planet(obj.x, obj.y, obj.r, obj.v));
    },

    planetFromPos(x, y) {
        var pos = new Pos(x, y);
        for (var i = this.planets.length - 1; i >= 0; --i) {
            if (new Vector(this.planets[i].pos, pos).length <= this.planets[i].r) return this.planets[i];
        }
        return null;
    },

    removePlanet(planet) {
        var index = this.planets.indexOf(planet);
        if (index !== -1) {
            this.removePlanetAt(index);
        }
    },

    removePlanetAt(index) {
        var planet = this.planets.splice(index, 1)[0];
        if (planet === UI.selectedPlanet) {
            UI.selectedPlanet = null;
        }
        if (planet === UI.hoveredPlanet) {
            UI.hoveredPlanet = null;
        }
        index = UI.lockedPlanets.indexOf(planet);
        if (index !== -1) {
            UI.lockedPlanets.splice(index, 1);
        }
        index = UI.watchedPlanets.indexOf(planet);
        if (index !== -1) {
            UI.watchedPlanets.splice(index, 1);
            UI.watchedOrbit.splice(index, 1);
        }
    },

    clearPlanets(obj) {
        this.planets = [];
        UI.selectedPlanet = null;
        UI.hoveredPlanet = null;
        UI.lockedPlanets = [];
        UI.watchedPlanets = [];
        UI.watchedOrbit = [];
    },

    simulate(t) {
        var A, B, F;
        var n = this.planets.length;
        for (var i = 0; i < n; ++i) {
            this.planets[i].F = new Vector(0, 0);
        }
        for (var i = 1; i < n; ++i) {
            A = this.planets[i];
            for (var j = 0; j < i; ++j) {
                B = this.planets[j];
                F = makeGravity(this.G, A.mass, B.mass, A.pos, B.pos);
                A.F.plus_eq(F);
                B.F.plus_eq(F.inv());
            }
        }
        for (var i = 0; i < n; ++i) {
            A = this.planets[i];
            if (UI.lockedPlanets.indexOf(A) !== -1) {
                A.v.clear(); continue;
            }
            A.a = A.F.divide(A.mass);
            A.pos.plus_eq(A.v.plus(A.a.multiply(0.5 * t)).multiply(t));
            A.v.plus_eq(A.a.multiply(t));
        }
    },

    tick() {
        var timePassed = 0.001 * (Date.now() - this.lastTime);
        this.lastTime = Date.now();
        if (UI.mouseClick && UI.hitPlanet) return;
        var count = 10;
        var elapse = timePassed / count;
        while (count--) {
            this.simulate(elapse);
        }
        for (var i = 0; i < this.planets.length; ) {
            if (new Vector(this.planets[i].pos, renderer.centerPos).length > this.MAX_DIST) {
                this.removePlanetAt(i);
            } else {
                ++i;
            }
        }
        UI.watchedPlanets.forEach(function(planet, index) {
            var arr = UI.watchedOrbit[index];
            if (!arr.length || new Vector(arr[arr.length - 1], planet.pos).length > 3) {
                arr.push(planet.pos.copy());
                if (arr.length > 2000) arr.shift();
            }
        });
    },

    start() {
        var _this = this;
        if (this.interval !== null) return;
        this.lastTime = Date.now();
        this.interval = setInterval(function() {
            _this.tick();
        }, 18);
    },

    pause() {
        if (this.interval === null) return;
        clearInterval(this.interval);
        this.interval = null;
    }

};
