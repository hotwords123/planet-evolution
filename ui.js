
var UI = Object.assign(new EventEmitter(), {

    $toolbar: $('.toolbar'),
    $header: $('.toolbar-header'),
    $canvas: $('.renderer'),

    mouseClick: false,
    mouseDrag: false,
    mouseMoved: false,
    mouseButton: null,
    mouseX: null,
    mouseY: null,

    accelerateTimer: null,

    debug: false,

    paused: false,

    hoveredPlanet: null,
    selectedPlanet: null,
    lockedPlanets: [],
    watchedPlanets: [],
    watchedOrbit: [],

    init() {
        this.registerEvents();
        this.addListeners();
        Simulator.start();
    },

    activePlanet() {
        return this.hoveredPlanet || this.selectedPlanet;
    },

    accelerate(rate) {
        var planet = this.selectedPlanet;
        if (!planet) return;
        var vec = new Vector(planet.pos, new Pos(this.worldX, this.worldY));
        var size = vec.length - planet.r;
        if (size > 0) {
            var vecNew = vec.unit.multiply(Math.max(size, 500));
            planet.v.plus_eq(vecNew.multiply(rate));
        }
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

    registerEvents() {
        this.on('mousedown', function() {
            var x = this.worldX, y = this.worldY;
            if (this.mouseButton === 'l') {
                var planet = Simulator.planetFromPos(x, y);
                if (planet) {
                    this.selectedPlanet = planet;
                }
            } else {
                if (this.selectedPlanet) {
                    this.accelerate(0.015);
                    this.accelerateTimer = setInterval(function() {
                        UI.accelerate(0.001);
                    }, 15);
                }
            }
        });
        this.on('mouseup', function() {
            var x = this.worldX, y = this.worldY;
            if (this.mouseButton === 'l') {
                if (!this.mouseMoved) {
                    var planet = Simulator.planetFromPos(x, y);
                    if (!planet) {
                        this.selectedPlanet = null;
                    }
                }
            } else {
                //
            }
            if (this.accelerateTimer) {
                clearInterval(this.accelerateTimer);
                this.accelerateTimer = null;
            }
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
                if (this.selectedPlanet) {
                    this.selectedPlanet.x += deltaX;
                    this.selectedPlanet.y += deltaY;
                } else {
                    renderer.moveCamera(deltaX, deltaY);
                }
            } else {
                //
            }
        });
        this.on('mousewheel', function(e, delta) {
            if (e.ctrlKey) {
                //
            } else {
                if (this.selectedPlanet) {
                    var planet = this.selectedPlanet;
                    if (delta > 0) {
                        planet.r = Math.min(planet.r + 1, 200);
                    } else {
                        planet.r = Math.max(planet.r - 1, 5);
                    }
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
            } else if (this.selectedPlanet) {
                Simulator.removePlanet(this.selectedPlanet);
                this.selectedPlanet = null;
            }
        });
        this.on('keydown_13', function(e) { // Enter
            if (this.worldX === null || this.worldY === null) return;
            Simulator.addPlanet({
                x: this.worldX, y: this.worldY,
                r: Math.random() * 30 + 10,
                v: new Vector(Math.random() * 50 - 25, Math.random() * 50 - 25)
            });
        });
        this.on('keydown_27', function(e) { // Esc
            if (this.selectedPlanet) {
                this.selectedPlanet = null;
            }
        });
        this.on('keydown_76', function(e) { // L
            var planet = this.activePlanet();
            if (planet) {
                var index = this.lockedPlanets.indexOf(planet);
                if (index === -1) {
                    planet.v.clear();
                    this.lockedPlanets.push(planet);
                } else {
                    this.lockedPlanets.splice(index, 1);
                }
            }
        });
        this.on('keydown_83', function(e) { // S
            var planet = this.activePlanet();
            if (planet) {
                planet.v.clear();
            }
        });
        this.on('keydown_87', function(e) { // W
            var planet = this.activePlanet();
            if (planet) {
                var index = this.watchedPlanets.indexOf(planet);
                if (index === -1) {
                    this.watchedPlanets.push(planet);
                    this.watchedOrbit.push([]);
                } else {
                    this.watchedPlanets.splice(index, 1);
                    this.watchedOrbit.splice(index, 1);
                }
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
            if (UI.mouseButton === 'l' && UI.selectedPlanet) UI.mouseDrag = true;
        });
        this.$canvas.mouseup(function(evt) {
            var e = window.event || evt;
            UI.mouseClick = false;
            UI.mouseDrag = false;
            UI.calcMouse(e);
            UI.emit('mouseup', e);
            UI.mouseButton = null;
            UI.mouseMoved = false;
        });
        this.$canvas.mousemove(function(evt) {
            var e = window.event || evt;
            UI.calcMouse(e, true);
            if (UI.mouseClick) {
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
            if (UI.debug) {
                $(this).removeClass('invert');
            } else {
                $(this).addClass('invert');
            }
            UI.debug = !UI.debug;
        });

        $(window).keydown(function(e) {
            console.log('keydown: ' + e.which);
            UI.emit('keydown_' + e.which, e);
            UI.emit('keydown', e);
        });
        $(window).keyup(function(e) {
            console.log('keyup: ' + e.which);
            UI.emit('keyup_' + e.which, e);
            UI.emit('keyup', e);
        });
    }

});

UI.init();
