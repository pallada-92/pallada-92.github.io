import * as d3 from 'd3';
import * as R from 'ramda';
import { SeasonGamesTable1 } from './dao';
import { Common1 } from './common';

export class Cross1 {

    width = 600;
    height = 600;
    margin = { top: 100.5, right: 80, bottom: 50, left: 100.5 };
    matches;
    svg;
    elem;

    score_scale;
    scores_scale_x;
    teams;
    percent;
    nothing;
    dao;
    precalc() {
        this.dao = new SeasonGamesTable1(this.matches);
        this.score_scale = d3.scaleLinear()
            .domain(this.dao.score_range)
            .range([this.height, 0])
            .nice();
        this.scores_scale_x = this.width + 30.5;
        this.teams = d3.scaleBand()
            .domain(this.dao.team_names)
            .paddingInner(0.1)
            .rangeRound([0, this.height]);
        this.prob_scale = d3.scaleLinear()
            .domain([0, 1])
            .range([0, this.width])
        this.percent = d3.format('.0%');
    }

    prob_g;
    cells;
    cur_score;
    prob_scale;
    diag;
    prob_title;
    team_odds_titles;
    diag_score;

    init_sets() {
        this.nothing = this.svg.selectAll('.nothing');
        this.prob_g = this.nothing;
        this.cells = this.nothing;
        this.diag = this.nothing;
        this.prob_title = this.nothing;
        this.team_odds_titles = this.nothing;
        this.diag_score = this.nothing;
    }

    reset() {
        this.diag_score
            .attr('visibility', 'hidden')
        this.svg.selectAll('.team-hor')
            .attr('fill', 'black')
            .style('font-weight', 'normal');
        this.svg.selectAll('.team-vert')
            .attr('fill', 'black')
            .style('font-weight', 'normal');
        this.cur_score
            .attr('visibility', 'hidden');
        this.team_odds_titles
            .attr('visibility', 'hidden');
        this.prob_title
            .attr('visibility', 'hidden');
        this.prob_g
            .attr('visibility', 'hidden');
        this.cells.select('text')
            .attr('fill', (match) => this.dao.res_prob(match) > 1 / 3 ? 'black' : 'white');
        this.cells.select('rect')
            .attr('fill', (match) => Common1.res_interp[this.dao.match_res1(match)](this.dao.res_prob(match)));
    }

    first_draw() {
        this.svg.append('g')
            .attr('transform', `translate(${this.scores_scale_x}, 0.5)`)
            .call(d3.axisRight(this.score_scale)
                .tickValues(d3.range(this.score_scale.domain()[0], this.score_scale.domain()[1] + 1, 5)));
        this.svg.append('text')
            .text('scores')
            .attr('fill', 'gray')
            .attr('transform', `
                translate(${this.width + 60}, 0)
                rotate(90)`)
            .attr('text-anchor', 'start');
        this.svg.append('text')
            .text('Home')
            .attr('fill', 'gray')
            .attr('x', -40)
            .attr('y', 20)
            .attr('text-anchor', 'end')
        this.svg.append('text')
            .text('Away')
            .attr('fill', 'gray')
            .attr('x', 20)
            .attr('y', -40)
            .attr('text-anchor', 'end')
        this.svg.selectAll('.team-hor')
            .data(this.dao.team_names)
            .enter().append('text')
            .classed('team-hor', true)
            .text(R.identity)
            .attr('transform', (team) => `
                translate(-10, ${this.teams(team)})
                translate(0, ${this.teams.bandwidth() * 0.7})
                rotate(-45)`)
            .attr('text-anchor', 'end')
        this.svg.selectAll('.team-vert')
            .data(this.dao.team_names)
            .enter().append('text')
            .classed('team-vert', true)
            .text(R.identity)
            .attr('transform', (team) => `
                translate(${this.teams(team)}, -10)
                translate(${this.teams.bandwidth() * 0.7})
                rotate(-45)`)
            .attr('text-anchor', 'start')
        this.svg.selectAll('.team-score')
            .data(this.dao.team_names)
            .enter().append('line')
            .classed('team-score', true)
            .attr('x1', this.width)
            .attr('y1', (team) => this.teams(team) + this.teams.bandwidth() / 2)
            .attr('x2', this.scores_scale_x)
            .attr('y2', (team) => this.score_scale(this.dao.scores[team]))
            .attr('stroke', 'gray')
        this.cells = this.cells
            .data(this.matches)
            .enter().append('g')
            .attr('transform', (match) => `
                translate(
                    ${this.teams(match['ATeam'])},
                    ${this.teams(match['HTeam'])}
                )`)
        this.cells.append('rect')
            .attr('width', this.teams.bandwidth())
            .attr('height', this.teams.bandwidth())
        this.cells.append('text')
            .attr('x', this.teams.bandwidth() / 2)
            .attr('y', this.teams.bandwidth() / 2)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .text((match) => match['HGoals'] + ':' + match['AGoals'])
        this.prob_g = this.svg.append('g')
            .attr('transform', `translate(0, ${this.height + 20})`)
        this.prob_g.selectAll('rect')
            .data(['H', 'D', 'A'])
            .enter().append('rect')
        this.prob_g.selectAll('text')
            .data(['H', 'D', 'A'])
            .enter().append('text')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central');
        this.cur_score = (
            this.cur_score ||
            this.svg.append('g')
                .attr('transform', `translate(${this.scores_scale_x})`)
                .selectAll('.nothing'))
            .data(['H', 'A'])
            .enter().append('g')
        this.cur_score.append('circle')
            .attr('r', 5)
        this.cur_score.append('text')
        this.prob_title = this.svg.append('text')
            .attr('x', this.width / 2)
            .attr('y', this.height + 10)
            .attr('fill', 'gray')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central');
        this.team_odds_titles = this.team_odds_titles
            .data(['H', 'A'])
            .enter().append('text')
            .attr('x', (d: string) => ({ H: 0, A: this.width }[d]))
            .attr('y', this.height + 10)
            .attr('text-anchor', (d: string) => ({ H: 'begin', A: 'end' }[d]))
            .attr('dominant-baseline', 'central')
            .attr('fill', 'gray');
        this.diag = this.diag
            .data(this.dao.team_names)
            .enter().append('g')
            .attr('transform', (team) => `
                translate(
                    ${this.teams(team)},
                    ${this.teams(team)}
                )`);
        this.diag.append('rect')
            .attr('width', this.teams.bandwidth())
            .attr('height', this.teams.bandwidth())
            .attr('fill', 'lightgray');
        this.diag.append('text')
            .attr('x', this.teams.bandwidth() / 2)
            .attr('y', this.teams.bandwidth() / 2)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .text((team) => this.dao.scores[team]);
        this.diag_score = this.svg.append('circle')
            .attr('cx', this.scores_scale_x)
            .attr('r', 5)
            .attr('fill', 'gray')
            .attr('visibility', 'hidden');
        this.cells.on('mouseover', this.cell_mouseover.bind(this))
            .on('mouseout', this.reset.bind(this));
        this.diag.on('mouseover', this.diag_mouseover.bind(this))
            .on('mouseout', this.reset.bind(this));
        this.svg.selectAll('.team-hor, .team-vert')
            .on('mouseover', this.diag_mouseover.bind(this))
            .on('mouseout', this.reset.bind(this));
    }

    cell_mouseover(match) {
        let probs = this.dao.match_prob2(match);
        let left = {
            H: 0,
            D: probs['H'],
            A: probs['H'] + probs['D']
        }
        let res = this.dao.match_res1(match);
        this.team_odds_titles
            .attr('visibility', 'visible');
        this.prob_title
            .attr('visibility', 'visible')
            .text('Bookmaker predictions');
        this.prob_g
            .attr('visibility', 'visible');
        this.prob_g.selectAll('rect')
            .attr('x', (letter: string) => this.prob_scale(left[letter]))
            .attr('y', 0)
            .attr('width', (letter: string) => this.prob_scale(probs[letter]))
            .attr('height', 20)
            .attr('fill', (letter: string) => Common1.res_interp[letter](probs[letter]))
        this.prob_g.selectAll('text')
            .attr('x', (letter: string) => this.prob_scale(left[letter] + probs[letter] / 2))
            .attr('y', 10)
            .attr('fill', (letter: string) => probs[letter] > 1 / 3 ? 'black' : 'white')
            .text((letter: string) => this.percent(probs[letter]))
        this.cur_score
            .attr('visibility', 'visible');
        this.cur_score.select('circle')
            .attr('cy', (letter: string) => this.score_scale(this.dao.scores[match[letter + 'Team']]))
            .attr('fill', (letter: string) => Common1.clr[Common1.mat[res][letter]])
        this.cur_score.select('text')
            .attr('x', -7)
            .attr('y', (letter: string) => this.score_scale(this.dao.scores[match[letter + 'Team']]))
            .text(R.identity)
            .attr('fill', (letter: string) => Common1.clr[Common1.mat[res][letter]])
            .attr('text-anchor', 'end')
            .attr('dominant-baseline', 'central')
            .style('font-weight', 'bold');
        this.team_odds_titles
            .text((d: string) => match[d + 'Team'] + ' (' + { H: 'Home', A: 'Away' }[d] + ')')
        this.svg.selectAll('.team-hor')
            .attr('fill', 'gray')
            .filter(R.equals(match['HTeam']))
            .style('font-weight', 'bold')
            .attr('fill', (team: string) => Common1.clr[Common1.mat[res]['H']])
        this.svg.selectAll('.team-vert')
            .attr('fill', 'gray')
            .filter(R.equals(match['ATeam']))
            .style('font-weight', 'bold')
            .attr('fill', (team: string) => Common1.clr[Common1.mat[res]['A']])
    }


    diag_mouseover(team) {
        this.svg.selectAll('.team-hor')
            .attr('fill', 'gray')
            .filter(R.equals(team))
            .attr('fill', 'black')
            .style('font-weight', 'bold')
        this.svg.selectAll('.team-vert')
            .attr('fill', 'gray')
            .filter(R.equals(team))
            .attr('fill', 'black')
            .style('font-weight', 'bold')
        this.cells.select('rect').attr('fill', '#EEE')
        this.cells.select('text').attr('fill', 'black')
        let paint_cells = this.cells
            .filter((match) => (match['HTeam'] == team) || (match['ATeam'] == team))
        paint_cells.select('text')
            .attr('fill', 'white')
        paint_cells.select('rect')
            .attr('fill', (match) => {
                let res = this.dao.match_res1(match);
                let which = match['HTeam'] == team ? 'H' : 'A';
                let trans = {
                    H: { H: 'H', A: 'A' },
                    D: { H: 'D', A: 'D' },
                    A: { H: 'A', A: 'H' },
                }
                return Common1.res_interp[trans[res][which]](1 / 3);
            })
        this.prob_title
            .attr('visibility', 'visible')
            .text(team + ' statistics');
        this.prob_g
            .attr('visibility', 'visible');
        let stats = { H: 0, D: 0, A: 0 };
        let stats_trans = { W: 'H', D: 'D', L: 'A' };
        this.matches.forEach((match) => {
            let res = this.dao.match_res1(match);
            if (match['HTeam'] == team) {
                stats[stats_trans[Common1.mat[res]['H']]] += 1;
            } else if (match['ATeam'] == team) {
                stats[stats_trans[Common1.mat[res]['A']]] += 1;
            }
        })
        let total = stats['H'] + stats['D'] + stats['A'];
        let left = {
            H: 0,
            D: stats['H'],
            A: stats['H'] + stats['D'],
        }
        this.prob_g.selectAll('rect')
            .attr('x', (letter: string) => this.prob_scale(left[letter] / total))
            .attr('y', 0)
            .attr('width', (letter: string) => this.prob_scale(stats[letter] / total))
            .attr('height', 20)
            .attr('fill', (letter: string) => Common1.res_interp[letter](1 / 3))
        this.prob_g.selectAll('text')
            .attr('x', (letter: string) => this.prob_scale(left[letter] / total + stats[letter] / 2 / total))
            .attr('y', 10)
            .attr('fill', 'white')
            .text((letter: string) => stats[letter])
        this.diag_score
            .attr('visibility', 'visibile')
            .attr('cy', this.score_scale(this.dao.scores[team]))
    }

    launch() {
        this.precalc();
        this.init_sets();
        this.first_draw();
        this.reset();
    }
}
