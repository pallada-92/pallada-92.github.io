function clamp(x, min, max) {
    if (x < min) return min;
    if (x > max) return max;
    return x;
}

class WebGLApp {

    canvas_3d: HTMLCanvasElement;
    gl: WebGLRenderingContext;

    set_gl(): void {
        let res: WebGLRenderingContext | null = null;
        try {
            res = this.canvas_3d.getContext('webgl', {
                stencil: true,
            });
        } catch (e) { }
        if (!res) throw 'Could not initialise WebGL, sorry :-(';
        this.gl = res;
    }

    compile_shader(source: string, shader_type: string): WebGLShader {
        let gl = this.gl,
            res: WebGLShader | null;
        if (shader_type == 'fragment') {
            res = gl.createShader(gl.FRAGMENT_SHADER);
        } else if (shader_type == 'vertex') {
            res = gl.createShader(gl.VERTEX_SHADER);
        } else {
            res = null;
        }
        if (!res) throw 'Can\'t init shader';
        gl.shaderSource(res, source);
        gl.compileShader(res);
        if (!gl.getShaderParameter(res, gl.COMPILE_STATUS)) {
            throw gl.getShaderInfoLog(res);
        }
        return res;
    }

    link_program(
        vertex: WebGLShader,
        fragment: WebGLShader,
        attributes: string[],
        uniforms: string[],
    ): WebGLProgram {
        let gl = this.gl,
            res = gl.createProgram();
        if (!res) throw 'Can\'t create program';
        gl.attachShader(res, vertex);
        gl.attachShader(res, fragment);
        gl.linkProgram(res);
        if (!gl.getProgramParameter(res, gl.LINK_STATUS)) {
            throw 'Could not link program';
        }
        res['attr'] = {};
        for (let i = 0; i < attributes.length; i++) {
            res['attr'][attributes[i]] =
                gl.getAttribLocation(res, attributes[i]);
            gl.enableVertexAttribArray(
                res['attr'][attributes[i]]
            );
        }
        res['uni'] = {};
        for (let i = 0; i < uniforms.length; i++) {
            res['uni'][uniforms[i]] =
                gl.getUniformLocation(res, uniforms[i]);
        }
        return res;
    }

    init() {
        this.set_gl();
    }

}

class FullScreenCanvasApp extends WebGLApp {

    view_width: number;
    view_height: number;
    canvas_2d: HTMLCanvasElement;
    ctx2d: CanvasRenderingContext2D;

    fit_view() {
        this.view_width = window.innerWidth;
        this.view_height = window.innerHeight;
        this.canvas_3d.width = this.view_width;
        this.canvas_3d.height = this.view_height;
        this.canvas_2d.width = this.view_width;
        this.canvas_2d.height = this.view_height;
        this.gl.viewport(0, 0, this.view_width, this.view_height);
    }

    onresize() {
        this.fit_view();
    }

    init() {
        this.canvas_3d =
            document.getElementById('fullscreen_canvas_3d') as
            HTMLCanvasElement;
        this.canvas_2d =
            document.getElementById('fullscreen_canvas_2d') as
            HTMLCanvasElement;
        this.ctx2d = this.canvas_2d.getContext('2d') as
            CanvasRenderingContext2D;
        super.init();
        window.addEventListener('resize', this.onresize.bind(this));
        this.fit_view();
    }

}

class Camera {

    view_width: number;
    view_height: number;
    proj_matrix = mat4.create();
    pos = mat4.create();
    matrix = mat4.create();
    horizontal_angle: number = 0;
    vertical_angle: number = 0;
    target = vec3.create();
    zoom: number = 1;
    near: number = 0.1;
    far: number = 10;
    zero3 = vec3.create();
    up = vec3.fromValues(0, 0, 1);

    set_ortho() {
        const ratio = this.view_width / this.view_height,
            h = this.zoom;
        mat4.ortho(
            this.proj_matrix,
            - h * ratio / 2, h * ratio / 2,
            - h / 2, h / 2,
            this.near, this.far,
        );
    }

    set_pos() {
        vec3.set(
            this.pos,
            1, 0, 0,
        );
        vec3.rotateY(
            this.pos,
            this.pos,
            this.zero3,
            this.vertical_angle / 360 * (2 * Math.PI),
        );
        vec3.rotateZ(
            this.pos,
            this.pos,
            this.zero3,
            this.horizontal_angle / 360 * (2 * Math.PI),
        );
        vec3.add(
            this.pos,
            this.pos,
            this.target,
        );
    }

    set_matrix() {
        mat4.lookAt(
            this.matrix,
            this.pos,
            this.target,
            this.up,
        );
    }

}

class GraphApp extends FullScreenCanvasApp {

    vertex_shader_source = `
attribute vec2 aVertexXY;
attribute vec2 aVertexZ12;

uniform mat4 uProjMatrix;
uniform mat4 uCameraMatrix;
uniform float uZCoeff;

void main(void) {
float z = mix(aVertexZ12[0], aVertexZ12[1], uZCoeff);
gl_Position = uProjMatrix * uCameraMatrix * vec4(aVertexXY, z, 500.0);
}
`;
    fragment_shader_source = `
precision mediump float;

uniform vec4 uColor;

void main(void) {
  gl_FragColor = uColor;
}
`;

    camera: Camera = new Camera();

    subgraph: Subgraph;
    graph: Graph;

    vertices_xy_buffer: WebGLBuffer;
    vertices_z12_buffer: WebGLBuffer;
    edges_ids_buffer: WebGLBuffer;

    zcoeff: number = 0;
    prev_frames: number[] = [];
    frame_no: number = 0;
    fps: number = 0;

    program: WebGLProgram;
    weight_groups: {
        weight_range: [number, number],
        color: [number, number, number, number],
        linewidth: number,
        show: boolean,
        edges_ids_range?: [number, number],
    }[] = [{
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

    data_to_buffers() {
        let gl = this.gl;

        this.vertices_xy_buffer = gl.createBuffer() as WebGLBuffer;
        gl.bindBuffer(
            gl.ARRAY_BUFFER,
            this.vertices_xy_buffer,
        );
        gl.bufferData(
            gl.ARRAY_BUFFER,
            this.graph.coords,
            gl.STATIC_DRAW,
        );
        this.vertices_xy_buffer['ItemSize'] = 2;
        this.vertices_xy_buffer['numItems'] = this.graph.node_count;

        this.edges_ids_buffer = gl.createBuffer() as WebGLBuffer;
        gl.bindBuffer(
            gl.ELEMENT_ARRAY_BUFFER,
            this.edges_ids_buffer,
        );
        gl.bufferData(
            gl.ELEMENT_ARRAY_BUFFER,
            this.subgraph.edges,
            gl.STATIC_DRAW,
        );
        this.edges_ids_buffer['ItemSize'] = 1;
        this.edges_ids_buffer['numItems'] = this.graph.edge_count * 2;

        this.vertices_z12_buffer = gl.createBuffer() as WebGLBuffer;
        this.vertices_z12_buffer['numItems'] = this.graph.node_count;
        this.vertices_z12_buffer['ItemSize'] = 2;
    }

    set_z_buffers(index1_name, index2_name) {
        let gl = this.gl;
        this.subgraph.set_z12(index1_name, index2_name);
        gl.bindBuffer(
            gl.ARRAY_BUFFER,
            this.vertices_z12_buffer,
        );
        gl.bufferData(
            gl.ARRAY_BUFFER,
            this.subgraph.z12,
            gl.STATIC_DRAW,
        );
    }

    init() {
        super.init();
        this.camera.view_width = this.view_width;
        this.camera.view_height = this.view_height;
        this.data_to_buffers();
        this.set_z_buffers('2011', '2015');
        this.program = this.link_program(
            this.compile_shader(
                this.vertex_shader_source,
                'vertex',
            ),
            this.compile_shader(
                this.fragment_shader_source,
                'fragment',
            ), [
                'aVertexXY',
                'aVertexZ12',
            ], [
                'uColor',
                'uProjMatrix',
                'uCameraMatrix',
                'uZCoeff',
            ],
        );
        for (let i = 0; i < 30; i++) {
            this.prev_frames.push(0);
        }
        this.gl.useProgram(this.program);
        this.canvas_2d.addEventListener(
            'mousemove',
            this.onmousemove.bind(this),
        );
        window.addEventListener(
            'wheel',
            this.onwheel.bind(this),
        );
        this.camera.zoom = 2;
        this.update_proj();
        this.subgraph.set_weight_groups(this.weight_groups);
        this.subgraph.set_top_values('2011');
        this.draw();
    }

    update_proj() {
        this.camera.set_ortho();
        this.gl.uniformMatrix4fv(
            this.program['uni']['uProjMatrix'],
            false,
            this.camera.proj_matrix
        );
    }

    update_zcoeff() {
    }

    onwheel(e: MouseWheelEvent) {
        this.camera.zoom = clamp(
            this.camera.zoom * Math.exp(-e.deltaX * 0.01),
            0.01, 100,
        );
        this.update_proj();
        this.weight_groups[0].show = this.camera.zoom > 1;
    }

    onresize() {
        super.onresize();
        this.camera.view_width = this.view_width;
        this.camera.view_height = this.view_height;
        this.update_proj();
        this.needs_redraw = true;
    }

    draw_2d() {
        const ctx = this.ctx2d,
            w = this.view_width,
            h = this.view_height;
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
        const y = Math.sin(this.camera.vertical_angle / 180 * Math.PI) * 40,
            x = Math.cos(this.camera.horizontal_angle / 180 * Math.PI) * 40,
            pad_l = 25;
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
        let vpos: [number, number] = [0, 0];
        const count = 10 * Math.pow(1 / app.camera.zoom, 1.5)
        for (let i = 0; i < count; i++) {
            const ix = this.graph.node_count - 1 - i,
                idx = this.subgraph.top_values[ix];
            this.vertex_pos(idx, vpos);
            ctx.fillText(graph.labels.get_label(idx), vpos[0], vpos[1]);
        }
        ctx.restore();
    }

    vertex_pos(idx: number, write_to: [number, number]) {
        const x = this.graph.coords[idx * 2],
            y = this.graph.coords[idx * 2 + 1],
            z1 = this.subgraph.z12[idx * 2],
            z2 = this.subgraph.z12[idx * 2 + 1],
            zc = this.zcoeff,
            z = z1 * (1 - zc) + z2 * zc,
            v = vec4.fromValues(x, y, z, 500);
        vec4.transformMat4(v, v, this.camera.matrix);
        vec4.transformMat4(v, v, this.camera.proj_matrix);
        write_to[0] = (1 + v[0] / v[3]) / 2 * this.view_width;
        write_to[1] = (1 - v[1] / v[3]) / 2 * this.view_height;
    }

    update_fps() {
        const cur_frame = +new Date(),
            prev_frame = this.prev_frames[this.frame_no],
            delta = (cur_frame - prev_frame) / this.prev_frames.length;
        this.fps = 1000 / delta;
        this.prev_frames[this.frame_no] = cur_frame;
        this.frame_no++;
        this.frame_no %= this.prev_frames.length;
    }

    draw() {
        requestAnimationFrame(this.draw.bind(this));
        this.update_fps();
        this.draw_2d();
        let gl = this.gl;
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.disable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        this.zcoeff = (Math.sin(+new Date() / 1000) + 1) / 2;
        this.gl.uniform1f(
            this.program['uni']['uZCoeff'],
            this.zcoeff
        );
        this.camera.vertical_angle = clamp(
            180 - this.mouse_y * 0.25,
            180.0,
            270,
        )
        this.camera.horizontal_angle = -90 + this.mouse_x * 0.20;
        this.camera.set_pos();
        this.camera.set_matrix();
        this.gl.uniformMatrix4fv(
            this.program['uni']['uCameraMatrix'],
            false,
            this.camera.matrix,
        );
        gl.bindBuffer(
            gl.ARRAY_BUFFER,
            this.vertices_xy_buffer,
        );
        gl.vertexAttribPointer(
            this.program['attr']['aVertexXY'],
            this.vertices_xy_buffer['ItemSize'],
            gl.FLOAT, false, 0, 0,
        );
        gl.bindBuffer(
            gl.ARRAY_BUFFER,
            this.vertices_z12_buffer,
        );
        gl.vertexAttribPointer(
            this.program['attr']['aVertexZ12'],
            this.vertices_z12_buffer['ItemSize'],
            gl.FLOAT, false, 0, 0,
        );
        gl.bindBuffer(
            gl.ELEMENT_ARRAY_BUFFER,
            this.edges_ids_buffer,
        );
        for (let i = 0; i < this.weight_groups.length; i++) {
            const params = this.weight_groups[i],
                ids_range = params.edges_ids_range;
            if (!ids_range || !params.show) continue;
            // console.log(ids_range[1] - ids_range[0]);
            gl.lineWidth(params.linewidth);
            this.gl.uniform4fv(
                this.program['uni']['uColor'],
                params.color,
            );
            gl.drawElements(
                gl.LINES,
                (ids_range[1] - ids_range[0]) * 2,
                gl.UNSIGNED_SHORT,
                ids_range[0] * 2 * 2,
            );
        }
    }

    needs_redraw: boolean = false;
    mouse_x: number = 0;
    mouse_y: number = 0;

    onmousemove(e: MouseEvent) {
        this.mouse_x = e.clientX - this.view_width / 2;
        this.mouse_y = e.clientY - this.view_height / 2;
        this.needs_redraw = true;
    }

}

let app: GraphApp,
    subgraph: Subgraph,
    graph = new Graph('../jupyter/metal_2.json', () => {
        subgraph = new Subgraph(graph);
        app = new GraphApp();
        app.graph = graph;
        app.subgraph = subgraph;
        app.init();
    });

window.addEventListener('load', graph.start_loading_data.bind(graph));

