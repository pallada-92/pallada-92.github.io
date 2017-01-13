"use strict";
var d3 = require('d3');
var R = require('ramda');
var dao_1 = require('./dao');
var common_1 = require('./common');
var Cross1 = (function () {
    function Cross1() {
        this.width = 600;
        this.height = 600;
        this.margin = { top: 100.5, right: 80, bottom: 50, left: 100.5 };
    }
    Cross1.prototype.precalc = function () {
        this.dao = new dao_1.SeasonGamesTable1(this.matches);
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
            .range([0, this.width]);
        this.percent = d3.format('.0%');
    };
    Cross1.prototype.init_sets = function () {
        this.nothing = this.svg.selectAll('.nothing');
        this.prob_g = this.nothing;
        this.cells = this.nothing;
        this.diag = this.nothing;
        this.prob_title = this.nothing;
        this.team_odds_titles = this.nothing;
        this.diag_score = this.nothing;
    };
    Cross1.prototype.reset = function () {
        var _this = this;
        this.diag_score
            .attr('visibility', 'hidden');
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
            .attr('fill', function (match) { return _this.dao.res_prob(match) > 1 / 3 ? 'black' : 'white'; });
        this.cells.select('rect')
            .attr('fill', function (match) { return common_1.Common1.res_interp[_this.dao.match_res1(match)](_this.dao.res_prob(match)); });
    };
    Cross1.prototype.first_draw = function () {
        var _this = this;
        this.svg.append('g')
            .attr('transform', "translate(" + this.scores_scale_x + ", 0.5)")
            .call(d3.axisRight(this.score_scale)
            .tickValues(d3.range(this.score_scale.domain()[0], this.score_scale.domain()[1] + 1, 5)));
        this.svg.append('text')
            .text('scores')
            .attr('fill', 'gray')
            .attr('transform', "\n                translate(" + (this.width + 60) + ", 0)\n                rotate(90)")
            .attr('text-anchor', 'start');
        this.svg.append('text')
            .text('Home')
            .attr('fill', 'gray')
            .attr('x', -40)
            .attr('y', 20)
            .attr('text-anchor', 'end');
        this.svg.append('text')
            .text('Away')
            .attr('fill', 'gray')
            .attr('x', 20)
            .attr('y', -40)
            .attr('text-anchor', 'end');
        this.svg.selectAll('.team-hor')
            .data(this.dao.team_names)
            .enter().append('text')
            .classed('team-hor', true)
            .text(R.identity)
            .attr('transform', function (team) { return ("\n                translate(-10, " + _this.teams(team) + ")\n                translate(0, " + _this.teams.bandwidth() * 0.7 + ")\n                rotate(-45)"); })
            .attr('text-anchor', 'end');
        this.svg.selectAll('.team-vert')
            .data(this.dao.team_names)
            .enter().append('text')
            .classed('team-vert', true)
            .text(R.identity)
            .attr('transform', function (team) { return ("\n                translate(" + _this.teams(team) + ", -10)\n                translate(" + _this.teams.bandwidth() * 0.7 + ")\n                rotate(-45)"); })
            .attr('text-anchor', 'start');
        this.svg.selectAll('.team-score')
            .data(this.dao.team_names)
            .enter().append('line')
            .classed('team-score', true)
            .attr('x1', this.width)
            .attr('y1', function (team) { return _this.teams(team) + _this.teams.bandwidth() / 2; })
            .attr('x2', this.scores_scale_x)
            .attr('y2', function (team) { return _this.score_scale(_this.dao.scores[team]); })
            .attr('stroke', 'gray');
        this.cells = this.cells
            .data(this.matches)
            .enter().append('g')
            .attr('transform', function (match) { return ("\n                translate(\n                    " + _this.teams(match['ATeam']) + ",\n                    " + _this.teams(match['HTeam']) + "\n                )"); });
        this.cells.append('rect')
            .attr('width', this.teams.bandwidth())
            .attr('height', this.teams.bandwidth());
        this.cells.append('text')
            .attr('x', this.teams.bandwidth() / 2)
            .attr('y', this.teams.bandwidth() / 2)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .text(function (match) { return match['HGoals'] + ':' + match['AGoals']; });
        this.prob_g = this.svg.append('g')
            .attr('transform', "translate(0, " + (this.height + 20) + ")");
        this.prob_g.selectAll('rect')
            .data(['H', 'D', 'A'])
            .enter().append('rect');
        this.prob_g.selectAll('text')
            .data(['H', 'D', 'A'])
            .enter().append('text')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central');
        this.cur_score = (this.cur_score ||
            this.svg.append('g')
                .attr('transform', "translate(" + this.scores_scale_x + ")")
                .selectAll('.nothing'))
            .data(['H', 'A'])
            .enter().append('g');
        this.cur_score.append('circle')
            .attr('r', 5);
        this.cur_score.append('text');
        this.prob_title = this.svg.append('text')
            .attr('x', this.width / 2)
            .attr('y', this.height + 10)
            .attr('fill', 'gray')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central');
        this.team_odds_titles = this.team_odds_titles
            .data(['H', 'A'])
            .enter().append('text')
            .attr('x', function (d) { return ({ H: 0, A: _this.width }[d]); })
            .attr('y', this.height + 10)
            .attr('text-anchor', function (d) { return ({ H: 'begin', A: 'end' }[d]); })
            .attr('dominant-baseline', 'central')
            .attr('fill', 'gray');
        this.diag = this.diag
            .data(this.dao.team_names)
            .enter().append('g')
            .attr('transform', function (team) { return ("\n                translate(\n                    " + _this.teams(team) + ",\n                    " + _this.teams(team) + "\n                )"); });
        this.diag.append('rect')
            .attr('width', this.teams.bandwidth())
            .attr('height', this.teams.bandwidth())
            .attr('fill', 'lightgray');
        this.diag.append('text')
            .attr('x', this.teams.bandwidth() / 2)
            .attr('y', this.teams.bandwidth() / 2)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .text(function (team) { return _this.dao.scores[team]; });
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
    };
    Cross1.prototype.cell_mouseover = function (match) {
        var _this = this;
        var probs = this.dao.match_prob2(match);
        var left = {
            H: 0,
            D: probs['H'],
            A: probs['H'] + probs['D']
        };
        var res = this.dao.match_res1(match);
        this.team_odds_titles
            .attr('visibility', 'visible');
        this.prob_title
            .attr('visibility', 'visible')
            .text('Bookmaker predictions');
        this.prob_g
            .attr('visibility', 'visible');
        this.prob_g.selectAll('rect')
            .attr('x', function (letter) { return _this.prob_scale(left[letter]); })
            .attr('y', 0)
            .attr('width', function (letter) { return _this.prob_scale(probs[letter]); })
            .attr('height', 20)
            .attr('fill', function (letter) { return common_1.Common1.res_interp[letter](probs[letter]); });
        this.prob_g.selectAll('text')
            .attr('x', function (letter) { return _this.prob_scale(left[letter] + probs[letter] / 2); })
            .attr('y', 10)
            .attr('fill', function (letter) { return probs[letter] > 1 / 3 ? 'black' : 'white'; })
            .text(function (letter) { return _this.percent(probs[letter]); });
        this.cur_score
            .attr('visibility', 'visible');
        this.cur_score.select('circle')
            .attr('cy', function (letter) { return _this.score_scale(_this.dao.scores[match[letter + 'Team']]); })
            .attr('fill', function (letter) { return common_1.Common1.clr[common_1.Common1.mat[res][letter]]; });
        this.cur_score.select('text')
            .attr('x', -7)
            .attr('y', function (letter) { return _this.score_scale(_this.dao.scores[match[letter + 'Team']]); })
            .text(R.identity)
            .attr('fill', function (letter) { return common_1.Common1.clr[common_1.Common1.mat[res][letter]]; })
            .attr('text-anchor', 'end')
            .attr('dominant-baseline', 'central')
            .style('font-weight', 'bold');
        this.team_odds_titles
            .text(function (d) { return match[d + 'Team'] + ' (' + { H: 'Home', A: 'Away' }[d] + ')'; });
        this.svg.selectAll('.team-hor')
            .attr('fill', 'gray')
            .filter(R.equals(match['HTeam']))
            .style('font-weight', 'bold')
            .attr('fill', function (team) { return common_1.Common1.clr[common_1.Common1.mat[res]['H']]; });
        this.svg.selectAll('.team-vert')
            .attr('fill', 'gray')
            .filter(R.equals(match['ATeam']))
            .style('font-weight', 'bold')
            .attr('fill', function (team) { return common_1.Common1.clr[common_1.Common1.mat[res]['A']]; });
    };
    Cross1.prototype.diag_mouseover = function (team) {
        var _this = this;
        this.svg.selectAll('.team-hor')
            .attr('fill', 'gray')
            .filter(R.equals(team))
            .attr('fill', 'black')
            .style('font-weight', 'bold');
        this.svg.selectAll('.team-vert')
            .attr('fill', 'gray')
            .filter(R.equals(team))
            .attr('fill', 'black')
            .style('font-weight', 'bold');
        this.cells.select('rect').attr('fill', '#EEE');
        this.cells.select('text').attr('fill', 'black');
        var paint_cells = this.cells
            .filter(function (match) { return (match['HTeam'] == team) || (match['ATeam'] == team); });
        paint_cells.select('text')
            .attr('fill', 'white');
        paint_cells.select('rect')
            .attr('fill', function (match) {
            var res = _this.dao.match_res1(match);
            var which = match['HTeam'] == team ? 'H' : 'A';
            var trans = {
                H: { H: 'H', A: 'A' },
                D: { H: 'D', A: 'D' },
                A: { H: 'A', A: 'H' },
            };
            return common_1.Common1.res_interp[trans[res][which]](1 / 3);
        });
        this.prob_title
            .attr('visibility', 'visible')
            .text(team + ' statistics');
        this.prob_g
            .attr('visibility', 'visible');
        var stats = { H: 0, D: 0, A: 0 };
        var stats_trans = { W: 'H', D: 'D', L: 'A' };
        this.matches.forEach(function (match) {
            var res = _this.dao.match_res1(match);
            if (match['HTeam'] == team) {
                stats[stats_trans[common_1.Common1.mat[res]['H']]] += 1;
            }
            else if (match['ATeam'] == team) {
                stats[stats_trans[common_1.Common1.mat[res]['A']]] += 1;
            }
        });
        var total = stats['H'] + stats['D'] + stats['A'];
        var left = {
            H: 0,
            D: stats['H'],
            A: stats['H'] + stats['D'],
        };
        this.prob_g.select('rect')
            .attr('x', function (letter) { return _this.prob_scale(left[letter] / total); })
            .attr('y', 0)
            .attr('width', function (letter) { return _this.prob_scale(stats[letter] / total); })
            .attr('height', 20)
            .attr('fill', function (letter) { return common_1.Common1.res_interp[letter](1 / 3); });
        this.prob_g.select('text')
            .attr('x', function (letter) { return _this.prob_scale(left[letter] / total + stats[letter] / 2 / total); })
            .attr('y', 10)
            .attr('fill', 'white')
            .text(function (letter) { return stats[letter]; });
        this.diag_score
            .attr('visibility', 'visibile')
            .attr('cy', this.score_scale(this.dao.scores[team]));
    };
    Cross1.prototype.launch = function () {
        this.precalc();
        this.init_sets();
        this.first_draw();
        this.reset();
    };
    return Cross1;
}());
exports.Cross1 = Cross1;
