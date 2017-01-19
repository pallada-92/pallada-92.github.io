"use strict";
var d3 = require('d3');
var Common = (function () {
    function Common() {
    }
    Common.f00 = function (num) {
        return ('0' + num).slice(-2);
    };
    Common.ftime1 = function (stamp100) {
        var seconds = Math.floor(stamp100 / 100);
        var frac = stamp100 - seconds * 100;
        var minutes = Math.floor(seconds / 60);
        seconds -= minutes * 60;
        return Common.f00(minutes) +
            ':' + Common.f00(seconds) +
            '.' + Common.f00(frac);
    };
    Common.ftime2 = function (stamp100) {
        var seconds = Math.floor(stamp100 / 100);
        var minutes = Math.floor(seconds / 60);
        seconds -= minutes * 60;
        return Common.f00(minutes) +
            ':' + Common.f00(seconds);
    };
    Common.move_to_front = function () {
        var t = this;
        if (t) {
            t['parentNode']['appendChild'](t);
        }
    };
    Common.rng = function (n, fun) {
        for (var i = 0; i < n; i++) {
            fun(i);
        }
    };
    Common.clamp = function (num, min, max) {
        if (min === void 0) { min = 0; }
        if (max === void 0) { max = 1; }
        return Math.max(min, Math.min(max, num));
    };
    Common.rgb_lst = function (color) {
        var c = d3.rgb(color);
        return [c.r, c.g, c.b];
    };
    Common.vec_len = function (vec) {
        var x = vec[0];
        var y = vec[1];
        return Math.sqrt(x * x + y * y);
    };
    Common.dist = function (vec1, vec2) {
        var dx = vec1[0] - vec2[0];
        var dy = vec1[1] - vec2[1];
        return Math.sqrt(dx * dx + dy * dy);
    };
    return Common;
}());
exports.Common = Common;
