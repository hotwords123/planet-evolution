
class Renderer extends EventEmitter {
    
    constructor($dom) {
        super();

        this.$canvas = $dom;
        this.canvas = $dom.get(0);
        this.ctx = this.canvas.getContext('2d');

        this.renderTime = [];

        this.width = 0;
        this.height = 0;

        this.cameraX = 0;
        this.cameraY = 0;
        
        this.registerEvents();
        this.addListeners();

        this.emit('resize');
    }

    moveCamera(x, y) {
        this.cameraX += x;
        this.cameraY += y;
    }

    get centerPos() {
        return new Pos(-this.cameraX + this.width / 2, -this.cameraY + this.height / 2);
    }

    renderTimer() {
        var _this = this;
        this.emit('render');
        window.requestAnimationFrame(function() {
            _this.renderTimer();
        });
    }

    render() {
        var ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);
        ctx.save();
        ctx.translate(this.cameraX, this.cameraY);

        Simulator.watchedPlanetsOrbit.forEach(function(arr) {
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#9df';
            ctx.shadowBlur = 0;
            if (!arr.length) return;
            ctx.beginPath();
            ctx.moveTo(arr[0].x, arr[0].y);
            for (var i = 1; i < arr.length; ++i) {
                ctx.lineTo(arr[i].x, arr[i].y);
            }
            ctx.stroke();
        });

        Simulator.planets.forEach(function(planet) {
            ctx.lineWidth = 2;
            if (Simulator.isLocked(planet)) {
                if (UI.isSelected(planet)) {
                    ctx.fillStyle = '#cdf';
                    ctx.strokeStyle = '#fff';
                    ctx.shadowColor = '#fff';
                    ctx.shadowBlur = 10;
                } else if (planet === UI.hoveredPlanet) {
                    ctx.fillStyle = '#abd';
                    ctx.strokeStyle = '#eee';
                    ctx.shadowColor = '#eee';
                    ctx.shadowBlur = 10;
                } else {
                    ctx.fillStyle = '#89b';
                    ctx.strokeStyle = '#cdf';
                    ctx.shadowColor = '#cdf';
                    ctx.shadowBlur = 8;
                }
            } else {
                if (UI.isSelected(planet)) {
                    ctx.fillStyle = '#ccc';
                    ctx.strokeStyle = '#fff';
                    ctx.shadowColor = '#fff';
                    ctx.shadowBlur = 12;
                } else if (planet === UI.hoveredPlanet) {
                    ctx.fillStyle = '#999';
                    ctx.strokeStyle = '#ccc';
                    ctx.shadowColor = '#ccc';
                    ctx.shadowBlur = 10;
                } else {
                    ctx.fillStyle = '#666';
                    ctx.strokeStyle = '#999';
                    ctx.shadowColor = '#999';
                    ctx.shadowBlur = 8;
                }
            }
            ctx.beginPath();
            ctx.arc(planet.x, planet.y, planet.r, 0, 2 * Math.PI, false);
            ctx.closePath();
            ctx.stroke();
            ctx.fill();

            if (UI.debug) {
                ctx.lineWidth = 2;
                ctx.shadowBlur = 0;

                ctx.strokeStyle = '#0f0';
                ctx.beginPath();
                ctx.moveTo(planet.x, planet.y);
                ctx.lineTo(planet.x + planet.v.x * 5, planet.y + planet.v.y * 5);
                ctx.stroke();

                ctx.strokeStyle = '#09f';
                ctx.beginPath();
                ctx.moveTo(planet.x, planet.y);
                ctx.lineTo(planet.x + planet.a.x * 25, planet.y + planet.a.y * 25);
                ctx.stroke();
            }
        });

        ctx.restore();

        if (UI.debug) {

            var info = [];

            info.push([
                'Planets:', Simulator.planets.length,
                'Locked:', Simulator.lockedPlanets.length,
                'Watching:', Simulator.watchedPlanets.length
            ].join(' '));

            var planets = UI.selectedPlanets;
            var N = planets.length;
            if (N) {
                info.push('Selected ' + (N > 1 ? 'planets' : 'planet') + ':');
                var mass = 0,
                    x = 0, y = 0,
                    v = new Vector(0, 0),
                    F = new Vector(0, 0),
                    a = new Vector(0, 0),
                    Ek = 0, Ep = 0;
                for (var i = 0; i < N; ++i) {
                    var A = planets[i];
                    mass += A.mass;
                    x += A.x * A.mass; y += A.y * A.mass;
                    v.plus_eq(A.v.multiply(A.mass));
                    F.plus_eq(A.F);
                    a.plus_eq(A.a.multiply(A.mass));
                    Ek += 0.5 * A.mass * A.v.length2;
                    for (var j = 0; j < i; ++j) {
                        var B = planets[j];
                        Ep -= Simulator.G * A.mass * B.mass / new Vector(A.pos, B.pos).length;
                    }
                }
                x /= mass; y /= mass;
                var p = v.copy();
                v.divide_eq(mass);
                a.divide_eq(mass);
                info.push('mass: ' + mass.toFixed(4));
                info.push([
                    'x:', x.toFixed(4),
                    'y:', y.toFixed(4)
                ].join(' '));
                info.push([
                    'v<sub>C</sub>:', v.length.toFixed(4),
                    'v<sub>Cx</sub>:', v.x.toFixed(4),
                    'v<sub>Cy</sub>:', v.y.toFixed(4)
                ].join(' '));
                info.push([
                    'F:', F.length.toFixed(4),
                    'F<sub>x</sub>:', F.x.toFixed(4),
                    'F<sub>y</sub>:', F.y.toFixed(4)
                ].join(' '));
                info.push([
                    'a<sub>C</sub>:', a.length.toFixed(4),
                    'a<sub>Cx</sub>:', a.x.toFixed(4),
                    'a<sub>Cy</sub>:', a.y.toFixed(4)
                ].join(' '));
                info.push([
                    'p:', p.length.toFixed(4),
                    'p<sub>x</sub>:', p.x.toFixed(4),
                    'p<sub>y</sub>:', p.y.toFixed(4)
                ].join(' '));
                info.push('E: ' + (Ek + Ep).toFixed(4));
                info.push('E<sub>k</sub>: ' + Ek.toFixed(4));
                info.push('E<sub>p</sub>: ' + Ep.toFixed(4));
            }

            var planet = UI.hoveredPlanet;
            if (planet) {
                info.push('Hovered planet:');
                info.push('mass: ' + planet.mass.toFixed(4));
                info.push([
                    'x:', planet.x.toFixed(4),
                    'y:', planet.y.toFixed(4)
                ].join(' '));
                info.push([
                    'v:', planet.v.length.toFixed(4),
                    'v<sub>x</sub>:', planet.v.x.toFixed(4),
                    'v<sub>y</sub>:', planet.v.y.toFixed(4)
                ].join(' '));
                info.push([
                    'F:', planet.F.length.toFixed(4),
                    'F<sub>x</sub>:', planet.F.x.toFixed(4),
                    'F<sub>y</sub>:', planet.F.y.toFixed(4)
                ].join(' '));
                info.push([
                    'a:', planet.a.length.toFixed(4),
                    'a<sub>x</sub>:', planet.a.x.toFixed(4),
                    'a<sub>y</sub>:', planet.a.y.toFixed(4)
                ].join(' '));
                info.push('radius: ' + (planet.v.length2 / planet.a.length).toFixed(4));
                var p = planet.v.multiply(planet.mass);
                info.push([
                    'p:', p.length.toFixed(4),
                    'p<sub>x</sub>:', p.x.toFixed(4),
                    'p<sub>y</sub>:', p.y.toFixed(4)
                ].join(' '));
                var Ek = planet.v.length2 * planet.mass * 0.5;
                info.push('E<sub>k</sub>: ' + Ek.toFixed(4));
            }

            $('.debug-info').html(info.join('<br>'));
        }

        this.renderTime.unshift(Date.now());
        if (this.renderTime.length > 30) {
            $('.fps').text('FPS: ' + (30 * 1000 / (this.renderTime[0] - this.renderTime[30])).toFixed(0));
            this.renderTime.splice(25);
        }
    }

    registerEvents() {
        this.on('resize', function() {
            this.width = window.innerWidth;
            this.height = window.innerHeight;
            this.canvas.width = this.width;
            this.canvas.height = this.height;
            this.emit('render');
        });
        this.on('render', this.render);
    }

    addListeners() {
        var _this = this;
        window.addEventListener('resize', function() {
            _this.emit('resize');
        }, false);
    }

}

var renderer = new Renderer($("canvas.renderer"));

renderer.renderTimer();
