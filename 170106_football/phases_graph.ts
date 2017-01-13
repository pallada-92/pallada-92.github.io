import * as d3 from 'd3';
import * as R from 'ramda';
import { Common1 } from './common';
import { SeasonGamesTable1 } from './dao';

export class PhasesGraph1 {
    width = 650;
    height = 650;
    margin = { top: 30.5, right: 30, bottom: 0, left: 30.5 };
    svg;
    matches;
    elem;

    quantile = false;
    mean_coeff = 2;
    random_rad = 0.2;

    dao;
    teams;
    params_scales;
    param_scale;
    params;
    precalc() {
        this.dao = new SeasonGamesTable1(this.matches);
        this.params = ['Corners', 'Shots', 'ShotsTarget', 'Goals'];
        this.param_scale = d3.scalePoint()
            .domain(this.params)
            .range([0, this.width]);
        this.params_scales = {};
        this.params.forEach((key) => {
            let scale;
            if (this.quantile) {
                scale = d3.scaleLinear()
                    .domain([0, this.dao.matches1.length]);
            } else {
                scale = d3.scaleLinear()
                    .domain([0, this.dao.avg_params[key] * this.mean_coeff]);
            }
            scale.range([this.height, 0]);
            this.params_scales[key] = scale;
        });
    }

    line;
    scales_g;
    title;
    title_home;
    title_away;
    title_comment;
    match_paths;
    cur_avg;
    cur_path;
    other_avg;
    other_path;
    first_draw() {
        let this1 = this;
        this.scales_g = this.svg.selectAll('.nothing')
            .data(this.params)
            .enter().append('g')
            .attr('transform', (param) => `translate(${this.param_scale(param)}, 0)`)
            .each(function (param, _, group) {
                let axis = d3.axisLeft(this1.params_scales[param]);
                if (this1.quantile) {
                    let vals: any[] = this1.dao.sorted_params[param];
                    let ticks = [0];
                    let cur_val = 0;
                    vals.forEach((val, idx) => {
                        if (cur_val == val) return;
                        ticks.push(idx);
                        cur_val = val;
                    })
                    axis
                        .tickValues(ticks)
                        .tickFormat((val, idx) => '' + idx)
                }
                axis(d3.select(this));
            });
        this.scales_g.append('text')
            .attr('y', this.height + 24)
            .style('font-size', '14px')
            .attr('fill', 'black')
            .attr('text-anchor', 'middle')
            .text((param) => ({
                Corners: 'Corners',
                Shots: 'Shots',
                ShotsTarget: 'Shots on target',
                Goals: 'Goals',
            }[param]))
        this.title = this.svg.append('text')
            .attr('x', this.width / 2)
            .attr('y', -45)
            .attr('fill', 'black')
            .attr('text-anchor', 'middle')
        this.title_home = this.title.append('tspan')
            .text('')
        this.title.append('tspan')
            .text(':')
        this.title_away = this.title.append('tspan')
            .text('')
        this.title_comment = this.svg.append('text')
            .attr('x', this.width / 2)
            .attr('y', -20)
            .attr('text-anchor', 'middle')
            .text('Select team')
        this.line = d3.line()
            .x(([param, val]) => this.param_scale(param))
            .y(([param, val]) => Common1.scale_rand(
                this.param_scale_fun(param),
                val,
                this.random_rad
            ))
        this.svg.selectAll('.nothing')
            .data(this.params)
            .enter().append('g')
            .attr('transform', (param) => `
                translate(${this.param_scale(param)}, 0)`)
            .selectAll('.nothing')
            .data((param) => R.xprod(
                [param],
                R.union(this.dao.sorted_params[param], [])
            ))
            .enter().append('rect')
            .attr('fill', 'gray')
            .attr('x', -2)
            .attr('y', ([param, idx]) => Common1.scale_rand_range(
                this.param_scale_fun(param),
                idx,
                this.random_rad
            )[0])
            .attr('width', 4)
            .attr('height', ([param, idx]) => Common1.scale_rand_range(
                this.param_scale_fun(param),
                idx,
                this.random_rad
            )[1])
        this.match_paths = this.svg.selectAll('.nothing');
        this.cur_avg = this.svg.append('path')
            .attr('stroke', 'darkblue')
            .attr('stroke-dasharray', '10,10')
            .attr('stroke-width', 1)
            .attr('fill', 'none')
        this.other_avg = this.svg.append('path')
            .attr('stroke', 'orange')
            .attr('stroke-dasharray', '10,10')
            .attr('stroke-width', 1)
            .attr('fill', 'none')
        this.cur_path = this.svg.append('path')
            .attr('stroke', 'darkblue')
            .attr('stroke-width', 3)
            .attr('fill', 'none')
        this.other_path = this.svg.append('path')
            .attr('stroke', 'orange')
            .attr('stroke-width', 3)
            .attr('fill', 'none')
    }

    param_scale_fun(param) {
        if (this.quantile) {
            return (x) => this.params_scales[param](
                this.dao.sorted_params[param].indexOf(x))
        } else {
            return this.params_scales[param];
        }
    }

    selected_team;
    select_team(team) {
        this.selected_team = team;
        this.title
            .attr('visibility', 'hidden')
        this.title_comment
            .text(`gray are ${team} matches`)
            .attr('fill', 'gray')
        this.match_paths = this.match_paths
            .data(R.filter(
                R.propEq('cur_team', team),
                this.dao.matches1
            ).map(this.match_to_path.bind(this)))
            .enter().append('path')
            .attr('fill', 'none')
            .attr('stroke', 'lightgray')
            .merge(this.match_paths)
            .attr('d', this.line)
            .exit().remove()
        this.cur_avg
            .data(R.filter(
                ({cur_team, other_team, cur_home}) =>
                    R.equals([cur_team, other_team, cur_home], ['Arsenal', 'Chelsea', true]),
                this.dao.matches1).map(this.match_to_path.bind(this)))
            .merge(this.cur_avg)
            .attr('d', this.line);
    }



    match_to_path(match) {
        return this.params.map((param) => [
            param,
            match[param]
        ])
    }

    launch() {
        this.precalc();
        this.first_draw();
        this.select_team('Arsenal');
    }
}
