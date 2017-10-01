//--------------------------------------------------------------------

namespace DrawNS {

    export type Color = string | [number, number, number] |
        [number, number, number, number];

    export function color2str(color: Color) {
        if (typeof (color) == 'string') return color;
        let res: string = 'rgba(';
        res += (color[0]).toFixed(0) + ', ';
        res += (color[1]).toFixed(0) + ', ';
        res += (color[2]).toFixed(0) + ', ';
        res += (color[3] || 1).toFixed(2) + ')';
        return res;
    }

    export class Draw {
        constructor(
            public ctx: CanvasRenderingContext2D,
            public w: number,
            public h: number,
        ) {
            ctx.font = '14px Helvetica';
        };
        circle(circ: Geom.Circ) {
            this.ctx.beginPath();
            this.ctx.arc(
                circ[0], circ[1], circ[2],
                0, 2 * Math.PI, true,
            );
            return this;
        }
        fill(color: Color) {
            this.ctx.fillStyle = color2str(color);
            this.ctx.fill();
            return this;
        }
        fill_grad(grad) {
            this.ctx.fillStyle = grad;
            this.ctx.fill();
            return this;
        }
        line(pos: Pt, pos2?: Pt) {
            this.ctx.beginPath();
            this.ctx.moveTo(pos[0], pos[1]);
            if (pos2) {
                this.ctx.lineTo(pos2[0], pos2[1]);
            }
            return this;
        }
        stroke(color: Color, width: number) {
            if (width == 0) {
                return this;
            }
            this.ctx.strokeStyle = color2str(color);
            this.ctx.lineWidth = width;
            this.ctx.stroke();
            return this;
        }
        stroke_grad(grad, width: number) {
            if (width == 0) {
                return this;
            }
            this.ctx.strokeStyle = grad;
            this.ctx.lineWidth = width;
            this.ctx.stroke();
            return this;
        }
        measure_width(text: string) {
            return this.ctx.measureText(text).width;
        }
        text(text: string, pos: Pt, color: Color) {
            this.ctx.fillStyle = color2str(color);
            this.ctx.fillText(text, pos[0], pos[1]);
            return this;
        }
        save(shift: Pt) {
            this.ctx.save();
            this.ctx.translate(shift[0], shift[1]);
            return this;
        }
        var_width_line(
            pt1: Pt, pt2: Pt,
            width1: number, width2: number
        ) {
            let ort = Geom.ort_unit(Geom.vec(pt1, pt2));
            this.ctx.beginPath();
            this.ctx.moveTo(
                pt1[0] + width1 * ort[0],
                pt1[1] + width1 * ort[1],
            );
            this.ctx.lineTo(
                pt1[0] - width1 * ort[0],
                pt1[1] - width1 * ort[1],
            );
            this.ctx.lineTo(
                pt2[0] - width2 * ort[0],
                pt2[1] - width2 * ort[1],
            );
            this.ctx.lineTo(
                pt2[0] + width2 * ort[0],
                pt2[1] + width2 * ort[1],
            );
            this.ctx.closePath();
            return this;
        }
        restore() {
            this.ctx.restore();
            return this;
        }
    }

}

import Color = DrawNS.Color;
import Draw = DrawNS.Draw;

