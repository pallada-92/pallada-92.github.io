var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var Time;
(function (Time) {
    Time.min = 60;
    Time.hour = 60 * 60;
    Time.day = 24 * 60 * 60;
    Time.year = 365 * Time.day;
    Time.month = 30 * Time.day;
    Time.months3 = ['Jan', 'Feb', 'Mar', 'Apr', 'May',
        'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    Time.weekdays3 = ['Sun', 'Mon', 'Tue',
        'Wed', 'Thu', 'Fri', 'Sat'];
    Time.levels = ['sec', 'min', 'hour',
        'day', 'month', 'year'];
    Time.default_vals = {
        year: 1970,
        month: 0,
        day: 1,
        hour: 0,
        min: 0,
        sec: 0,
    };
    var shift = 3 * Time.hour;
    function stamp2date(stamp) {
        var a = new Date((stamp + shift) * 1000);
        return {
            year: a.getUTCFullYear(),
            month: a.getUTCMonth(),
            day: a.getUTCDate(),
            weekday: a.getUTCDay(),
            holyday: a.getUTCDay() == 0 || a.getUTCDay() == 6,
            hour: a.getUTCHours(),
            min: a.getUTCMinutes(),
            sec: a.getUTCSeconds(),
        };
    }
    Time.stamp2date = stamp2date;
    function date2stamp(date) {
        return Date.UTC(date.year, date.month, date.day, date.hour, date.min, date.sec) / 1000 - shift;
    }
    Time.date2stamp = date2stamp;
    function time24to12(hours24) {
        var suff = (hours24 >= 12) ? 'pm' : 'am';
        var hours12;
        if (hours24 == 0 || hours24 == 12) {
            hours12 = 12;
        }
        else if (hours24 > 12) {
            hours12 = hours24 - 12;
        }
        else {
            hours12 = hours24;
        }
        return two_digit(hours12) + suff;
    }
    Time.time24to12 = time24to12;
    function format_date(date, level) {
        var res = [
            date.year,
            ' ' + Time.months3[date.month],
            ' ' + date.day,
            ' ' + two_digit(date.hour),
            ':' + two_digit(date.min),
        ];
        return res.slice(0, res.length - level + 1).join('');
    }
    Time.format_date = format_date;
    function round_date(date, level) {
        for (var _i = 0, levels_1 = Time.levels; _i < levels_1.length; _i++) {
            var cur_level = levels_1[_i];
            if (cur_level == level)
                break;
            date[cur_level] = Time.default_vals[cur_level];
        }
    }
    Time.round_date = round_date;
})(Time || (Time = {}));
var TimelineScaleNS;
(function (TimelineScaleNS) {
    var max_date_level = 6;
    function date_level(date) {
        var level_id = 0;
        for (var _i = 0, _a = Time.levels; _i < _a.length; _i++) {
            var level = _a[_i];
            if (date[level] != Time.default_vals[level]) {
                return level_id;
            }
            level_id += 1;
        }
        return max_date_level;
    }
    TimelineScaleNS.date_level = date_level;
    function format_label(val, level_name) {
        if (level_name == 'month') {
            return Time.months3[val];
        }
        else if (level_name == 'weekday') {
            return Time.weekdays3[val];
        }
        else if (level_name == 'hour') {
            return Time.time24to12(val);
        }
        else if (level_name == 'min') {
            return ':' + two_digit(val);
        }
        else {
            return '' + val;
        }
    }
    var Label = (function () {
        function Label(level, left, text, style) {
            this.level = level;
            this.left = left;
            this.text = text;
            this.style = style;
            this.visible = true;
            this.width = 0;
        }
        Object.defineProperty(Label.prototype, "right", {
            get: function () {
                return this.left + this.width;
            },
            enumerable: true,
            configurable: true
        });
        return Label;
    }());
    var TimelineScale = (function () {
        function TimelineScale() {
            this.label_left_pad = 3;
            this.label_right_pad = 5;
            this.label_top_pad = 10;
            this.tick_bottom_space = 3;
            this.min_tick_dist = 3;
            this.tick_size_step = 8;
            this.step_level = 0;
            this.labels = [];
        }
        TimelineScale.prototype.stamp2pos = function (stamp) {
            return this.width *
                (stamp - this.range[0]) /
                (this.range[1] - this.range[0]);
        };
        TimelineScale.prototype.pos2stamp = function (pos) {
            return pos / this.width *
                (this.range[1] - this.range[0]) +
                this.range[0];
        };
        TimelineScale.prototype.calc_width = function (label, draw) {
            label.width = this.label_left_pad +
                draw.measure_width(label.text) +
                this.label_right_pad;
        };
        TimelineScale.prototype.correct = function (label, other) {
            if (label.right <= other.left)
                return;
            if (other.right <= label.left)
                return;
            if (!other.visible) {
                if (label.level < other.level) {
                    label.visible = false;
                }
                return;
            }
            if (!label.visible) {
                if (label.level > other.level) {
                    other.visible = false;
                }
                return;
            }
            if (label.level <= other.level) {
                label.visible = false;
            }
            else {
                other.visible = false;
            }
        };
        TimelineScale.prototype.step_level_name = function () {
            var dur = this.range[1] - this.range[0];
            var ratio = dur * this.min_tick_dist / this.width;
            for (var _i = 0, _a = Time.levels; _i < _a.length; _i++) {
                var level = _a[_i];
                if (ratio < Time[level]) {
                    return level;
                }
            }
            return 'year';
        };
        TimelineScale.prototype.recalc_labels = function (draw) {
            this.labels = [];
            var step_level_name = this.step_level_name();
            this.step_level = Time.levels.indexOf(step_level_name);
            var date = Time.stamp2date(this.range[1]);
            Time.round_date(date, step_level_name);
            while (true) {
                var stamp = Time.date2stamp(date);
                date = Time.stamp2date(stamp);
                var last_iter = stamp <= this.range[0];
                var level = void 0, pos = void 0, text = void 0, style = void 0;
                if (!last_iter) {
                    level = date_level(date);
                    var level_name = Time.levels[level];
                    if (level_name == 'day' && date.holyday) {
                        style = 'holyday';
                    }
                    else {
                        style = 'normal';
                    }
                    var val = date[level_name];
                    pos = this.stamp2pos(stamp);
                    text = format_label(val, level_name);
                }
                else {
                    style = 'leftmost';
                    level = max_date_level + 1;
                    pos = 0;
                    text = Time.format_date(date, this.step_level);
                }
                var label = new Label(level, pos, text, style);
                this.calc_width(label, draw);
                for (var i = this.labels.length - 1; i >= 0; i--) {
                    var other = this.labels[i];
                    if (label.right <= other.left)
                        break;
                    this.correct(label, other);
                }
                this.labels.push(label);
                date[step_level_name] -= 1;
                if (last_iter)
                    break;
            }
        };
        TimelineScale.prototype.draw_label = function (label, draw) {
            var level = Math.min(label.level, max_date_level - 1);
            var tick_size = (level - this.step_level + 1) *
                this.tick_size_step;
            if (label.visible) {
                draw.text(label.text, [
                    label.left + this.label_left_pad,
                    this.label_top_pad + tick_size,
                ], label.style != 'holyday' ?
                    'black' : 'darkred');
            }
            if (label.style != 'leftmost') {
                draw.line([
                    label.left,
                    0,
                ], [
                    label.left,
                    tick_size,
                ]).stroke('black', 1);
            }
        };
        TimelineScale.prototype.draw_labels = function (draw) {
            for (var _i = 0, _a = this.labels; _i < _a.length; _i++) {
                var label = _a[_i];
                this.draw_label(label, draw);
            }
        };
        TimelineScale.prototype.draw = function (draw) {
            this.recalc_labels(draw);
            this.draw_labels(draw);
        };
        return TimelineScale;
    }());
    TimelineScaleNS.TimelineScale = TimelineScale;
})(TimelineScaleNS || (TimelineScaleNS = {}));
var TimelineScale = TimelineScaleNS.TimelineScale;
var TimelineNS;
(function (TimelineNS) {
    var Mode;
    (function (Mode) {
        Mode[Mode["Making"] = 0] = "Making";
        Mode[Mode["Moving"] = 1] = "Moving";
    })(Mode || (Mode = {}));
    var TCanvasComponent = (function (_super) {
        __extends(TCanvasComponent, _super);
        function TCanvasComponent(timeline) {
            var _this = _super.call(this) || this;
            _this.timeline = timeline;
            _this.scale = new TimelineScale();
            return _this;
        }
        Object.defineProperty(TCanvasComponent.prototype, "range", {
            set: function (range) {
                this.scale.range = range;
            },
            enumerable: true,
            configurable: true
        });
        TCanvasComponent.prototype.onmousedown = function (pt) {
            var stamp = this.scale.pos2stamp(pt[0]);
            var sel_range = this.timeline.sel_range;
            if (inside_range(stamp, this.timeline.sel_range)) {
                this.mode = 1;
                this.movingrange_shift = stamp - sel_range[0];
                this.movingrange_len = sel_range[1] - sel_range[0];
            }
            else {
                this.mode = 0;
                this.makingrange_start = stamp;
            }
        };
        TCanvasComponent.prototype.onmousedrag = function (pt) {
            var stamp = this.scale.pos2stamp(pt[0]);
            if (this.mode == 1) {
                var x0 = stamp - this.movingrange_shift;
                this.timeline.set_sel_range([x0, x0 + this.movingrange_len]);
            }
            else if (this.mode == 0) {
                var v0 = this.makingrange_start;
                var v1 = stamp;
                this.timeline.set_sel_range([Math.min(v0, v1), Math.max(v0, v1)]);
            }
            this.redraw();
        };
        TCanvasComponent.prototype.draw_sel_range = function (draw) {
            var sel_range = this.timeline.sel_range;
            var x0 = this.scale.stamp2pos(sel_range[0]);
            var x1 = this.scale.stamp2pos(sel_range[1]);
            draw.ctx.fillStyle = 'lightblue';
            draw.ctx.fillRect(x0, 0, x1 - x0, this.h);
        };
        TCanvasComponent.prototype.draw = function (draw) {
            this.draw_sel_range(draw);
            this.scale.width = this.w;
            this.scale.draw(draw);
        };
        return TCanvasComponent;
    }(CanvasComponent));
    var Timeline = (function () {
        function Timeline() {
            this.component = new TCanvasComponent(this);
            this.component.range = [0, 0];
            this.sel_range = [0, 0];
        }
        Object.defineProperty(Timeline.prototype, "range", {
            set: function (range) {
                this.component.range = range;
            },
            enumerable: true,
            configurable: true
        });
        Timeline.prototype.set_sel_range = function (range) {
            this.sel_range = range;
            this.graph.stamp_range = range;
            this.graph.graph.weights =
                this.graph.priv_stamps.get_slice(range);
            this.graph.graph.calc_max_weight();
        };
        return Timeline;
    }());
    TimelineNS.Timeline = Timeline;
})(TimelineNS || (TimelineNS = {}));
var Timeline = TimelineNS.Timeline;
