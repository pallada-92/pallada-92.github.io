/// <reference path="../libs/typescript/jquery@2.0.d.ts"/>

type Color = [number, number, number];

type TwoD = [number, number];

type Configuration = {
    basis: TwoD[],
    scale: number,
    random_scale: number,
    sel_feat_id: number,
    show_sel_scale: boolean,
    show_heights: boolean,
    recalc_random_on_move: boolean,
    color_std_mul: number,
    pt_rad: number,
    norm_feat: boolean,
    norm_after: boolean,
    show_basis: boolean,
    show_points: boolean,
    legend_colors: boolean,
    feat_font_size: number,
    groups: string[],
};

type DataCache = {
    feats: {
        avg: number,
        std: number,
    }[],
    random_deltas: TwoD[],
    zero: number[],
    norms: number[],
    groups: {
        [vector_id: number]: string[],
    },
};

type Data = {
    title: string,
    feat_names: string[],
    groups: {
        [group_id: string]: {
            label: string,
            vec_ids: number[],
            color: Color,
        }
    },
    vecs: number[][],
    cache: DataCache,
    sel_conf: number,
    conf: Configuration,
    saved_confs: Configuration[],
}[];

function rgb(rgb: Color) {
    return 'rgb(' + Math.round(rgb[0]) +
        ',' + Math.round(rgb[1]) +
        ',' + Math.round(rgb[2]) + ')';
}

function blend(color1: Color, color2: Color, t: number) {
    return [
        color1[0] * (1 - t) + color2[0] * t,
        color1[1] * (1 - t) + color2[1] * t,
        color1[2] * (1 - t) + color2[2] * t,
    ] as Color;
}

function cool_warm(t: number) {
    const warm: Color = [255, 0, 0];
    const mid: Color = [255, 255, 255];
    const cool: Color = [0, 0, 255];
    if (t <= 0) {
        t = Math.min(1, -t);
        return rgb(blend(mid, cool, t));
    } else {
        t = Math.min(1, t);
        return rgb(blend(mid, warm, t));
    }
}

function mul_vec(vec: number[], coeff: number): number[] {
    let res: number[] = [];
    for (let i = 0; i < vec.length; i++) {
        res.push(vec[i] * coeff);
    }
    return res;
}

function constrain(val, min, max) {
    return Math.min(max, Math.max(min, val));
}

function toggle(
    obj: any, prop: string,
    key: string, key_toggle: string,
) {
    if (key != key_toggle) return;
    obj[prop] = !obj[prop];
}

function cycle(
    obj: any, prop: string, count: number,
    key: string, key_down: string, key_up: string,
    onchange: (value: number) => void,
) {
    if (key != key_down && key != key_up) return;
    let val = obj[prop];
    if (key == key_down) {
        val += 1
    } else {
        val += count - 1;
    }
    val = val % count;
    console.log(prop, val);
    obj[prop] = val;
    onchange(val);
}

function control(
    obj: any, prop: string,
    key: string, key_down: string, key_up: string,
    min: number, max: number, step: number, log: boolean
) {
    if (key != key_up && key != key_down) return;
    let val = obj[prop];
    if (log) {
        val = Math.log(val);
        step = Math.log(step);
    }
    if (key == key_down) {
        val -= step;
    } else {
        val += step;
    }
    if (log) {
        val = Math.exp(val);
    }
    val = constrain(val, min, max);
    console.log(prop, val);
    obj[prop] = val;
}

class App {
    cur_data_id: number = 0;
    data: Data;
    canvas: HTMLCanvasElement;
    get w() {
        return this.canvas.width;
    }
    get h() {
        return this.canvas.height;
    }
    recalc_random() {
        for (let data_item of this.data) {
            data_item.cache.random_deltas = [];
            const vecs_count = data_item.vecs.length;
            for (let i = 0; i < vecs_count; i++) {
                const a = Math.random() * Math.PI * 2;
                const r = Math.random();
                data_item.cache.random_deltas.push([Math.cos(a) * r, Math.sin(a) * r]);
            }
        }
    }
    calc_feats() {
        for (let data_item of this.data) {
            const feat_count = data_item.feat_names.length;
            let sum: number[] = [];
            let sum_sq: number[] = [];
            for (let i = 0; i < feat_count; i++) {
                sum.push(0);
                sum_sq.push(0);
            }
            for (let vec of data_item.vecs) {
                for (let i = 0; i < vec.length; i++) {
                    let val = vec[i];
                    if (data_item.cache.norms.length > 0) {
                        const norm = data_item.cache.norms[i];
                        val /= norm;
                    }
                    sum[i] += val;
                    sum_sq[i] += val * val;
                }
            }
            const vecs_count = data_item.vecs.length;
            data_item.cache.feats = [];
            for (let i = 0; i < feat_count; i++) {
                const avg = sum[i] / vecs_count;
                data_item.cache.feats.push({
                    avg: avg,
                    std: Math.sqrt(sum_sq[i] / vecs_count - avg * avg),
                });
            }
        };
    }
    calc_norms() {
        for (let data_item of this.data) {
            data_item.cache.norms = [];
            for (let vec of data_item.vecs) {
                let norm = 0;
                for (let i = 0; i < vec.length; i++) {
                    const feat = data_item.cache.feats[i]
                    let val = vec[i];
                    if (data_item.cache.feats.length > 0) {
                        val = (val - feat.avg) / feat.std;
                    }
                    norm += val * val;
                }
                data_item.cache.norms.push(Math.sqrt(norm));
            }
        }
    }
    calc_cache() {
        for (let data_item of this.data) {
            let groups: { [vec_id: number]: string[] } = {};
            data_item.cache = {
                feats: [],
                random_deltas: [],
                zero: [],
                norms: [],
                groups,
            };
            for (let group in data_item.groups) {
                for (let vec_id of data_item.groups[group].vec_ids) {
                    if (!(vec_id in groups)) {
                        groups[vec_id] = [];
                    }
                    groups[vec_id].push(group);
                }
            }
        }
        // this.calc_norms();
        this.calc_feats();
        // this.calc_norms();
        // this.calc_feats();
        for (let data_item of this.data) {
            const feat_count = data_item.feat_names.length;
            for (let i = 0; i < feat_count; i++) {
                data_item.cache.zero.push(
                    data_item.cache.feats[i].avg
                );
            }
        }
        this.recalc_random();
    }
    get cur_data() {
        return this.data[this.cur_data_id];
    }
    get config() {
        return this.cur_data.conf;
    }
    add_vec(vec1: TwoD, vec2: TwoD, coeff: number = 1): TwoD {
        return [
            vec1[0] + vec2[0] * coeff,
            vec1[1] + vec2[1] * coeff,
        ]
    }
    pt2px(pt: TwoD): TwoD {
        const scale = this.config.scale;
        return [
            this.w / 2 + pt[0] * scale,
            this.h / 2 + pt[1] * scale,
        ];
    }
    px2pt(px: TwoD): TwoD {
        const scale = this.config.scale;
        return [
            (px[0] - this.w / 2) / scale,
            (px[1] - this.h / 2) / scale,
        ];
    }
    dpx2dpt(dpx: TwoD): TwoD {
        const scale = this.config.scale;
        return [
            dpx[0] / scale,
            dpx[1] / scale,
        ];
    }
    vec2pt(vec: number[]): TwoD {
        let res: TwoD = [0, 0];
        const basis = this.config.basis;
        const cfeats = this.cur_data.cache.feats;
        let norm;
        if (this.config.norm_after) {
            norm = 0;
            for (let i = 0; i < basis.length; i++) {
                const val = (vec[i] - cfeats[i].avg) / cfeats[i].std;
                norm += val * val;
            }
            norm = Math.sqrt(norm);
        } else {
            norm = 1;
        }
        for (let i = 0; i < basis.length; i++) {
            const val = (vec[i] - cfeats[i].avg) / cfeats[i].std / norm;
            res[0] += val * basis[i][0];
            res[1] += val * basis[i][1];
        }
        return res;
    }
    redraw() {
        if (!this.canvas) return;
        const ctx = this.canvas.getContext('2d');
        if (!ctx) return;
        if (!this.data) return;
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, this.w, this.h);
        const data = this.data[this.cur_data_id];
        const sel_feat = this.config.sel_feat_id;
        const cfeat = data.cache.feats[sel_feat];
        ctx.fillStyle = 'white';
        ctx.font = '20px Helvetica';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        ctx.fillText(data.feat_names[sel_feat], this.w - 10, 10);
        let stdr = cfeat.std * this.config.color_std_mul;
        const fixed = 5;
        ctx.font = '16px Helvetica';
        ctx.textBaseline = 'bottom';
        ctx.fillStyle = cool_warm(1);
        ctx.fillText((cfeat.avg + stdr).toFixed(fixed), this.w - 10, 60);
        ctx.fillStyle = cool_warm(0);
        ctx.fillText((cfeat.avg).toFixed(fixed), this.w - 10, 80);
        ctx.fillStyle = cool_warm(-1);
        ctx.fillText((cfeat.std - stdr).toFixed(fixed), this.w - 10, 100);
        const basis = data.conf.basis;
        const pt_rad = this.config.pt_rad;
        for (let vec_id in data.vecs) {
            if (!(data.conf.show_points)) continue;
            if (!(vec_id in data.cache.groups)) continue;
            for (let group of data.cache.groups[vec_id]) {
                if (data.conf.groups.indexOf(group) == -1) continue;
                const color = data.groups[group].color;
                const vec = data.vecs[vec_id];
                const pt = this.vec2pt(vec);
                const px = this.add_vec(
                    this.pt2px(pt),
                    data.cache.random_deltas[vec_id],
                    data.conf.random_scale
                );
                if (data.conf.legend_colors) {
                    ctx.fillStyle = rgb(color);
                } else {
                    ctx.fillStyle = cool_warm((vec[sel_feat] - cfeat.avg) / cfeat.std / this.config.color_std_mul);
                }
                ctx.beginPath();
                ctx.arc(px[0], px[1], pt_rad, 0, 2 * Math.PI, false);
                ctx.fill();
                let vec1 = data.vecs[vec_id].slice();
                vec1[sel_feat] = cfeat.avg;
                const pt1 = this.vec2pt(vec1);
                const px1 = this.add_vec(
                    this.pt2px(pt1),
                    data.cache.random_deltas[vec_id],
                    data.conf.random_scale
                );
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
            const px0 = this.pt2px([0, 0]);
            for (let i = 0; i < basis.length; i++) {
                let zeros1 = data.cache.zero.slice();
                zeros1[i] += this.config.color_std_mul * data.cache.feats[i].std;
                const pt = this.vec2pt(zeros1);
                const px = this.pt2px(pt);
                if (i == sel_feat) {
                    let grad = ctx.createLinearGradient(px0[0], px0[1], px[0], px[1]);
                    grad.addColorStop(1, cool_warm(1));
                    grad.addColorStop(0, cool_warm(0));
                    ctx.fillStyle = grad;
                    ctx.strokeStyle = grad;
                } else {
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
        let legend_pos = 0;
        ctx.fillStyle = 'white';
        ctx.font = '26px Helvetica';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(this.cur_data.title, 20, 20);
        const legend_xy = [20.5, 70.5];
        const legend_rect_size = 15;
        const legend_row_h = 20;
        for (let group of this.config.groups) {
            let color: Color;
            if (data.conf.legend_colors) {
                color = data.groups[group].color;
            } else {
                color = [100, 100, 100];
            }
            ctx.fillStyle = rgb(color);
            ctx.beginPath();
            ctx.rect(
                legend_xy[0],
                legend_xy[1] + legend_row_h * legend_pos,
                legend_rect_size, legend_rect_size
            )
            ctx.fill();
            ctx.fillStyle = 'lightgray';
            ctx.font = 'bold 15px Helvetica';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'bottom';
            let label = data.groups[group].label;
            ctx.fillText(
                label,
                legend_xy[0] + legend_rect_size * 2,
                legend_xy[1] + legend_row_h * legend_pos + legend_rect_size,
            );
            legend_pos++;
        }
    }
    mousedown_px: TwoD;
    mousedown_pt: TwoD;
    onmousedown(e: MouseEvent) {
        const px: TwoD = [e.clientX, e.clientY];
        this.mousedown_px = px;
        const sel_feat = this.config.sel_feat_id;
        this.mousedown_pt = this.config.basis[sel_feat];
    }
    onmouseup() {
        delete this.mousedown_px;
    }
    onmousemove(e: MouseEvent) {
        if (e.buttons == 0 || !this.mousedown_px) return;
        const dpx: TwoD = [
            e.clientX - this.mousedown_px[0],
            e.clientY - this.mousedown_px[1],
        ];
        const dpt = this.dpx2dpt(dpx);
        const sel_feat = this.config.sel_feat_id;
        this.config.basis[sel_feat] = [
            this.mousedown_pt[0] + dpt[0],
            this.mousedown_pt[1] + dpt[1],
        ];
        if (this.config.recalc_random_on_move) {
            this.recalc_random();
        }
        this.redraw();
        this.onmousedown(e);
    }
    onresize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.canvas.getContext('2d')
        this.redraw();
    }
    onload() {
        this.canvas = document.createElement('canvas');
        document.body.appendChild(this.canvas);
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0px';
        this.canvas.style.left = '0px';
        this.onresize();
        this.canvas.addEventListener('mousedown', this.onmousedown.bind(this));
        this.canvas.addEventListener('mousemove', this.onmousemove.bind(this));
        window.addEventListener('mouseup', this.onmouseup.bind(this));
        $.getJSON('/json/thread_feats1.json', (data: Data) => {
            this.data = data;
            this.calc_cache();
            document.title = 'Многомерная визуализация';
            this.redraw();
        });
    }
    onkeydown(e: KeyboardEvent) {
        console.log(e.key);
        const conf = this.cur_data.conf;
        if (e.key == '6') {
            this.recalc_random();
        }
        cycle(
            conf, 'sel_feat_id',
            this.cur_data.feat_names.length,
            e.key, 'z', 'x', () => {
                const sel_feat = this.config.sel_feat_id;
                this.mousedown_pt = this.config.basis[sel_feat];
            }
        );
        cycle(
            this, 'cur_data_id',
            this.data.length,
            e.key, '1', '2', () => { },
        );
        cycle(
            this.cur_data, 'sel_conf',
            this.cur_data.saved_confs.length,
            e.key, '3', '4', (val) => {
                this.cur_data.conf = JSON.parse(JSON.stringify(
                    this.cur_data.saved_confs[val]
                ));
            }
        );
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
    }
    mount() {
        window.addEventListener('load', this.onload.bind(this));
        window.addEventListener('resize', this.onresize.bind(this));
        window.addEventListener('keydown', this.onkeydown.bind(this));
    }
}
