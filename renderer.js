
class Renderer extends EventEmitter {
    
    constructor($dom) {
        super();

        this.$canvas = $dom;
        this.canvas = $dom.get(0);
        this.ctx = this.canvas.getContext('2d');

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

        UI.watchedOrbit.forEach(function(arr) {
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#9df';
            ctx.shadowBlur = 0;
            if (!arr.length) return;
            ctx.moveTo(arr[0].x, arr[0].y);
            for (var i = 1; i < arr.length; ++i) {
                ctx.lineTo(arr[i].x, arr[i].y);
            }
            ctx.stroke();
        });

        Simulator.planets.forEach(function(planet) {
            ctx.lineWidth = 2;
            if (UI.lockedPlanets.indexOf(planet) !== -1) {
                if (planet === UI.selectedPlanet) {
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
                if (planet === UI.selectedPlanet) {
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
                ctx.lineTo(planet.x + planet.v.x, planet.y + planet.v.y);
                ctx.stroke();

                ctx.strokeStyle = '#09f';
                ctx.beginPath();
                ctx.moveTo(planet.x, planet.y);
                ctx.lineTo(planet.x + planet.a.x, planet.y + planet.a.y);
                ctx.stroke();
            }
        });

        ctx.restore();
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
