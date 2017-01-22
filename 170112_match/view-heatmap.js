var App = (function () {
    function App() {
    }
    App.prototype.on_data_load = function (param) {
        var _this = this;
        if (param === void 0) { param = 'source-over'; }
        var time0 = +new Date();
        var scheme_e = ColorScheme.from_uniform_steps([
            'rgb(0, 0, 0)', 'rgb(0, 0, 255)', 'rgb(0, 255, 255)',
            'rgb(0, 255, 0)', 'rgb(255, 255, 0)', 'rgb(255, 0, 0)',
            'rgb(255, 255, 255)'], 500);
        var scheme = ColorScheme.from_uniform_steps(['white', 'black'], 500);
        var iter_fitness = new FitnessShapeIterator(this.dao, [1], [0, 70 * 60 * 100], [this.dao.cmd_players('H')[0]]);
        var ratio = this.dao.field_width / this.dao.field_height;
        var h1 = 500, w1 = Math.round(h1 * ratio), m1 = w1 / this.dao.field_width;
        var adapter = function (_a) {
            var x = _a[0], y = _a[1];
            return [
                y * w1 / _this.dao.field_width,
                x * h1 / _this.dao.field_height,
            ];
        };
        var buf1 = new Uint16DrawBuffer(w1, h1, 20)
            .feed_shape_iterator(adapter, iter_fitness);
        var h2 = 500, w2 = Math.round(h2 * ratio), m2 = w2 / this.dao.field_width;
        var buf2 = new GaussConvolutionBuffer(buf1).blur(0, 4);
        var quant = new QuantBuffer(buf2, 7, 255);
        var contour = new EdgeDetector(quant);
        var iter_events = iter_fitness.events(this.dao.event_names.map(function (v, i) { return i; }));
        var h3 = 500, w3 = Math.round(h3 * ratio), m3 = w3 / this.dao.field_width;
        var adapter_e = function (_a) {
            var x = _a[0], y = _a[1];
            return [
                y * w3 / _this.dao.field_width,
                x * h3 / _this.dao.field_height,
            ];
        };
        var buf1e = new Uint16DrawBuffer(w3, h3, 1)
            .feed_shape_iterator(adapter_e, iter_events);
        var circles_e = new GroupPoints(3)
            .feed_shape_iterator(adapter_e, iter_events);
        console.log(iter_events, circles_e);
        var r_e = 15, b_e = 0.6;
        var buf2e = new GaussConvolutionBuffer(buf1e).blur(Math.round(r_e / 2), 4);
        var quant_e = new QuantBuffer(buf2e, 0, 7);
        var contour_e = new EdgeDetector(quant_e);
        var composition = new CompositionCanvas(this.canvas)
            .resize(w2, h2)
            .fill(function () { return [240, 255, 240]; })
            .draw_field(m2, 'rgb(0, 127, 0)', 1)
            .blend_alpha_buffer(quant, function (val, x, y) {
            var val_e = quant_e.at(x, y);
            var t1 = Math.pow(val / quant.levels, 1 / 2.2);
            var t2 = val_e / quant_e.levels;
            return [
                scheme.at(t1),
                1 - t1];
        })
            .blend_alpha_buffer(quant_e, function (val, x, y) {
            val /= quant_e.levels;
            return [
                scheme_e.at(val),
                Math.max(1 - 1.5 * val, 0)
            ];
        })
            .draw(function (ctx) {
            ctx.fillStyle = 'black';
            ctx.font = '12px Monospace';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText('ef22', 10, 10);
        });
        console.log("time = " + (+new Date() - time0));
    };
    App.prototype.onload = function () {
        this.dao = new Dao();
        this.dao.onload = this.on_data_load.bind(this, 0);
        this.dao.load();
        this.canvas = document.getElementById('field');
        this.ctx = this.canvas.getContext('2d');
    };
    App.prototype.mount = function () {
        window.onload = this.onload.bind(this);
    };
    return App;
}());
var app = new App();
app.mount();
