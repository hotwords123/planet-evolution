
var Simulator = {

    G: 800,
    MAX_DIST: 50000,

    tickElapse: 18,

    lastTime: null,
    interval: null,
    lastPlanetsCount: 0,
    simulateCount: 1024,
    simulateCountScale: 1,
    
    planets: [],
    lockedPlanets: [],
    watchedPlanets: [],
    watchedPlanetsOrbit: [],

    particles: [],

    addPlanet(obj) {
        this.planets.push(new Planet(obj.x, obj.y, obj.r, obj.m, obj.v));
    },

    planetFromPos(x, y) {
        var pos = new Pos(x, y);
        for (var i = this.planets.length - 1; i >= 0; --i) {
            if (new Vector(this.planets[i].pos, pos).length2 < Math.pow(this.planets[i].r + 6, 2)) return this.planets[i];
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
        this.cleanupPlanet(planet);
    },

    cleanupPlanet(planet) {
        var index;
        if (planet === UI.hoveredPlanet) {
            UI.hoveredPlanet = null;
        }
        if (planet === UI.activePlanet) {
            UI.activePlanet = null;
            UI.planetAdded = true;
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

    calcRadius(mass) {
        return 3 + Math.pow(mass, 0.5) * 0.7;
    },

    mergePlanet(A, B) {
        var mass = A.mass + B.mass;
        return new Planet(
            (A.x * A.mass + B.x * B.mass) / mass,
            (A.y * A.mass + B.y * B.mass) / mass,
            this.calcRadius(mass),
            mass,
            A.v.multiply(A.mass).plus(B.v.multiply(B.mass)).divide(mass)
        );
    },

    bombPlanet(A, B, C) {
        //var v_r = Math.min(A.v.minus(B.v).length, 1000);
        //var m_r = Math.pow(Math.min(A.mass, B.mass), 0.5);
        var p_r = A.v.minus(C.v).length * A.mass;
        var count = Math.floor(50 + Math.pow(p_r, 0.8) * 0.05);
        count = Math.min(count, 500);
        var v_m = 5 + Math.pow(p_r, 0.5) * 0.4;
        v_m = Math.min(v_m, 120);
        var x = (A.x * B.r + B.x * A.r) / (A.r + B.r);
        var y = (A.y * B.r + B.y * A.r) / (A.r + B.r);
        for (var i = 0; i < count; ++i) {
            var size = v_m * Math.sqrt(Math.random());
            var arg = Math.random() * 2 * Math.PI;
            this.particles.push(new Particle(
                 x, y,
                 new Vector(
                     size * Math.cos(arg),
                     size * Math.sin(arg)
                 ).plus(C.v),
                 Math.random() * 1 + 1,
                 Math.random() * 0.2 + 0.3
            ));
        }
    },

    processCollision() {
        var arr = this.planets;
        var A, B, C, vec;
        for (var i = 1; i < arr.length; ++i) {
            A = arr[i];
            for (var j = 0; j < i; ++j) {
                B = arr[j];
                vec = new Vector(A.pos, B.pos);
                if (vec.length2 < Math.pow(A.r + B.r, 2)) {
                    C = this.mergePlanet(A, B);
                    this.bombPlanet(A, B, C);
                    this.cleanupPlanet(A);
                    this.cleanupPlanet(B);
                    arr[j] = C;
                    arr.splice(i, 1);
                    --i; break;
                }
            }
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

    removeEscapingPlanets() {
        var dist2 = this.MAX_DIST * this.MAX_DIST;
        var center = renderer.centerPos;
        for (var i = 0; i < this.planets.length; ) {
            var vec = new Vector(this.planets[i].pos, center);
            if (vec.length2 > dist2) {
                this.removePlanetAt(i);
            } else {
                ++i;
            }
        }
    },

    updatePlanetsOrbit() {
        this.watchedPlanets.forEach(function(planet, index) {
            var arr = this.watchedPlanetsOrbit[index];
            if (!arr.length || new Vector(arr[arr.length - 1], planet.pos).length > 2) {
                arr.push(planet.pos.copy());
                if (arr.length > 2000) arr.shift();
            }
        }, this);
    },

    getBaseSimulateCount() {
        var count = this.planets.length;
        if (count <= 3) return 16384;
        if (count <= 5) return 8192;
        if (count <= 8) return 4096;
        if (count <= 12) return 2048;
        if (count <= 16) return 1024;
        if (count <= 24) return 512;
        if (count <= 50) return 256;
        return 128;
    },

    updateParticles(t) {
        for (var i = 0; i < this.particles.length; ) {
            var p = this.particles[i];
            p.update(t);
            if (p.opacity <= 0) this.particles.splice(i, 1);
            else ++i;
        }
    },

    tick() {
        var timePassed = 0.001 * (Date.now() - this.lastTime);
        this.lastTime = Date.now();
        timePassed = Math.min(timePassed, 0.05);
        var worldTime = timePassed * 10;
        if (UI.mouseClick && UI.activePlanet) return;
        if (!this.planets.length) return;
        if (this.planets.length !== this.lastPlanetsCount) {
            this.simulateCount = this.getBaseSimulateCount(this.planets.length);
            this.lastPlanetsCount = this.planets.length;
        }
        var count = Math.round(this.simulateCount * this.simulateCountScale);
        count = Math.max(count, 64);
        var elapse = worldTime / count;
        var startTime = Date.now();
        while (count--) {
            this.processCollision();
            this.simulate(elapse);
        }
        this.removeEscapingPlanets();
        this.updatePlanetsOrbit();
        this.updateParticles(worldTime);
        var timeUsed = Date.now() - startTime;
        var minTime = this.tickElapse * 0.2;
        var maxTime = this.tickElapse * 0.8;
        if (timeUsed < minTime) {
            this.simulateCountScale *= 2;
        } else if (timeUsed > maxTime) {
            this.simulateCountScale /= 2;
        }
    },

    start() {
        var _this = this;
        if (this.interval !== null) return;
        this.lastTime = Date.now();
        this.interval = setInterval(function() {
            _this.tick();
        }, this.tickElapse);
    },

    pause() {
        if (this.interval === null) return;
        clearInterval(this.interval);
        this.interval = null;
    }

};
