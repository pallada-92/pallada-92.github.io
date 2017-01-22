class App {
    dao: Dao;
    on_data_load(param = 'source-over') {
        let time0 = +new Date();
        // let scheme = new ColorScheme(
        //     [d3.interpolateInferno], [0, 1], 500)
        let scheme_e = ColorScheme.from_uniform_steps([
            'rgb(0, 0, 0)', 'rgb(0, 0, 255)', 'rgb(0, 255, 255)',
            'rgb(0, 255, 0)', 'rgb(255, 255, 0)', 'rgb(255, 0, 0)',
            'rgb(255, 255, 255)'], 500)
        // let scheme = ColorScheme.from_steps([
        //     [0, 'rgb(0, 0, 255)'], [0.25, 'rgb(0,0,255)'],
        //     [0.55, 'rgb(0,255,0)'], [0.85, 'rgb(255, 255, 0)'],
        //     [1.0, 'rgb(255,0,0)']], 500);
        // let scheme = ColorScheme.from_steps([
        //     [0.45, 'rgb(0,0,255)'],
        //     [0.55, 'rgb(0,255,255)'],
        //     [0.65, 'rgb(0,255,0)'],
        //     [0.95, 'yellow'],
        //     [1, 'rgb(255,0,0)']], 500);
        // let scheme = ColorScheme.from_steps([
        //     [0, 'rgb(0, 0, 255)'],
        //     [0.65, 'rgb(0,0,255)'],
        //     [0.75, 'rgb(0,255,255)'],
        //     [0.85, 'rgb(0,255,0)'],
        //     [0.95, 'yellow'],
        //     [1, 'rgb(255,0,0)'],], 500);
        // let scheme = ColorScheme.from_uniform_steps([
        //     'rgb(0, 0, 0)', 'rgb(0,0,190)', 'rgb(0,255,255)',
        //     'rgb(0,255,0)', 'rgb(255, 255, 0)', 'rgb(255,0,0)'], 500);
        // .reverse();
        let scheme = ColorScheme.from_uniform_steps(
            ['white', 'black'], 500);
        // let scheme = ColorScheme.from_uniform_steps(
        //     ['yellow', 'red'], 500);
        let iter_fitness = new FitnessShapeIterator(
            this.dao, [1], [0, 70 * 60 * 100],
            [this.dao.cmd_players('H')[0]]
        );
        const ratio = this.dao.field_width / this.dao.field_height;
        const h1 = 500, w1 = Math.round(h1 * ratio),
            m1 = w1 / this.dao.field_width;
        let adapter = ([x, y]: PointShape): PointShape => [
            y * w1 / this.dao.field_width,
            x * h1 / this.dao.field_height,
        ];
        let buf1 = new Uint16DrawBuffer(w1, h1, 20)
            .feed_shape_iterator(adapter, iter_fitness);
        // let buf1_max_val = buf1.max_val();
        const h2 = 500, w2 = Math.round(h2 * ratio),
            m2 = w2 / this.dao.field_width;
        let buf2 = new GaussConvolutionBuffer(buf1).blur(0, 4);
        // let r = 9, b = 0.6;
        // let buf2 = new UpsampleConvolutionBuffer(buf1, w2, h2,
        //     (d) => Math.exp(-Math.pow(d / r, 6)), 10 * r);
        // (d) => Common.clamp(1 - (d / r - b) / (1 - b)), 20);
        // let buf2 = new ResizedBuffer(buf1, w2, h2);
        // let buf2_max_val = buf2.max_val();
        let quant = new QuantBuffer(buf2, 7, 255);
        let contour = new EdgeDetector(quant);
        let iter_events = iter_fitness.events(
            this.dao.event_names.map((v, i) => i));
        const h3 = 500, w3 = Math.round(h3 * ratio),
            m3 = w3 / this.dao.field_width;
        let adapter_e = ([x, y]: PointShape): PointShape => [
            y * w3 / this.dao.field_width,
            x * h3 / this.dao.field_height,
        ];
        let buf1e = new Uint16DrawBuffer(w3, h3, 1)
            .feed_shape_iterator(adapter_e, iter_events);
        let circles_e = new GroupPoints(3)
            .feed_shape_iterator(adapter_e, iter_events);
        console.log(iter_events, circles_e);
        let r_e = 15, b_e = 0.6;
        let buf2e = new GaussConvolutionBuffer(buf1e).blur(
            Math.round(r_e / 2), 4);
        // let buf2e = new GenericConvolutionBuffer(buf1e,
        // let buf2e = new UpsampleConvolutionBuffer(buf1e, w2, h2,
        // (d) => Math.exp(-Math.pow(d / (r_e), 2)), r_e * 2);
        // (d) => Common.clamp(1 - (d / r_e - b_e) / (1 - b_e)),
        // (d) => d < r_e ? 1 : 0,
        // r_e * 2);
        // let buf2e = new ResizedBuffer(buf1e, w2, h2);
        let quant_e = new QuantBuffer(buf2e, 0, 7);
        // let quant_e1 = new QuantBuffer(buf2e, 0, 6);
        let contour_e = new EdgeDetector(quant_e);
        let composition = new CompositionCanvas(this.canvas)
            .resize(w2, h2)
            // .fill((x, y) => (x % 2 && y % 2) ^ ~~(y % 100 < 50) ?
            // .fill((x, y) => x % 2 && y % 2 ?
            // .fill((x, y) => y % 100 < 50 ?
            // [0, 140, 0] : [0, 150, 0])
            // [105, 170, 52] : [86, 159, 28])
            // [78, 90, 42] : [96, 108, 58])
            // .fill(() => [255, 255, 255])
            .fill(() => [240, 255, 240])
            // .fill(() => [0, 0, 0])
            .draw_field(m2, 'rgb(0, 127, 0)', 1)
            // .draw_field(m2, 'white', 1)
            .blend_alpha_buffer(quant, (val, x, y) => {
                let val_e = quant_e.at(x, y);
                // let t = Math.pow(val / quant_e.levels, 1 / 2.2)
                // let t = val / quant.levels;
                let t1 = Math.pow(val / quant.levels, 1 / 2.2);
                let t2 = val_e / quant_e.levels;
                return [
                    // [(1 - t1) * 255,
                    // (1 - t2) * 255,
                    // (1 - (t1 + t1) / 2) * 255],
                    // Common.rgb_lst(d3.hcl(
                    // 140, 50,
                    // 140 + t2 * 360, 30 + t2 * 70,
                    // 50 + (1 - t1) * 25
                    // )),
                    // [0, 127, 0],
                    scheme.at(t1),
                    // [0, 0, 0],
                    // val > 0 ? 0.2 : 1];
                    // t > 0.15 ? 0 : 1];
                    // 1 - Common.clamp(t * 2, 0, 0.7)];
                    1 - t1];
                // Math.pow(1 - t, 2)];
                // 0];
                // 1 - (t1 + t2) / 2];
                // Math.max(1, 1 - t)];
            })
            .blend_alpha_buffer(quant_e, (val, x, y) => {
                val /= quant_e.levels;
                return [
                    scheme_e.at(val),
                    Math.max(1 - 1.5 * val, 0)
                ]
            })
            // .draw_buffer(buf1, (
            // ctx: CanvasRenderingContext2D,
            // val: number, x: number, y: number
            // ) => {
            // let radius = Common.clamp(
            // Math.pow(val / buf1_max_val, 1) * 15, 0, 15);
            // ctx.fillStyle = 'rgb(0, 127, 0)';
            // ctx.beginPath();
            // ctx.arc(x, y, radius, 0, 2 * Math.PI);
            // ctx.fill();
            // })
            // .draw_field(m2, 'white', 1)
            // .draw(contour.draw_on('gray', 'rect', 1, 0))
            // .draw((ctx: CanvasRenderingContext2D) => {
            //     ctx.fillStyle = 'white';
            //     ctx.lineWidth = 1;
            //     ctx.globalAlpha = 1;
            //     // ctx.globalCompositeOperation = 'hue';
            //     circles_e.forEach(([x, y, rad]) => {
            //         x = Math.floor(x); y = Math.floor(y);
            //         let t1 = quant.at(x, y) / quant.levels;
            //         let t2 = quant_e.at(x, y) / quant_e.levels;
            //         // ctx.fillStyle = t1 < 0.5 ? 'black' : 'white';
            //         ctx.strokeStyle = 'white';
            //         ctx.fillStyle = 'red';
            //         ctx.beginPath();
            //         ctx.arc(x, y, rad, 0, 2 * Math.PI);
            //         ctx.fill();
            //         ctx.stroke();
            //     });
            //     // ctx.globalCompositeOperation = 'source-over'
            //     ctx.globalAlpha = 1;
            // })
            // .draw_buffer(buf1e, (
            //     ctx: CanvasRenderingContext2D,
            //     val: number, x: number, y: number
            // ) => {
            //     // return;
            //     if (val == 0) return;
            //     let t1 = quant.at(x, y) / quant.levels;
            //     let t2 = quant_e.at(x, y) / quant_e.levels;
            //     // ctx.strokeStyle = Math.max(t1, t2) < 0.5
            //     //     ? 'black' : 'white';
            //     ctx.fillStyle = 'black';
            //     ctx.beginPath();
            //     ctx.arc(x, y, 2, 0, 2 * Math.PI);
            //     ctx.fill();
            // })
            .draw((ctx) => {
                ctx.fillStyle = 'black';
                ctx.font = '12px Monospace';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';
                ctx.fillText('ef22', 10, 10);
            })
        console.log(`time = ${+new Date() - time0}`);
    }
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    onload() {
        this.dao = new Dao();
        this.dao.onload = this.on_data_load.bind(this, 0);
        this.dao.load();
        this.canvas = document.getElementById('field') as
            HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d') as
            CanvasRenderingContext2D;
    }
    mount() {
        window.onload = this.onload.bind(this);
        // window.onresize = this.onresize.bind(this);
        // window.onkeydown = this.onkeydown.bind(this);
    }
}

let app = new App();
app.mount();
