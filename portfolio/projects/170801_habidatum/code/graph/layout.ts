//--------------------------------------------------------------------

class CanvasComponent {
    rect: Geom.Rect;
    redraw: () => void;
    get w() {
        return this.rect[2];
    }
    get h() {
        return this.rect[3];
    }
    change_rect() { };
    draw(draw: Draw) { };
    onmousedown(pt: Pt) { };
    onmousemove(pt: Pt) { };
    onmousedrag(pt: Pt, delta: Pt) { };
    onmouseup(pt: Pt) { };
    onkeydown(key: string) { };
}

class TestComponent extends CanvasComponent {
    draw(draw: Draw) {
        draw.line([0, 0], [this.w, this.h]).stroke('gray', 1);
        draw.line([this.w, 0], [0, this.h]).stroke('gray', 1);
    }
}

class Canvas {
    canvas: HTMLCanvasElement;
    layout: Layout;
    constructor() {
        this.layout = new Layout(this, []);
    }
    protected onresize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.layout.w = this.canvas.width;
        this.layout.h = this.canvas.height;
        this.layout.recalc_rects();
        this.draw();
    }
    change_layout() {
        this.layout.w = this.canvas.width;
        this.layout.h = this.canvas.height;
        this.layout.recalc_rects();
        this.draw();
    }
    create() {
        this.canvas = document.createElement('canvas');
        document.body.appendChild(this.canvas);
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0px';
        this.canvas.style.left = '0px';
        this.canvas.addEventListener(
            'mousedown',
            (e) => this.layout.onmousedown(e)
        );
        this.canvas.addEventListener(
            'mousemove',
            (e) => this.layout.onmousemove(e)
        );
        this.canvas.addEventListener(
            'mouseup',
            (e) => this.layout.onmouseup(e)
        );
        window.addEventListener(
            'resize',
            this.onresize.bind(this)
        );
        this.onresize();
    }
    draw() {
        let ctx = this.canvas.getContext('2d');
        if (!ctx) return;
        this.layout.draw(ctx);
    }
}

class Layout {
    w: number;
    h: number;
    constructor(
        public canvas: Canvas,
        public components: CanvasComponent[],
    ) {
        for (let comp of components) {
            comp.redraw = this.redraw.bind(this);
        }
    };
    draw(ctx: CanvasRenderingContext2D) {
        ctx.clearRect(0, 0, this.w, this.h);
        let draw = new Draw(ctx, this.w, this.h);
        for (let comp of this.components) {
            ctx.save();
            ctx.translate(comp.rect[0], comp.rect[1]);
            ctx.beginPath();
            ctx.rect(0, 0, comp.rect[2], comp.rect[3]);
            ctx.clip();
            comp.draw(draw);
            ctx.restore();
        }
    }
    mouse_pos(e: MouseEvent): Pt {
        return [e.clientX, e.clientY]
    }
    which_comp(pt: Pt): CanvasComponent | null {
        let res: CanvasComponent | null = null;
        for (let comp of this.components) {
            if (Geom.inside_rect(pt, comp.rect)) {
                res = comp;
            }
        };
        return res;
    }
    mouse_down: boolean = false;
    sel_comp: CanvasComponent | null = null;
    mouse_down_rel_pos: Pt | null = null;
    onmousedown(e: MouseEvent) {
        let pt = this.mouse_pos(e);
        this.mouse_down = true;
        let comp = this.which_comp(pt);
        if (comp === null) return;
        let rel_pos = Geom.vec(comp.rect, pt);
        this.sel_comp = comp;
        this.mouse_down_rel_pos = rel_pos;
        comp.onmousedown(rel_pos);
    }
    onkeydown(key: string) {
        if (this.sel_comp === null) return;
        this.sel_comp.onkeydown(key);
    }
    onmousemove(e: MouseEvent) {
        let pt = this.mouse_pos(e);
        if (this.mouse_down) {
            if (this.sel_comp === null ||
                this.mouse_down_rel_pos === null) return;
            let rel_pos = Geom.vec(this.sel_comp.rect, pt);
            let delta = Geom.vec(this.mouse_down_rel_pos, rel_pos);
            this.sel_comp.onmousedrag(rel_pos, delta);
        } else {
            this.sel_comp = this.which_comp(pt);
            if (this.sel_comp === null) return;
            let rel_pos = Geom.vec(this.sel_comp.rect, pt);
            this.sel_comp.onmousemove(rel_pos);
        }
    }
    onmouseup(e: MouseEvent) {
        let pt = this.mouse_pos(e);
        this.mouse_down = false;
        this.mouse_down_rel_pos = null;
        if (this.sel_comp === null) return;
        this.sel_comp.onmouseup(Geom.vec(this.sel_comp.rect, pt));
    }
    redraw() {
        this.canvas.draw();
    }
    recalc_rects() { };
}

namespace Layouts {

    export class SingleLayout extends Layout {
        constructor(
            canvas: Canvas,
            public comp: CanvasComponent,
        ) {
            super(canvas, [comp]);
        }
        recalc_rects() {
            this.comp.rect = [0, 0, this.w, this.h];
        }
    }

    export class Layout5 extends Layout {
        constructor(
            public canvas: Canvas,
            public main: CanvasComponent,
            public top: CanvasComponent,
            public t: number,
            public right: CanvasComponent,
            public r: number,
            public bottom: CanvasComponent,
            public b: number,
            public left: CanvasComponent,
            public l: number,
        ) {
            super(canvas, [
                main, bottom, left, right, top
            ]);
        }
        recalc_rects() {
            this.main.rect = [
                this.l, this.t,
                this.w - this.l - this.r,
                this.h - this.t - this.b,
            ];
            this.top.rect = [
                0, 0, this.w, this.t,
            ];
            this.right.rect = [
                this.w - this.r, this.t, this.r,
                this.h - this.t - this.b,
            ];
            this.bottom.rect = [
                0, this.h - this.b, this.w, this.b
            ];
            this.left.rect = [
                0, this.t, this.l,
                this.h - this.t - this.b,
            ];
        }
    }

}
