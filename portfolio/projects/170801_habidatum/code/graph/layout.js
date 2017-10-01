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
var CanvasComponent = (function () {
    function CanvasComponent() {
    }
    Object.defineProperty(CanvasComponent.prototype, "w", {
        get: function () {
            return this.rect[2];
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CanvasComponent.prototype, "h", {
        get: function () {
            return this.rect[3];
        },
        enumerable: true,
        configurable: true
    });
    CanvasComponent.prototype.change_rect = function () { };
    ;
    CanvasComponent.prototype.draw = function (draw) { };
    ;
    CanvasComponent.prototype.onmousedown = function (pt) { };
    ;
    CanvasComponent.prototype.onmousemove = function (pt) { };
    ;
    CanvasComponent.prototype.onmousedrag = function (pt, delta) { };
    ;
    CanvasComponent.prototype.onmouseup = function (pt) { };
    ;
    CanvasComponent.prototype.onkeydown = function (key) { };
    ;
    return CanvasComponent;
}());
var TestComponent = (function (_super) {
    __extends(TestComponent, _super);
    function TestComponent() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    TestComponent.prototype.draw = function (draw) {
        draw.line([0, 0], [this.w, this.h]).stroke('gray', 1);
        draw.line([this.w, 0], [0, this.h]).stroke('gray', 1);
    };
    return TestComponent;
}(CanvasComponent));
var Canvas = (function () {
    function Canvas() {
        this.layout = new Layout(this, []);
    }
    Canvas.prototype.onresize = function () {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.layout.w = this.canvas.width;
        this.layout.h = this.canvas.height;
        this.layout.recalc_rects();
        this.draw();
    };
    Canvas.prototype.change_layout = function () {
        this.layout.w = this.canvas.width;
        this.layout.h = this.canvas.height;
        this.layout.recalc_rects();
        this.draw();
    };
    Canvas.prototype.create = function () {
        var _this = this;
        this.canvas = document.createElement('canvas');
        document.body.appendChild(this.canvas);
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0px';
        this.canvas.style.left = '0px';
        this.canvas.addEventListener('mousedown', function (e) { return _this.layout.onmousedown(e); });
        this.canvas.addEventListener('mousemove', function (e) { return _this.layout.onmousemove(e); });
        this.canvas.addEventListener('mouseup', function (e) { return _this.layout.onmouseup(e); });
        window.addEventListener('resize', this.onresize.bind(this));
        this.onresize();
    };
    Canvas.prototype.draw = function () {
        var ctx = this.canvas.getContext('2d');
        if (!ctx)
            return;
        this.layout.draw(ctx);
    };
    return Canvas;
}());
var Layout = (function () {
    function Layout(canvas, components) {
        this.canvas = canvas;
        this.components = components;
        this.mouse_down = false;
        this.sel_comp = null;
        this.mouse_down_rel_pos = null;
        for (var _i = 0, components_1 = components; _i < components_1.length; _i++) {
            var comp = components_1[_i];
            comp.redraw = this.redraw.bind(this);
        }
    }
    ;
    Layout.prototype.draw = function (ctx) {
        ctx.clearRect(0, 0, this.w, this.h);
        var draw = new Draw(ctx, this.w, this.h);
        for (var _i = 0, _a = this.components; _i < _a.length; _i++) {
            var comp = _a[_i];
            ctx.save();
            ctx.translate(comp.rect[0], comp.rect[1]);
            ctx.beginPath();
            ctx.rect(0, 0, comp.rect[2], comp.rect[3]);
            ctx.clip();
            comp.draw(draw);
            ctx.restore();
        }
    };
    Layout.prototype.mouse_pos = function (e) {
        return [e.clientX, e.clientY];
    };
    Layout.prototype.which_comp = function (pt) {
        var res = null;
        for (var _i = 0, _a = this.components; _i < _a.length; _i++) {
            var comp = _a[_i];
            if (Geom.inside_rect(pt, comp.rect)) {
                res = comp;
            }
        }
        ;
        return res;
    };
    Layout.prototype.onmousedown = function (e) {
        var pt = this.mouse_pos(e);
        this.mouse_down = true;
        var comp = this.which_comp(pt);
        if (comp === null)
            return;
        var rel_pos = Geom.vec(comp.rect, pt);
        this.sel_comp = comp;
        this.mouse_down_rel_pos = rel_pos;
        comp.onmousedown(rel_pos);
    };
    Layout.prototype.onkeydown = function (key) {
        if (this.sel_comp === null)
            return;
        this.sel_comp.onkeydown(key);
    };
    Layout.prototype.onmousemove = function (e) {
        var pt = this.mouse_pos(e);
        if (this.mouse_down) {
            if (this.sel_comp === null ||
                this.mouse_down_rel_pos === null)
                return;
            var rel_pos = Geom.vec(this.sel_comp.rect, pt);
            var delta = Geom.vec(this.mouse_down_rel_pos, rel_pos);
            this.sel_comp.onmousedrag(rel_pos, delta);
        }
        else {
            this.sel_comp = this.which_comp(pt);
            if (this.sel_comp === null)
                return;
            var rel_pos = Geom.vec(this.sel_comp.rect, pt);
            this.sel_comp.onmousemove(rel_pos);
        }
    };
    Layout.prototype.onmouseup = function (e) {
        var pt = this.mouse_pos(e);
        this.mouse_down = false;
        this.mouse_down_rel_pos = null;
        if (this.sel_comp === null)
            return;
        this.sel_comp.onmouseup(Geom.vec(this.sel_comp.rect, pt));
    };
    Layout.prototype.redraw = function () {
        this.canvas.draw();
    };
    Layout.prototype.recalc_rects = function () { };
    ;
    return Layout;
}());
var Layouts;
(function (Layouts) {
    var SingleLayout = (function (_super) {
        __extends(SingleLayout, _super);
        function SingleLayout(canvas, comp) {
            var _this = _super.call(this, canvas, [comp]) || this;
            _this.comp = comp;
            return _this;
        }
        SingleLayout.prototype.recalc_rects = function () {
            this.comp.rect = [0, 0, this.w, this.h];
        };
        return SingleLayout;
    }(Layout));
    Layouts.SingleLayout = SingleLayout;
    var Layout5 = (function (_super) {
        __extends(Layout5, _super);
        function Layout5(canvas, main, top, t, right, r, bottom, b, left, l) {
            var _this = _super.call(this, canvas, [
                main, bottom, left, right, top
            ]) || this;
            _this.canvas = canvas;
            _this.main = main;
            _this.top = top;
            _this.t = t;
            _this.right = right;
            _this.r = r;
            _this.bottom = bottom;
            _this.b = b;
            _this.left = left;
            _this.l = l;
            return _this;
        }
        Layout5.prototype.recalc_rects = function () {
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
        };
        return Layout5;
    }(Layout));
    Layouts.Layout5 = Layout5;
})(Layouts || (Layouts = {}));
