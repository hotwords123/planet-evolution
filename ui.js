
var UI = Object.assign(new EventEmitter(), {

    $toolbar: $('.toolbar'),
    $header: $('.toolbar-header'),
    $canvas: $('.renderer'),

    mouseX: null,
    mouseY: null,
    mouseClick: false,
    mouseMoved: false,
    mouseButton: null,

    accelerateTimer: null,

    debug: false,

    paused: false,

    hoveredPlanet: null,
    activePlanet: null,
    selectedPlanets: [],
    planetAdded: false,

    init() {
        this.registerEvents();
        this.addListeners();
        Simulator.start();
    },

    isSelected(planet) {
        return this.selectedPlanets.indexOf(planet) !== -1;
    },

    activePlanets() {
        if (this.hoveredPlanet && !this.isSelected(this.hoveredPlanet)) {
            return [this.hoveredPlanet];
        }
        return this.selectedPlanets.slice(0);
    },

    accelerate(rate) {
        var mass = 0, x = 0, y = 0;
        this.selectedPlanets.forEach(function(planet) {
            mass += planet.mass;
            x += planet.x * planet.mass;
            y += planet.y * planet.mass;
        });
        var C = new Pos(x / mass, y / mass);
        var vec = new Vector(C, new Pos(this.worldX, this.worldY));
        var dv = vec.unit.multiply(vec.length * rate);
        this.selectedPlanets.forEach(function(planet) {
            planet.v.plus_eq(dv);
        });
    },

    togglePaused() {
        if (this.paused) {
            Simulator.start();
            $('.btn-pause').text("Pause");
        } else {
            Simulator.pause();
            $('.btn-pause').text("Resume");
        }
        this.paused = !this.paused;
    },

    toggleDebug() {
        if (this.debug) {
            $('.btn-debug').removeClass('invert');
            $('.debug-info').hide();
        } else {
            $('.btn-debug').addClass('invert');
            $('.debug-info').show();
        }
        this.debug = !this.debug;
    },

    registerEvents() {
        this.on('mousedown', function(e) {
            var x = this.worldX, y = this.worldY;
            this.activePlanet = null;
            this.planetAdded = false;
            if (e.button === 0) {
                var planet = Simulator.planetFromPos(x, y);
                if (planet) {
                    this.activePlanet = planet;
                    var index = this.selectedPlanets.indexOf(planet);
                    if (index === -1) {
                        if (!e.ctrlKey) {
                            this.selectedPlanets = [];
                        }
                        this.planetAdded = true;
                        this.selectedPlanets.push(planet);
                    }
                }
            } else {
                if (this.selectedPlanets.length) {
                    this.accelerate(0.0001);
                    this.accelerateTimer = setInterval(function() {
                        UI.accelerate(0.0005);
                    }, 15);
                }
            }
        });
        this.on('mouseup', function(e) {
            var x = this.worldX, y = this.worldY;
            if (e.button === 0) {
                if (!this.mouseMoved) {
                    var planet = this.activePlanet;
                    if (planet) {
                        if (!this.planetAdded) {
                            if (e.ctrlKey) {
                                var index = this.selectedPlanets.indexOf(planet);
                                if (index !== -1) {
                                    this.selectedPlanets.splice(index, 1);
                                }
                            } else {
                                this.selectedPlanets = [planet];
                            }
                        }
                    } else {
                        if (!e.ctrlKey) {
                            this.selectedPlanets = [];
                        }
                    }
                }
            } else {
                //
            }
            if (this.accelerateTimer) {
                clearInterval(this.accelerateTimer);
                this.accelerateTimer = null;
            }
            this.activePlanet = null;
        });
        this.on('mousemove', function() {
            var x = this.worldX, y = this.worldY;
            var deltaX = this.deltaX, deltaY = this.deltaY;
            var planet = Simulator.planetFromPos(x, y);
            if (planet) {
                this.hoveredPlanet = planet;
            } else {
                this.hoveredPlanet = null;
            }
        });
        this.on('mousedrag', function() {
            var x = this.worldX, y = this.worldY;
            var deltaX = this.deltaX, deltaY = this.deltaY;
            if (this.mouseButton === 'l') {
                if (this.activePlanet) {
                    this.selectedPlanets.forEach(function(planet) {
                        planet.x += deltaX;
                        planet.y += deltaY;
                    });
                } else {
                    renderer.moveCamera(deltaX, deltaY);
                }
            } else {
                //
            }
        });
        this.on('mousewheel', function(e, wheelDelta) {
            if (e.ctrlKey) {
                //e.preventDefault();
            } else {
                if (this.selectedPlanets.length) {
                    this.selectedPlanets.forEach(function(planet) {
                        var delta = e.shiftKey ? 0.05 : 1;
                        if (wheelDelta < 0) {
                            delta = -delta;
                        }
                        var temp = Math.min(200, Math.max(0.1, planet.mass + delta));
                        planet.mass = temp;
                        planet.r = Simulator.calcRadius(temp);
                    });
                }
            }
        });
        
        this.on('keydown_32', function(e) { // Space
            this.togglePaused();
        });
        this.on('keydown_46', function(e) { // Delete
            if (this.hoveredPlanet) {
                Simulator.removePlanet(this.hoveredPlanet);
                this.hoveredPlanet = null;
            } else if (this.selectedPlanets.length) {
                var arr = this.selectedPlanets.slice(0);
                arr.forEach(function(planet) {
                    Simulator.removePlanet(planet);
                });
            }
        });
        this.on('keydown_13', function(e) { // Enter
            if (this.worldX === null || this.worldY === null) return;
            var mass = Math.random() * 48 + 2;
            Simulator.addPlanet({
                x: this.worldX,
                y: this.worldY,
                m: mass,
                r: Simulator.calcRadius(mass),
                v: new Vector(Math.random() * 10 - 5, Math.random() * 10 - 5)
            });
        });
        this.on('keydown_27', function(e) { // Esc
            if (this.selectedPlanets.length) {
                this.selectedPlanets = [];
            }
        });
        this.on('keydown_65', function(e) { // A
            if (e.ctrlKey) {
                e.preventDefault();
                this.selectedPlanets = Simulator.planets.slice(0);
                this.planetAdded = true;
            }
        });
        this.on('keydown_76', function(e) { // L
            var planets = this.activePlanets();
            if (planets.length) {
                var flag = false;
                for (var i = 0; i < planets.length; ++i) {
                    if (!Simulator.isLocked(planets[i])) {
                        flag = true; break;
                    }
                }
                planets.forEach(function(planet) {
                    Simulator.setLocked(planet, flag);
                });
            }
        });
        this.on('keydown_83', function(e) { // S
            this.activePlanets().forEach(function(planet) {
                planet.v.clear();
            });
        });
        this.on('keydown_87', function(e) { // W
            var planets = this.activePlanets();
            if (planets.length) {
                var flag = false;
                for (var i = 0; i < planets.length; ++i) {
                    if (!Simulator.isWatched(planets[i])) {
                        flag = true; break;
                    }
                }
                planets.forEach(function(planet) {
                    Simulator.setWatched(planet, flag);
                });
            }
        });
        this.on('keydown_67', function(e) { // C
            var planets = this.activePlanets();
            if (!planets.length) {
                var arr = Simulator.watchedPlanetsOrbit;
                for (var i = 0; i < arr.length; ++i) {
                    arr[i] = [];
                }
            } else {
                planets.forEach(function(planet) {
                    var index = Simulator.watchedPlanets.indexOf(planet);
                    if (index !== -1) {
                        Simulator.watchedPlanetsOrbit[index] = [];
                    }
                });
            }
        });
    },

    calcMouse(e, move) {
        if (move) {
            if (this.mouseX === null || this.mouseY === null) {
                this.deltaX = 0; this.deltaY = 0;
            } else {
                this.deltaX = e.clientX - this.mouseX;
                this.deltaY = e.clientY - this.mouseY;
            }
        }
        this.mouseX = e.clientX;
        this.mouseY = e.clientY;
        this.worldX = this.mouseX - renderer.cameraX;
        this.worldY = this.mouseY - renderer.cameraY;
    },

    addListeners() {
        this.$header.on('click', '.button[data-mode]', function() {
            var $this = $(this);
            UI.setMode($this.attr('data-mode'));
        });

        this.$canvas.mousedown(function(evt) {
            var e = window.event || evt;
            UI.mouseClick = true;
            UI.mouseMoved = false;
            UI.mouseButton = e.button === 0 ? 'l' : 'r';
            UI.calcMouse(e);
            UI.emit('mousedown', e);
        });
        this.$canvas.mouseup(function(evt) {
            var e = window.event || evt;
            UI.mouseClick = false;
            UI.calcMouse(e);
            UI.emit('mouseup', e);
            UI.mouseButton = null;
            UI.mouseMoved = false;
        });
        this.$canvas.mousemove(function(evt) {
            var e = window.event || evt;
            UI.calcMouse(e, true);
            if (UI.mouseClick) {
                e.preventDefault();
                UI.mouseMoved = true;
                UI.emit('mousedrag', e);
            } else {
                UI.emit('mousemove', e);
            }
        });

        this.$canvas.on('mousewheel', function(evt) {
            var e = window.event || evt;
            UI.emit('mousewheel', e, typeof e.wheelDelta === 'undefined' ? e.detail : e.wheelDelta);
        });

        this.$canvas.contextmenu(function(e) {
            e.preventDefault();
        });

        $('.btn-pause').click(function() {
            UI.togglePaused();
        });
        $('.btn-clear').click(function() {
            Simulator.clearPlanets();
        });
        $('.btn-debug').click(function() {
            UI.toggleDebug();
        });

        $(window).keydown(function(e) {
            //console.log('keydown: ' + e.which);
            UI.emit('keydown_' + e.which, e);
            UI.emit('keydown', e);
        });
        $(window).keyup(function(e) {
            //console.log('keyup: ' + e.which);
            UI.emit('keyup_' + e.which, e);
            UI.emit('keyup', e);
        });
    }

});

UI.init();
