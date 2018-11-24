
class Renderer extends EventEmitter {
    
    constructor($dom) {
        super();

        this.$canvas = $dom;
        this.canvas = $dom.get(0);
        this.ctx = this.canvas.getContext('2d');

        this.renderTime = [];

        this.width = 0;
        this.height = 0;

        this.offsetX = 0;
        this.offsetY = 0;
        this.scale = 1.0;
        
        this.registerEvents();
        this.addListeners();

        this.emit('resize');
    }

    toWorldPos(pos) {
        return new Pos(
            this.offsetX + pos.x / this.scale,
            this.offsetY + pos.y / this.scale
        );
    }

    fromWorldPos(pos) {
        return new Pos(
            (pos.x - this.offsetX) * this.scale,
            (pos.y - this.offsetY) * this.scale
        );
    }

    moveCamera(x, y) {
        this.offsetX += x;
        this.offsetY += y;
    }

    scaleCamera(z, c) {
        var oldScale = this.scale;
        this.scale *= z;
        var temp = 1 / oldScale - 1 / this.scale;
        this.offsetX += c.x * temp;
        this.offsetY += c.y * temp;
    }

    get screenCenterPos() {
        return new Pos(this.width / 2, this.height / 2);
    }

    get centerPos() {
        return this.toWorldPos(this.screenCenterPos);
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
        ctx.scale(this.scale, this.scale);
        ctx.translate(-this.offsetX, -this.offsetY);

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
                ctx.lineTo(planet.x + planet.v.x * 3, planet.y + planet.v.y * 3);
                ctx.stroke();

                ctx.strokeStyle = '#09f';
                ctx.beginPath();
                ctx.moveTo(planet.x, planet.y);
                ctx.lineTo(planet.x + planet.a.x * 9, planet.y + planet.a.y * 9);
                ctx.stroke();
            }
        });

        Simulator.particles.forEach(function(particle) {
            ctx.lineWidth = 0;
            ctx.fillStyle = 'rgba(192, 192, 192, ' + particle.opacity + ')';
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.r, 0, 2 * Math.PI, false);
            ctx.fill();
        });

        ctx.restore();

        $('.info.scale').text('Scale: ' + (this.scale * 100).toFixed(0) + '%');

        if (UI.debug) {

            var info = new DebugInfo();

            info.title([
                'Planets:', Simulator.planets.length,
                'Locked:', Simulator.lockedPlanets.length,
                'Watching:', Simulator.watchedPlanets.length
            ].join(' '));

            if (Simulator.planets.length > UI.selectedPlanets.length) {

                info.newBlock('All Planets');

                var planets = Simulator.planets;
                var mass = 0,
                    x = 0, y = 0,
                    p = new Vector(0, 0),
                    Ek = 0, Ep = 0;

                for (var i = 0; i < planets.length; ++i) {
                    var A = planets[i];
                    mass += A.mass;
                    x += A.x * A.mass; y += A.y * A.mass;
                    p.plus_eq(A.v.multiply(A.mass));
                    Ek += 0.5 * A.mass * A.v.length2;
                    for (var j = 0; j < i; ++j) {
                        var B = planets[j];
                        Ep -= Simulator.G * A.mass * B.mass / new Vector(A.pos, B.pos).length;
                    }
                }

                x /= mass; y /= mass;
                var v = p.divide(mass);

                info.lines([
                    'mass: ' + mass.toFixed(4),
                    [
                        'x<sub>C</sub>:', x.toFixed(4),
                        'y<sub>C</sub>:', y.toFixed(4)
                    ].join(' '),
                    [
                        'v<sub>C</sub>:', v.length.toFixed(4),
                        'v<sub>Cx</sub>:', v.x.toFixed(4),
                        'v<sub>Cy</sub>:', v.y.toFixed(4)
                    ].join(' '),
                    [
                        'p:', p.length.toFixed(4),
                        'p<sub>x</sub>:', p.x.toFixed(4),
                        'p<sub>y</sub>:', p.y.toFixed(4)
                    ].join(' '),
                    'E: ' + (Ek + Ep).toFixed(4),
                    [
                        'E<sub>k</sub>:', Ek.toFixed(4),
                        'E<sub>p</sub>:', Ep.toFixed(4)
                    ].join(' ')
                ]);
            }

            if (UI.selectedPlanets.length) {
                var planets = UI.selectedPlanets;
                info.newBlock([
                    'Selected ', planets.length > 1 ? 'Planets' : 'Planet',
                    ' (', planets.length === Simulator.planets.length ? 'all' : planets.length, ')'
                ].join(''));
                var mass = 0,
                    x = 0, y = 0,
                    p = new Vector(0, 0),
                    F = new Vector(0, 0),
                    a = new Vector(0, 0),
                    Ek = 0, Ep = 0;
                for (var i = 0; i < planets.length; ++i) {
                    var A = planets[i];
                    mass += A.mass;
                    x += A.x * A.mass; y += A.y * A.mass;
                    p.plus_eq(A.v.multiply(A.mass));
                    F.plus_eq(A.F);
                    a.plus_eq(A.a.multiply(A.mass));
                    Ek += 0.5 * A.mass * A.v.length2;
                    for (var j = 0; j < i; ++j) {
                        var B = planets[j];
                        Ep -= Simulator.G * A.mass * B.mass / new Vector(A.pos, B.pos).length;
                    }
                }
                x /= mass; y /= mass;
                var v = p.divide(mass);
                a.divide_eq(mass);
                if (planets.length === 2) {
                    var vec = new Vector(planets[0].pos, planets[1].pos);
                    info.lines([
                        'distance: ' + vec.length.toFixed(4),
                        'deltaX: ' + vec.x.toFixed(4) + ' deltaY: ' + vec.y.toFixed(4)
                    ]);
                }
                info.lines([
                    'mass: ' + mass.toFixed(4),
                    [
                        'x<sub>C</sub>:', x.toFixed(4),
                        'y<sub>C</sub>:', y.toFixed(4)
                    ].join(' '),
                    [
                        'v<sub>C</sub>:', v.length.toFixed(4),
                        'v<sub>Cx</sub>:', v.x.toFixed(4),
                        'v<sub>Cy</sub>:', v.y.toFixed(4)
                    ].join(' '),
                    [
                        'p:', p.length.toFixed(4),
                        'p<sub>x</sub>:', p.x.toFixed(4),
                        'p<sub>y</sub>:', p.y.toFixed(4)
                    ].join(' '),
                    [
                        'F:', F.length.toFixed(4),
                        'F<sub>x</sub>:', F.x.toFixed(4),
                        'F<sub>y</sub>:', F.y.toFixed(4)
                    ].join(' '),
                    [
                        'a<sub>C</sub>:', a.length.toFixed(4),
                        'a<sub>Cx</sub>:', a.x.toFixed(4),
                        'a<sub>Cy</sub>:', a.y.toFixed(4)
                    ].join(' '),
                    'E: ' +  (Ek + Ep).toFixed(4),
                    [
                        'E<sub>k</sub>:', Ek.toFixed(4),
                        'E<sub>p</sub>:', Ep.toFixed(4)
                    ].join(' ')
                ]);
            }

            var planet = UI.hoveredPlanet;
            if (planet && Simulator.planets.length > 1 && !(UI.selectedPlanets.length === 1 && UI.selectedPlanets[0] === planet)) {
                info.newBlock('Hovered Planet');
                var p = planet.v.multiply(planet.mass);
                var Ek = planet.v.length2 * planet.mass * 0.5;
                info.lines([
                    'mass: ' + planet.mass.toFixed(4),
                    [
                        'x:', planet.x.toFixed(4),
                        'y:', planet.y.toFixed(4)
                    ].join(' '),
                    [
                        'v:', planet.v.length.toFixed(4),
                        'v<sub>x</sub>:', planet.v.x.toFixed(4),
                        'v<sub>y</sub>:', planet.v.y.toFixed(4)
                    ].join(' '),
                    [
                        'p:', p.length.toFixed(4),
                        'p<sub>x</sub>:', p.x.toFixed(4),
                        'p<sub>y</sub>:', p.y.toFixed(4)
                    ].join(' '),
                    [
                        'F:', planet.F.length.toFixed(4),
                        'F<sub>x</sub>:', planet.F.x.toFixed(4),
                        'F<sub>y</sub>:', planet.F.y.toFixed(4)
                    ].join(' '),
                    [
                        'a:', planet.a.length.toFixed(4),
                        'a<sub>x</sub>:', planet.a.x.toFixed(4),
                        'a<sub>y</sub>:', planet.a.y.toFixed(4)
                    ].join(' '),
                    'radius: ' + (planet.v.length2 / planet.a.length).toFixed(4),
                    'E<sub>k</sub>: ' + Ek.toFixed(4)
                ]);
            }

            $('.info.debug').html(info.toHTML());
        }

        this.renderTime.unshift(Date.now());
        if (this.renderTime.length > 30) {
            $('.info.fps').text('FPS: ' + (30 * 1000 / (this.renderTime[0] - this.renderTime[30])).toFixed(0));
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

class DebugInfo {
    constructor() {
        this.clear();
    }
    get lastBlock() {
        return this.blocks[this.blocks.length - 1];
    }
    set lastBlock(a) {
        this.blocks[this.blocks.length - 1] = a;
    }
    clear() {
        this.blocks = [''];
    }
    newBlock(title) {
        this.blocks.push('');
        if (title) this.title(title);
    }
    insert(html) {
        this.lastBlock += html;
    }
    title(html) {
        this.lastBlock += '<div class="debug-info-title">' + html + '</div>';
    }
    line(html) {
        this.lastBlock += '<div>' + html + '</div>';
    }
    lines(arr) {
        arr.forEach(function(a) {
            this.line(a);
        }, this);
    }
    toHTML() {
        return this.blocks.join('<div class="debug-info-sep"></div>');
    }
}

var renderer = new Renderer($("canvas.renderer"));

renderer.renderTimer();
