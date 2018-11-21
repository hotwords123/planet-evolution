
var Simulator = {

    G: 800,
    MAX_DIST: 50000,

    lastTime: null,
    interval: null,
    
    planets: [],
    lockedPlanets: [],
    watchedPlanets: [],
    watchedPlanetsOrbit: [],

    calcRadius(mass) {
        return 2.5 + Math.pow(mass, 0.4) * 2.5;
    },

    addPlanet(obj) {
        this.planets.push(new Planet(obj.x, obj.y, obj.r, obj.m, obj.v));
    },

    planetFromPos(x, y) {
        var pos = new Pos(x, y);
        for (var i = this.planets.length - 1; i >= 0; --i) {
            if (new Vector(this.planets[i].pos, pos).length < this.planets[i].r + 10) return this.planets[i];
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
        if (planet === UI.hoveredPlanet) {
            UI.hoveredPlanet = null;
        }
        index = UI.selectedPlanets.indexOf(planet);
        if (index !== -1) {
            UI.selectedPlanets.splice(index, 1);
        }
        index = this.lockedPlanets.indexOf(planet);
        if (index !== -1) {
            this.lockedPlanets.splice(index, 1);
        }
        index = this.watchedPlanets.indexOf(planet);
        if (index !== -1) {
            this.watchedPlanets.splice(index, 1);
            this.watchedPlanetsOrbit.splice(index, 1);
        }
    },

    clearPlanets(obj) {
        this.planets = [];
        UI.hoveredPlanet = null;
        UI.selectedPlanets = [];
        UI.activePlanet = null;
        UI.planetAdded = true;
        this.lockedPlanets = [];
        this.watchedPlanets = [];
        this.watchedPlanetsOrbit = [];
    },

    isLocked(planet) {
        return this.lockedPlanets.indexOf(planet) !== -1;
    },

    setLocked(planet, flag) {
        var index = this.lockedPlanets.indexOf(planet);
        if (index === -1) {
            if (flag) {
                this.lockedPlanets.push(planet);
            }
        } else {
            if (!flag) {
                this.lockedPlanets.splice(index, 1);
            }
        }
    },

    toggleLocked(planet) {
        var index = this.lockedPlanets.indexOf(planet);
        if (index === -1) {
            this.lockedPlanets.push(planet);
        } else {
            this.lockedPlanets.splice(index, 1);
        }
    },

    isWatched(planet) {
        return this.watchedPlanets.indexOf(planet) !== -1;
    },

    setWatched(planet, flag) {
        var index = this.watchedPlanets.indexOf(planet);
        if (index === -1) {
            if (flag) {
                this.watchedPlanets.push(planet);
                this.watchedPlanetsOrbit.push([]);
            }
        } else {
            if (!flag) {
                this.watchedPlanets.splice(index, 1);
                this.watchedPlanetsOrbit.splice(index, 1);
            }
        }
    },

    toggleWatched(planet) {
        var index = this.watchedPlanets.indexOf(planet);
        if (index === -1) {
            this.watchedPlanets.push(planet);
            this.watchedPlanetsOrbit.push([]);
        } else {
            this.watchedPlanets.splice(index, 1);
            this.watchedPlanetsOrbit.splice(index, 1);
        }
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
            if (this.lockedPlanets.indexOf(A) !== -1) {
                A.v.clear(); A.F.clear(); A.a.clear(); continue;
            }
            A.a = A.F.divide(A.mass);
            A.pos.plus_eq(A.v.plus(A.a.multiply(0.5 * t)).multiply(t));
            A.v.plus_eq(A.a.multiply(t));
        }
    },

    tick() {
        var timePassed = 0.001 * (Date.now() - this.lastTime) * 10;
        this.lastTime = Date.now();
        if (UI.mouseClick && UI.activePlanet) return;
        var countPlanets = this.planets.length;
        if (!countPlanets) return;
        var count;
        if (countPlanets <= 3) {
            count = 16384;
        } else if (countPlanets <= 5) {
            count = 8192;
        } else if (countPlanets <= 8) {
            count = 4096;
        } else if (countPlanets <= 12) {
            count = 2048;
        } else if (countPlanets <= 16) {
            count = 1024;
        } else if (countPlanets <= 24) {
            count = 512;
        } else if (countPlanets <= 50) {
            count = 256;
        } else {
            count = 128;
        }
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
        this.watchedPlanets.forEach(function(planet, index) {
            var arr = this.watchedPlanetsOrbit[index];
            if (!arr.length || new Vector(arr[arr.length - 1], planet.pos).length > 2) {
                arr.push(planet.pos.copy());
                if (arr.length > 2000) arr.shift();
            }
        }, this);
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
