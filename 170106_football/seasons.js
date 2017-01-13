"use strict";
var d3 = require('d3');
var R = require('ramda');
var dao_1 = require('./dao');
var Seasons1 = (function () {
    function Seasons1() {
        this.width = 1280;
        this.height = 690;
        this.margin = { top: 30.5, right: 30, bottom: 0, left: 30.5 };
        this.div_scales_ranges = {
            'E0': [0, 20],
            'E1': [0, 23],
            'E2': [0, 23],
            'E3': [0, 23],
            'EC': [0, 23],
        };
    }
    Seasons1.prototype.precalc = function () {
        var _this = this;
        this.dao = new dao_1.SeasonsPositions1(this.matches);
        this.season = d3.scalePoint()
            .domain(this.dao.seasons)
            .rangeRound([0, this.width]);
        this.division = d3.scaleBand()
            .domain(this.dao.divisions.reverse())
            .paddingInner(0.1)
            .rangeRound([this.height, 0]);
        this.div_scales = R.mapObjIndexed(function (range, div) {
            return d3.scaleLinear()
                .domain(range)
                .rangeRound([
                _this.division(div) + _this.division.bandwidth(),
                _this.division(div)
            ]);
        }, this.div_scales_ranges);
        this.points = [];
        for (var team in this.dao.vm) {
            for (var i in this.dao.vm[team]) {
                if (!this.dao.vm[team][i])
                    continue;
                var _a = this.dao.vm[team][i], cur_season = _a[0], cur_division = _a[1], score = _a[2];
                this.points.push([this.season(cur_season), this.div_scales[cur_division](score), team]);
            }
        }
    };
    Seasons1.prototype.first_draw = function () {
        var _this = this;
        this.season_sel = this.svg.selectAll('.season')
            .data(this.dao.seasons)
            .enter().append('g')
            .attr('class', 'season')
            .attr('transform', function (d) { return ("translate(" + _this.season(d) + ")"); });
        this.season_sel.append('text')
            .attr('x', 0)
            .attr('y', -5)
            .attr('text-anchor', 'middle')
            .attr('fill', 'gray')
            .text(function (d) { return d; });
        this.division_sel = this.season_sel
            .selectAll('.division')
            .data(function () { return _this.dao.divisions; })
            .enter().append('g')
            .attr('transform', function (d) { return ("translate(0, " + _this.division(d) + ")"); })
            .append('line')
            .attr('y2', function (d) { return _this.division.bandwidth(); })
            .attr('stroke', 'gray');
        this.svg.selectAll('.division-label')
            .data(this.dao.divisions)
            .enter().append('text')
            .attr('transform', function (d) { return ("translate(-10, " + (_this.division(d) + _this.division.bandwidth() / 2) + ") rotate(-90)"); })
            .attr('text-anchor', 'middle')
            .attr('fill', 'gray')
            .text(function (d) { return _this.dao.div_titles[d]; });
        this.line = d3.line()
            .x(function (d) { return _this.season(d[0]); })
            .y(function (d) { return _this.div_scales[d[1]](d[2]); })
            .defined(function (d) { return d !== undefined; });
        this.svg.selectAll('path')
            .data(R.keys(this.dao.vm))
            .enter().append('path')
            .attr('d', function (team) { return _this.line(_this.dao.vm[team]); })
            .attr('fill', 'none')
            .attr('stroke', 'lightgray');
        this.voronoi = d3.voronoi()
            .size([this.width, this.height])(this.points);
        d3.select(this.elem).on('mousemove', this.mousemove.bind(this));
    };
    Seasons1.prototype.mousemove = function () {
        var cur = this.voronoi.find.apply(this.voronoi, d3.mouse(this.svg.node())).data;
        this.svg.selectAll('path')
            .attr('stroke', 'lightgray')
            .attr('stroke-width', 1)
            .filter(function (team) { return team == cur[2]; })
            .attr('stroke', 'black')
            .attr('stroke-width', 2)
            .each(function () {
            this.parentNode.appendChild(this);
        });
        var label = this.svg.selectAll('.team_label')
            .data([cur[2]]);
        label.enter().append('text')
            .classed('team_label', true)
            .attr('text-anchor', 'middle')
            .merge(label)
            .text(function (d) { return d; })
            .attr('x', cur[0])
            .attr('y', cur[1] - 5)
            .each(function () {
            this.parentNode.appendChild(this);
        });
    };
    Seasons1.prototype.launch = function () {
        this.precalc();
        this.first_draw();
    };
    return Seasons1;
}());
exports.Seasons1 = Seasons1;
