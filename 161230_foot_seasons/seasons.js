"use strict";
var d3 = require('d3');
var R = require('ramda');
var width = 1280, height = 700, margin = { top: 30.5, right: 30, bottom: 0, left: 30.5 };
var svg = d3.select('#vis1')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
var divisions = ['E0', 'E1', 'E2', 'E3', 'EC'];
var seasons = d3.range(1993, 2015 + 1).map(function (x) { return '' + x; });
var season = d3.scalePoint()
    .domain(seasons)
    .rangeRound([0, width]);
var division = d3.scaleBand()
    .domain(divisions.reverse())
    .paddingInner(0.1)
    .rangeRound([height, 0]);
var div_titles = {
    'E0': 'Premier league',
    'E1': 'Division 1',
    'E2': 'Division 2',
    'E3': 'Division 3',
    'EC': 'Conference',
};
var div_scales_ranges = {
    'E0': [0, 20],
    'E1': [0, 23],
    'E2': [0, 23],
    'E3': [0, 23],
    'EC': [0, 23],
};
var div_scales = R.mapObjIndexed(function (range, div) {
    return d3.scaleLinear()
        .domain(range)
        .rangeRound([
        division(div) + division.bandwidth(),
        division(div)
    ]);
}, div_scales_ranges);
var season_sel = svg.selectAll('.season')
    .data(seasons)
    .enter().append('g')
    .attr('class', 'season')
    .attr('transform', function (d) { return 'translate(' + season(d) + ')'; });
season_sel.append('text')
    .attr('x', 0)
    .attr('y', -5)
    .attr('text-anchor', 'middle')
    .attr('fill', 'gray')
    .text(function (d) { return d; });
var division_sel = season_sel
    .selectAll('.division')
    .data(function () { return divisions; })
    .enter().append('g')
    .attr('transform', function (d) { return 'translate(0, ' + division(d) + ')'; })
    .append('line')
    .attr('y2', function (d) { return division.bandwidth(); })
    .attr('stroke', 'gray');
svg.selectAll('.division-label')
    .data(divisions)
    .enter().append('text')
    .attr('transform', function (d) { return 'translate(-10, ' + (division(d) + division.bandwidth() / 2) + ') rotate(-90)'; })
    .attr('text-anchor', 'middle')
    .attr('fill', 'gray')
    .text(function (d) { return div_titles[d]; });
var line = d3.line()
    .x(function (d) {
    return season(d[0]);
})
    .y(function (d) {
    return div_scales[d[1]](d[2]);
})
    .defined(function (d) { return d !== undefined; });
d3.json('seasons.json', function (matches) {
    var points = [];
    var vm = {};
    for (var cur_season in matches) {
        if (seasons.indexOf(cur_season) == -1)
            continue;
        for (var cur_division in matches[cur_season]) {
            if (divisions.indexOf(cur_division) == -1)
                continue;
            var scores = matches[cur_season][cur_division];
            var positions = R.fromPairs(R.sortBy(R.prop('1'), R.toPairs(scores)).map(function (v, i) { return [v[0], i]; }));
            for (var team in scores) {
                if (!(team in vm)) {
                    vm[team] = seasons.map(function () { return undefined; });
                }
                var score = positions[team];
                vm[team][seasons.indexOf(cur_season)] = [cur_season, cur_division, score];
                points.push([season(cur_season), div_scales[cur_division](score), team]);
            }
        }
    }
    svg.selectAll('path')
        .data(R.keys(vm))
        .enter().append('path')
        .attr('d', function (team) { return line(vm[team]); })
        .attr('fill', 'none')
        .attr('stroke', 'lightgray');
    var voronoi = d3.voronoi()
        .size([width, height])(points);
    function mousemove() {
        var cur = voronoi.find.apply(voronoi, d3.mouse(this)).data;
        svg.selectAll('path')
            .attr('stroke', 'lightgray')
            .attr('stroke-width', 1)
            .filter(function (team) { return team == cur[2]; })
            .attr('stroke', 'black')
            .attr('stroke-width', 2)
            .each(function () {
            this.parentNode.appendChild(this);
        });
        var label = svg.selectAll('.team_label')
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
    }
    svg.on('mousemove', mousemove);
});
