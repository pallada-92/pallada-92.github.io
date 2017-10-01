namespace Time {

    export type Stamp = number;
    export type Range = [Stamp, Stamp];

    export const min = 60;
    export const hour = 60 * 60;
    export const day = 24 * 60 * 60;
    export const year = 365 * day;
    export const month = 30 * day;

    export const months3 = ['Jan', 'Feb', 'Mar', 'Apr', 'May',
        'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    export const weekdays3 = ['Sun', 'Mon', 'Tue',
        'Wed', 'Thu', 'Fri', 'Sat'];
    export const levels = ['sec', 'min', 'hour',
        'day', 'month', 'year'];
    export const default_vals = {
        year: 1970,
        month: 0,
        day: 1,
        hour: 0,
        min: 0,
        sec: 0,
    };

    let shift = 3 * hour;
    export type DateDicOut = {
        year: number, month: number, day: number, weekday: number,
        hour: number, min: number, sec: number, holyday: boolean,
    };
    export type DateDicIn = {
        year: number, month: number, day: number,
        hour: number, min: number, sec: number,
    };

    export function stamp2date(stamp: Stamp): DateDicOut {
        let a = new Date((stamp + shift) * 1000);
        return {
            year: a.getUTCFullYear(),
            month: a.getUTCMonth(),
            day: a.getUTCDate(),
            weekday: a.getUTCDay(),
            holyday: a.getUTCDay() == 0 || a.getUTCDay() == 6,
            hour: a.getUTCHours(),
            min: a.getUTCMinutes(),
            sec: a.getUTCSeconds(),
        }
    }

    export function date2stamp(date: DateDicIn): number {
        return Date.UTC(
            date.year, date.month, date.day,
            date.hour, date.min, date.sec
        ) / 1000 - shift;
    }

    export function time24to12(hours24: number): string {
        let suff = (hours24 >= 12) ? 'pm' : 'am';
        let hours12;
        if (hours24 == 0 || hours24 == 12) {
            hours12 = 12;
        } else if (hours24 > 12) {
            hours12 = hours24 - 12;
        } else {
            hours12 = hours24;
        }
        return two_digit(hours12) + suff;
    }

    export function format_date(
        date: DateDicIn,
        level: number
    ): string {
        let res = [
            date.year,
            ' ' + months3[date.month],
            ' ' + date.day,
            ' ' + two_digit(date.hour),
            ':' + two_digit(date.min),
        ];
        return res.slice(0, res.length - level + 1).join('');
    }

    export function round_date(date: DateDicIn, level: string) {
        for (let cur_level of levels) {
            if (cur_level == level) break;
            date[cur_level] = Time.default_vals[cur_level];
        }
    }

}

namespace TimelineScaleNS {

    const max_date_level = 6;

    export function date_level(date: Time.DateDicIn): number {
        let level_id: number = 0;
        for (let level of Time.levels) {
            if (date[level] != Time.default_vals[level]) {
                return level_id;
            }
            level_id += 1;
        }
        return max_date_level;
    }

    function format_label(
        val: number, level_name: string
    ): string {
        if (level_name == 'month') {
            return Time.months3[val];
        } else if (level_name == 'weekday') {
            return Time.weekdays3[val];
        } else if (level_name == 'hour') {
            return Time.time24to12(val);
        } else if (level_name == 'min') {
            return ':' + two_digit(val);
        } else {
            return '' + val;
        }
    }

    class Label {
        visible: boolean = true;
        width: number = 0;
        constructor(
            public level: number,
            public left: number,
            public text: string,
            public style: string,
        ) { }
        get right() {
            return this.left + this.width;
        }
    }

    export class TimelineScale {
        public label_left_pad: number = 3;
        public label_right_pad: number = 5;
        public label_top_pad: number = 10;
        public tick_bottom_space: number = 3;
        public min_tick_dist: number = 3;
        public tick_size_step: number = 8;
        public range: Time.Range;
        public width: number;
        protected step_level: number = 0;
        protected labels: Label[] = [];
        public stamp2pos(stamp: Time.Stamp): number {
            return this.width *
                (stamp - this.range[0]) /
                (this.range[1] - this.range[0]);
        }
        public pos2stamp(pos: number): Time.Stamp {
            return pos / this.width *
                (this.range[1] - this.range[0]) +
                this.range[0];
        }
        protected calc_width(label: Label, draw: Draw) {
            label.width = this.label_left_pad +
                draw.measure_width(label.text) +
                this.label_right_pad;
        }
        protected correct(label: Label, other: Label) {
            if (label.right <= other.left) return;
            if (other.right <= label.left) return;
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
            } else {
                other.visible = false;
            }
        }
        protected step_level_name() {
            let dur = this.range[1] - this.range[0];
            let ratio = dur * this.min_tick_dist / this.width;
            for (let level of Time.levels) {
                if (ratio < Time[level]) {
                    return level;
                }
            }
            return 'year';
        }
        public recalc_labels(draw: Draw) {
            this.labels = [];
            let step_level_name = this.step_level_name();
            this.step_level = Time.levels.indexOf(step_level_name);
            let date = Time.stamp2date(this.range[1]);
            Time.round_date(date, step_level_name);
            while (true) {
                let stamp = Time.date2stamp(date);
                date = Time.stamp2date(stamp);
                let last_iter = stamp <= this.range[0];
                let level, pos, text, style;
                if (!last_iter) {
                    level = date_level(date);
                    let level_name = Time.levels[level];
                    if (level_name == 'day' && date.holyday) {
                        style = 'holyday';
                    } else {
                        style = 'normal';
                    }
                    let val = date[level_name];
                    pos = this.stamp2pos(stamp);
                    text = format_label(val, level_name);
                } else {
                    style = 'leftmost';
                    level = max_date_level + 1;
                    pos = 0;
                    text = Time.format_date(date, this.step_level);
                }
                let label = new Label(level, pos, text, style);
                this.calc_width(label, draw);
                for (let i = this.labels.length - 1; i >= 0; i--) {
                    let other = this.labels[i];
                    if (label.right <= other.left) break;
                    this.correct(label, other);
                }
                this.labels.push(label);
                date[step_level_name] -= 1;
                if (last_iter) break;
            }
        }
        protected draw_label(label: Label, draw: Draw) {
            let level = Math.min(label.level, max_date_level - 1);
            let tick_size = (level - this.step_level + 1) *
                this.tick_size_step;
            if (label.visible) {
                draw.text(
                    label.text, [
                        label.left + this.label_left_pad,
                        this.label_top_pad + tick_size,
                    ],
                    label.style != 'holyday' ?
                        'black' : 'darkred'
                );
            }
            if (label.style != 'leftmost') {
                draw.line(
                    [
                        label.left,
                        0,
                    ], [
                        label.left,
                        tick_size,
                    ]
                ).stroke('black', 1);
            }
        }
        protected draw_labels(draw: Draw) {
            for (let label of this.labels) {
                this.draw_label(label, draw);
            }
        }
        public draw(draw: Draw) {
            this.recalc_labels(draw);
            this.draw_labels(draw);
        }
    }

}

import TimelineScale = TimelineScaleNS.TimelineScale;

namespace TimelineNS {

    const enum Mode {
        Making,
        Moving,
    }

    class TCanvasComponent extends CanvasComponent {
        scale: TimelineScale;
        mode: Mode;
        movingrange_shift: number;
        movingrange_len: number;
        makingrange_start: number;
        constructor(
            public timeline: Timeline,
        ) {
            super();
            this.scale = new TimelineScale();
        }
        set range(range: Time.Range) {
            this.scale.range = range;
        }
        onmousedown(pt: Pt) {
            let stamp = this.scale.pos2stamp(pt[0]);
            let sel_range = this.timeline.sel_range;
            if (inside_range(stamp, this.timeline.sel_range)) {
                this.mode = Mode.Moving;
                this.movingrange_shift = stamp - sel_range[0];
                this.movingrange_len = sel_range[1] - sel_range[0];
            } else {
                this.mode = Mode.Making;
                this.makingrange_start = stamp;
            }
        }
        onmousedrag(pt: Pt) {
            let stamp = this.scale.pos2stamp(pt[0]);
            if (this.mode == Mode.Moving) {
                let x0 = stamp - this.movingrange_shift;
                this.timeline.set_sel_range(
                    [x0, x0 + this.movingrange_len]
                );
            } else if (this.mode == Mode.Making) {
                let v0 = this.makingrange_start;
                let v1 = stamp;
                this.timeline.set_sel_range(
                    [Math.min(v0, v1), Math.max(v0, v1)]
                );
            }
            this.redraw();
        }
        draw_sel_range(draw: Draw) {
            let sel_range = this.timeline.sel_range;
            let x0 = this.scale.stamp2pos(sel_range[0]);
            let x1 = this.scale.stamp2pos(sel_range[1]);
            draw.ctx.fillStyle = 'lightblue';
            draw.ctx.fillRect(x0, 0, x1 - x0, this.h);
        }
        draw(draw: Draw) {
            this.draw_sel_range(draw);
            this.scale.width = this.w;
            this.scale.draw(draw);
        }
    }

    export class Timeline {
        component: TCanvasComponent;
        sel_range: Time.Range;
        graph: PrivateGraph;
        constructor() {
            this.component = new TCanvasComponent(this);
            this.component.range = [0, 0];
            this.sel_range = [0, 0];
        }
        set range(range: Time.Range) {
            this.component.range = range;
        }
        set_sel_range(range: Time.Range) {
            this.sel_range = range;
            this.graph.stamp_range = range;
            this.graph.graph.weights =
                this.graph.priv_stamps.get_slice(range);
            this.graph.graph.calc_max_weight();
        }
    }

}

import Timeline = TimelineNS.Timeline;
