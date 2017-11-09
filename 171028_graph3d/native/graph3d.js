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
function clamp(x, min, max) {
    if (x < min)
        return min;
    if (x > max)
        return max;
    return x;
}
var WebGLApp = (function () {
    function WebGLApp() {
    }
    WebGLApp.prototype.set_gl = function () {
        var res = null;
        try {
            res = this.canvas_3d.getContext('webgl', {
                stencil: true,
            });
        }
        catch (e) { }
        if (!res)
            throw 'Could not initialise WebGL, sorry :-(';
        this.gl = res;
    };
    WebGLApp.prototype.compile_shader = function (source, shader_type) {
        var gl = this.gl, res;
        if (shader_type == 'fragment') {
            res = gl.createShader(gl.FRAGMENT_SHADER);
        }
        else if (shader_type == 'vertex') {
            res = gl.createShader(gl.VERTEX_SHADER);
        }
        else {
            res = null;
        }
        if (!res)
            throw 'Can\'t init shader';
        gl.shaderSource(res, source);
        gl.compileShader(res);
        if (!gl.getShaderParameter(res, gl.COMPILE_STATUS)) {
            throw gl.getShaderInfoLog(res);
        }
        return res;
    };
    WebGLApp.prototype.link_program = function (vertex, fragment, attributes, uniforms) {
        var gl = this.gl, res = gl.createProgram();
        if (!res)
            throw 'Can\'t create program';
        gl.attachShader(res, vertex);
        gl.attachShader(res, fragment);
        gl.linkProgram(res);
        if (!gl.getProgramParameter(res, gl.LINK_STATUS)) {
            throw 'Could not link program';
        }
        res['attr'] = {};
        for (var i = 0; i < attributes.length; i++) {
            res['attr'][attributes[i]] =
                gl.getAttribLocation(res, attributes[i]);
            gl.enableVertexAttribArray(res['attr'][attributes[i]]);
        }
        res['uni'] = {};
        for (var i = 0; i < uniforms.length; i++) {
            res['uni'][uniforms[i]] =
                gl.getUniformLocation(res, uniforms[i]);
        }
        return res;
    };
    WebGLApp.prototype.init = function () {
        this.set_gl();
    };
    return WebGLApp;
}());
var FullScreenCanvasApp = (function (_super) {
    __extends(FullScreenCanvasApp, _super);
    function FullScreenCanvasApp() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    FullScreenCanvasApp.prototype.fit_view = function () {
        this.view_width = window.innerWidth;
        this.view_height = window.innerHeight;
        this.canvas_3d.width = this.view_width;
        this.canvas_3d.height = this.view_height;
        this.canvas_2d.width = this.view_width;
        this.canvas_2d.height = this.view_height;
        this.gl.viewport(0, 0, this.view_width, this.view_height);
    };
    FullScreenCanvasApp.prototype.onresize = function () {
        this.fit_view();
    };
    FullScreenCanvasApp.prototype.init = function () {
        this.canvas_3d =
            document.getElementById('fullscreen_canvas_3d');
        this.canvas_2d =
            document.getElementById('fullscreen_canvas_2d');
        this.ctx2d = this.canvas_2d.getContext('2d');
        _super.prototype.init.call(this);
        window.addEventListener('resize', this.onresize.bind(this));
        this.fit_view();
    };
    return FullScreenCanvasApp;
}(WebGLApp));
var Camera = (function () {
    function Camera() {
        this.proj_matrix = mat4.create();
        this.pos = mat4.create();
        this.matrix = mat4.create();
        this.horizontal_angle = 0;
        this.vertical_angle = 0;
        this.target = vec3.create();
        this.zoom = 1;
        this.near = 0.1;
        this.far = 10;
        this.zero3 = vec3.create();
        this.up = vec3.fromValues(0, 0, 1);
    }
    Camera.prototype.set_ortho = function () {
        var ratio = this.view_width / this.view_height, h = this.zoom;
        mat4.ortho(this.proj_matrix, -h * ratio / 2, h * ratio / 2, -h / 2, h / 2, this.near, this.far);
    };
    Camera.prototype.set_pos = function () {
        vec3.set(this.pos, 1, 0, 0);
        vec3.rotateY(this.pos, this.pos, this.zero3, this.vertical_angle / 360 * (2 * Math.PI));
        vec3.rotateZ(this.pos, this.pos, this.zero3, this.horizontal_angle / 360 * (2 * Math.PI));
        vec3.add(this.pos, this.pos, this.target);
    };
    Camera.prototype.set_matrix = function () {
        mat4.lookAt(this.matrix, this.pos, this.target, this.up);
    };
    return Camera;
}());
var GraphApp = (function (_super) {
    __extends(GraphApp, _super);
    function GraphApp() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.vertex_shader_source = "\nattribute vec2 aVertexXY;\nattribute vec2 aVertexZ12;\n\nuniform mat4 uProjMatrix;\nuniform mat4 uCameraMatrix;\nuniform float uZCoeff;\n\nvoid main(void) {\nfloat z = mix(aVertexZ12[0], aVertexZ12[1], uZCoeff);\ngl_Position = uProjMatrix * uCameraMatrix * vec4(aVertexXY, z, 500.0);\n}\n";
        _this.fragment_shader_source = "\nprecision mediump float;\n\nuniform vec4 uColor;\n\nvoid main(void) {\n  gl_FragColor = uColor;\n}\n";
        _this.camera = new Camera();
        _this.zcoeff = 0;
        _this.prev_frames = [];
        _this.frame_no = 0;
        _this.fps = 0;
        _this.weight_groups = [{
                weight_range: [2, 2],
                color: [0, 0, 1, 1 / 32],
                linewidth: 1,
                show: true,
            }, {
                weight_range: [3, 5],
                color: [0, 0.25, 1, 1 / 32],
                linewidth: 1,
                show: true,
            }, {
                weight_range: [6, 11],
                color: [0, 0.5, 1, 1 / 16],
                linewidth: 1,
                show: true,
            }, {
                weight_range: [12, 24],
                color: [0, 1, 1, 1 / 16],
                linewidth: 1,
                show: true,
            }, {
                weight_range: [25, 49],
                color: [0.3, 1, 1, 1 / 8],
                linewidth: 1,
                show: true,
            }, {
                weight_range: [50, 99],
                color: [0.6, 1, 1, 1 / 4],
                linewidth: 1,
                show: true,
            }, {
                weight_range: [100, Infinity],
                color: [1, 1, 1, 1 / 4],
                linewidth: 2,
                show: true,
            }];
        _this.needs_redraw = false;
        _this.mouse_x = 0;
        _this.mouse_y = 0;
        return _this;
    }
    GraphApp.prototype.data_to_buffers = function () {
        var gl = this.gl;
        this.vertices_xy_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertices_xy_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.graph.coords, gl.STATIC_DRAW);
        this.vertices_xy_buffer['ItemSize'] = 2;
        this.vertices_xy_buffer['numItems'] = this.graph.node_count;
        this.edges_ids_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.edges_ids_buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.subgraph.edges, gl.STATIC_DRAW);
        this.edges_ids_buffer['ItemSize'] = 1;
        this.edges_ids_buffer['numItems'] = this.graph.edge_count * 2;
        this.vertices_z12_buffer = gl.createBuffer();
        this.vertices_z12_buffer['numItems'] = this.graph.node_count;
        this.vertices_z12_buffer['ItemSize'] = 2;
    };
    GraphApp.prototype.set_z_buffers = function (index1_name, index2_name) {
        var gl = this.gl;
        this.subgraph.set_z12(index1_name, index2_name);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertices_z12_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.subgraph.z12, gl.STATIC_DRAW);
    };
    GraphApp.prototype.init = function () {
        _super.prototype.init.call(this);
        this.camera.view_width = this.view_width;
        this.camera.view_height = this.view_height;
        this.data_to_buffers();
        this.set_z_buffers('2011', '2015');
        this.program = this.link_program(this.compile_shader(this.vertex_shader_source, 'vertex'), this.compile_shader(this.fragment_shader_source, 'fragment'), [
            'aVertexXY',
            'aVertexZ12',
        ], [
            'uColor',
            'uProjMatrix',
            'uCameraMatrix',
            'uZCoeff',
        ]);
        for (var i = 0; i < 30; i++) {
            this.prev_frames.push(0);
        }
        this.gl.useProgram(this.program);
        this.canvas_2d.addEventListener('mousemove', this.onmousemove.bind(this));
        window.addEventListener('wheel', this.onwheel.bind(this));
        this.camera.zoom = 2;
        this.update_proj();
        this.subgraph.set_weight_groups(this.weight_groups);
        this.subgraph.set_top_values('2011');
        this.draw();
    };
    GraphApp.prototype.update_proj = function () {
        this.camera.set_ortho();
        this.gl.uniformMatrix4fv(this.program['uni']['uProjMatrix'], false, this.camera.proj_matrix);
    };
    GraphApp.prototype.update_zcoeff = function () {
    };
    GraphApp.prototype.onwheel = function (e) {
        this.camera.zoom = clamp(this.camera.zoom * Math.exp(-e.deltaX * 0.01), 0.01, 100);
        this.update_proj();
        this.weight_groups[0].show = this.camera.zoom > 1;
    };
    GraphApp.prototype.onresize = function () {
        _super.prototype.onresize.call(this);
        this.camera.view_width = this.view_width;
        this.camera.view_height = this.view_height;
        this.update_proj();
        this.needs_redraw = true;
    };
    GraphApp.prototype.draw_2d = function () {
        var ctx = this.ctx2d, w = this.view_width, h = this.view_height;
        ctx.clearRect(0, 0, w, h);
        ctx.font = '10px Courier New';
        ctx.save();
        ctx.fillStyle = 'white';
        ctx.fillRect(20, 22, this.zcoeff * 100, 1);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('2011', 20, 20);
        ctx.fillText('2015', 20 + 100, 20);
        ctx.restore();
        ctx.save();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1;
        var y = Math.sin(this.camera.vertical_angle / 180 * Math.PI) * 40, x = Math.cos(this.camera.horizontal_angle / 180 * Math.PI) * 40, pad_l = 25;
        ctx.beginPath();
        ctx.moveTo(pad_l + 0.5, h / 2);
        ctx.lineTo(pad_l + 0.5, h / 2 + y);
        ctx.stroke();
        ctx.textAlign = 'center';
        ctx.fillStyle = 'white';
        ctx.textBaseline = 'bottom';
        ctx.fillText('top', pad_l, h / 2 - 40 - 5);
        ctx.textBaseline = 'top';
        ctx.fillText('side', pad_l, h / 2 + 5);
        ctx.restore();
        ctx.save();
        ctx.textBaseline = 'top';
        ctx.textAlign = 'right';
        ctx.fillStyle = 'white';
        ctx.fillText('' + Math.round(this.fps) + ' fps', w - 25, 25);
        ctx.restore();
        ctx.save();
        ctx.textBaseline = 'bottom';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'orange';
        var vpos = [0, 0];
        var count = 10 * Math.pow(1 / app.camera.zoom, 1.5);
        for (var i = 0; i < count; i++) {
            var ix = this.graph.node_count - 1 - i, idx = this.subgraph.top_values[ix];
            this.vertex_pos(idx, vpos);
            ctx.fillText(graph.labels.get_label(idx), vpos[0], vpos[1]);
        }
        ctx.restore();
    };
    GraphApp.prototype.vertex_pos = function (idx, write_to) {
        var x = this.graph.coords[idx * 2], y = this.graph.coords[idx * 2 + 1], z1 = this.subgraph.z12[idx * 2], z2 = this.subgraph.z12[idx * 2 + 1], zc = this.zcoeff, z = z1 * (1 - zc) + z2 * zc, v = vec4.fromValues(x, y, z, 500);
        vec4.transformMat4(v, v, this.camera.matrix);
        vec4.transformMat4(v, v, this.camera.proj_matrix);
        write_to[0] = (1 + v[0] / v[3]) / 2 * this.view_width;
        write_to[1] = (1 - v[1] / v[3]) / 2 * this.view_height;
    };
    GraphApp.prototype.update_fps = function () {
        var cur_frame = +new Date(), prev_frame = this.prev_frames[this.frame_no], delta = (cur_frame - prev_frame) / this.prev_frames.length;
        this.fps = 1000 / delta;
        this.prev_frames[this.frame_no] = cur_frame;
        this.frame_no++;
        this.frame_no %= this.prev_frames.length;
    };
    GraphApp.prototype.draw = function () {
        requestAnimationFrame(this.draw.bind(this));
        this.update_fps();
        this.draw_2d();
        var gl = this.gl;
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.disable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        this.zcoeff = (Math.sin(+new Date() / 1000) + 1) / 2;
        this.gl.uniform1f(this.program['uni']['uZCoeff'], this.zcoeff);
        this.camera.vertical_angle = clamp(180 - this.mouse_y * 0.25, 180.0, 270);
        this.camera.horizontal_angle = -90 + this.mouse_x * 0.20;
        this.camera.set_pos();
        this.camera.set_matrix();
        this.gl.uniformMatrix4fv(this.program['uni']['uCameraMatrix'], false, this.camera.matrix);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertices_xy_buffer);
        gl.vertexAttribPointer(this.program['attr']['aVertexXY'], this.vertices_xy_buffer['ItemSize'], gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertices_z12_buffer);
        gl.vertexAttribPointer(this.program['attr']['aVertexZ12'], this.vertices_z12_buffer['ItemSize'], gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.edges_ids_buffer);
        for (var i = 0; i < this.weight_groups.length; i++) {
            var params = this.weight_groups[i], ids_range = params.edges_ids_range;
            if (!ids_range || !params.show)
                continue;
            gl.lineWidth(params.linewidth);
            this.gl.uniform4fv(this.program['uni']['uColor'], params.color);
            gl.drawElements(gl.LINES, (ids_range[1] - ids_range[0]) * 2, gl.UNSIGNED_SHORT, ids_range[0] * 2 * 2);
        }
    };
    GraphApp.prototype.onmousemove = function (e) {
        this.mouse_x = e.clientX - this.view_width / 2;
        this.mouse_y = e.clientY - this.view_height / 2;
        this.needs_redraw = true;
    };
    return GraphApp;
}(FullScreenCanvasApp));
var app, subgraph, graph = new Graph('../jupyter/metal_2.json', function () {
    subgraph = new Subgraph(graph);
    app = new GraphApp();
    app.graph = graph;
    app.subgraph = subgraph;
    app.init();
});
window.addEventListener('load', graph.start_loading_data.bind(graph));
