"use strict";
var d3 = require('d3');
var R = require('ramda');
var width = 600, height = 600, margin = { top: 100.5, right: 80, bottom: 50, left: 100.5 };
var svg = d3.select('#vis1')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
d3.csv('2015_E0.csv', function (matches) {
    var scores = {};
    matches.forEach(function (_a) {
        var HTeam = _a.HTeam;
        return scores[HTeam] = 0;
    });
    matches.map(function (_a) {
        var HTeam = _a.HTeam, ATeam = _a.ATeam, HGoals = _a.HGoals, AGoals = _a.AGoals;
        scores[HTeam] += +(HGoals > AGoals) * 3 + +(HGoals == AGoals) * 1;
        scores[ATeam] += +(HGoals < AGoals) * 3 + +(HGoals == AGoals) * 1;
    });
    console.log(matches);
    console.log(scores);
    var rating = R.reverse(R.sortBy(R.prop('1'), R.toPairs(scores)));
    var team_names = rating.map(R.prop('0'));
    console.log(rating);
    var score_range = d3.extent(rating.map(R.prop('1')));
    var score_scale = d3.scaleLinear()
        .domain(score_range)
        .range([height, 0])
        .nice();
    var scores_scale_x = width + 30.5;
    svg.append('g')
        .attr('transform', 'translate(' + scores_scale_x + ', 0.5)')
        .call(d3.axisRight(score_scale)
        .tickValues(d3.range(score_scale.domain()[0], score_scale.domain()[1] + 1, 5)));
    svg.append('text')
        .text('scores')
        .attr('fill', 'gray')
        .attr('transform', 'translate(' + (width + 60) + ',' + 0 + ') rotate(90)')
        .attr('text-anchor', 'start');
    svg.append('text')
        .text('Home')
        .attr('fill', 'gray')
        .attr('x', -40)
        .attr('y', 20)
        .attr('text-anchor', 'end');
    svg.append('text')
        .text('Away')
        .attr('fill', 'gray')
        .attr('x', 20)
        .attr('y', -40)
        .attr('text-anchor', 'end');
    var teams = d3.scaleBand()
        .domain(team_names)
        .paddingInner(0.1)
        .rangeRound([0, height]);
    svg.selectAll('.team-hor')
        .data(team_names)
        .enter().append('text')
        .classed('team-hor', true)
        .text(R.identity)
        .attr('transform', function (team) { return 'translate(-10,' +
        teams(team) + ') translate(0, ' +
        teams.bandwidth() * 0.7 + ') rotate(-45)'; })
        .attr('text-anchor', 'end');
    svg.selectAll('.team-vert')
        .data(team_names)
        .enter().append('text')
        .classed('team-vert', true)
        .text(R.identity)
        .attr('transform', function (team) { return 'translate(' + teams(team) + ',-10) translate(' + teams.bandwidth() * 0.7 + ') rotate(-45)'; })
        .attr('text-anchor', 'start');
    svg.selectAll('.team-score')
        .data(team_names)
        .enter().append('line')
        .classed('team-score', true)
        .attr('x1', width)
        .attr('y1', function (team) { return teams(team) + teams.bandwidth() / 2; })
        .attr('x2', scores_scale_x)
        .attr('y2', function (team) { return score_scale(scores[team]); })
        .attr('stroke', 'gray');
    var cells = svg.selectAll('.cell')
        .data(matches)
        .enter().append('g')
        .classed('cell', true)
        .attr('transform', function (match) { return 'translate(' +
        teams(match['ATeam']) + ',' +
        teams(match['HTeam']) + ')'; });
    var win_int = d3.interpolateHsl(d3.hsl(120, 0.7, 0), d3.hsl(120, 0.7, 1));
    var draw_int = d3.interpolateHsl(d3.hsl(60, 0.7, 0), d3.hsl(60, 0.7, 1));
    var loose_int = d3.interpolateHsl(d3.hsl(0, 0.7, 0), d3.hsl(0, 0.7, 1));
    var res_interp = {
        H: function (x) { return x > 1 / 3 ? win_int(1 / 2 + (x - 1 / 3) * 3 / 2 / 2) : win_int(x * 3 / 2); },
        D: function (x) { return x > 1 / 3 ? draw_int(1 / 2 + (x - 1 / 3) * 3 / 2 / 2) : draw_int(x * 3 / 2); },
        A: function (x) { return x > 1 / 3 ? loose_int(1 / 2 + (x - 1 / 3) * 3 / 2 / 2) : loose_int(x * 3 / 2); },
    };
    var match_res = function (match) {
        if (match['HGoals'] > match['AGoals']) {
            return 'H';
        }
        else if (match['HGoals'] < match['AGoals']) {
            return 'A';
        }
        else {
            return 'D';
        }
    };
    var match_prob = function (match) {
        var harm = 1 / match['OddH'] + 1 / match['OddD'] + 1 / match['OddA'];
        return {
            'H': 1 / match['OddH'] / harm,
            'D': 1 / match['OddD'] / harm,
            'A': 1 / match['OddA'] / harm,
        };
    };
    var res_prob = function (match) { return match_prob(match)[match_res(match)]; };
    cells.append('rect')
        .attr('width', teams.bandwidth())
        .attr('height', teams.bandwidth());
    cells.append('text')
        .attr('x', teams.bandwidth() / 2)
        .attr('y', teams.bandwidth() / 2)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .text(function (match) { return match['HGoals'] + ':' + match['AGoals']; });
    var prob_g = svg.append('g')
        .attr('transform', 'translate(' + 0 + ',' + (height + 20) + ')')
        .classed('prob_g', true);
    prob_g.selectAll('rect')
        .data(['H', 'D', 'A'])
        .enter().append('rect');
    prob_g.selectAll('text')
        .data(['H', 'D', 'A'])
        .enter().append('text')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central');
    var cur_score_g = svg.append('g')
        .attr('transform', 'translate(' + scores_scale_x + ')')
        .selectAll('.cur_score')
        .data(['H', 'A'])
        .enter().append('g')
        .classed('cur_score', true);
    cur_score_g.append('circle')
        .attr('r', 5);
    cur_score_g.append('text');
    var prob_scale = d3.scaleLinear()
        .domain([0, 1])
        .range([0, width]);
    var percent = d3.format('.0%');
    svg.append('text')
        .classed('prob_title', true)
        .attr('x', width / 2)
        .attr('y', height + 10)
        .attr('fill', 'gray')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central');
    svg.selectAll('.team_odds_titles')
        .data(['H', 'A'])
        .enter().append('text')
        .classed('team_odds_titles', true)
        .attr('x', function (d) { return ({ H: 0, A: width }[d]); })
        .attr('y', height + 10)
        .attr('text-anchor', function (d) { return ({ H: 'begin', A: 'end' }[d]); })
        .attr('dominant-baseline', 'central')
        .attr('fill', 'gray');
    var diag = svg.selectAll('.diag_cells')
        .data(team_names)
        .enter().append('g')
        .attr('transform', function (team) { return 'translate(' + teams(team) + ',' + teams(team) + ')'; });
    diag.append('rect')
        .attr('width', teams.bandwidth())
        .attr('height', teams.bandwidth())
        .attr('fill', 'lightgray');
    diag.append('text')
        .attr('x', teams.bandwidth() / 2)
        .attr('y', teams.bandwidth() / 2)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .text(function (team) { return scores[team]; });
    svg.append('circle')
        .classed('diag_score', true)
        .attr('cx', scores_scale_x)
        .attr('r', 5)
        .attr('fill', 'gray')
        .attr('visibility', 'hidden');
    function reset() {
        svg.selectAll('.diag_score')
            .attr('visibility', 'hidden');
        svg.selectAll('.team-hor')
            .attr('fill', 'black')
            .style('font-weight', 'normal');
        svg.selectAll('.team-vert')
            .attr('fill', 'black')
            .style('font-weight', 'normal');
        svg.selectAll('.cur_score')
            .attr('visibility', 'hidden');
        svg.selectAll('.team_odds_titles')
            .attr('visibility', 'hidden');
        svg.selectAll('.prob_title')
            .attr('visibility', 'hidden');
        svg.selectAll('.prob_g')
            .attr('visibility', 'hidden');
        svg.selectAll('.cell text')
            .attr('fill', function (match) { return res_prob(match) > 1 / 3 ? 'black' : 'white'; });
        svg.selectAll('.cell rect')
            .attr('fill', function (match) { return res_interp[match_res(match)](res_prob(match)); });
    }
    reset();
    var clr = {
        W: 'green',
        D: 'orange',
        L: 'red',
    };
    var mat = {
        H: { H: 'W', A: 'L' },
        D: { H: 'D', A: 'D' },
        A: { H: 'L', A: 'W' }
    };
    function cell_mouseover(match) {
        var probs = match_prob(match);
        var left = {
            H: 0,
            D: probs['H'],
            A: probs['H'] + probs['D']
        };
        var res = match_res(match);
        svg.selectAll('.team_odds_titles')
            .attr('visibility', 'visible');
        svg.selectAll('.prob_title')
            .attr('visibility', 'visible')
            .text('Bookmaker predictions');
        svg.selectAll('.prob_g')
            .attr('visibility', 'visible');
        prob_g.selectAll('rect')
            .attr('x', function (letter) { return prob_scale(left[letter]); })
            .attr('y', 0)
            .attr('width', function (letter) { return prob_scale(probs[letter]); })
            .attr('height', 20)
            .attr('fill', function (letter) { return res_interp[letter](probs[letter]); });
        prob_g.selectAll('text')
            .attr('x', function (letter) { return prob_scale(left[letter] + probs[letter] / 2); })
            .attr('y', 10)
            .attr('fill', function (letter) { return probs[letter] > 1 / 3 ? 'black' : 'white'; })
            .text(function (letter) { return percent(probs[letter]); });
        svg.selectAll('.cur_score')
            .attr('visibility', 'visible');
        svg.selectAll('.cur_score circle')
            .attr('cy', function (letter) { return score_scale(scores[match[letter + 'Team']]); })
            .attr('fill', function (letter) { return clr[mat[res][letter]]; });
        svg.selectAll('.cur_score text')
            .attr('x', -7)
            .attr('y', function (letter) { return score_scale(scores[match[letter + 'Team']]); })
            .text(R.identity)
            .attr('fill', function (letter) { return clr[mat[res][letter]]; })
            .attr('text-anchor', 'end')
            .attr('dominant-baseline', 'central')
            .style('font-weight', 'bold');
        svg.selectAll('.team_odds_titles')
            .text(function (d) { return match[d + 'Team'] + ' (' + { H: 'Home', A: 'Away' }[d] + ')'; });
        svg.selectAll('.team-hor')
            .attr('fill', 'gray')
            .filter(R.equals(match['HTeam']))
            .style('font-weight', 'bold')
            .attr('fill', function (team) { return clr[mat[res]['H']]; });
        svg.selectAll('.team-vert')
            .attr('fill', 'gray')
            .filter(R.equals(match['ATeam']))
            .style('font-weight', 'bold')
            .attr('fill', function (team) { return clr[mat[res]['A']]; });
    }
    function diag_mouseover(team) {
        svg.selectAll('.team-hor')
            .attr('fill', 'gray')
            .filter(R.equals(team))
            .attr('fill', 'black')
            .style('font-weight', 'bold');
        svg.selectAll('.team-vert')
            .attr('fill', 'gray')
            .filter(R.equals(team))
            .attr('fill', 'black')
            .style('font-weight', 'bold');
        svg.selectAll('.cell rect').attr('fill', '#EEE');
        svg.selectAll('.cell text').attr('fill', 'black');
        var paint_cells = svg.selectAll('.cell')
            .filter(function (match) { return (match['HTeam'] == team) || (match['ATeam'] == team); });
        paint_cells.select('text')
            .attr('fill', 'white');
        paint_cells.select('rect')
            .attr('fill', function (match) {
            var res = match_res(match);
            var which = match['HTeam'] == team ? 'H' : 'A';
            var trans = {
                H: { H: 'H', A: 'A' },
                D: { H: 'D', A: 'D' },
                A: { H: 'A', A: 'H' },
            };
            return res_interp[trans[res][which]](1 / 3);
        });
        svg.selectAll('.prob_title')
            .attr('visibility', 'visible')
            .text(team + ' statistics');
        svg.selectAll('.prob_g')
            .attr('visibility', 'visible');
        var stats = { H: 0, D: 0, A: 0 };
        var stats_trans = { W: 'H', D: 'D', L: 'A' };
        matches.forEach(function (match) {
            var res = match_res(match);
            if (match['HTeam'] == team) {
                stats[stats_trans[mat[res]['H']]] += 1;
            }
            else if (match['ATeam'] == team) {
                stats[stats_trans[mat[res]['A']]] += 1;
            }
        });
        var total = stats['H'] + stats['D'] + stats['A'];
        var left = {
            H: 0,
            D: stats['H'],
            A: stats['H'] + stats['D'],
        };
        prob_g.selectAll('rect')
            .attr('x', function (letter) { return prob_scale(left[letter] / total); })
            .attr('y', 0)
            .attr('width', function (letter) { return prob_scale(stats[letter] / total); })
            .attr('height', 20)
            .attr('fill', function (letter) { return res_interp[letter](1 / 3); });
        prob_g.selectAll('text')
            .attr('x', function (letter) { return prob_scale(left[letter] / total + stats[letter] / 2 / total); })
            .attr('y', 10)
            .attr('fill', 'white')
            .text(function (letter) { return stats[letter]; });
        svg.selectAll('.diag_score')
            .attr('visibility', 'visibile')
            .attr('cy', score_scale(scores[team]));
    }
    cells.on('mouseover', cell_mouseover)
        .on('mouseout', reset);
    diag.on('mouseover', diag_mouseover)
        .on('mouseout', reset);
    svg.selectAll('.team-hor, .team-vert')
        .on('mouseover', diag_mouseover)
        .on('mouseout', reset);
});
