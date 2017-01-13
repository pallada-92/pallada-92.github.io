import * as d3 from 'd3';
import * as R from 'ramda';
import { Common1 } from './common';
import { SeasonGamesTable1 } from './dao';

export class Minimatch1 {
    height = 650;
    width = 60;
    margin = { top: 30.5, right: 70, bottom: 40, left: 30.5 };
    svg;
    matches;
    elem;

    dao;
    teams_scale;
    place_scale;
    precalc() {
        this.dao = new SeasonGamesTable1(this.matches);
        this.teams_scale = d3.scaleBand()
            .domain(this.dao.team_names)
            .paddingInner(0.1)
            .range([0, this.height]);
        this.place_scale = d3.scaleBand()
            .domain(['Home', 'Away'])
            .paddingInner(0.1)
            .range([0, this.width])
    }

    selected_team;
    team_label;
    teams;
    cells;
    places;
    first_draw() {
        this.team_label = this.svg.append('text')
            .text('')
            .attr('x', 75)
            .attr('y', -57)
            .attr('text-anchor', 'end')
        this.teams = this.svg.selectAll('.nothing')
            .data(this.dao.team_names)
            .enter().append('text')
            .text(R.identity)
            .attr('transform', (team) => `
                translate(-10, ${this.teams_scale(team)})
                translate(0, ${this.teams_scale.bandwidth() * 0.7})
                rotate(-45)
            `)
            .attr('text-anchor', 'end')
            .style('cursor', 'pointer')
            .on('click', (team) => {
                this.select_team(team);
                this.select_team_handler(team);
            });
        this.places = this.svg.selectAll('.nothing')
            .data(['Home', 'Away'])
            .enter().append('text')
            .text(R.identity)
            .attr('transform', (place) => `
                translate(${this.place_scale(place)}, -10)
                translate(${this.place_scale.bandwidth() * 0.7})
                rotate(-45)`)
            .attr('text-anchor', 'start')
            .attr('visibility', 'hidden');
        this.cells = this.svg.selectAll('.nothing')
            .data(R.xprod(this.dao.team_names, ['Home', 'Away']))
            .enter()
            .append('g')
            .attr('transform', ([team, place]) => `
                translate(
                    ${this.place_scale(place)},
                    ${this.teams_scale(team)}
                )`)
        this.cells.append('rect')
            .attr('width', this.place_scale.bandwidth())
            .attr('height', this.teams_scale.bandwidth())
            .attr('fill', 'white')
        this.cells.append('text')
            .attr('x', this.place_scale.bandwidth() / 2)
            .attr('y', this.teams_scale.bandwidth() / 2)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .text('');
    }

    select_team(team) {
        this.selected_team = team;
        this.team_label
            .text(`vs ${this.selected_team}`);
        this.teams
            .style('font-weight', 'normal')
            .attr('fill', 'black')
            .filter(R.equals(team))
            .style('font-weight', 'bold')
            .attr('fill', 'darkblue');
        this.places
            .attr('visibility', 'visible');
        this.cells.select('text')
            .text(([team2, place]) => {
                let match = this.dao.find_match(place, team, team2);
                if (!match) {
                    return '—';
                }
                if (place == 'Home') {
                    return `${match['HGoals']}:${match['AGoals']}`;
                } else {
                    return `${match['HGoals']}:${match['AGoals']}`;
                }
            })
            .attr('fill', ([team2, place]) => {
                let match = this.dao.find_match(place, team, team2);
                if (!match) {
                    return 'black';
                }
                if (this.dao.res_prob(match) > 1 / 3) {
                    return 'black';
                } else {
                    return 'white';
                }
            });
        this.cells.select('rect')
            .attr('stroke', 'none')
            .attr('fill', ([team2, place]) => {
                let match = this.dao.find_match(place, team, team2);
                if (!match) {
                    return 'lightgray';
                }
                return Common1.res_interp[
                    Common1.mat[this.dao.match_res1(match)][place[0]]
                ](this.dao.res_prob(match))
            });
        this.cells
            .on('mouseover', ([team2, place]) => {
                this.highlight_match(team, [team2, place]);
                this.highlight_match_handler([team2, place]);
            })
            .on('mouseout', this.select_team.bind(this, team));
    }

    highlight_match(team1, [team2, place]) {
        let match = this.dao.find_match(place, team1, team2);
        if (!match) return;
        this.cells
            .filter(R.equals([team2, place]))
            .select('rect')
            .attr('stroke', 'black')
            .attr('fill', Common1.res_interp[
                Common1.mat[this.dao.match_res1(match)][place[0]]
            ](1 / 3))
    }

    select_team_handler: (team) => void;
    highlight_match_handler: (match) => void;

    launch() {
        this.precalc();
        this.first_draw();
    }
}
