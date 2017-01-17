"use strict";
var R = require('ramda');
var d3 = require('d3');
function trim(str) {
    return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
}
var FixString = (function () {
    function FixString(str, width) {
        this.str = str;
        this.width = width;
        this.empty = '';
        while (width > 0) {
            this.empty += ' ';
            width--;
        }
    }
    ;
    Object.defineProperty(FixString.prototype, "length", {
        get: function () {
            return Math.floor(this.str.length / this.width);
        },
        enumerable: true,
        configurable: true
    });
    FixString.prototype.at_raw = function (id) {
        if (id < 0 || id >= this.length) {
            return undefined;
        }
        var res = this.str.slice(id * this.width, (id + 1) * this.width);
        if (res == this.empty) {
            return undefined;
        }
        else {
            return res;
        }
    };
    FixString.prototype.at_int = function (id) {
        var res = this.at_raw(id);
        if (res == undefined) {
            return undefined;
        }
        else {
            return parseInt(res);
        }
    };
    FixString.prototype.find_ids = function (min, max) {
        var res = [];
        for (var i = 0; i < this.length; i++) {
            var val = this.at_int(i);
            if (val == undefined)
                continue;
            if (val >= min && val < max) {
                res.push(i);
            }
        }
        return res;
    };
    FixString.prototype.max = function () {
        for (var i = this.length - 1; i >= 0; i--) {
            var val = this.at_int(i);
            if (val != undefined) {
                return val;
            }
        }
        return 0;
    };
    return FixString;
}());
function polar_decart(phi, r) {
    return [Math.cos(phi) * r, Math.sin(phi) * r];
}
var Dao = (function () {
    function Dao() {
        this.mock = false;
        this.field_width = 68;
        this.field_height = 105;
        this.fitness_shift = 12 * 100;
    }
    Dao.prototype.load = function () {
        var _this = this;
        if (this.mock) {
            setTimeout(function () { return _this.onload(); }, 0);
            return;
        }
        d3.json('data.json', function (data) {
            _this.data = data;
            _this.onload();
        });
    };
    Dao.prototype.max_event_time = function (period) {
        var e = this.data.events[("period" + period)];
        return new FixString(e.T, 6).max();
    };
    Object.defineProperty(Dao.prototype, "event_names", {
        get: function () {
            return this.data.events.event_names;
        },
        enumerable: true,
        configurable: true
    });
    Dao.prototype.event_count = function (period) {
        var e = this.data.events[("period" + period)];
        return new FixString(e.T, 6).length;
    };
    Dao.prototype.all_players = function () {
        return R.keys(this.data.players);
    };
    Dao.prototype.cmd_players = function (command) {
        return this.all_players().filter(function (x) { return x[0] == command; });
    };
    Dao.prototype.event = function (period, id, events) {
        var e = events || this.data.events[("period" + period)];
        var code = new FixString(e.E, 3).at_int(id);
        var player_id = new FixString(e.P, 3).at_raw(id);
        var inverse = player_id && player_id[0] == 'H';
        var x = new FixString(e.X, 5).at_int(id) / 100 * this.field_height / 105;
        var y = new FixString(e.Y, 5).at_int(id) / 100 * this.field_width / 68;
        return {
            id: id,
            code: code,
            title: this.data.events.event_names[code] || '-',
            P: player_id,
            T: new FixString(e.T, 6).at_int(id),
            X: inverse ? this.field_height - x : x,
            Y: inverse ? this.field_width - y : y,
        };
    };
    Dao.prototype.events = function (period, min_t, max_t) {
        var _this = this;
        var e = this.data.events[("period" + period)];
        var ids = new FixString(e.T, 6).find_ids(min_t, max_t);
        return ids.map(function (id) { return _this.event(period, id, e); })
            .filter(function (_a) {
            var code = _a.code;
            return code != undefined;
        });
    };
    Dao.prototype.player_info = function (player_id) {
        return {
            name: this.data.players[player_id].name,
            team: this.data[(player_id[0] + "Team")],
        };
    };
    Dao.prototype.player_positions = function (period, time) {
        time = Math.floor(time / 100) * 100;
        time -= this.fitness_shift;
        var res = {};
        for (var player_id in this.data.players) {
            var f = this.data.players[player_id].fitness;
            if (f == null)
                continue;
            var p = f[("period" + period)];
            if (p == null || time < p.T0)
                continue;
            var row_id = Math.floor((time - p.T0) / 100);
            var x = new FixString(p.X, 5).at_int(row_id);
            if (x == undefined)
                continue;
            var y = new FixString(p.Y, 4).at_int(row_id);
            if (y == undefined)
                continue;
            var v = new FixString(p.V, 3).at_int(row_id);
            if (v == undefined)
                continue;
            res[player_id] = {
                X: ((x - 10000) / 10324 + 0.5) * this.field_height,
                Y: (y / 6567) * this.field_width,
                V: v / 100,
            };
        }
        return res;
    };
    Dao.prototype.player_directions = function (period, time) {
        var res = {};
        var cur_pos = this.player_positions(period, time);
        var prev_pos = this.player_positions(period, time - 100);
        for (var player_id in cur_pos) {
            var cur_x = cur_pos[player_id].X;
            var cur_y = cur_pos[player_id].Y;
            var prev_x = 0, prev_y = 0;
            if (player_id in prev_pos) {
                prev_x = prev_pos[player_id].X;
                prev_y = prev_pos[player_id].Y;
            }
            var phi = Math.atan2(cur_y - prev_y, cur_x - prev_x);
            res[player_id] = {
                player_id: player_id,
                pos: [cur_x, cur_y],
                prev_pos: [prev_x, prev_y],
                dir: polar_decart(phi, cur_pos[player_id].V),
                speed: cur_pos[player_id].V
            };
        }
        return res;
    };
    Dao.prototype.player_time_range = function (player_id, period) {
        var f = this.data.players[player_id].fitness;
        if (f == null) {
            return [0, -1];
        }
        var p = f[("period" + period)];
        if (p == null) {
            return [0, -1];
        }
        var res = [p.T0, p.T0 + new FixString(p.X, 5).length * 100];
        return [
            res[0] + this.fitness_shift,
            res[1] + this.fitness_shift
        ];
    };
    Dao.prototype.max_time = function (period) {
        var res = this.max_event_time(period);
        for (var player_id in this.data.players) {
            var val = this.player_time_range(player_id, period)[1];
            res = Math.max(val, res);
        }
        return res;
    };
    return Dao;
}());
exports.Dao = Dao;
