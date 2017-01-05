"use strict";
var d3 = require('d3');
var R = require('ramda');
var width = 1200, height = 600, margin = { top: 30, right: 30, bottom: 50, left: 100 };
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
    var rating = R.reverse(R.sortBy(R.prop('1'), R.toPairs(scores)));
    var team_names = rating.map(R.prop('0'));
    var score_range = d3.extent(rating.map(R.prop('1')));
    svg.append('text')
        .text('Teams')
        .attr('fill', 'gray')
        .attr('x', -40)
        .attr('y', 20)
        .attr('text-anchor', 'end');
    svg.append('text')
        .text('Weeks')
        .attr('fill', 'gray')
        .attr('x', 0)
        .attr('y', -10)
        .attr('text-anchor', 'start');
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
    var match_count = R.fromPairs(team_names.map(function (x) { return [x, 0]; }));
    var matches1 = [];
    function match_res(cur_goals, other_goals) {
        if (cur_goals > other_goals) {
            return 'W';
        }
        else if (cur_goals < other_goals) {
            return 'L';
        }
        else {
            return 'D';
        }
    }
    function match_prob(odds) {
        var harm = 1 / odds['W'] + 1 / odds['D'] + 1 / odds['L'];
        return {
            'W': 1 / odds['W'] / harm,
            'D': 1 / odds['D'] / harm,
            'L': 1 / odds['L'] / harm,
        };
    }
    matches.forEach(function (match) {
        var week = Math.max(match_count[match['HTeam']], match_count[match['ATeam']]);
        var odds;
        odds = {
            W: +match['OddH'],
            D: +match['OddD'],
            L: +match['OddA'],
        };
        matches1.push({
            cur_team: match['HTeam'],
            other_team: match['ATeam'],
            cur_goals: match['HGoals'],
            other_goals: match['AGoals'],
            cur_home: true,
            res: match_res(match['HGoals'], match['AGoals']),
            week: week,
            odds: odds,
            prob: match_prob(odds),
        });
        odds = {
            W: +match['OddA'],
            D: +match['OddD'],
            L: +match['OddH'],
        };
        matches1.push({
            cur_team: match['ATeam'],
            other_team: match['HTeam'],
            cur_goals: match['AGoals'],
            other_goals: match['HGoals'],
            cur_home: false,
            res: match_res(match['AGoals'], match['HGoals']),
            week: week,
            odds: odds,
            prob: match_prob(odds),
        });
        match_count[match['HTeam']] = week + 1;
        match_count[match['ATeam']] = week + 1;
    });
    var max_week = R.apply(Math.max, matches1.map(R.prop('week')));
    var weeks = d3.scaleBand()
        .domain(d3.range(max_week + 1).map(function (x) { return '' + x; }))
        .paddingInner(0.1)
        .range([0, width]);
    var cells = svg.selectAll('.cell')
        .data(matches1)
        .enter().append('g')
        .classed('cell', true)
        .attr('transform', function (match) { return 'translate(' +
        weeks(match['week']) + ',' +
        teams(match['cur_team']) + ')'; });
    var win_int = d3.interpolateHsl(d3.hsl(120, 0.7, 0), d3.hsl(120, 0.7, 1));
    var draw_int = d3.interpolateHsl(d3.hsl(60, 0.7, 0), d3.hsl(60, 0.7, 1));
    var loose_int = d3.interpolateHsl(d3.hsl(0, 0.7, 0), d3.hsl(0, 0.7, 1));
    var res_interp = {
        W: function (x) { return x > 1 / 3 ? win_int(1 / 2 + (x - 1 / 3) * 3 / 2 / 2) : win_int(x * 3 / 2); },
        D: function (x) { return x > 1 / 3 ? draw_int(1 / 2 + (x - 1 / 3) * 3 / 2 / 2) : draw_int(x * 3 / 2); },
        L: function (x) { return x > 1 / 3 ? loose_int(1 / 2 + (x - 1 / 3) * 3 / 2 / 2) : loose_int(x * 3 / 2); },
    };
    cells.append('rect')
        .attr('width', teams.bandwidth())
        .attr('height', teams.bandwidth());
    cells.append('text')
        .attr('x', teams.bandwidth() / 2)
        .attr('y', teams.bandwidth() / 2)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .text(function (match) { return match['cur_goals'] + ':' + match['other_goals']; });
    cells
        .filter(R.prop('cur_home'))
        .append('line')
        .attr('x1', teams.bandwidth() * 0.1)
        .attr('x2', teams.bandwidth() * 0.9)
        .attr('y1', teams.bandwidth() * 0.8)
        .attr('y2', teams.bandwidth() * 0.8);
    var ind_width = width / 2 - 10;
    var prob_g = svg.append('g')
        .attr('transform', 'translate(' + 0 + ',' + height + ')')
        .classed('prob_g', true);
    var stat_g = svg.append('g')
        .attr('transform', 'translate(' + (width - ind_width) + ',' + height + ')')
        .classed('stat_g', true);
    prob_g.append('text')
        .classed('prob_title', true)
        .attr('x', ind_width / 2)
        .attr('y', 10)
        .attr('fill', 'gray')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .text('Bookmaker predictions');
    prob_g.selectAll('.team_titles')
        .data(['cur', 'other'])
        .enter().append('text')
        .classed('team_titles', true)
        .attr('x', function (d) { return ({ cur: 0, other: ind_width }[d]); })
        .attr('y', 10)
        .attr('text-anchor', function (d) { return ({ cur: 'begin', other: 'end' }[d]); })
        .attr('dominant-baseline', 'central')
        .attr('fill', 'gray')
        .text('test');
    stat_g.append('text')
        .classed('title', true)
        .attr('x', ind_width / 2)
        .attr('y', 10)
        .attr('fill', 'gray')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .text('Team statistics');
    prob_g.selectAll('rect')
        .data(['W', 'D', 'L'])
        .enter().append('rect');
    stat_g.selectAll('rect')
        .data(['W', 'D', 'L'])
        .enter().append('rect');
    prob_g.selectAll('text.labels')
        .data(['W', 'D', 'L'])
        .enter().append('text')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .classed('labels', true);
    stat_g.selectAll('text.labels')
        .data(['W', 'D', 'L'])
        .enter().append('text')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .attr('fill', 'white')
        .classed('labels', true);
    var prob_scale = d3.scaleLinear()
        .domain([0, 1])
        .range([0, ind_width]);
    var percent = d3.format('.0%');
    function reset() {
        svg.selectAll('.team-hor')
            .attr('fill', 'black')
            .style('font-weight', 'normal');
        svg.selectAll('.stat_g')
            .attr('visibility', 'hidden');
        svg.selectAll('.prob_g')
            .attr('visibility', 'hidden');
        svg.selectAll('.cell text')
            .attr('fill', function (match) { return match['prob'][match['res']] > 1 / 3 ? 'black' : 'white'; });
        svg.selectAll('.cell line')
            .attr('stroke', function (match) { return match['prob'][match['res']] > 1 / 3 ? 'black' : 'white'; });
        svg.selectAll('.cell rect')
            .attr('fill', function (match) { return res_interp[match['res']](match['prob'][match['res']]); });
    }
    reset();
    var clr = {
        W: 'green',
        D: 'orange',
        L: 'red',
    };
    function highlight_team(team) {
        var sel = svg.selectAll('.cell')
            .filter(function (match) { return (match['cur_team'] != team) && (match['other_team'] != team); });
        sel.select('rect').attr('fill', 'lightgray');
        sel.select('text').attr('fill', 'black');
        sel.select('line').attr('stroke', 'black');
        svg.selectAll('.team-hor')
            .attr('fill', 'gray')
            .filter(R.equals(team))
            .attr('fill', 'black')
            .style('font-weight', 'bold');
        svg.selectAll('.stat_g')
            .attr('visibility', 'visible');
        var stats = { W: 0, D: 0, L: 0 };
        matches1.forEach(function (match) { if (match.cur_team == team) {
            stats[match.res]++;
        } });
        var total = stats.W + stats.D + stats.L;
        var left = {
            W: 0,
            D: stats.W,
            L: stats.W + stats.D,
        };
        svg.selectAll('.stat_g rect')
            .attr('x', function (letter) { return prob_scale(left[letter] / total); })
            .attr('y', 20)
            .attr('width', function (letter) { return prob_scale(stats[letter] / total); })
            .attr('height', 20)
            .attr('fill', function (letter) { return clr[letter]; });
        svg.selectAll('.stat_g text.labels')
            .attr('x', function (letter) { return prob_scale((left[letter] + stats[letter] / 2) / total); })
            .attr('y', 30)
            .text(function (letter) { return stats[letter]; });
        svg.selectAll('.stat_g text.title')
            .text('"' + team + '" statistics');
    }
    function highlight_match(match) {
        svg.selectAll('.prob_g')
            .attr('visibility', 'visible');
        var probs = match.prob;
        var total = probs.W + probs.D + probs.L;
        var left = {
            W: 0,
            D: probs.W,
            L: probs.W + probs.D,
        };
        svg.selectAll('.prob_g rect')
            .attr('x', function (letter) { return prob_scale(left[letter] / total); })
            .attr('y', 20)
            .attr('width', function (letter) { return prob_scale(probs[letter] / total); })
            .attr('height', 20)
            .attr('fill', function (letter) { return res_interp[letter](match.prob[letter]); });
        svg.selectAll('.prob_g text.labels')
            .attr('x', function (letter) { return prob_scale((left[letter] + probs[letter] / 2) / total); })
            .attr('y', 30)
            .attr('fill', function (letter) { return match.prob[letter] > 1 / 3 ? 'black' : 'white'; })
            .text(function (letter) { return percent(probs[letter]); });
        svg.selectAll('.prob_g text.team_titles')
            .text(function (letter) { return match[letter + '_team'] + (+match.cur_home ^ +(letter == 'cur') ? ' (Away)' : ' (Home)'); });
    }
    cells.on('mouseover', function (match) {
        highlight_team(match['cur_team']);
        highlight_match(match);
    }).on('mouseout', reset);
    svg.selectAll('.team-hor').on('mouseover', highlight_team)
        .on('mouseout', reset);
});
