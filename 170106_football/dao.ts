import * as R from 'ramda';
import * as d3 from 'd3';

export class SeasonGamesTable1 {
    scores;
    rating;
    team_names;
    score_range;
    matches1;
    match_count;
    max_week;
    sorted_params;
    avg_params;
    constructor(
        public matches: any[]
    ) {
        this.scores = {};
        this.matches.forEach(({HTeam}) => this.scores[HTeam] = 0);
        this.matches.map(({HTeam, ATeam, HGoals, AGoals}) => {
            this.scores[HTeam] += +(HGoals > AGoals) * 3 + +(HGoals == AGoals) * 1;
            this.scores[ATeam] += +(HGoals < AGoals) * 3 + +(HGoals == AGoals) * 1;
        })
        this.rating = R.reverse(R.sortBy(R.nth(1), R.toPairs(this.scores)));
        this.team_names = this.rating.map(R.nth(0)) as string[];
        this.score_range = d3.extent(this.rating.map(R.nth(1)) as number[]) as [number, number];
        this.match_count = R.fromPairs(this.team_names.map((x: string) => [x, 0] as [string, number]));
        this.matches1 = [];
        this.matches.forEach((match) => {
            let week = Math.max(this.match_count[match['HTeam']], this.match_count[match['ATeam']]);
            let odds;
            odds = {
                W: +match['OddH'],
                D: +match['OddD'],
                L: +match['OddA'],
            };
            this.matches1.push({
                cur_team: match['HTeam'],
                other_team: match['ATeam'],
                cur_goals: +match['HGoals'],
                other_goals: +match['AGoals'],
                cur_home: true,
                Corners: +match['HCorners'],
                Shots: +match['HShots'],
                ShotsTarget: +match['HShotsTarget'],
                Goals: +match['HGoals'],
                res: this.match_res2(+match['HGoals'], +match['AGoals']),
                week,
                odds,
                prob: this.match_prob1(odds),
            })
            odds = {
                W: +match['OddA'],
                D: +match['OddD'],
                L: +match['OddH'],
            };
            this.matches1.push({
                cur_team: match['ATeam'],
                other_team: match['HTeam'],
                cur_goals: +match['AGoals'],
                other_goals: +match['HGoals'],
                Corners: +match['ACorners'],
                Shots: +match['AShots'],
                ShotsTarget: +match['AShotsTarget'],
                Goals: +match['AGoals'],
                cur_home: false,
                res: this.match_res2(+match['AGoals'], +match['HGoals']),
                week,
                odds,
                prob: this.match_prob1(odds),
            })
            this.match_count[match['HTeam']] = week + 1;
            this.match_count[match['ATeam']] = week + 1;
        })
        this.max_week = R.apply(Math.max, this.matches1.map(R.prop('week')));
        this.sorted_params = {
            Corners: [],
            Shots: [],
            ShotsTarget: [],
            Goals: [],
        };
        this.matches1.forEach((match) => {
            for (let param in this.sorted_params) {
                this.sorted_params[param].push(+match[param]);
            }
        });
        this.avg_params = {};
        for (let key in this.sorted_params) {
            let list = this.sorted_params[key];
            list.sort(R.subtract);
            this.avg_params[key] = R.sum(list) / list.length;
        }
    }

    team_matches(team) {
        return R.filter(R.propEq('cur_team', team), this.matches1)
    }

    team_avg_param(team, param) {
        R.mean(R.map(
            R.prop(param),
            this.team_matches(team)
        ) as number[]);
    }

    match_res2(cur_goals, other_goals) {
        if (cur_goals > other_goals) {
            return 'W';
        } else if (cur_goals < other_goals) {
            return 'L';
        } else {
            return 'D';
        }
    }

    match_res1(match) {
        if (match['HGoals'] > match['AGoals']) {
            return 'H';
        } else if (match['HGoals'] < match['AGoals']) {
            return 'A';
        } else {
            return 'D';
        }
    }

    match_prob1(odds) {
        let harm = 1 / odds['W'] + 1 / odds['D'] + 1 / odds['L'];
        return {
            'W': 1 / odds['W'] / harm,
            'D': 1 / odds['D'] / harm,
            'L': 1 / odds['L'] / harm,
        }
    }

    match_prob2(match) {
        let harm = 1 / match['OddH'] + 1 / match['OddD'] + 1 / match['OddA'];
        return {
            'H': 1 / match['OddH'] / harm,
            'D': 1 / match['OddD'] / harm,
            'A': 1 / match['OddA'] / harm,
        }
    }

    res_prob(match) {
        return this.match_prob2(match)[this.match_res1(match)];
    }

    find_match(place, team1, team2) {
        let res;
        this.matches.forEach((match) => {
            if (match['HTeam'] == team1 &&
                match['ATeam'] == team2 &&
                place == 'Home' ||
                match['ATeam'] == team1 &&
                match['HTeam'] == team2 &&
                place == 'Away'
            ) {
                res = match;
            }
        })
        return res;
    }
}

export class SeasonsPositions1 {
    divisions = ['E0', 'E1', 'E2', 'E3', 'EC'];
    seasons = d3.range(1993, 2015 + 1).map((x) => '' + x)

    div_titles = {
        'E0': 'Premier league',
        'E1': 'Division 1',
        'E2': 'Division 2',
        'E3': 'Division 3',
        'EC': 'Conference',
    }

    vm;
    constructor(
        public matches: any[]
    ) {
        this.vm = {};
        for (let cur_season in this.matches) {
            if (this.seasons.indexOf(cur_season) == -1) continue;
            for (let cur_division in this.matches[cur_season]) {
                if (this.divisions.indexOf(cur_division) == -1) continue;
                let scores = this.matches[cur_season][cur_division];
                let positions = R.fromPairs(
                    R.sortBy(
                        R.prop('1'),
                        R.toPairs(scores)
                    ).map((v, i) => [v[0], i] as [string, number]));
                for (let team in scores) {
                    if (!(team in this.vm)) {
                        this.vm[team] = this.seasons.map(() => undefined);
                    }
                    // let score = matches[season][division][team];
                    let score = positions[team];
                    this.vm[team][this.seasons.indexOf(cur_season)] = [cur_season, cur_division, score];
                }
            }
        }

    };

}
