
var StorageManager = {

    VERSION: '1.1',
    STORAGE_KEY_SAVE: 'planet_evolution_save',
    STORAGE_KEY_OPTIONS: 'planet_evolution_options',

    makeSaveData() {
        var data = {};

        data.version = this.VERSION;

        data.camera = {
            x: renderer.offsetX,
            y: renderer.offsetY,
            scale: renderer.scale
        };

        data.planets = {};
        data.planets.list = Simulator.planets.map(function(planet) {
            return planet.toJSON();
        });
        data.planets.selected = UI.selectedPlanets.map(function(planet) {
            return Simulator.planets.indexOf(planet);
        });
        data.planets.locked = Simulator.lockedPlanets.map(function(planet) {
            return Simulator.planets.indexOf(planet);
        });
        data.planets.watched = Simulator.watchedPlanets.map(function(planet) {
            return Simulator.planets.indexOf(planet);
        });
        data.planets.orbit = Simulator.watchedPlanetsOrbit.map(function(orbit) {
            return orbit.toJSON();
        });
        if (Simulator.referencePlanets) {
            data.reference = {};
            data.reference.indexes = Simulator.referencePlanets.map(function(planet) {
                return Simulator.planets.indexOf(planet);
            });
            data.reference.pos = Simulator.referencePlanetsPos.toJSON();
            data.reference.changeReferenceSystem = Simulator.changeReferenceSystem;
        } else {
            data.reference = null;
        }

        data.particles = Simulator.particles.map(function(particle) {
            return particle.toJSON();
        });

        return data;
    },

    getSavedData() {
        try {
            return JSON.parse(window.localStorage.getItem(this.STORAGE_KEY_SAVE));
        } catch (err) {
            return null;
        }
    },

    cleanup() {
        Simulator.clearPlanets();
        Simulator.particles = [];
        
        renderer.offsetX = 0;
        renderer.offsetY = 0;
        renderer.scale = 1;
    },

    load(data) {
        if (data.version !== this.VERSION) {
            switch (data.version) {
                case '1.0': {
                    var arr = data.planets.orbit;
                    for (var i = 0; i < arr.length; ++i) {
                        arr[i] = new PlanetOrbit().toJSON();
                    }
                    break;
                }
                default: {
                    if (!confirm([
                        "The version of the save does not match the current version.",
                        "It may not work properly.",
                        "Continue to load anyway?"
                    ].join('\n'))) {
                        return;
                    }
                }
            }
        }

        this.cleanup();
        
        renderer.offsetX = data.camera.x;
        renderer.offsetY = data.camera.y;
        renderer.scale = data.camera.scale;

        Simulator.planets = data.planets.list.map(function(o) {
            return Planet.fromJSON(o);
        });
        UI.selectedPlanets = data.planets.selected.map(function(i) {
            return Simulator.planets[i];
        });
        Simulator.lockedPlanets = data.planets.locked.map(function(i) {
            return Simulator.planets[i];
        });
        Simulator.watchedPlanets = data.planets.watched.map(function(i) {
            return Simulator.planets[i];
        });
        Simulator.watchedPlanetsOrbit = data.planets.orbit.map(function(o) {
            return PlanetOrbit.fromJSON(o);
        });
        if (data.reference) {
            Simulator.referencePlanets = data.reference.indexes.map(function(i) {
                return Simulator.planets[i];
            });
            Simulator.referencePlanetsPos = Pos.fromJSON(data.reference.pos);
            Simulator.changeReferenceSystem = data.reference.changeReferenceSystem;
        }

        Simulator.particles = data.particles.map(function(o) {
            return Particle.fromJSON(o);
        });
    },

    save() {
        try {
            var data = this.makeSaveData();
            window.localStorage.setItem(this.STORAGE_KEY_SAVE, JSON.stringify(data));
            return true;
        } catch (err) {
            console.warn('Failed to save data.');
            console.error(err);
            return false;
        }
    },

    restore() {
        var data = this.getSavedData();
        if (data) {
            try {
                this.load(data);
                return true;
            } catch (err) {
                console.warn('Failed to restore data.');
                console.error(err);
                this.cleanup();
                return false;
            }
        }
    },

    loadOptions() {
        var data;
        try {
            data = JSON.parse(window.localStorage.getItem(this.STORAGE_KEY_OPTIONS));
        } catch (err) {}
        if (data === null || typeof data !== 'object') {
            data = {};
        }
        data = Object.assign({
            paused: false,
            debug: false,
            autoSave: true
        }, data);
        return data;
    },

    applyOptions(data) {
        if (data.paused !== UI.paused) {
            UI.togglePaused();
        }
        if (data.debug !== UI.debug) {
            UI.toggleDebug();
        }
        if (data.autoSave !== UI.autoSave) {
            UI.toggleAutoSave();
        }
    },

    saveOptions() {
        var data = {
            paused: UI.paused,
            debug: UI.debug,
            autoSave: UI.autoSave
        };
        try {
            window.localStorage.setItem(this.STORAGE_KEY_OPTIONS, JSON.stringify(data));
            return true;
        } catch (err) {
            return false;
        }
    }
};

StorageManager.restore();

StorageManager.applyOptions(StorageManager.loadOptions());
