import * as d3 from 'd3';
import * as R from 'ramda';

export class Common1 {

    static win_int = d3.interpolateHsl(d3.hsl(120, 0.7, 0.15), d3.hsl(120, 0.7, 1));
    static draw_int = d3.interpolateHsl(d3.hsl(60, 0.7, 0.15), d3.hsl(60, 0.7, 1));
    static loose_int = d3.interpolateHsl(d3.hsl(0, 0.7, 0.15), d3.hsl(0, 0.7, 1));

    static res_interp = {
        H: (x) => x > 1 / 3 ? Common1.win_int(1 / 2 + (x - 1 / 3) * 3 / 2 / 2) : Common1.win_int(x * 3 / 2),
        W: (x) => x > 1 / 3 ? Common1.win_int(1 / 2 + (x - 1 / 3) * 3 / 2 / 2) : Common1.win_int(x * 3 / 2),
        D: (x) => x > 1 / 3 ? Common1.draw_int(1 / 2 + (x - 1 / 3) * 3 / 2 / 2) : Common1.draw_int(x * 3 / 2),
        A: (x) => x > 1 / 3 ? Common1.loose_int(1 / 2 + (x - 1 / 3) * 3 / 2 / 2) : Common1.loose_int(x * 3 / 2),
        L: (x) => x > 1 / 3 ? Common1.loose_int(1 / 2 + (x - 1 / 3) * 3 / 2 / 2) : Common1.loose_int(x * 3 / 2),
    }

    static clr = {
        W: 'green',
        D: 'orange',
        L: 'red',
    }

    static mat = {
        H: { H: 'W', A: 'L' },
        D: { H: 'D', A: 'D' },
        A: { H: 'L', A: 'W' },
    };

    static outer(obj): [number, number] {
        return [
            obj.width + obj.margin.left + obj.margin.right,
            obj.height + obj.margin.top + obj.margin.bottom
        ]
    }

    static scale_rand(scale, idx, radius) {
        let dir = +(Math.random() > 0.5) * 2 - 1;
        let prop = Math.random() * radius;
        return scale(idx) * (1 - prop) + scale(idx + dir) * prop;
    }

    static scale_rand_range(scale, idx, radius) {
        return [
            scale(idx) * (1 - radius) + scale(idx + 1) * radius,
            (scale(idx - 1) - scale(idx + 1)) * radius,
        ]
    }

    static union(vals) {

    }
}
