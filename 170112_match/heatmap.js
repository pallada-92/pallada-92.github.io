"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var d3 = require('d3');
var common_1 = require('./common');
var ShapeIterator = (function () {
    function ShapeIterator() {
    }
    return ShapeIterator;
}());
var FitnessShapeIterator = (function (_super) {
    __extends(FitnessShapeIterator, _super);
    function FitnessShapeIterator(dao, periods, time_range, players) {
        _super.call(this);
        this.dao = dao;
        this.periods = periods;
        this.time_range = time_range;
        this.players = players;
        this.time_step = 100;
        this.width = this.dao.field_width;
        this.height = this.dao.field_height;
    }
    ;
    FitnessShapeIterator.prototype.forEach = function (fun) {
        var _this = this;
        this.periods.forEach(function (period) {
            var cur_pos = {};
            var prev_pos = {};
            for (var time = _this.time_range[0]; time < _this.time_range[1]; time += _this.time_step) {
                cur_pos = _this.dao.player_positions(period, time);
                _this.players.forEach(function (player) {
                    var c = cur_pos[player];
                    var p = prev_pos[player];
                    if (c != undefined && p != undefined) {
                        fun([p.X, p.Y, c.X, c.Y]);
                    }
                });
                prev_pos = cur_pos;
            }
        });
    };
    FitnessShapeIterator.prototype.events = function (event_ids) {
        return new EventShapeIterator(this.dao, this.periods, this.time_range, this.players, event_ids);
    };
    return FitnessShapeIterator;
}(ShapeIterator));
var EventShapeIterator = (function (_super) {
    __extends(EventShapeIterator, _super);
    function EventShapeIterator(dao, periods, time_range, players, event_ids) {
        _super.call(this);
        this.dao = dao;
        this.periods = periods;
        this.time_range = time_range;
        this.players = players;
        this.event_ids = event_ids;
        this.width = this.dao.field_width;
        this.height = this.dao.field_height;
    }
    ;
    EventShapeIterator.prototype.forEach = function (fun) {
        var _this = this;
        this.periods.forEach(function (period) {
            var max_i = _this.dao.event_count(period);
            for (var i = 0; i < max_i; i++) {
                var event_1 = _this.dao.event(period, i);
                if (_this.time_range[0] <= event_1.T &&
                    event_1.T < _this.time_range[1] &&
                    _this.event_ids.indexOf(event_1.code) != -1 &&
                    _this.players.indexOf(event_1.P) != -1 &&
                    event_1.X && event_1.Y) {
                    fun([event_1.X, event_1.Y]);
                }
            }
        });
    };
    return EventShapeIterator;
}(ShapeIterator));
var Buffer = (function () {
    function Buffer() {
    }
    Object.defineProperty(Buffer.prototype, "length", {
        get: function () {
            return this.width * this.height;
        },
        enumerable: true,
        configurable: true
    });
    Buffer.prototype.finalize = function () { };
    ;
    Buffer.prototype.forEach = function (fun) {
        for (var y = 0; y < this.height; y++) {
            for (var x = 0; x < this.width; x++) {
                fun(x, y, this.at(x, y));
            }
        }
    };
    Buffer.prototype.max_val = function () {
        var res = 0;
        this.forEach(function (x, y, val) {
            res = Math.max(val, res);
        });
        return res;
    };
    return Buffer;
}());
var ResizedBuffer = (function (_super) {
    __extends(ResizedBuffer, _super);
    function ResizedBuffer(buffer, width, height) {
        _super.call(this);
        this.buffer = buffer;
        this.width = width;
        this.height = height;
    }
    ;
    ResizedBuffer.prototype.at = function (x, y) {
        return this.buffer.at(Math.floor(x / this.width * this.buffer.width), Math.floor(y / this.height * this.buffer.height));
    };
    return ResizedBuffer;
}(Buffer));
var DrawShapeBuffer = (function (_super) {
    __extends(DrawShapeBuffer, _super);
    function DrawShapeBuffer() {
        _super.apply(this, arguments);
    }
    DrawShapeBuffer.prototype.feed_shape_iterator = function (adapter, iter) {
        var _this = this;
        iter.forEach(function (s) {
            if (s.length == 4) {
                var _a = adapter([s[0], s[1]]), x1 = _a[0], y1 = _a[1];
                var _b = adapter([s[2], s[3]]), x2 = _b[0], y2 = _b[1];
                _this.draw_line([x1, y1, x2, y2]);
            }
            else {
                _this.draw_point(adapter(s));
            }
        });
        this.finalize();
        return this;
    };
    return DrawShapeBuffer;
}(Buffer));
var Uint16DrawBuffer = (function (_super) {
    __extends(Uint16DrawBuffer, _super);
    function Uint16DrawBuffer(width, height, line_pts) {
        _super.call(this);
        this.width = width;
        this.height = height;
        this.line_pts = line_pts;
        this.data = new Uint16Array(width * height);
    }
    ;
    Uint16DrawBuffer.prototype.draw_line = function (_a) {
        var x1 = _a[0], y1 = _a[1], x2 = _a[2], y2 = _a[3];
        var step_x = (x2 - x1) / this.line_pts;
        var step_y = (y2 - y1) / this.line_pts;
        for (var i = 0; i < this.line_pts; i++) {
            var x = Math.round(x1 + step_x * (0.5 + i));
            var y = Math.round(y1 + step_y * (0.5 + i));
            this.data[this.width * y + x] += 1;
        }
    };
    Uint16DrawBuffer.prototype.draw_point = function (_a) {
        var x = _a[0], y = _a[1];
        x = Math.floor(x);
        y = Math.floor(y);
        this.data[this.width * y + x] += this.line_pts;
    };
    Uint16DrawBuffer.prototype.at = function (x, y) {
        return this.data[this.width * y + x];
    };
    Uint16DrawBuffer.prototype.max_val = function () {
        var res = 0;
        for (var x = 0; x < this.data.length; x++) {
            res = Math.max(res, this.data[x]);
        }
        return res;
    };
    return Uint16DrawBuffer;
}(DrawShapeBuffer));
var UpsampleConvolutionBuffer = (function (_super) {
    __extends(UpsampleConvolutionBuffer, _super);
    function UpsampleConvolutionBuffer(source, width, height, fun, window) {
        var _this = this;
        _super.call(this);
        this.source = source;
        this.width = width;
        this.height = height;
        this.fun = fun;
        this.window = window;
        this.precalc_matrix(window, fun);
        this.data = new Float64Array(this.width * this.height);
        source.forEach(function (sx, sy, s_val) {
            if (s_val == 0)
                return;
            var cx = Math.floor((sx + 0.5) * _this.width / source.width);
            var cy = Math.floor((sy + 0.5) * _this.height / source.height);
            var min_x = Math.max(0, cx - _this.window);
            var min_y = Math.max(0, cy - _this.window);
            var max_x = Math.min(_this.width - 1, cx + _this.window);
            var max_y = Math.min(_this.height - 1, cy + _this.window);
            for (var y = min_y; y <= max_y; y++) {
                for (var x = min_x; x <= max_x; x++) {
                    _this.data[y * _this.width + x] +=
                        s_val * _this.matrix[_this.w2 * (y - cy + _this.window) +
                            (x - cx + _this.window)];
                }
            }
        });
    }
    UpsampleConvolutionBuffer.prototype.precalc_matrix = function (window, fun) {
        this.w2 = this.window * 2 + 1;
        this.matrix = new Float64Array(this.w2 * this.w2);
        for (var i = 0; i <= this.w2; i++) {
            for (var j = 0; j <= this.w2; j++) {
                var x = i - this.window;
                var y = j - this.window;
                var dist = Math.sqrt(x * x + y * y);
                this.matrix[j * this.w2 + i] = fun(dist);
            }
        }
    };
    UpsampleConvolutionBuffer.prototype.at = function (x, y) {
        return this.data[y * this.width + x];
    };
    return UpsampleConvolutionBuffer;
}(Buffer));
var GaussConvolutionBuffer = (function (_super) {
    __extends(GaussConvolutionBuffer, _super);
    function GaussConvolutionBuffer(source) {
        _super.call(this);
        this.source = source;
        this.width = source.width;
        this.height = source.height;
        this.data = new Float64Array(this.width * this.height);
        for (var x = 0; x < this.width; x++) {
            for (var y = 0; y < this.height; y++) {
                this.data[this.width * y + x] = this.source.at(x, y);
            }
        }
    }
    GaussConvolutionBuffer.prototype.at = function (x, y) {
        return this.data[y * this.width + x];
    };
    GaussConvolutionBuffer.prototype.motion_blur = function (start, step, end, w) {
        var w2 = w * 2 + 1;
        var buffer = new Float64Array(w2);
        var buf_pos = 0;
        var accum = 0;
        var data = this.data;
        for (var i = start; i < end + step * w; i += step) {
            accum -= buffer[buf_pos];
            if (i < end) {
                buffer[buf_pos] = data[i];
                accum += buffer[buf_pos];
            }
            var write_to = i - step * w;
            if (write_to >= start) {
                data[write_to] = accum;
            }
            buf_pos++;
            buf_pos %= w2;
        }
        return data;
    };
    GaussConvolutionBuffer.prototype.blur_step = function (w) {
        for (var start = 0; start < this.length; start += this.width) {
            this.motion_blur(start, 1, start + this.width, w);
        }
        for (var start = 0; start < this.width; start++) {
            this.motion_blur(start, this.width, this.length, w);
        }
    };
    GaussConvolutionBuffer.prototype.blur = function (w, steps) {
        for (var i = 0; i < steps; i++) {
            this.blur_step(w);
        }
        return this;
    };
    return GaussConvolutionBuffer;
}(Buffer));
var QuantBuffer = (function (_super) {
    __extends(QuantBuffer, _super);
    function QuantBuffer(source, max_in, levels) {
        _super.call(this);
        this.source = source;
        this.max_in = max_in;
        this.levels = levels;
        this.width = source.width;
        this.height = source.height;
        if (!max_in) {
            this.max_in = this.source.max_val();
        }
    }
    ;
    QuantBuffer.prototype.at = function (x, y) {
        var val = this.source.at(x, y);
        if (val >= this.max_in) {
            return this.levels;
        }
        return Math.floor(val / this.max_in * this.levels);
    };
    return QuantBuffer;
}(Buffer));
var EdgeDetector = (function () {
    function EdgeDetector(source) {
        var _this = this;
        this.source = source;
        this.edge_x = [];
        this.edge_y = [];
        source.forEach(function (x, y, val) {
            var res = x + 1 < source.width &&
                _this.source.at(x + 1, y) > val ||
                y + 1 < source.height &&
                    _this.source.at(x, y + 1) > val ||
                x - 1 >= 0 &&
                    _this.source.at(x - 1, y) > val ||
                y - 1 >= 0 &&
                    _this.source.at(x, y - 1) > val;
            if (res) {
                _this.edge_x.push(x);
                _this.edge_y.push(y);
            }
        });
    }
    EdgeDetector.prototype.forEach = function (fun) {
        for (var i = 0; i < this.edge_x.length; i++) {
            fun(this.edge_x[i], this.edge_y[i]);
        }
    };
    EdgeDetector.prototype.draw_on = function (color, shape, radius, shift) {
        var _this = this;
        return function (ctx) {
            ctx.fillStyle = color;
            if (shape == 'rect') {
                _this.forEach(function (x, y) {
                    ctx.fillRect(Math.round(x - radius / 2) + shift, Math.round(y - radius / 2) + shift, radius, radius);
                });
            }
            else if (shape == 'circ') {
                _this.forEach(function (x, y) {
                    ctx.beginPath();
                    ctx.arc(Math.round(x) + shift, Math.round(y) + shift, radius, 0, 2 * Math.PI);
                    ctx.fill();
                });
            }
        };
    };
    return EdgeDetector;
}());
var GroupPoints = (function () {
    function GroupPoints(radius) {
        this.radius = radius;
        this.circles = [];
    }
    ;
    GroupPoints.prototype.add_circle = function (circle) {
        for (var i = 0; i < this.circles.length; i++) {
            var cur_circle = this.circles[i];
            var dist = common_1.Common.dist(circle, cur_circle);
            if (dist >= circle[2] + cur_circle[2])
                continue;
            var a = 1 / (1 + Math.pow(circle[2] / cur_circle[2], 2));
            var new_x = cur_circle[0] * a + circle[0] * (1 - a);
            var new_y = cur_circle[1] * a + circle[1] * (1 - a);
            var new_rad = common_1.Common.vec_len([circle[2], cur_circle[2]]);
            this.circles.splice(i, 1);
            this.add_circle([new_x, new_y, new_rad]);
            return;
        }
        this.circles.push(circle);
    };
    GroupPoints.prototype.feed_shape_iterator = function (adapter, iter) {
        var _this = this;
        iter.forEach(function (s) {
            if (s.length == 2) {
                var _a = adapter([s[0], s[1]]), x = _a[0], y = _a[1];
                _this.add_circle([x, y, _this.radius]);
            }
        });
        return this;
    };
    GroupPoints.prototype.forEach = function (fun) {
        this.circles.forEach(function (c) { return fun(c); });
    };
    return GroupPoints;
}());
var CompositionCanvas = (function () {
    function CompositionCanvas(canvas) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d');
    }
    CompositionCanvas.prototype.resize = function (width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        return this;
    };
    Object.defineProperty(CompositionCanvas.prototype, "width", {
        get: function () {
            return this.canvas.width;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CompositionCanvas.prototype, "height", {
        get: function () {
            return this.canvas.height;
        },
        enumerable: true,
        configurable: true
    });
    CompositionCanvas.prototype.clear_canvas = function (bg_color) {
        this.bg_color = bg_color;
        this.ctx.fillStyle = this.bg_color;
        this.ctx.fillRect(0, 0, this.width, this.height);
        return this;
    };
    CompositionCanvas.prototype.draw_field = function (meter, line_color, line_width) {
        var o = function (x) { return Math.round(x) + 0.5; };
        var s = function (x) { return Math.round(x); };
        this.meter = meter;
        this.line_color = line_color;
        var w = this.canvas.width;
        var h = this.canvas.height;
        var line = line_width;
        var ctx = this.ctx;
        ctx.strokeStyle = this.line_color;
        ctx.lineWidth = line;
        ctx.fillStyle = this.line_color;
        ctx.beginPath();
        ctx.moveTo(o(0), o(h / 2));
        ctx.lineTo(o(w), o(h / 2));
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(o(w / 2), o(h / 2), s(0.15 * meter), 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(o(w / 2), o(h / 2), s(9.15 * meter), 0, 2 * Math.PI);
        ctx.stroke();
        var draw_half = function () {
            ctx.strokeRect(o(3), o(3), s(w - 6), s(h / 2 - 3));
            ctx.strokeRect(o((w - 18.32 * meter) / 2), o(3), s(18.32 * meter), s(5.5 * meter - 3));
            ctx.strokeRect(o((w - 40.32 * meter) / 2), o(3), s(40.32 * meter), s(16.5 * meter - 3));
            ctx.beginPath();
            ctx.arc(o(w / 2), o(11 * meter), s(0.15 * meter), 0, 2 * Math.PI);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(o(w / 2), o(meter * 11), s(9.15 * meter), Math.asin((16.5 - 11) / 9.15), Math.PI - Math.asin((16.5 - 11) / 9.15));
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(o(3), o(3), s(meter), 0, Math.PI / 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(o(w - 3), o(3), s(meter), Math.PI / 2, Math.PI);
            ctx.stroke();
        };
        draw_half();
        ctx.save();
        ctx.translate(0, o(h / 2));
        ctx.scale(1, -1);
        ctx.translate(0, -o(h / 2));
        draw_half();
        ctx.restore();
        return this;
    };
    CompositionCanvas.prototype.fill = function (fun) {
        var idata = this.ctx.getImageData(0, 0, this.width, this.height);
        var data = idata.data;
        for (var x = 0; x < this.width; x++) {
            for (var y = 0; y < this.height; y++) {
                var offset = (this.width * y + x) * 4;
                var val = fun(x, y, [
                    data[offset + 0],
                    data[offset + 1],
                    data[offset + 2],
                ]);
                data[offset + 0] = val[0];
                data[offset + 1] = val[1];
                data[offset + 2] = val[2];
                data[offset + 3] = 255;
            }
        }
        this.ctx.putImageData(idata, 0, 0);
        return this;
    };
    CompositionCanvas.prototype.draw = function (fun) {
        fun(this.ctx);
        return this;
    };
    CompositionCanvas.prototype.apply_buffer = function (buffer, fun) {
        this.fill(function (x, y, val) { return fun(buffer.at(x, y), x, y, val); });
        return this;
    };
    CompositionCanvas.prototype.draw_buffer = function (buffer, fun) {
        var _this = this;
        buffer.forEach(function (x, y, val) {
            var cx = Math.floor((x + 0.5) * _this.width / buffer.width);
            var cy = Math.floor((y + 0.5) * _this.height / buffer.height);
            fun(_this.ctx, val, cx, cy);
        });
        return this;
    };
    CompositionCanvas.prototype.blend_buffer = function (buffer, fun) {
        var _this = this;
        var data = this.ctx.getImageData(0, 0, this.width, this.height).data;
        this.fill(function (x, y) {
            var offset = 4 * (y * _this.width + x);
            return fun([
                data[offset],
                data[offset + 1],
                data[offset + 2]], buffer.at(x, y), x, y);
        });
        return this;
    };
    CompositionCanvas.prototype.blend_alpha_buffer = function (buffer, fun) {
        this.blend_buffer(buffer, function (prev, val, x, y) {
            var f = fun(val, x, y);
            var cur = f[0];
            var alpha = f[1];
            return [
                Math.floor(prev[0] * alpha + cur[0] * (1 - alpha)),
                Math.floor(prev[1] * alpha + cur[1] * (1 - alpha)),
                Math.floor(prev[2] * alpha + cur[2] * (1 - alpha)),
            ];
        });
        return this;
    };
    CompositionCanvas.prototype.apply_buffers = function (buffers, fun) {
        this.fill(function (x, y) { return fun(buffers.map(function (buffer) { return buffer.at(x, y); }), x, y); });
        return this;
    };
    return CompositionCanvas;
}());
var ColorScheme = (function () {
    function ColorScheme(interpolators, stops, table_size) {
        this.interpolators = interpolators;
        this.stops = stops;
        this.table_size = table_size;
        this.table = [];
        var _loop_1 = function(i) {
            var t = i / table_size;
            var seg = 0;
            stops.forEach(function (stop, cur_seg) {
                if (stop < t) {
                    seg = cur_seg;
                }
            });
            var seg_t = (t - stops[seg]) / (stops[seg + 1] - stops[seg]);
            var color = d3.color(interpolators[seg](seg_t)).rgb();
            this_1.table[i] = [color.r, color.g, color.b];
        };
        var this_1 = this;
        for (var i = 0; i < table_size; i++) {
            _loop_1(i);
        }
    }
    ColorScheme.from_uniform_steps = function (colors, table_size) {
        return this.from_steps(colors.map(function (col, i) { return [i / (colors.length - 1), col]; }), table_size);
    };
    ColorScheme.from_steps = function (colors, table_size) {
        var interpolators = [];
        var stops = [];
        for (var i = 0; i < colors.length - 1; i++) {
            interpolators.push(d3.interpolateRgb(colors[i][1], colors[i + 1][1]));
            stops.push(colors[i][0]);
        }
        stops.push(1);
        return new ColorScheme(interpolators, stops, table_size);
    };
    ColorScheme.prototype.reverse = function () {
        this.table.reverse();
        return this;
    };
    ColorScheme.prototype.at = function (t) {
        return this.table[Math.floor(t * (this.table_size - 1))];
    };
    return ColorScheme;
}());
