import * as d3 from 'd3';
import * as R from 'ramda';
import { SeasonGamesTable1 } from './dao';
import { Common1 } from './common';

export class Weeks1 {

    width = 1200;
    height = 600;
    margin = { top: 30, right: 30, bottom: 50, left: 100 };

    div_scales_ranges = {
        'E0': [0, 20],
        'E1': [0, 23],
        'E2': [0, 23],
        'E3': [0, 23],
        'EC': [0, 23],
    }

    matches;
    svg;
    elem;
    teams;
    weeks;
    cells;
    prob_scale;
    percent;
    ind_width;
    dao;
    points;
    season;
    div_scales;
    precalc() {
        this.dao = new SeasonGamesTable1(this.matches);
        this.teams = d3.scaleBand()
            .domain(this.dao.team_names)
            .paddingInner(0.1)
            .rangeRound([0, this.height]);
        this.weeks = d3.scaleBand()
            .domain(d3.range(this.dao.max_week + 1).map((x) => '' + x))
            .paddingInner(0.1)
            .range([0, this.width]);
        this.cells = this.svg.selectAll('.cell')
            .data(this.dao.matches1)
            .enter().append('g')
            .classed('cell', true)
            .attr('transform', (match) => `translate(${this.weeks(match['week'])}, ${this.teams(match['cur_team'])})`)
        this.ind_width = this.width / 2 - 10;
        this.prob_scale = d3.scaleLinear()
            .domain([0, 1])
            .range([0, this.ind_width]);
        this.percent = d3.format('.0%');
    }

    stat_g;
    prob_g;
    first_draw() {
        this.svg.append('text')
            .text('Teams')
            .attr('fill', 'gray')
            .attr('x', -40)
            .attr('y', 20)
            .attr('text-anchor', 'end')
        this.svg.append('text')
            .text('Weeks')
            .attr('fill', 'gray')
            .attr('x', 0)
            .attr('y', -10)
            .attr('text-anchor', 'start')
        this.svg.selectAll('.team-hor')
            .data(this.dao.team_names)
            .enter().append('text')
            .classed('team-hor', true)
            .text(R.identity)
            .attr('transform', (team) => `translate(-10, ${this.teams(team)}) translate(0, ${this.teams.bandwidth() * 0.7}) rotate(-45)`)
            .attr('text-anchor', 'end')
        this.cells.append('rect')
            .attr('width', this.teams.bandwidth())
            .attr('height', this.teams.bandwidth())
        this.cells.append('text')
            .attr('x', this.teams.bandwidth() / 2)
            .attr('y', this.teams.bandwidth() / 2)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .text((match) => `${match['cur_goals']}:${match['other_goals']}`)
        this.cells
            .filter(R.prop('cur_home'))
            .append('line')
            .attr('x1', this.teams.bandwidth() * 0.1)
            .attr('x2', this.teams.bandwidth() * 0.9)
            .attr('y1', this.teams.bandwidth() * 0.8)
            .attr('y2', this.teams.bandwidth() * 0.8)
        this.prob_g = this.svg.append('g')
            .attr('transform', `translate(0, ${this.height}) `)
            .classed('prob_g', true)
        this.stat_g = this.svg.append('g')
            .attr('transform', `translate(${this.width - this.ind_width}, ${this.height})`)
            .classed('stat_g', true)
        this.prob_g.append('text')
            .classed('prob_title', true)
            .attr('x', this.ind_width / 2)
            .attr('y', 10)
            .attr('fill', 'gray')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .text('Bookmaker predictions');
        this.prob_g.selectAll('.team_titles')
            .data(['cur', 'other'])
            .enter().append('text')
            .classed('team_titles', true)
            .attr('x', (d: string) => ({ cur: 0, other: this.ind_width }[d]))
            .attr('y', 10)
            .attr('text-anchor', (d: string) => ({ cur: 'begin', other: 'end' }[d]))
            .attr('dominant-baseline', 'central')
            .attr('fill', 'gray')
            .text('test');
        this.stat_g.append('text')
            .classed('title', true)
            .attr('x', this.ind_width / 2)
            .attr('y', 10)
            .attr('fill', 'gray')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .text('Team statistics');
        this.prob_g.selectAll('rect')
            .data(['W', 'D', 'L'])
            .enter().append('rect');
        this.stat_g.selectAll('rect')
            .data(['W', 'D', 'L'])
            .enter().append('rect');
        this.prob_g.selectAll('text.labels')
            .data(['W', 'D', 'L'])
            .enter().append('text')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .classed('labels', true);
        this.stat_g.selectAll('text.labels')
            .data(['W', 'D', 'L'])
            .enter().append('text')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .attr('fill', 'white')
            .classed('labels', true);
        this.cells.on('mouseover', (match) => {
            this.highlight_team(match['cur_team']);
            this.highlight_match(match);
        }).on('mouseout', this.reset.bind(this));
        this.svg.selectAll('.team-hor').on('mouseover', this.highlight_team.bind(this))
            .on('mouseout', this.reset.bind(this));
    }

    reset() {
        this.svg.selectAll('.team-hor')
            .attr('fill', 'black')
            .style('font-weight', 'normal');
        this.svg.selectAll('.stat_g')
            .attr('visibility', 'hidden');
        this.svg.selectAll('.prob_g')
            .attr('visibility', 'hidden');
        this.svg.selectAll('.cell text')
            .attr('fill', (match) => match['prob'][match['res']] > 1 / 3 ? 'black' : 'white')
        this.svg.selectAll('.cell line')
            .attr('stroke', (match) => match['prob'][match['res']] > 1 / 3 ? 'black' : 'white')
        this.svg.selectAll('.cell rect')
            .attr('fill', (match) => Common1.res_interp[match['res']](match['prob'][match['res']]))
    }

    highlight_team(team) {
        let sel = this.svg.selectAll('.cell')
            .filter((match) => (match['cur_team'] != team) && (match['other_team'] != team))
        sel.select('rect').attr('fill', 'lightgray')
        sel.select('text').attr('fill', 'black')
        sel.select('line').attr('stroke', 'black')
        /* this.svg.selectAll('.cell rect')
            .filter((match) => match['cur_team'] == team)
            .attr('fill', (match) => Common1.res_interp[match['res']](1 / 3))
            */
        this.svg.selectAll('.team-hor')
            .attr('fill', 'gray')
            .filter(R.equals(team))
            .attr('fill', 'black')
            .style('font-weight', 'bold')
        this.svg.selectAll('.stat_g')
            .attr('visibility', 'visible')
        let stats = { W: 0, D: 0, L: 0 };
        this.dao.matches1.forEach((match) => { if (match.cur_team == team) { stats[match.res]++ } });
        let total = stats.W + stats.D + stats.L;
        let left = {
            W: 0,
            D: stats.W,
            L: stats.W + stats.D,
        }
        this.svg.selectAll('.stat_g rect')
            .attr('x', (letter: string) => this.prob_scale(left[letter] / total))
            .attr('y', 20)
            .attr('width', (letter: string) => this.prob_scale(stats[letter] / total))
            .attr('height', 20)
            .attr('fill', (letter: string) => Common1.clr[letter])
        this.svg.selectAll('.stat_g text.labels')
            .attr('x', (letter: string) => this.prob_scale((left[letter] + stats[letter] / 2) / total))
            .attr('y', 30)
            .text((letter: string) => stats[letter])
        this.svg.selectAll('.stat_g text.title')
            .text(`"${team}" statistics`)
    }

    highlight_match(match) {
        this.svg.selectAll('.prob_g')
            .attr('visibility', 'visible')
        let probs = match.prob;
        let total = probs.W + probs.D + probs.L;
        let left = {
            W: 0,
            D: probs.W,
            L: probs.W + probs.D,
        }
        this.svg.selectAll('.prob_g rect')
            .attr('x', (letter: string) => this.prob_scale(left[letter] / total))
            .attr('y', 20)
            .attr('width', (letter: string) => this.prob_scale(probs[letter] / total))
            .attr('height', 20)
            .attr('fill', (letter: string) => Common1.res_interp[letter](match.prob[letter]))
        this.svg.selectAll('.prob_g text.labels')
            .attr('x', (letter: string) => this.prob_scale((left[letter] + probs[letter] / 2) / total))
            .attr('y', 30)
            .attr('fill', (letter: string) => match.prob[letter] > 1 / 3 ? 'black' : 'white')
            .text((letter: string) => this.percent(probs[letter]))
        this.svg.selectAll('.prob_g text.team_titles')
            .text((letter: string) => match[letter + '_team'] + (+match.cur_home ^ +(letter == 'cur') ? ' (Away)' : ' (Home)'))
    }

    launch() {
        this.precalc();
        this.first_draw();
        this.reset();
    }

}
