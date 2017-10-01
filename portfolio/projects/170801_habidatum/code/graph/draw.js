var DrawNS;
(function (DrawNS) {
    function color2str(color) {
        if (typeof (color) == 'string')
            return color;
        var res = 'rgba(';
        res += (color[0]).toFixed(0) + ', ';
        res += (color[1]).toFixed(0) + ', ';
        res += (color[2]).toFixed(0) + ', ';
        res += (color[3] || 1).toFixed(2) + ')';
        return res;
    }
    DrawNS.color2str = color2str;
    var Draw = (function () {
        function Draw(ctx, w, h) {
            this.ctx = ctx;
            this.w = w;
            this.h = h;
            ctx.font = '14px Helvetica';
        }
        ;
        Draw.prototype.circle = function (circ) {
            this.ctx.beginPath();
            this.ctx.arc(circ[0], circ[1], circ[2], 0, 2 * Math.PI, true);
            return this;
        };
        Draw.prototype.fill = function (color) {
            this.ctx.fillStyle = color2str(color);
            this.ctx.fill();
            return this;
        };
        Draw.prototype.fill_grad = function (grad) {
            this.ctx.fillStyle = grad;
            this.ctx.fill();
            return this;
        };
        Draw.prototype.line = function (pos, pos2) {
            this.ctx.beginPath();
            this.ctx.moveTo(pos[0], pos[1]);
            if (pos2) {
                this.ctx.lineTo(pos2[0], pos2[1]);
            }
            return this;
        };
        Draw.prototype.stroke = function (color, width) {
            if (width == 0) {
                return this;
            }
            this.ctx.strokeStyle = color2str(color);
            this.ctx.lineWidth = width;
            this.ctx.stroke();
            return this;
        };
        Draw.prototype.stroke_grad = function (grad, width) {
            if (width == 0) {
                return this;
            }
            this.ctx.strokeStyle = grad;
            this.ctx.lineWidth = width;
            this.ctx.stroke();
            return this;
        };
        Draw.prototype.measure_width = function (text) {
            return this.ctx.measureText(text).width;
        };
        Draw.prototype.text = function (text, pos, color) {
            this.ctx.fillStyle = color2str(color);
            this.ctx.fillText(text, pos[0], pos[1]);
            return this;
        };
        Draw.prototype.save = function (shift) {
            this.ctx.save();
            this.ctx.translate(shift[0], shift[1]);
            return this;
        };
        Draw.prototype.var_width_line = function (pt1, pt2, width1, width2) {
            var ort = Geom.ort_unit(Geom.vec(pt1, pt2));
            this.ctx.beginPath();
            this.ctx.moveTo(pt1[0] + width1 * ort[0], pt1[1] + width1 * ort[1]);
            this.ctx.lineTo(pt1[0] - width1 * ort[0], pt1[1] - width1 * ort[1]);
            this.ctx.lineTo(pt2[0] - width2 * ort[0], pt2[1] - width2 * ort[1]);
            this.ctx.lineTo(pt2[0] + width2 * ort[0], pt2[1] + width2 * ort[1]);
            this.ctx.closePath();
            return this;
        };
        Draw.prototype.restore = function () {
            this.ctx.restore();
            return this;
        };
        return Draw;
    }());
    DrawNS.Draw = Draw;
})(DrawNS || (DrawNS = {}));
var Draw = DrawNS.Draw;
