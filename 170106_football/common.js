"use strict";
var d3 = require('d3');
var Common1 = (function () {
    function Common1() {
    }
    Common1.outer = function (obj) {
        return [
            obj.width + obj.margin.left + obj.margin.right,
            obj.height + obj.margin.top + obj.margin.bottom
        ];
    };
    Common1.scale_rand = function (scale, idx, radius) {
        var dir = +(Math.random() > 0.5) * 2 - 1;
        var prop = Math.random() * radius;
        return scale(idx) * (1 - prop) + scale(idx + dir) * prop;
    };
    Common1.scale_rand_range = function (scale, idx, radius) {
        return [
            scale(idx) * (1 - radius) + scale(idx + 1) * radius,
            (scale(idx - 1) - scale(idx + 1)) * radius,
        ];
    };
    Common1.union = function (vals) {
    };
    Common1.win_int = d3.interpolateHsl(d3.hsl(120, 0.7, 0.15), d3.hsl(120, 0.7, 1));
    Common1.draw_int = d3.interpolateHsl(d3.hsl(60, 0.7, 0.15), d3.hsl(60, 0.7, 1));
    Common1.loose_int = d3.interpolateHsl(d3.hsl(0, 0.7, 0.15), d3.hsl(0, 0.7, 1));
    Common1.res_interp = {
        H: function (x) { return x > 1 / 3 ? Common1.win_int(1 / 2 + (x - 1 / 3) * 3 / 2 / 2) : Common1.win_int(x * 3 / 2); },
        W: function (x) { return x > 1 / 3 ? Common1.win_int(1 / 2 + (x - 1 / 3) * 3 / 2 / 2) : Common1.win_int(x * 3 / 2); },
        D: function (x) { return x > 1 / 3 ? Common1.draw_int(1 / 2 + (x - 1 / 3) * 3 / 2 / 2) : Common1.draw_int(x * 3 / 2); },
        A: function (x) { return x > 1 / 3 ? Common1.loose_int(1 / 2 + (x - 1 / 3) * 3 / 2 / 2) : Common1.loose_int(x * 3 / 2); },
        L: function (x) { return x > 1 / 3 ? Common1.loose_int(1 / 2 + (x - 1 / 3) * 3 / 2 / 2) : Common1.loose_int(x * 3 / 2); },
    };
    Common1.clr = {
        W: 'green',
        D: 'orange',
        L: 'red',
    };
    Common1.mat = {
        H: { H: 'W', A: 'L' },
        D: { H: 'D', A: 'D' },
        A: { H: 'L', A: 'W' },
    };
    return Common1;
}());
exports.Common1 = Common1;
