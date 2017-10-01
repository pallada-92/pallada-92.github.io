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
var PrivateGraphNS;
(function (PrivateGraphNS) {
    function count_stamps(stamps, range) {
        var min_id = bin_search(stamps, range[0]);
        var max_id = bin_search(stamps, range[1]);
        min_id = Math.ceil(min_id);
        max_id = Math.floor(max_id);
        return max_id - min_id + 1;
    }
    var Graph = (function () {
        function Graph() {
            this.labels = [];
            this.vertex_pos = [];
            this.weights = [];
        }
        Object.defineProperty(Graph.prototype, "vertex_count", {
            get: function () {
                return this.labels.length;
            },
            enumerable: true,
            configurable: true
        });
        Graph.prototype.calc_max_weight = function () {
            var res = 0;
            for (var _i = 0, _a = this.weights; _i < _a.length; _i++) {
                var edge = _a[_i];
                res = Math.max(res, edge[2], edge[3]);
            }
            this.max_weight = res;
        };
        return Graph;
    }());
    var TCanvasComponent = (function (_super) {
        __extends(TCanvasComponent, _super);
        function TCanvasComponent(graph, main) {
            var _this = _super.call(this) || this;
            _this.graph = graph;
            _this.main = main;
            _this.dragging_vertex_id = -1;
            _this.roles = {};
            _this.is_visible = [];
            _this.colors = [];
            _this.bg = new Image();
            _this.bg.src = '/resources/scheme.jpg';
            return _this;
        }
        TCanvasComponent.prototype.set_is_visible = function () {
            var res = [];
            for (var _i = 0, _a = this.graph.labels; _i < _a.length; _i++) {
                var label = _a[_i];
                res.push(this.roles[label] != '');
            }
            this.is_visible = res;
        };
        TCanvasComponent.prototype.set_colors = function () {
            var colors = {
                '': 'red',
                data_scientist: 'rgb(255, 150, 0)',
                analyst: 'rgb(255, 200, 0)',
                designer: 'rgb(255, 0, 95)',
                frontend: 'rgb(163, 0, 255)',
                backend: 'rgb(77, 0, 255)',
                other: 'gray',
            };
            var res = [];
            for (var _i = 0, _a = this.graph.labels; _i < _a.length; _i++) {
                var label = _a[_i];
                res.push(colors[this.roles[label]]);
            }
            this.colors = res;
        };
        TCanvasComponent.prototype.vertex_circle = function (id) {
            return [
                this.graph.vertex_pos[id][0],
                this.graph.vertex_pos[id][1],
                5,
            ];
        };
        TCanvasComponent.prototype.which_vertex = function (pt) {
            for (var i = 0; i < this.graph.vertex_count; i++) {
                var circ = this.vertex_circle(i);
                if (Geom.inside_circ(pt, circ)) {
                    return i;
                }
            }
            return -1;
        };
        TCanvasComponent.prototype.onmousedown = function (pt) {
            var id = this.which_vertex(pt);
            this.dragging_vertex_id = id;
            if (id == -1)
                return;
            if (!this.is_visible[id]) {
                this.dragging_vertex_id = -1;
                return;
            }
            p(this.graph.labels[id]);
            this.dragging_init_pos = this.graph.vertex_pos[id];
        };
        ;
        TCanvasComponent.prototype.onmousemove = function (pt) { };
        ;
        TCanvasComponent.prototype.onmousedrag = function (pt, delta) {
            var id = this.dragging_vertex_id;
            if (id == -1)
                return;
            this.graph.vertex_pos[id] = Geom.add(this.dragging_init_pos, delta);
            this.redraw();
        };
        ;
        TCanvasComponent.prototype.onmouseup = function (pt) { };
        ;
        TCanvasComponent.prototype.onkeydown = function (key) { };
        ;
        TCanvasComponent.prototype.draw_edges = function (draw) {
            for (var i = 0; i < this.graph.weights.length; i++) {
                var _a = this.graph.weights[i], id1 = _a[0], id2 = _a[1], w12 = _a[2], w21 = _a[3];
                if (!this.is_visible[id1] || !this.is_visible[id2]) {
                    continue;
                }
                var coeff = this.graph.max_weight / 5;
                if (coeff > 0) {
                    w12 /= coeff;
                    w21 /= coeff;
                }
                var pos1 = this.graph.vertex_pos[id1];
                var pos2 = this.graph.vertex_pos[id2];
                var col1 = this.colors[id1];
                var col2 = this.colors[id2];
                var grad = draw.ctx.createLinearGradient(pos1[0], pos1[1], pos2[0], pos2[1]);
                grad.addColorStop(0, col1);
                grad.addColorStop(1, col2);
                if (Math.max(w12, w21) >= 1) {
                    draw.var_width_line(pos1, pos2, w12, w21)
                        .fill_grad(grad);
                }
                else {
                    draw.line(pos1, pos2)
                        .stroke_grad(grad, (w12 + w21) / 2);
                }
            }
        };
        TCanvasComponent.prototype.draw_vertices = function (draw) {
            for (var i = 0; i < this.graph.vertex_count; i++) {
                if (!this.is_visible[i])
                    continue;
                var label = this.graph.labels[i];
                var _a = label.split(' '), name_1 = _a[0], surname = _a[1];
                var role = {
                    '': 'red',
                    data_scientist: 'data scientist',
                    analyst: 'analyst',
                    designer: 'desginer',
                    frontend: 'frontend',
                    backend: 'backend',
                    other: 'other',
                }[this.roles[label]];
                if (name_1 == 'Anna') {
                    label = name_1 + ' ' + surname[0];
                }
                else {
                    label = name_1;
                }
                label = role;
                draw.circle(this.vertex_circle(i))
                    .fill(this.colors[i])
                    .text(label, Geom.add(this.graph.vertex_pos[i], [8, 5]), 'black');
            }
        };
        TCanvasComponent.prototype.draw_bg = function (draw) {
            var ctx = draw.ctx;
            var bg = this.bg;
            ctx.save();
            ctx.scale(0.4, 0.4);
            ctx.globalAlpha = this.main.bg_alpha;
            ctx.drawImage(bg, 0, 0, bg.width, bg.height);
            ctx.restore();
        };
        TCanvasComponent.prototype.draw = function (draw) {
            this.draw_bg(draw);
            this.draw_edges(draw);
            this.draw_vertices(draw);
        };
        ;
        return TCanvasComponent;
    }(CanvasComponent));
    var PrivateGraphStamps = (function (_super) {
        __extends(PrivateGraphStamps, _super);
        function PrivateGraphStamps() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.labels = [];
            return _this;
        }
        Object.defineProperty(PrivateGraphStamps.prototype, "vertex_count", {
            get: function () {
                return this.labels.length;
            },
            enumerable: true,
            configurable: true
        });
        PrivateGraphStamps.prototype.calc_labels = function () {
            if (this.data === undefined)
                throw Error();
            var labels = [];
            var temp = {};
            for (var edge_labels in this.data) {
                var _a = edge_labels.split('-'), label1 = _a[0], label2 = _a[1];
                temp[label1] = 1;
                temp[label2] = 1;
            }
            var res = [];
            for (var label in temp) {
                res.push(label);
            }
            res.sort();
            this.labels = res;
        };
        PrivateGraphStamps.prototype.calc_stamp_range = function () {
            if (this.data === undefined)
                throw Error();
            var min = +Infinity;
            var max = -Infinity;
            for (var edge_labels in this.data) {
                var stamps = this.data[edge_labels];
                min = Math.min(min, stamps[0]);
                max = Math.max(max, stamps[stamps.length - 1]);
            }
            this.stamp_range = [min, max];
        };
        PrivateGraphStamps.prototype.subclass_after_load = function () {
            this.calc_labels();
            this.calc_stamp_range();
        };
        PrivateGraphStamps.prototype.get_slice = function (range) {
            if (this.data === undefined)
                throw Error();
            var res = [];
            var temp = {};
            for (var edge_labels in this.data) {
                var stamps = this.data[edge_labels];
                if (edge_labels in temp) {
                    temp[edge_labels][3] =
                        count_stamps(stamps, range);
                }
                else {
                    var _a = edge_labels.split('-'), label1 = _a[0], label2 = _a[1];
                    var item = [
                        this.labels.indexOf(label1),
                        this.labels.indexOf(label2),
                        count_stamps(stamps, range),
                        0,
                    ];
                    res.push(item);
                    var inv_labels = label2 + '-' + label1;
                    temp[inv_labels] = item;
                }
            }
            return res;
        };
        return PrivateGraphStamps;
    }(Download));
    var PrivateGraph = (function () {
        function PrivateGraph(timeline) {
            this.timeline = timeline;
            this.bg_alpha = 0.1;
            this.priv_stamps = new PrivateGraphStamps('PrivateGraphStamps1', this.on_data_load.bind(this));
            this.graph = new Graph();
            this.component = new TCanvasComponent(this.graph, this);
        }
        PrivateGraph.prototype.start_loading = function () {
            this.priv_stamps.load();
        };
        PrivateGraph.prototype.save_vertex_pos = function () {
            localStorage.setItem('vertex_pos', JSON.stringify(this.graph.vertex_pos));
        };
        PrivateGraph.prototype.load_vertex_pos = function () {
            this.graph.vertex_pos = JSON.parse(localStorage.getItem('vertex_pos') || '[]');
        };
        PrivateGraph.prototype.on_data_load = function () {
            this.graph.labels = this.priv_stamps.labels;
            this.stamp_range = this.priv_stamps.stamp_range;
            this.graph.weights = this.priv_stamps.get_slice(this.stamp_range);
            this.component.set_colors();
            this.component.set_is_visible();
            this.graph.calc_max_weight();
            this.timeline.range = this.stamp_range;
            this.component.redraw();
        };
        return PrivateGraph;
    }());
    PrivateGraphNS.PrivateGraph = PrivateGraph;
})(PrivateGraphNS || (PrivateGraphNS = {}));
var PrivateGraph = PrivateGraphNS.PrivateGraph;
