import * as d3 from 'd3';
import * as R from 'ramda';
import { Common1 } from './common';
import { SeasonsPositions1 } from './dao';

export class Seasons1 {
    width = 1280;
    height = 690;
    margin = { top: 30.5, right: 30, bottom: 0, left: 30.5 };

    div_scales_ranges = {
        'E0': [0, 20],
        'E1': [0, 23],
        'E2': [0, 23],
        'E3': [0, 23],
        'EC': [0, 23],
    };

    season;
    div_scales;
    division;
    svg;
    elem;
    matches;
    points;
    dao;
    precalc() {
        this.dao = new SeasonsPositions1(this.matches);
        this.season = d3.scalePoint()
            .domain(this.dao.seasons)
            .rangeRound([0, this.width]);
        this.division = d3.scaleBand()
            .domain(this.dao.divisions.reverse())
            .paddingInner(0.1)
            .rangeRound([this.height, 0]);
        this.div_scales = R.mapObjIndexed((range: number[], div) =>
            d3.scaleLinear()
                .domain(range)
                .rangeRound([
                    this.division(div) + this.division.bandwidth(),
                    this.division(div)
                ] as [number, number])
            , this.div_scales_ranges);
        this.points = [];
        for (let team in this.dao.vm) {
            for (let i in this.dao.vm[team]) {
                if (!this.dao.vm[team][i]) continue;
                let [cur_season, cur_division, score] = this.dao.vm[team][i];
                this.points.push([this.season(cur_season), this.div_scales[cur_division](score), team]);
            }
        }
    }

    season_sel;
    division_sel;
    voronoi;
    line;
    first_draw() {
        this.season_sel = this.svg.selectAll('.season')
            .data(this.dao.seasons)
            .enter().append('g')
            .attr('class', 'season')
            .attr('transform', (d) => `translate(${this.season(d)})`)
        this.season_sel.append('text')
            .attr('x', 0)
            .attr('y', -5)
            .attr('text-anchor', 'middle')
            .attr('fill', 'gray')
            .text((d) => d)
        this.division_sel = this.season_sel
            .selectAll('.division')
            .data(() => this.dao.divisions)
            .enter().append('g')
            .attr('transform', (d) => `translate(0, ${this.division(d)})`)
            .append('line')
            .attr('y2', (d) => this.division.bandwidth())
            .attr('stroke', 'gray')
        this.svg.selectAll('.division-label')
            .data(this.dao.divisions)
            .enter().append('text')
            .attr('transform', (d) => `translate(-10, ${this.division(d) + this.division.bandwidth() / 2}) rotate(-90)`)
            .attr('text-anchor', 'middle')
            .attr('fill', 'gray')
            .text((d) => this.dao.div_titles[d])
        this.line = d3.line()
            .x((d: any) => this.season(d[0]) as number)
            .y((d: any) => this.div_scales[d[1]](d[2]) as number)
            .defined((d) => d !== undefined)
        this.svg.selectAll('path')
            .data(R.keys(this.dao.vm))
            .enter().append('path')
            .attr('d', (team) => this.line(this.dao.vm[team]))
            .attr('fill', 'none')
            .attr('stroke', 'lightgray')
        this.voronoi = d3.voronoi()
            .size([this.width, this.height])(this.points);
        d3.select(this.elem).on('mousemove', this.mousemove.bind(this));
    }

    mousemove() {
        let cur = this.voronoi.find.apply(this.voronoi, d3.mouse(this.svg.node())).data;
        this.svg.selectAll('path')
            .attr('stroke', 'lightgray')
            .attr('stroke-width', 1)
            .filter((team) => team == cur[2])
            .attr('stroke', 'black')
            .attr('stroke-width', 2)
            .each(function () {
                (this as any).parentNode.appendChild(this);
            })
        let label = this.svg.selectAll('.team_label')
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

    launch() {
        this.precalc();
        this.first_draw();
    }

}
