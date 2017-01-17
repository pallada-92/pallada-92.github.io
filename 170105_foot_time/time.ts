import * as d3 from 'd3';
import * as R from 'ramda';

let width = 1200,
    height = 600,
    margin = { top: 30, right: 30, bottom: 50, left: 100 };
let svg = d3.select('#vis1')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
d3.csv('2015_E0.csv', function (matches) {
    let scores = {};
    matches.forEach(({HTeam}) => scores[HTeam] = 0);
    matches.map(({HTeam, ATeam, HGoals, AGoals}) => {
        scores[HTeam] += +(HGoals > AGoals) * 3 + +(HGoals == AGoals) * 1;
        scores[ATeam] += +(HGoals < AGoals) * 3 + +(HGoals == AGoals) * 1;
    })
    let rating = R.reverse(R.sortBy(R.prop('1'), R.toPairs(scores)));
    let team_names = rating.map(R.prop('0')) as string[];
    let score_range = d3.extent(rating.map(R.prop('1')) as number[]) as [number, number];
    svg.append('text')
        .text('Teams')
        .attr('fill', 'gray')
        .attr('x', -40)
        .attr('y', 20)
        .attr('text-anchor', 'end')
    svg.append('text')
        .text('Weeks')
        .attr('fill', 'gray')
        .attr('x', 0)
        .attr('y', -10)
        .attr('text-anchor', 'start')
    let teams = d3.scaleBand()
        .domain(team_names)
        .paddingInner(0.1)
        .rangeRound([0, height]);
    svg.selectAll('.team-hor')
        .data(team_names)
        .enter().append('text')
        .classed('team-hor', true)
        .text(R.identity)
        .attr('transform', (team) => 'translate(-10,' +
            teams(team) + ') translate(0, ' +
            teams.bandwidth() * 0.7 + ') rotate(-45)')
        .attr('text-anchor', 'end')

    let match_count = R.fromPairs(team_names.map((x: string) => [x, 0] as [string, number]))
    let matches1: any[] = [];
    function match_res(cur_goals, other_goals) {
        if (cur_goals > other_goals) {
            return 'W';
        } else if (cur_goals < other_goals) {
            return 'L';
        } else {
            return 'D';
        }
    }
    function match_prob(odds) {
        let harm = 1 / odds['W'] + 1 / odds['D'] + 1 / odds['L'];
        return {
            'W': 1 / odds['W'] / harm,
            'D': 1 / odds['D'] / harm,
            'L': 1 / odds['L'] / harm,
        }
    }
    matches.forEach((match) => {
        let week = Math.max(match_count[match['HTeam']], match_count[match['ATeam']]);
        let odds;
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
            week,
            odds,
            prob: match_prob(odds),
        })
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
            week,
            odds,
            prob: match_prob(odds),
        })
        match_count[match['HTeam']] = week + 1;
        match_count[match['ATeam']] = week + 1;
    })
    let max_week = R.apply(Math.max, matches1.map(R.prop('week')));
    let weeks = d3.scaleBand()
        .domain(d3.range(max_week + 1).map((x) => '' + x))
        .paddingInner(0.1)
        .range([0, width]);
    let cells = svg.selectAll('.cell')
        .data(matches1)
        .enter().append('g')
        .classed('cell', true)
        .attr('transform', (match) => 'translate(' +
            weeks(match['week']) + ',' +
            teams(match['cur_team']) + ')')
    let win_int = d3.interpolateHsl(d3.hsl(120, 0.7, 0), d3.hsl(120, 0.7, 1));
    let draw_int = d3.interpolateHsl(d3.hsl(60, 0.7, 0), d3.hsl(60, 0.7, 1));
    let loose_int = d3.interpolateHsl(d3.hsl(0, 0.7, 0), d3.hsl(0, 0.7, 1));
    let res_interp = {
        W: (x) => x > 1 / 3 ? win_int(1 / 2 + (x - 1 / 3) * 3 / 2 / 2) : win_int(x * 3 / 2),
        D: (x) => x > 1 / 3 ? draw_int(1 / 2 + (x - 1 / 3) * 3 / 2 / 2) : draw_int(x * 3 / 2),
        L: (x) => x > 1 / 3 ? loose_int(1 / 2 + (x - 1 / 3) * 3 / 2 / 2) : loose_int(x * 3 / 2),
    }
    cells.append('rect')
        .attr('width', teams.bandwidth())
        .attr('height', teams.bandwidth())
    cells.append('text')
        .attr('x', teams.bandwidth() / 2)
        .attr('y', teams.bandwidth() / 2)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .text((match) => match['cur_goals'] + ':' + match['other_goals'])
    cells
        .filter(R.prop('cur_home'))
        .append('line')
        .attr('x1', teams.bandwidth() * 0.1)
        .attr('x2', teams.bandwidth() * 0.9)
        .attr('y1', teams.bandwidth() * 0.8)
        .attr('y2', teams.bandwidth() * 0.8)
    const ind_width = width / 2 - 10;
    let prob_g = svg.append('g')
        .attr('transform', 'translate(' + 0 + ',' + height + ')')
        .classed('prob_g', true)
    let stat_g = svg.append('g')
        .attr('transform', 'translate(' + (width - ind_width) + ',' + height + ')')
        .classed('stat_g', true)
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
        .attr('x', (d: string) => ({ cur: 0, other: ind_width }[d]))
        .attr('y', 10)
        .attr('text-anchor', (d: string) => ({ cur: 'begin', other: 'end' }[d]))
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
    let prob_scale = d3.scaleLinear()
        .domain([0, 1])
        .range([0, ind_width]);
    let percent = d3.format('.0%');
    function reset() {
        svg.selectAll('.team-hor')
            .attr('fill', 'black')
            .style('font-weight', 'normal');
        svg.selectAll('.stat_g')
            .attr('visibility', 'hidden');
        svg.selectAll('.prob_g')
            .attr('visibility', 'hidden');
        svg.selectAll('.cell text')
            .attr('fill', (match) => match['prob'][match['res']] > 1 / 3 ? 'black' : 'white')
        svg.selectAll('.cell line')
            .attr('stroke', (match) => match['prob'][match['res']] > 1 / 3 ? 'black' : 'white')
        svg.selectAll('.cell rect')
            .attr('fill', (match) => res_interp[match['res']](match['prob'][match['res']]))
    }
    reset();

    let clr = {
        W: 'green',
        D: 'orange',
        L: 'red',
    };

    function highlight_team(team) {
        let sel = svg.selectAll('.cell')
            .filter((match) => (match['cur_team'] != team) && (match['other_team'] != team))
        sel.select('rect').attr('fill', 'lightgray')
        sel.select('text').attr('fill', 'black')
        sel.select('line').attr('stroke', 'black')
        svg.selectAll('.team-hor')
            .attr('fill', 'gray')
            .filter(R.equals(team))
            .attr('fill', 'black')
            .style('font-weight', 'bold')
        svg.selectAll('.stat_g')
            .attr('visibility', 'visible')
        let stats = { W: 0, D: 0, L: 0 };
        matches1.forEach((match) => { if (match.cur_team == team) { stats[match.res]++ } });
        let total = stats.W + stats.D + stats.L;
        let left = {
            W: 0,
            D: stats.W,
            L: stats.W + stats.D,
        }
        svg.selectAll('.stat_g rect')
            .attr('x', (letter: string) => prob_scale(left[letter] / total))
            .attr('y', 20)
            .attr('width', (letter: string) => prob_scale(stats[letter] / total))
            .attr('height', 20)
            .attr('fill', (letter: string) => clr[letter])
        svg.selectAll('.stat_g text.labels')
            .attr('x', (letter: string) => prob_scale((left[letter] + stats[letter] / 2) / total))
            .attr('y', 30)
            .text((letter: string) => stats[letter])
        svg.selectAll('.stat_g text.title')
            .text('"' + team + '" statistics')
    }

    function highlight_match(match) {
        svg.selectAll('.prob_g')
            .attr('visibility', 'visible')
        let probs = match.prob;
        let total = probs.W + probs.D + probs.L;
        let left = {
            W: 0,
            D: probs.W,
            L: probs.W + probs.D,
        }
        svg.selectAll('.prob_g rect')
            .attr('x', (letter: string) => prob_scale(left[letter] / total))
            .attr('y', 20)
            .attr('width', (letter: string) => prob_scale(probs[letter] / total))
            .attr('height', 20)
            .attr('fill', (letter: string) => res_interp[letter](match.prob[letter]))
        svg.selectAll('.prob_g text.labels')
            .attr('x', (letter: string) => prob_scale((left[letter] + probs[letter] / 2) / total))
            .attr('y', 30)
            .attr('fill', (letter: string) => match.prob[letter] > 1 / 3 ? 'black' : 'white')
            .text((letter: string) => percent(probs[letter]))
        svg.selectAll('.prob_g text.team_titles')
            .text((letter: string) => match[letter + '_team'] + (+match.cur_home ^ +(letter == 'cur') ? ' (Away)' : ' (Home)'))
    }
    cells.on('mouseover', (match) => {
        highlight_team(match['cur_team']);
        highlight_match(match);
    }).on('mouseout', reset);
    svg.selectAll('.team-hor').on('mouseover', highlight_team)
        .on('mouseout', reset);
})


