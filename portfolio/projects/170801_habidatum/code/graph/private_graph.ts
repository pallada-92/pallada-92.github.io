//--------------------------------------------------------------------

namespace PrivateGraphNS {

    type Weight = number;
    type VertexLabel = string;
    type VertexId = number;
    type EdgeInfo = [VertexId, VertexId, Weight, Weight]
    type EdgesWeights = EdgeInfo[];
    type RawData = {
        [edge_labels: string]: Time.Stamp[]
    };

    function count_stamps(stamps: Time.Stamp[], range: Time.Range) {
        let min_id = bin_search(stamps, range[0]);
        let max_id = bin_search(stamps, range[1]);
        min_id = Math.ceil(min_id);
        max_id = Math.floor(max_id);
        return max_id - min_id + 1;
    }

    class Graph {
        get vertex_count() {
            return this.labels.length;
        }
        public labels: VertexLabel[] = [];
        public vertex_pos: Pt[] = [];
        public weights: EdgesWeights = [];
        public max_weight: number;
        calc_max_weight() {
            let res = 0;
            for (let edge of this.weights) {
                res = Math.max(res, edge[2], edge[3]);
            }
            this.max_weight = res;
        }
    }

    class TCanvasComponent extends CanvasComponent {
        dragging_vertex_id: VertexId = -1;
        dragging_init_pos: Pt;
        bg: HTMLImageElement;
        constructor(
            public graph: Graph,
            public main: PrivateGraph,
        ) {
            super();
            this.bg = new Image();
            this.bg.src = '/resources/scheme.jpg';
        }
        is_visible: boolean[] = [];
        set_is_visible() {
            let res: boolean[] = [];
            for (let label of this.graph.labels) {
                res.push(this.roles[label] != '');
            }
            this.is_visible = res;
        }
        colors: Color[] = [];
        set_colors() {
            let colors = {
                '': 'red',
                data_scientist: 'rgb(255, 150, 0)', // orange-red
                analyst: 'rgb(255, 200, 0)', // yellow-orange
                designer: 'rgb(255, 0, 95)', // pink
                frontend: 'rgb(163, 0, 255)', // pirple-blue
                backend: 'rgb(77, 0, 255)', // blue
                other: 'gray',
            };
            let res: Color[] = [];
            for (let label of this.graph.labels) {
                res.push(colors[this.roles[label]]);
            }
            this.colors = res;
        }
        vertex_circle(id: VertexId): Geom.Circ {
            return [
                this.graph.vertex_pos[id][0],
                this.graph.vertex_pos[id][1],
                5,
            ] as Geom.Circ;
        }
        which_vertex(pt: Pt): VertexId {
            for (let i = 0; i < this.graph.vertex_count; i++) {
                let circ = this.vertex_circle(i);
                if (Geom.inside_circ(pt, circ)) {
                    return i;
                }
            }
            return -1;
        }
        onmousedown(pt: Pt) {
            let id = this.which_vertex(pt);
            this.dragging_vertex_id = id
            if (id == -1) return;
            if (!this.is_visible[id]) {
                this.dragging_vertex_id = -1;
                return;
            }
            p(this.graph.labels[id]);
            this.dragging_init_pos = this.graph.vertex_pos[id];
        };
        onmousemove(pt: Pt) { };
        onmousedrag(pt: Pt, delta: Pt) {
            let id = this.dragging_vertex_id;
            if (id == -1) return;
            this.graph.vertex_pos[id] = Geom.add(
                this.dragging_init_pos,
                delta,
            );
            this.redraw();
        };
        onmouseup(pt: Pt) { };
        onkeydown(key: string) { };
        draw_edges(draw: Draw) {
            for (let i = 0; i < this.graph.weights.length; i++) {
                let [id1, id2, w12, w21] = this.graph.weights[i];
                if (!this.is_visible[id1] || !this.is_visible[id2]) {
                    continue;
                }
                const coeff = this.graph.max_weight / 5;
                if (coeff > 0) {
                    w12 /= coeff;
                    w21 /= coeff;
                }
                let pos1 = this.graph.vertex_pos[id1];
                let pos2 = this.graph.vertex_pos[id2];
                let col1 = this.colors[id1] as string;
                let col2 = this.colors[id2] as string;
                let grad = draw.ctx.createLinearGradient(
                    pos1[0], pos1[1], pos2[0], pos2[1],
                );
                grad.addColorStop(0, col1);
                grad.addColorStop(1, col2);
                if (Math.max(w12, w21) >= 1) {
                    draw.var_width_line(pos1, pos2, w12, w21)
                        .fill_grad(grad);
                } else {
                    draw.line(pos1, pos2)
                        .stroke_grad(grad, (w12 + w21) / 2);
                }
            }
        }
        draw_vertices(draw: Draw) {
            for (let i = 0; i < this.graph.vertex_count; i++) {
                if (!this.is_visible[i]) continue;
                let label = this.graph.labels[i];
                let [name, surname] = label.split(' ');
                let role = {
                    '': 'red',
                    data_scientist: 'data scientist', // orange-red
                    analyst: 'analyst', // yellow-orange
                    designer: 'desginer', // pink
                    frontend: 'frontend', // pirple-blue
                    backend: 'backend', // blue
                    other: 'other',
                }[this.roles[label]];
                if (name == 'Anna') {
                    label = name + ' ' + surname[0];
                } else {
                    label = name;
                }
                label = role; // + ' ' + i;
                draw.circle(this.vertex_circle(i))
                    .fill(this.colors[i])
                    .text(label,
                    Geom.add(
                        this.graph.vertex_pos[i],
                        [8, 5],
                    ),
                    'black',
                );
            }
        }
        draw_bg(draw: Draw) {
            let ctx = draw.ctx;
            let bg = this.bg;
            ctx.save();
            ctx.scale(0.4, 0.4);
            ctx.globalAlpha = this.main.bg_alpha;
            ctx.drawImage(bg, 0, 0, bg.width, bg.height);
            ctx.restore();
        }
        draw(draw: Draw) {
            this.draw_bg(draw);
            this.draw_edges(draw);
            this.draw_vertices(draw);
        };
    }

    class PrivateGraphStamps extends Download<RawData> {
        labels: string[] = [];
        stamp_range: Time.Range;
        max_weight: number;
        get vertex_count() {
            return this.labels.length;
        }
        private calc_labels() {
            if (this.data === undefined) throw Error();
            let labels: string[] = [];
            let temp: { [label: string]: any } = {};
            for (let edge_labels in this.data) {
                let [label1, label2] = edge_labels.split('-');
                temp[label1] = 1;
                temp[label2] = 1;
            }
            let res: string[] = [];
            for (let label in temp) {
                res.push(label);
            }
            res.sort();
            this.labels = res;
        }
        calc_stamp_range() {
            if (this.data === undefined) throw Error();
            let min = +Infinity;
            let max = -Infinity;
            for (let edge_labels in this.data) {
                let stamps = this.data[edge_labels];
                min = Math.min(min, stamps[0]);
                max = Math.max(max, stamps[stamps.length - 1]);
            }
            this.stamp_range = [min, max];
        }
        subclass_after_load() {
            this.calc_labels();
            this.calc_stamp_range();
        }
        public get_slice(range: Time.Range): EdgesWeights {
            if (this.data === undefined) throw Error();
            let res: EdgesWeights = [];
            let temp: {
                [edge_weights: string]: EdgeInfo
            } = {};
            for (let edge_labels in this.data) {
                let stamps = this.data[edge_labels];
                if (edge_labels in temp) {
                    temp[edge_labels][3] =
                        count_stamps(stamps, range);
                } else {
                    let [label1, label2] = edge_labels.split('-');
                    let item: EdgeInfo = [
                        this.labels.indexOf(label1),
                        this.labels.indexOf(label2),
                        count_stamps(stamps, range),
                        0,
                    ];
                    res.push(item);
                    let inv_labels: string = label2 + '-' + label1;
                    temp[inv_labels] = item;
                }
            }
            return res;
        }
    }

    export class PrivateGraph {
        priv_stamps: PrivateGraphStamps;
        graph: Graph;
        component: TCanvasComponent;
        stamp_range: Time.Range;
        max_weight: number;
        bg_alpha: number = 0.1;
        constructor(
            public timeline: Timeline
        ) {
            this.priv_stamps = new PrivateGraphStamps(
                'PrivateGraphStamps1',
                this.on_data_load.bind(this),
            );
            this.graph = new Graph();
            this.component = new TCanvasComponent(
                this.graph,
                this
            );
        }
        start_loading() {
            this.priv_stamps.load();
        }
        save_vertex_pos() {
            localStorage.setItem(
                'vertex_pos',
                JSON.stringify(this.graph.vertex_pos)
            );
        }
        load_vertex_pos() {
            this.graph.vertex_pos = JSON.parse(
                localStorage.getItem('vertex_pos') || '[]'
            );
        }
        on_data_load() {
            this.graph.labels = this.priv_stamps.labels;
            this.stamp_range = this.priv_stamps.stamp_range;
            this.graph.weights = this.priv_stamps.get_slice(
                this.stamp_range
            );
            this.component.set_colors();
            this.component.set_is_visible();
            this.graph.calc_max_weight();
            this.timeline.range = this.stamp_range;
            this.component.redraw();
        }
    }

}

import PrivateGraph = PrivateGraphNS.PrivateGraph;
