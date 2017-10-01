//--------------------------------------------------------------------

namespace Geom {

    export type Pt = [number, number];
    export type Rect = [number, number, number, number];
    export type Circ = [number, number, number];

    export function inside_rect(pt: Pt, rect: Rect) {
        if (pt[0] < rect[0]) return false;
        if (pt[1] < rect[1]) return false;
        if (pt[0] > rect[0] + rect[2]) return false;
        if (pt[1] > rect[1] + rect[3]) return false;
        return true;
    }

    export function dist_sq(pt1: number[], pt2: number[]) {
        let dx = pt2[0] - pt1[0], dy = pt2[1] - pt1[1];
        return dx * dx + dy * dy;
    }

    export function inside_circ(pt: Pt, circ: Circ) {
        let dist = dist_sq(pt, circ);
        return dist <= circ[2] * circ[2];
    }

    export function add(pt1: number[], pt2: number[]): Pt {
        return [
            pt1[0] + pt2[0],
            pt1[1] + pt2[1],
        ]
    }

    export function vec(pt1: number[], pt2: number[]): Pt {
        return [
            pt2[0] - pt1[0],
            pt2[1] - pt1[1],
        ]
    }

    export function mul(coeff: number, pt: Pt): Pt {
        return [coeff * pt[0], coeff * pt[1]];
    }

    export function norm(vec: Pt): number {
        return Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1]);
    }

    export function normed(vec: Pt): Pt {
        let len = norm(vec);
        return [vec[0] / len, vec[1] / len];
    }

    export function ort_unit(vec: Pt): Pt {
        return normed([-vec[1], vec[0]]);
    }

    export function circ_vertex_pos(
        num: number,
        center: Pt,
        radius: number,
    ): Pt[] {
        let res: Pt[] = [];
        for (let i = 0; i < num; i++) {
            let a = i / num * 2 * Math.PI;
            res.push([
                center[0] + radius * Math.cos(a),
                center[1] + radius * Math.sin(a),
            ]);
        }
        return res;
    }

}

import Pt = Geom.Pt;

