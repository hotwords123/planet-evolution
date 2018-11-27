
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

        var refInfo = Simulator.getReferenceInfo();

        Simulator.watchedPlanetsOrbit.forEach(function(orbit) {
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#9df';
            ctx.shadowBlur = 0;
            if (!orbit.last) return;
            var pos = orbit.last.copy();
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
            for (var i = orbit.delta.length - 1; i >= 0; --i) {
                pos.minus_eq(orbit.delta[i]);
                ctx.lineTo(pos.x, pos.y);
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

                var v_ = planet.v.minus(refInfo.v);
                var a_ = planet.a.minus(refInfo.a);

                ctx.lineWidth = 2;
                ctx.shadowBlur = 0;

                ctx.strokeStyle = '#0f0';
                ctx.beginPath();
                ctx.moveTo(planet.x, planet.y);
                ctx.lineTo(planet.x + v_.x * 3, planet.y + v_.y * 3);
                ctx.stroke();

                ctx.strokeStyle = '#09f';
                ctx.beginPath();
                ctx.moveTo(planet.x, planet.y);
                ctx.lineTo(planet.x + a_.x * 9, planet.y + a_.y * 9);
                ctx.stroke();
            }
        });

        if (UI.debug && UI.selectedPlanets.length > 1) {

            var mass = 0,
                x = 0, y = 0,
                mv = new Vector(0, 0),
                ma = new Vector(0, 0);
            
            UI.selectedPlanets.forEach(function(planet) {
                mass += planet.mass;
                x += planet.mass * planet.x;
                y += planet.mass * planet.y;
                mv.plus_eq(planet.v.multiply(planet.mass));
                ma.plus_eq(planet.a.multiply(planet.mass));
            });

            x /= mass; y /= mass;
            var v_ = mv.divide(mass).minus(refInfo.v);
            var a_ = ma.divide(mass).minus(refInfo.a);

            ctx.fillStyle = '#ffffaa66';
            ctx.shadowBlur = 0;

            ctx.beginPath();
            ctx.arc(x, y, Simulator.calcRadius(mass), 0, 2 * Math.PI, false);
            ctx.fill();

            ctx.strokeStyle = '#0f0';
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + v_.x * 3, y + v_.y * 3);
            ctx.stroke();

            ctx.strokeStyle = '#09f';
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + a_.x * 9, y + a_.y * 9);
            ctx.stroke();
        }

        Simulator.particles.forEach(function(particle) {
            ctx.lineWidth = 0;
            ctx.fillStyle = 'rgba(192, 192, 192, ' + particle.opacity + ')';
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.r, 0, 2 * Math.PI, false);
            ctx.fill();
        });

        ctx.restore();

        if (UI.mousePos) {
            var pos = this.toWorldPos(UI.mousePos);
            $('.info.camera').text([
                'X:', pos.x.toFixed(0),
                'Y:', pos.y.toFixed(0),
                'Scale:', (this.scale * 100).toFixed(0) + '%'
            ].join(' '));
        } else {
            $('.info.camera').text('Scale: ' + (this.scale * 100).toFixed(0) + '%');
        }

        if (UI.debug) {

            var info = new DebugInfo();

            info.title([
                'Planets:', Simulator.planets.length,
                'Locked:', Simulator.lockedPlanets.length,
                'Watching:', Simulator.watchedPlanets.length
            ].join(' '));

            info.newBlock('Reference System');
            info.lines([
                [
                    'v:', refInfo.v.length.toFixed(4),
                    'v<sub>x</sub>:', refInfo.v.x.toFixed(4),
                    'v<sub>y</sub>:', refInfo.v.y.toFixed(4)
                ].join(' '),
                [
                    'a:', refInfo.a.length.toFixed(4),
                    'a<sub>x</sub>:', refInfo.a.x.toFixed(4),
                    'a<sub>y</sub>:', refInfo.a.y.toFixed(4)
                ].join(' ')
            ]);

            if (Simulator.planets.length > UI.selectedPlanets.length) {

                info.newBlock('All Planets');

                var planets = Simulator.planets;
                var mass = 0,
                    x = 0, y = 0,
                    p = new Vector(0, 0),
                    Ek = 0, Ep = 0;

                for (var i = 0; i < planets.length; ++i) {
                    var A = planets[i];
                    var v_ = A.v.minus(refInfo.v);
                    mass += A.mass;
                    x += A.x * A.mass; y += A.y * A.mass;
                    p.plus_eq(v_.multiply(A.mass));
                    Ek += 0.5 * A.mass * v_.length2;
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
                    var v_ = A.v.minus(refInfo.v);
                    var F_ = A.F.minus(refInfo.a.multiply(A.mass));
                    var a_ = A.a.minus(refInfo.a);
                    mass += A.mass;
                    x += A.x * A.mass; y += A.y * A.mass;
                    p.plus_eq(v_.multiply(A.mass));
                    F.plus_eq(F_);
                    a.plus_eq(a_.multiply(A.mass));
                    Ek += 0.5 * A.mass * v_.length2;
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
                    info.line([
                        'distance:', vec.length.toFixed(4),
                        'X:', vec.x.toFixed(4),
                        'Y:', vec.y.toFixed(4)
                    ].join(' '));
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
                    ].join(' '),
                    'r<sub>C</sub>: ' + (v.length2 / a.length).toFixed(4)
                ]);
            }

            var planet = UI.hoveredPlanet;
            if (planet && Simulator.planets.length > 1 && !(UI.selectedPlanets.length === 1 && UI.selectedPlanets[0] === planet)) {
                info.newBlock('Hovered Planet');
                var v_ = planet.v.minus(refInfo.v);
                var F_ = planet.F.minus(refInfo.a.multiply(planet.mass));
                var a_ = planet.a.minus(refInfo.a);
                var p = v_.multiply(planet.mass);
                var Ek = v_.length2 * planet.mass * 0.5;
                info.lines([
                    'mass: ' + planet.mass.toFixed(4),
                    [
                        'x:', planet.x.toFixed(4),
                        'y:', planet.y.toFixed(4)
                    ].join(' '),
                    [
                        'v:', v_.length.toFixed(4),
                        'v<sub>x</sub>:', v_.x.toFixed(4),
                        'v<sub>y</sub>:', v_.y.toFixed(4)
                    ].join(' '),
                    [
                        'p:', p.length.toFixed(4),
                        'p<sub>x</sub>:', p.x.toFixed(4),
                        'p<sub>y</sub>:', p.y.toFixed(4)
                    ].join(' '),
                    [
                        'F:', F_.length.toFixed(4),
                        'F<sub>x</sub>:', F_.x.toFixed(4),
                        'F<sub>y</sub>:', F_.y.toFixed(4)
                    ].join(' '),
                    [
                        'a:', a_.length.toFixed(4),
                        'a<sub>x</sub>:', a_.x.toFixed(4),
                        'a<sub>y</sub>:', a_.y.toFixed(4)
                    ].join(' '),
                    'E<sub>k</sub>: ' + Ek.toFixed(4),
                    'r: ' + (v_.length2 / a_.length).toFixed(4)
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
