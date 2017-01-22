import * as d3 from 'd3';
import * as R from 'ramda';

import { Dao } from './dao';
import { Common } from './common';

type PointShape = [number, number];

type LineShape = [number, number, number, number];

type Shape = PointShape | LineShape;

// http://blog.ivank.net/fastest-gaussian-blur.html
// http://www.andrewnoske.com/wiki/Code_-_heatmaps_and_color_gradients

type PlayerPositions = {
    [player_id: string]: {
        X: number,
        Y: number,
        V: number,
    }
};

abstract class ShapeIterator {
    width: number;
    height: number;
    abstract forEach(fun: (s: Shape) => void);
}

class FitnessShapeIterator extends ShapeIterator {
    time_step = 100;
    width: number;
    height: number;
    constructor(
        public dao: Dao,
        public periods: number[],
        public time_range: [number, number],
        public players: string[],
    ) {
        super();
        this.width = this.dao.field_width;
        this.height = this.dao.field_height;
    };
    forEach(fun: (s: Shape) => void) {
        this.periods.forEach((period: number) => {
            let cur_pos: PlayerPositions = {};
            let prev_pos: PlayerPositions = {};
            for (
                let time = this.time_range[0];
                time < this.time_range[1];
                time += this.time_step
            ) {
                cur_pos = this.dao.player_positions(
                    period, time);
                this.players.forEach((player: string) => {
                    let c = cur_pos[player];
                    let p = prev_pos[player];
                    if (c != undefined && p != undefined) {
                        fun([p.X, p.Y, c.X, c.Y]);
                    }
                })
                prev_pos = cur_pos;
            }
        });
    }
    events(event_ids: number[]) {
        return new EventShapeIterator(
            this.dao, this.periods,
            this.time_range, this.players, event_ids);
    }
}

class EventShapeIterator extends ShapeIterator {
    width: number;
    height: number;
    constructor(
        public dao: Dao,
        public periods: number[],
        public time_range: [number, number],
        public players: string[],
        public event_ids: number[],
    ) {
        super();
        this.width = this.dao.field_width;
        this.height = this.dao.field_height;
    };
    forEach(fun: (s: Shape) => void) {
        this.periods.forEach((period: number) => {
            let max_i = this.dao.event_count(period)
            for (let i = 0; i < max_i; i++) {
                let event = this.dao.event(period, i);
                if (
                    this.time_range[0] <= event.T &&
                    event.T < this.time_range[1] &&
                    this.event_ids.indexOf(event.code) != -1 &&
                    this.players.indexOf(event.P) != -1 &&
                    event.X && event.Y
                ) {
                    fun([event.X, event.Y] as PointShape);
                }
            }
        });
    }
}

abstract class Buffer {
    width: number;
    height: number;
    get length() {
        return this.width * this.height;
    }
    finalize() { };
    abstract at(x: number, y: number);
    forEach(fun: (x, y, val) => void) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                fun(x, y, this.at(x, y));
            }
        }
    }
    max_val() {
        let res = 0;
        this.forEach((x, y, val) => {
            res = Math.max(val, res);
        })
        return res;
    }
}

class ResizedBuffer extends Buffer {
    constructor(
        public buffer: Buffer,
        public width: number,
        public height: number,
    ) {
        super();
    };
    at(x: number, y: number) {
        return this.buffer.at(
            Math.floor(x / this.width * this.buffer.width),
            Math.floor(y / this.height * this.buffer.height),
        );
    }
}

abstract class DrawShapeBuffer extends Buffer {
    abstract draw_line(line: LineShape);
    abstract draw_point(point: PointShape);
    feed_shape_iterator(
        adapter: (s: PointShape) => PointShape, iter: ShapeIterator
    ) {
        iter.forEach((s: Shape) => {
            if (s.length == 4) {
                let [x1, y1] = adapter([s[0], s[1]]);
                let [x2, y2] = adapter([s[2], s[3]]);
                this.draw_line([x1, y1, x2, y2] as LineShape);
            } else {
                this.draw_point(adapter(s));
            }
        });
        this.finalize();
        return this;
    }
}

class Uint16DrawBuffer extends DrawShapeBuffer {
    data: Uint16Array;
    constructor(
        public width: number,
        public height: number,
        public line_pts: number,
    ) {
        super();
        this.data = new Uint16Array(width * height);
    };
    draw_line([x1, y1, x2, y2]: LineShape) {
        let step_x = (x2 - x1) / this.line_pts;
        let step_y = (y2 - y1) / this.line_pts;
        for (let i = 0; i < this.line_pts; i++) {
            let x = Math.round(x1 + step_x * (0.5 + i));
            let y = Math.round(y1 + step_y * (0.5 + i));
            this.data[this.width * y + x] += 1;
        }
    }
    draw_point([x, y]: PointShape) {
        x = Math.floor(x);
        y = Math.floor(y);
        this.data[this.width * y + x] += this.line_pts;
    }
    at(x: number, y: number) {
        return this.data[this.width * y + x];
    }
    max_val() {
        let res = 0;
        for (let x = 0; x < this.data.length; x++) {
            res = Math.max(res, this.data[x]);
        }
        return res;
    }
}

class UpsampleConvolutionBuffer extends Buffer {
    matrix: Float64Array;
    data: Float64Array;
    w2: number;
    precalc_matrix(window: number, fun: (d: number) => number) {
        this.w2 = this.window * 2 + 1;
        this.matrix = new Float64Array(this.w2 * this.w2);
        for (let i = 0; i <= this.w2; i++) {
            for (let j = 0; j <= this.w2; j++) {
                let x = i - this.window;
                let y = j - this.window
                let dist = Math.sqrt(x * x + y * y);
                this.matrix[j * this.w2 + i] = fun(dist);
            }
        }
    }
    constructor(
        public source: Buffer,
        public width: number,
        public height: number,
        public fun: (dist: number) => number,
        public window: number,
    ) {
        super();
        this.precalc_matrix(window, fun);
        this.data = new Float64Array(this.width * this.height);
        source.forEach((sx, sy, s_val) => {
            if (s_val == 0) return;
            let cx = Math.floor(
                (sx + 0.5) * this.width / source.width);
            let cy = Math.floor(
                (sy + 0.5) * this.height / source.height);
            let min_x = Math.max(0, cx - this.window);
            let min_y = Math.max(0, cy - this.window);
            let max_x = Math.min(this.width - 1, cx + this.window);
            let max_y = Math.min(this.height - 1, cy + this.window);
            for (let y = min_y; y <= max_y; y++) {
                for (let x = min_x; x <= max_x; x++) {
                    this.data[y * this.width + x] +=
                        s_val * this.matrix[
                        this.w2 * (y - cy + this.window) +
                        (x - cx + this.window)
                        ];
                }
            }
        })
    }
    at(x: number, y: number) {
        return this.data[y * this.width + x];
    }
}

class GaussConvolutionBuffer extends Buffer {
    data: Float64Array;
    constructor(
        public source: Buffer,
    ) {
        super();
        this.width = source.width;
        this.height = source.height;
        this.data = new Float64Array(this.width * this.height);
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                this.data[this.width * y + x] = this.source.at(x, y);
            }
        }
    }
    at(x: number, y: number) {
        return this.data[y * this.width + x];
    }
    motion_blur(start: number, step: number, end: number, w: number) {
        let w2 = w * 2 + 1;
        let buffer = new Float64Array(w2);
        let buf_pos = 0;
        let accum = 0;
        let data = this.data;
        for (let i = start; i < end + step * w; i += step) {
            accum -= buffer[buf_pos];
            if (i < end) {
                buffer[buf_pos] = data[i]
                accum += buffer[buf_pos];
            }
            let write_to = i - step * w;
            if (write_to >= start) {
                data[write_to] = accum;
            }
            buf_pos++;
            buf_pos %= w2;
        }
        return data;
    }
    blur_step(w: number) {
        for (let start = 0; start < this.length; start += this.width) {
            this.motion_blur(start, 1, start + this.width, w);
        }
        for (let start = 0; start < this.width; start++) {
            this.motion_blur(start, this.width, this.length, w);
        }
    }
    blur(w: number, steps: number) {
        for (let i = 0; i < steps; i++) {
            this.blur_step(w);
        }
        return this;
    }
}

class QuantBuffer extends Buffer {
    constructor(
        public source: Buffer,
        public max_in: number, // 0 means = max;
        public levels: number,
    ) {
        super();
        this.width = source.width;
        this.height = source.height;
        if (!max_in) {
            this.max_in = this.source.max_val();
        }
    };
    at(x: number, y: number) {
        let val = this.source.at(x, y);
        if (val >= this.max_in) {
            return this.levels;
        }
        return Math.floor(val / this.max_in * this.levels);
    }
}

class EdgeDetector {
    edge_x: number[];
    edge_y: number[]
    constructor(
        public source: Buffer,
    ) {
        this.edge_x = [];
        this.edge_y = [];
        source.forEach((x, y, val) => {
            let res = x + 1 < source.width &&
                this.source.at(x + 1, y) > val ||
                y + 1 < source.height &&
                this.source.at(x, y + 1) > val ||
                x - 1 >= 0 &&
                this.source.at(x - 1, y) > val ||
                y - 1 >= 0 &&
                this.source.at(x, y - 1) > val;
            if (res) {
                this.edge_x.push(x);
                this.edge_y.push(y);
            }
        })
    }
    forEach(fun: (x: number, y: number) => void) {
        for (let i = 0; i < this.edge_x.length; i++) {
            fun(this.edge_x[i], this.edge_y[i]);
        }
    }
    draw_on(
        color: string, shape: string, radius: number, shift: number
    ) {
        return (ctx: CanvasRenderingContext2D) => {
            ctx.fillStyle = color;
            if (shape == 'rect') {
                this.forEach((x, y) => {
                    ctx.fillRect(
                        Math.round(x - radius / 2) + shift,
                        Math.round(y - radius / 2) + shift,
                        radius, radius
                    );
                })
            } else if (shape == 'circ') {
                this.forEach((x, y) => {
                    ctx.beginPath();
                    ctx.arc(
                        Math.round(x) + shift, Math.round(y) + shift,
                        radius, 0, 2 * Math.PI);
                    ctx.fill();
                })
            }
        }
    }
}

// x, y, radius
type CircleShape = [number, number, number];

class GroupPoints {
    circles: CircleShape[] = [];
    constructor(
        public radius: number
    ) { };
    add_circle(circle: CircleShape) {
        for (let i = 0; i < this.circles.length; i++) {
            let cur_circle = this.circles[i];
            let dist = Common.dist(circle, cur_circle);
            if (dist >= circle[2] + cur_circle[2]) continue;
            let a = 1 / (1 + Math.pow(circle[2] / cur_circle[2], 2));
            let new_x = cur_circle[0] * a + circle[0] * (1 - a);
            let new_y = cur_circle[1] * a + circle[1] * (1 - a);
            let new_rad = Common.vec_len([circle[2], cur_circle[2]]);
            this.circles.splice(i, 1);
            this.add_circle([new_x, new_y, new_rad]);
            return;
        }
        this.circles.push(circle);
    }
    feed_shape_iterator(
        adapter: (s: PointShape) => PointShape, iter: ShapeIterator
    ) {
        iter.forEach((s: Shape) => {
            if (s.length == 2) {
                let [x, y] = adapter([s[0], s[1]]);
                this.add_circle([x, y, this.radius]);
            }
        });
        return this;
    }
    forEach(fun: (c: CircleShape) => void) {
        this.circles.forEach((c: CircleShape) => fun(c));
    }
}

type RGBColor = [number, number, number];

class CompositionCanvas {
    ctx: CanvasRenderingContext2D;
    constructor(
        public canvas: HTMLCanvasElement,
    ) {
        this.ctx = this.canvas.getContext('2d') as
            CanvasRenderingContext2D;
    }
    resize(width: number, height: number) {
        this.canvas.width = width;
        this.canvas.height = height;
        return this;
    }
    get width() {
        return this.canvas.width;
    }
    get height() {
        return this.canvas.height;
    }
    bg_color: string;
    clear_canvas(bg_color: string) {
        this.bg_color = bg_color;
        this.ctx.fillStyle = this.bg_color;
        this.ctx.fillRect(0, 0, this.width, this.height);
        return this;
    }
    meter: number;
    line_color: string;
    draw_field(meter, line_color, line_width) {
        let o = (x) => Math.round(x) + 0.5;
        let s = (x) => Math.round(x);
        this.meter = meter;
        this.line_color = line_color;
        let w = this.canvas.width;
        let h = this.canvas.height;
        let line = line_width;
        let ctx = this.ctx;
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
        let draw_half = () => {
            ctx.strokeRect(o(3), o(3), s(w - 6), s(h / 2 - 3));
            ctx.strokeRect(
                o((w - 18.32 * meter) / 2), o(3),
                s(18.32 * meter), s(5.5 * meter - 3)
            );
            ctx.strokeRect(
                o((w - 40.32 * meter) / 2), o(3),
                s(40.32 * meter), s(16.5 * meter - 3)
            );
            ctx.beginPath();
            ctx.arc(o(w / 2), o(11 * meter),
                s(0.15 * meter), 0, 2 * Math.PI);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(o(w / 2), o(meter * 11), s(9.15 * meter),
                Math.asin((16.5 - 11) / 9.15),
                Math.PI - Math.asin((16.5 - 11) / 9.15));
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(o(3), o(3), s(meter), 0, Math.PI / 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(o(w - 3), o(3), s(meter), Math.PI / 2, Math.PI);
            ctx.stroke();
        }
        draw_half();
        ctx.save();
        ctx.translate(0, o(h / 2));
        ctx.scale(1, -1);
        ctx.translate(0, -o(h / 2));
        draw_half();
        ctx.restore();
        return this;
    }
    fill(fun: (x: number, y: number, val: RGBColor) => RGBColor) {
        let idata = this.ctx.getImageData(0, 0, this.width, this.height);
        let data = idata.data;
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                let offset = (this.width * y + x) * 4;
                let val = fun(x, y, [
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
    }
    draw(fun: (ctx: CanvasRenderingContext2D) => void) {
        fun(this.ctx);
        return this;
    }
    apply_buffer(
        buffer: Buffer,
        fun: (val: number, x: number, y: number,
            prev_color: RGBColor) => RGBColor
    ) {
        this.fill((x, y, val) => fun(buffer.at(x, y), x, y, val));
        return this;
    }
    draw_buffer(
        buffer: Buffer,
        fun: (ctx: CanvasRenderingContext2D,
            val: number, x: number, y: number) => void,
    ) {
        buffer.forEach((x, y, val) => {
            let cx = Math.floor(
                (x + 0.5) * this.width / buffer.width);
            let cy = Math.floor(
                (y + 0.5) * this.height / buffer.height);
            fun(this.ctx, val, cx, cy);
        });
        return this;
    }
    blend_buffer(
        buffer: Buffer,
        fun: (prev_val: RGBColor, new_val: number,
            x: number, y: number) => RGBColor
    ) {
        let data = this.ctx.getImageData(
            0, 0, this.width, this.height).data;
        this.fill((x, y) => {
            let offset = 4 * (y * this.width + x);
            return fun([
                data[offset],
                data[offset + 1],
                data[offset + 2]],
                buffer.at(x, y), x, y);
        });
        return this;
    }
    blend_alpha_buffer(
        buffer: Buffer,
        fun: (new_val: number, x: number, y: number)
            => [RGBColor, number]
    ) {
        this.blend_buffer(buffer, (prev, val, x, y) => {
            let f = fun(val, x, y);
            let cur = f[0];
            let alpha = f[1];
            return [
                Math.floor(prev[0] * alpha + cur[0] * (1 - alpha)),
                Math.floor(prev[1] * alpha + cur[1] * (1 - alpha)),
                Math.floor(prev[2] * alpha + cur[2] * (1 - alpha)),
            ];
        });
        return this;
    }
    apply_buffers(
        buffers: Buffer[],
        fun: (vals: number[], x, y) => RGBColor
    ) {
        this.fill((x, y) => fun(buffers.map(
            (buffer) => buffer.at(x, y)
        ), x, y));
        return this;
    }
}

class ColorScheme {
    table: RGBColor[] = [];
    static from_uniform_steps(
        colors: string[],
        table_size: number,
    ) {
        return this.from_steps(
            colors.map((col, i) => [i / (colors.length - 1), col] as
                [number, string]),
            table_size
        )
    }
    static from_steps(
        colors: [number, string][],
        table_size: number
    ) {
        let interpolators: ((t: number) => string)[] = [];
        let stops: number[] = [];
        for (let i = 0; i < colors.length - 1; i++) {
            interpolators.push(
                d3.interpolateRgb(colors[i][1], colors[i + 1][1]));
            stops.push(colors[i][0]);
        }
        stops.push(1);
        return new ColorScheme(interpolators, stops, table_size);
    }
    constructor(
        public interpolators: ((t: number) => string)[],
        public stops: number[],
        public table_size: number,
    ) {
        for (let i = 0; i < table_size; i++) {
            let t = i / table_size;
            let seg = 0;
            stops.forEach((stop, cur_seg) => {
                if (stop < t) {
                    seg = cur_seg;
                }
            });
            let seg_t = (t - stops[seg]) / (stops[seg + 1] - stops[seg]);
            // console.log(stops, i, t, seg,
            // seg_t, interpolators[seg](seg_t));
            let color = d3.color(interpolators[seg](seg_t)).rgb();
            this.table[i] = [color.r, color.g, color.b];
        }
    }
    reverse() {
        this.table.reverse();
        return this;
    }
    at(t: number) {
        return this.table[Math.floor(t * (this.table_size - 1))];
    }
}

