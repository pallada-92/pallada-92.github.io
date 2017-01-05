import * as d3 from 'd3';
import * as R from 'ramda';

let width = 1280,
    height = 700,
    margin = { top: 30.5, right: 30, bottom: 0, left: 30.5 };
let svg = d3.select('#vis1')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
const divisions = ['E0', 'E1', 'E2', 'E3', 'EC'];
const seasons = d3.range(1993, 2015 + 1).map((x) => '' + x)
let season = d3.scalePoint()
    .domain(seasons)
    .rangeRound([0, width]);
let division = d3.scaleBand()
    .domain(divisions.reverse())
    .paddingInner(0.1)
    .rangeRound([height, 0]);
const div_titles = {
    'E0': 'Premier league',
    'E1': 'Division 1',
    'E2': 'Division 2',
    'E3': 'Division 3',
    'EC': 'Conference',
};
const div_scales_ranges = {
    'E0': [0, 20],
    'E1': [0, 23],
    'E2': [0, 23],
    'E3': [0, 23],
    'EC': [0, 23],
};
let div_scales = R.mapObjIndexed((range: number[], div) =>
    d3.scaleLinear()
        .domain(range)
        .rangeRound([
            division(div) + division.bandwidth(),
            division(div)
        ] as [number, number])
    , div_scales_ranges);
let season_sel = svg.selectAll('.season')
    .data(seasons)
    .enter().append('g')
    .attr('class', 'season')
    .attr('transform', (d) => 'translate(' + season(d) + ')')
season_sel.append('text')
    .attr('x', 0)
    .attr('y', -5)
    .attr('text-anchor', 'middle')
    .attr('fill', 'gray')
    .text((d) => d)
let division_sel = season_sel
    .selectAll('.division')
    .data(() => divisions)
    .enter().append('g')
    .attr('transform', (d) => 'translate(0, ' + division(d) + ')')
    .append('line')
    .attr('y2', (d) => division.bandwidth())
    .attr('stroke', 'gray')
svg.selectAll('.division-label')
    .data(divisions)
    .enter().append('text')
    .attr('transform', (d) => 'translate(-10, ' + (division(d) + division.bandwidth() / 2) + ') rotate(-90)')
    .attr('text-anchor', 'middle')
    .attr('fill', 'gray')
    .text((d) => div_titles[d])
let line = d3.line()
    .x(function (d: any) {
        return season(d[0]) as number
    })
    .y(function (d: any) {
        return div_scales[d[1]](d[2]);
    })
    .defined((d) => d !== undefined)
d3.json('seasons.json', function (matches) {
    let points: any[] = [];
    let vm = {};
    for (let cur_season in matches) {
        if (seasons.indexOf(cur_season) == -1) continue;
        for (let cur_division in matches[cur_season]) {
            if (divisions.indexOf(cur_division) == -1) continue;
            let scores = matches[cur_season][cur_division];
            let positions = R.fromPairs(
                R.sortBy(
                    R.prop('1'),
                    R.toPairs(scores)
                ).map((v, i) => [v[0], i] as [string, number]));
            for (let team in scores) {
                if (!(team in vm)) {
                    vm[team] = seasons.map(() => undefined);
                }
                // let score = matches[season][division][team];
                let score = positions[team];
                vm[team][seasons.indexOf(cur_season)] = [cur_season, cur_division, score];
                points.push([season(cur_season), div_scales[cur_division](score), team]);
            }
        }
    }
    svg.selectAll('path')
        .data(R.keys(vm))
        .enter().append('path')
        .attr('d', (team) => line(vm[team]))
        .attr('fill', 'none')
        .attr('stroke', 'lightgray')
    let voronoi = d3.voronoi()
        .size([width, height])(points);
    function mousemove() {
        let cur = voronoi.find.apply(voronoi, d3.mouse(this)).data;
        svg.selectAll('path')
            .attr('stroke', 'lightgray')
            .attr('stroke-width', 1)
            .filter((team) => team == cur[2])
            .attr('stroke', 'black')
            .attr('stroke-width', 2)
            .each(function () {
                (this as any).parentNode.appendChild(this);
            })
        let label = svg.selectAll('.team_label')
            .data([cur[2]])
        label.enter().append('text')
            .classed('team_label', true)
            .attr('text-anchor', 'middle')
            .merge(label)
            .text((d) => d)
            .attr('x', cur[0])
            .attr('y', cur[1] - 5)
            .each(function () {
                (this as any).parentNode.appendChild(this);
            })
    }
    svg.on('mousemove', mousemove);
})
