"use strict";
var d3 = require('d3');
var R = require('ramda');
var common_1 = require('./common');
var dao_1 = require('./dao');
var PhasesGraph1 = (function () {
    function PhasesGraph1() {
        this.width = 650;
        this.height = 650;
        this.margin = { top: 30.5, right: 30, bottom: 0, left: 30.5 };
        this.quantile = false;
        this.mean_coeff = 2;
        this.random_rad = 0.2;
    }
    PhasesGraph1.prototype.precalc = function () {
        var _this = this;
        this.dao = new dao_1.SeasonGamesTable1(this.matches);
        this.params = ['Corners', 'Shots', 'ShotsTarget', 'Goals'];
        this.param_scale = d3.scalePoint()
            .domain(this.params)
            .range([0, this.width]);
        this.params_scales = {};
        this.params.forEach(function (key) {
            var scale;
            if (_this.quantile) {
                scale = d3.scaleLinear()
                    .domain([0, _this.dao.matches1.length]);
            }
            else {
                scale = d3.scaleLinear()
                    .domain([0, _this.dao.avg_params[key] * _this.mean_coeff]);
            }
            scale.range([_this.height, 0]);
            _this.params_scales[key] = scale;
        });
    };
    PhasesGraph1.prototype.first_draw = function () {
        var _this = this;
        var this1 = this;
        this.scales_g = this.svg.selectAll('.nothing')
            .data(this.params)
            .enter().append('g')
            .attr('transform', function (param) { return ("translate(" + _this.param_scale(param) + ", 0)"); })
            .each(function (param, _, group) {
            var axis = d3.axisLeft(this1.params_scales[param]);
            if (this1.quantile) {
                var vals = this1.dao.sorted_params[param];
                var ticks_1 = [0];
                var cur_val_1 = 0;
                vals.forEach(function (val, idx) {
                    if (cur_val_1 == val)
                        return;
                    ticks_1.push(idx);
                    cur_val_1 = val;
                });
                axis
                    .tickValues(ticks_1)
                    .tickFormat(function (val, idx) { return '' + idx; });
            }
            axis(d3.select(this));
        });
        this.scales_g.append('text')
            .attr('y', this.height + 24)
            .style('font-size', '14px')
            .attr('fill', 'black')
            .attr('text-anchor', 'middle')
            .text(function (param) { return ({
            Corners: 'Corners',
            Shots: 'Shots',
            ShotsTarget: 'Shots on target',
            Goals: 'Goals',
        }[param]); });
        this.title = this.svg.append('text')
            .attr('x', this.width / 2)
            .attr('y', -45)
            .attr('fill', 'black')
            .attr('text-anchor', 'middle');
        this.title_home = this.title.append('tspan')
            .text('');
        this.title.append('tspan')
            .text(':');
        this.title_away = this.title.append('tspan')
            .text('');
        this.title_comment = this.svg.append('text')
            .attr('x', this.width / 2)
            .attr('y', -20)
            .attr('text-anchor', 'middle')
            .text('Select team');
        this.line = d3.line()
            .x(function (_a) {
            var param = _a[0], val = _a[1];
            return _this.param_scale(param);
        })
            .y(function (_a) {
            var param = _a[0], val = _a[1];
            return common_1.Common1.scale_rand(_this.param_scale_fun(param), val, _this.random_rad);
        });
        this.svg.selectAll('.nothing')
            .data(this.params)
            .enter().append('g')
            .attr('transform', function (param) { return ("\n                translate(" + _this.param_scale(param) + ", 0)"); })
            .selectAll('.nothing')
            .data(function (param) { return R.xprod([param], R.union(_this.dao.sorted_params[param], [])); })
            .enter().append('rect')
            .attr('fill', 'gray')
            .attr('x', -2)
            .attr('y', function (_a) {
            var param = _a[0], idx = _a[1];
            return common_1.Common1.scale_rand_range(_this.param_scale_fun(param), idx, _this.random_rad)[0];
        })
            .attr('width', 4)
            .attr('height', function (_a) {
            var param = _a[0], idx = _a[1];
            return common_1.Common1.scale_rand_range(_this.param_scale_fun(param), idx, _this.random_rad)[1];
        });
        this.match_paths = this.svg.selectAll('.nothing');
        this.cur_avg = this.svg.append('path')
            .attr('stroke', 'darkblue')
            .attr('stroke-dasharray', '10,10')
            .attr('stroke-width', 1)
            .attr('fill', 'none');
        this.other_avg = this.svg.append('path')
            .attr('stroke', 'orange')
            .attr('stroke-dasharray', '10,10')
            .attr('stroke-width', 1)
            .attr('fill', 'none');
        this.cur_path = this.svg.append('path')
            .attr('stroke', 'darkblue')
            .attr('stroke-width', 3)
            .attr('fill', 'none');
        this.other_path = this.svg.append('path')
            .attr('stroke', 'orange')
            .attr('stroke-width', 3)
            .attr('fill', 'none');
    };
    PhasesGraph1.prototype.param_scale_fun = function (param) {
        var _this = this;
        if (this.quantile) {
            return function (x) { return _this.params_scales[param](_this.dao.sorted_params[param].indexOf(x)); };
        }
        else {
            return this.params_scales[param];
        }
    };
    PhasesGraph1.prototype.select_team = function (team) {
        this.selected_team = team;
        this.title
            .attr('visibility', 'hidden');
        this.title_comment
            .text("gray are " + team + " matches")
            .attr('fill', 'gray');
        this.match_paths = this.match_paths
            .data(R.filter(R.propEq('cur_team', team), this.dao.matches1).map(this.match_to_path.bind(this)))
            .enter().append('path')
            .attr('fill', 'none')
            .attr('stroke', 'lightgray')
            .merge(this.match_paths)
            .attr('d', this.line)
            .exit().remove();
        this.cur_avg
            .data(R.filter(function (_a) {
            var cur_team = _a.cur_team, other_team = _a.other_team, cur_home = _a.cur_home;
            return R.equals([cur_team, other_team, cur_home], ['Arsenal', 'Chelsea', true]);
        }, this.dao.matches1).map(this.match_to_path.bind(this)))
            .merge(this.cur_avg)
            .attr('d', this.line);
    };
    PhasesGraph1.prototype.match_to_path = function (match) {
        return this.params.map(function (param) { return [
            param,
            match[param]
        ]; });
    };
    PhasesGraph1.prototype.launch = function () {
        this.precalc();
        this.first_draw();
        this.select_team('Arsenal');
    };
    return PhasesGraph1;
}());
exports.PhasesGraph1 = PhasesGraph1;
