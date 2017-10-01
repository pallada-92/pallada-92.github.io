function rgb(rgb) {
    return 'rgb(' + Math.round(rgb[0]) +
        ',' + Math.round(rgb[1]) +
        ',' + Math.round(rgb[2]) + ')';
}
function blend(color1, color2, t) {
    return [
        color1[0] * (1 - t) + color2[0] * t,
        color1[1] * (1 - t) + color2[1] * t,
        color1[2] * (1 - t) + color2[2] * t,
    ];
}
function cool_warm(t) {
    var warm = [255, 0, 0];
    var mid = [255, 255, 255];
    var cool = [0, 0, 255];
    if (t <= 0) {
        t = Math.min(1, -t);
        return rgb(blend(mid, cool, t));
    }
    else {
        t = Math.min(1, t);
        return rgb(blend(mid, warm, t));
    }
}
function mul_vec(vec, coeff) {
    var res = [];
    for (var i = 0; i < vec.length; i++) {
        res.push(vec[i] * coeff);
    }
    return res;
}
function constrain(val, min, max) {
    return Math.min(max, Math.max(min, val));
}
function toggle(obj, prop, key, key_toggle) {
    if (key != key_toggle)
        return;
    obj[prop] = !obj[prop];
}
function cycle(obj, prop, count, key, key_down, key_up, onchange) {
    if (key != key_down && key != key_up)
        return;
    var val = obj[prop];
    if (key == key_down) {
        val += 1;
    }
    else {
        val += count - 1;
    }
    val = val % count;
    console.log(prop, val);
    obj[prop] = val;
    onchange(val);
}
function control(obj, prop, key, key_down, key_up, min, max, step, log) {
    if (key != key_up && key != key_down)
        return;
    var val = obj[prop];
    if (log) {
        val = Math.log(val);
        step = Math.log(step);
    }
    if (key == key_down) {
        val -= step;
    }
    else {
        val += step;
    }
    if (log) {
        val = Math.exp(val);
    }
    val = constrain(val, min, max);
    console.log(prop, val);
    obj[prop] = val;
}
var App = (function () {
    function App() {
        this.cur_data_id = 0;
    }
    Object.defineProperty(App.prototype, "w", {
        get: function () {
            return this.canvas.width;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(App.prototype, "h", {
        get: function () {
            return this.canvas.height;
        },
        enumerable: true,
        configurable: true
    });
    App.prototype.recalc_random = function () {
        for (var _i = 0, _a = this.data; _i < _a.length; _i++) {
            var data_item = _a[_i];
            data_item.cache.random_deltas = [];
            var vecs_count = data_item.vecs.length;
            for (var i = 0; i < vecs_count; i++) {
                var a = Math.random() * Math.PI * 2;
                var r = Math.random();
                data_item.cache.random_deltas.push([Math.cos(a) * r, Math.sin(a) * r]);
            }
        }
    };
    App.prototype.calc_feats = function () {
        for (var _i = 0, _a = this.data; _i < _a.length; _i++) {
            var data_item = _a[_i];
            var feat_count = data_item.feat_names.length;
            var sum = [];
            var sum_sq = [];
            for (var i = 0; i < feat_count; i++) {
                sum.push(0);
                sum_sq.push(0);
            }
            for (var _b = 0, _c = data_item.vecs; _b < _c.length; _b++) {
                var vec = _c[_b];
                for (var i = 0; i < vec.length; i++) {
                    var val = vec[i];
                    if (data_item.cache.norms.length > 0) {
                        var norm = data_item.cache.norms[i];
                        val /= norm;
                    }
                    sum[i] += val;
                    sum_sq[i] += val * val;
                }
            }
            var vecs_count = data_item.vecs.length;
            data_item.cache.feats = [];
            for (var i = 0; i < feat_count; i++) {
                var avg = sum[i] / vecs_count;
                data_item.cache.feats.push({
                    avg: avg,
                    std: Math.sqrt(sum_sq[i] / vecs_count - avg * avg),
                });
            }
        }
        ;
    };
    App.prototype.calc_norms = function () {
        for (var _i = 0, _a = this.data; _i < _a.length; _i++) {
            var data_item = _a[_i];
            data_item.cache.norms = [];
            for (var _b = 0, _c = data_item.vecs; _b < _c.length; _b++) {
                var vec = _c[_b];
                var norm = 0;
                for (var i = 0; i < vec.length; i++) {
                    var feat = data_item.cache.feats[i];
                    var val = vec[i];
                    if (data_item.cache.feats.length > 0) {
                        val = (val - feat.avg) / feat.std;
                    }
                    norm += val * val;
                }
                data_item.cache.norms.push(Math.sqrt(norm));
            }
        }
    };
    App.prototype.calc_cache = function () {
        for (var _i = 0, _a = this.data; _i < _a.length; _i++) {
            var data_item = _a[_i];
            var groups = {};
            data_item.cache = {
                feats: [],
                random_deltas: [],
                zero: [],
                norms: [],
                groups: groups,
            };
            for (var group in data_item.groups) {
                for (var _b = 0, _c = data_item.groups[group].vec_ids; _b < _c.length; _b++) {
                    var vec_id = _c[_b];
                    if (!(vec_id in groups)) {
                        groups[vec_id] = [];
                    }
                    groups[vec_id].push(group);
                }
            }
        }
        this.calc_feats();
        for (var _d = 0, _e = this.data; _d < _e.length; _d++) {
            var data_item = _e[_d];
            var feat_count = data_item.feat_names.length;
            for (var i = 0; i < feat_count; i++) {
                data_item.cache.zero.push(data_item.cache.feats[i].avg);
            }
        }
        this.recalc_random();
    };
    Object.defineProperty(App.prototype, "cur_data", {
        get: function () {
            return this.data[this.cur_data_id];
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(App.prototype, "config", {
        get: function () {
            return this.cur_data.conf;
        },
        enumerable: true,
        configurable: true
    });
    App.prototype.add_vec = function (vec1, vec2, coeff) {
        if (coeff === void 0) { coeff = 1; }
        return [
            vec1[0] + vec2[0] * coeff,
            vec1[1] + vec2[1] * coeff,
        ];
    };
    App.prototype.pt2px = function (pt) {
        var scale = this.config.scale;
        return [
            this.w / 2 + pt[0] * scale,
            this.h / 2 + pt[1] * scale,
        ];
    };
    App.prototype.px2pt = function (px) {
        var scale = this.config.scale;
        return [
            (px[0] - this.w / 2) / scale,
            (px[1] - this.h / 2) / scale,
        ];
    };
    App.prototype.dpx2dpt = function (dpx) {
        var scale = this.config.scale;
        return [
            dpx[0] / scale,
            dpx[1] / scale,
        ];
    };
    App.prototype.vec2pt = function (vec) {
        var res = [0, 0];
        var basis = this.config.basis;
        var cfeats = this.cur_data.cache.feats;
        var norm;
        if (this.config.norm_after) {
            norm = 0;
            for (var i = 0; i < basis.length; i++) {
                var val = (vec[i] - cfeats[i].avg) / cfeats[i].std;
                norm += val * val;
            }
            norm = Math.sqrt(norm);
        }
        else {
            norm = 1;
        }
        for (var i = 0; i < basis.length; i++) {
            var val = (vec[i] - cfeats[i].avg) / cfeats[i].std / norm;
            res[0] += val * basis[i][0];
            res[1] += val * basis[i][1];
        }
        return res;
    };
    App.prototype.redraw = function () {
        if (!this.canvas)
            return;
        var ctx = this.canvas.getContext('2d');
        if (!ctx)
            return;
        if (!this.data)
            return;
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, this.w, this.h);
        var data = this.data[this.cur_data_id];
        var sel_feat = this.config.sel_feat_id;
        var cfeat = data.cache.feats[sel_feat];
        ctx.fillStyle = 'white';
        ctx.font = '20px Helvetica';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        ctx.fillText(data.feat_names[sel_feat], this.w - 10, 10);
        var stdr = cfeat.std * this.config.color_std_mul;
        var fixed = 5;
        ctx.font = '16px Helvetica';
        ctx.textBaseline = 'bottom';
        ctx.fillStyle = cool_warm(1);
        ctx.fillText((cfeat.avg + stdr).toFixed(fixed), this.w - 10, 60);
        ctx.fillStyle = cool_warm(0);
        ctx.fillText((cfeat.avg).toFixed(fixed), this.w - 10, 80);
        ctx.fillStyle = cool_warm(-1);
        ctx.fillText((cfeat.std - stdr).toFixed(fixed), this.w - 10, 100);
        var basis = data.conf.basis;
        var pt_rad = this.config.pt_rad;
        for (var vec_id in data.vecs) {
            if (!(data.conf.show_points))
                continue;
            if (!(vec_id in data.cache.groups))
                continue;
            for (var _i = 0, _a = data.cache.groups[vec_id]; _i < _a.length; _i++) {
                var group = _a[_i];
                if (data.conf.groups.indexOf(group) == -1)
                    continue;
                var color = data.groups[group].color;
                var vec = data.vecs[vec_id];
                var pt = this.vec2pt(vec);
                var px = this.add_vec(this.pt2px(pt), data.cache.random_deltas[vec_id], data.conf.random_scale);
                if (data.conf.legend_colors) {
                    ctx.fillStyle = rgb(color);
                }
                else {
                    ctx.fillStyle = cool_warm((vec[sel_feat] - cfeat.avg) / cfeat.std / this.config.color_std_mul);
                }
                ctx.beginPath();
                ctx.arc(px[0], px[1], pt_rad, 0, 2 * Math.PI, false);
                ctx.fill();
                var vec1 = data.vecs[vec_id].slice();
                vec1[sel_feat] = cfeat.avg;
                var pt1 = this.vec2pt(vec1);
                var px1 = this.add_vec(this.pt2px(pt1), data.cache.random_deltas[vec_id], data.conf.random_scale);
                if (this.config.show_heights) {
                    ctx.strokeStyle = ctx.fillStyle;
                    ctx.beginPath();
                    ctx.moveTo(px[0], px[1]);
                    ctx.lineTo(px1[0], px1[1]);
                    ctx.stroke();
                }
                break;
            }
        }
        if (data.conf.show_basis) {
            var px0 = this.pt2px([0, 0]);
            for (var i = 0; i < basis.length; i++) {
                var zeros1 = data.cache.zero.slice();
                zeros1[i] += this.config.color_std_mul * data.cache.feats[i].std;
                var pt = this.vec2pt(zeros1);
                var px = this.pt2px(pt);
                if (i == sel_feat) {
                    var grad = ctx.createLinearGradient(px0[0], px0[1], px[0], px[1]);
                    grad.addColorStop(1, cool_warm(1));
                    grad.addColorStop(0, cool_warm(0));
                    ctx.fillStyle = grad;
                    ctx.strokeStyle = grad;
                }
                else {
                    ctx.fillStyle = 'white';
                    ctx.strokeStyle = 'white';
                }
                ctx.beginPath();
                ctx.moveTo(px0[0], px0[1]);
                ctx.lineTo(px[0], px[1]);
                ctx.stroke();
                ctx.textAlign = 'left';
                ctx.textBaseline = 'bottom';
                ctx.font = Math.round(data.conf.feat_font_size) + 'px Helvetica';
                ctx.fillText(data.feat_names[i], px[0], px[1]);
            }
        }
        var legend_pos = 0;
        ctx.fillStyle = 'white';
        ctx.font = '26px Helvetica';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(this.cur_data.title, 20, 20);
        var legend_xy = [20.5, 70.5];
        var legend_rect_size = 15;
        var legend_row_h = 20;
        for (var _b = 0, _c = this.config.groups; _b < _c.length; _b++) {
            var group = _c[_b];
            var color = void 0;
            if (data.conf.legend_colors) {
                color = data.groups[group].color;
            }
            else {
                color = [100, 100, 100];
            }
            ctx.fillStyle = rgb(color);
            ctx.beginPath();
            ctx.rect(legend_xy[0], legend_xy[1] + legend_row_h * legend_pos, legend_rect_size, legend_rect_size);
            ctx.fill();
            ctx.fillStyle = 'lightgray';
            ctx.font = 'bold 15px Helvetica';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'bottom';
            var label = data.groups[group].label;
            ctx.fillText(label, legend_xy[0] + legend_rect_size * 2, legend_xy[1] + legend_row_h * legend_pos + legend_rect_size);
            legend_pos++;
        }
    };
    App.prototype.onmousedown = function (e) {
        var px = [e.clientX, e.clientY];
        this.mousedown_px = px;
        var sel_feat = this.config.sel_feat_id;
        this.mousedown_pt = this.config.basis[sel_feat];
    };
    App.prototype.onmouseup = function () {
        delete this.mousedown_px;
    };
    App.prototype.onmousemove = function (e) {
        if (e.buttons == 0 || !this.mousedown_px)
            return;
        var dpx = [
            e.clientX - this.mousedown_px[0],
            e.clientY - this.mousedown_px[1],
        ];
        var dpt = this.dpx2dpt(dpx);
        var sel_feat = this.config.sel_feat_id;
        this.config.basis[sel_feat] = [
            this.mousedown_pt[0] + dpt[0],
            this.mousedown_pt[1] + dpt[1],
        ];
        if (this.config.recalc_random_on_move) {
            this.recalc_random();
        }
        this.redraw();
        this.onmousedown(e);
    };
    App.prototype.onresize = function () {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.canvas.getContext('2d');
        this.redraw();
    };
    App.prototype.onload = function () {
        var _this = this;
        this.canvas = document.createElement('canvas');
        document.body.appendChild(this.canvas);
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0px';
        this.canvas.style.left = '0px';
        this.onresize();
        this.canvas.addEventListener('mousedown', this.onmousedown.bind(this));
        this.canvas.addEventListener('mousemove', this.onmousemove.bind(this));
        window.addEventListener('mouseup', this.onmouseup.bind(this));
        $.getJSON('/json/thread_feats1.json', function (data) {
            _this.data = data;
            _this.calc_cache();
            document.title = 'Многомерная визуализация';
            _this.redraw();
        });
    };
    App.prototype.onkeydown = function (e) {
        var _this = this;
        console.log(e.key);
        var conf = this.cur_data.conf;
        if (e.key == '6') {
            this.recalc_random();
        }
        cycle(conf, 'sel_feat_id', this.cur_data.feat_names.length, e.key, 'z', 'x', function () {
            var sel_feat = _this.config.sel_feat_id;
            _this.mousedown_pt = _this.config.basis[sel_feat];
        });
        cycle(this, 'cur_data_id', this.data.length, e.key, '1', '2', function () { });
        cycle(this.cur_data, 'sel_conf', this.cur_data.saved_confs.length, e.key, '3', '4', function (val) {
            _this.cur_data.conf = JSON.parse(JSON.stringify(_this.cur_data.saved_confs[val]));
        });
        toggle(conf, 'norm_after', e.key, 'q');
        toggle(conf, 'legend_colors', e.key, 'a');
        toggle(conf, 'show_heights', e.key, 's');
        toggle(conf, 'show_basis', e.key, 'c');
        toggle(conf, 'show_points', e.key, 'v');
        control(conf, 'scale', e.key, '8', '9', 1 / 100, 1000, 1.2, true);
        control(conf, 'random_scale', e.key, '5', '7', 1, 200, 1.2, true);
        control(conf, 'pt_rad', e.key, '-', '=', 0.1, 10, 1.2, true);
        control(conf, 'feat_font_size', e.key, '[', ']', 3, 40, 1.2, true);
        this.redraw();
    };
    App.prototype.mount = function () {
        window.addEventListener('load', this.onload.bind(this));
        window.addEventListener('resize', this.onresize.bind(this));
        window.addEventListener('keydown', this.onkeydown.bind(this));
    };
    return App;
}());
