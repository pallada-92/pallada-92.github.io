"use strict";
var R = require('ramda');
var d3 = require('d3');
var SeasonGamesTable1 = (function () {
    function SeasonGamesTable1(matches) {
        var _this = this;
        this.matches = matches;
        this.scores = {};
        this.matches.forEach(function (_a) {
            var HTeam = _a.HTeam;
            return _this.scores[HTeam] = 0;
        });
        this.matches.map(function (_a) {
            var HTeam = _a.HTeam, ATeam = _a.ATeam, HGoals = _a.HGoals, AGoals = _a.AGoals;
            _this.scores[HTeam] += +(HGoals > AGoals) * 3 + +(HGoals == AGoals) * 1;
            _this.scores[ATeam] += +(HGoals < AGoals) * 3 + +(HGoals == AGoals) * 1;
        });
        this.rating = R.reverse(R.sortBy(R.nth(1), R.toPairs(this.scores)));
        this.team_names = this.rating.map(R.nth(0));
        this.score_range = d3.extent(this.rating.map(R.nth(1)));
        this.match_count = R.fromPairs(this.team_names.map(function (x) { return [x, 0]; }));
        this.matches1 = [];
        this.matches.forEach(function (match) {
            var week = Math.max(_this.match_count[match['HTeam']], _this.match_count[match['ATeam']]);
            var odds;
            odds = {
                W: +match['OddH'],
                D: +match['OddD'],
                L: +match['OddA'],
            };
            _this.matches1.push({
                cur_team: match['HTeam'],
                other_team: match['ATeam'],
                cur_goals: +match['HGoals'],
                other_goals: +match['AGoals'],
                cur_home: true,
                Corners: +match['HCorners'],
                Shots: +match['HShots'],
                ShotsTarget: +match['HShotsTarget'],
                Goals: +match['HGoals'],
                res: _this.match_res2(+match['HGoals'], +match['AGoals']),
                week: week,
                odds: odds,
                prob: _this.match_prob1(odds),
            });
            odds = {
                W: +match['OddA'],
                D: +match['OddD'],
                L: +match['OddH'],
            };
            _this.matches1.push({
                cur_team: match['ATeam'],
                other_team: match['HTeam'],
                cur_goals: +match['AGoals'],
                other_goals: +match['HGoals'],
                Corners: +match['ACorners'],
                Shots: +match['AShots'],
                ShotsTarget: +match['AShotsTarget'],
                Goals: +match['AGoals'],
                cur_home: false,
                res: _this.match_res2(+match['AGoals'], +match['HGoals']),
                week: week,
                odds: odds,
                prob: _this.match_prob1(odds),
            });
            _this.match_count[match['HTeam']] = week + 1;
            _this.match_count[match['ATeam']] = week + 1;
        });
        this.max_week = R.apply(Math.max, this.matches1.map(R.prop('week')));
        this.sorted_params = {
            Corners: [],
            Shots: [],
            ShotsTarget: [],
            Goals: [],
        };
        this.matches1.forEach(function (match) {
            for (var param in _this.sorted_params) {
                _this.sorted_params[param].push(+match[param]);
            }
        });
        this.avg_params = {};
        for (var key in this.sorted_params) {
            var list = this.sorted_params[key];
            list.sort(R.subtract);
            this.avg_params[key] = R.sum(list) / list.length;
        }
    }
    SeasonGamesTable1.prototype.team_matches = function (team) {
        return R.filter(R.propEq('cur_team', team), this.matches1);
    };
    SeasonGamesTable1.prototype.team_avg_param = function (team, param) {
        R.mean(R.map(R.prop(param), this.team_matches(team)));
    };
    SeasonGamesTable1.prototype.match_res2 = function (cur_goals, other_goals) {
        if (cur_goals > other_goals) {
            return 'W';
        }
        else if (cur_goals < other_goals) {
            return 'L';
        }
        else {
            return 'D';
        }
    };
    SeasonGamesTable1.prototype.match_res1 = function (match) {
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
    SeasonGamesTable1.prototype.match_prob1 = function (odds) {
        var harm = 1 / odds['W'] + 1 / odds['D'] + 1 / odds['L'];
        return {
            'W': 1 / odds['W'] / harm,
            'D': 1 / odds['D'] / harm,
            'L': 1 / odds['L'] / harm,
        };
    };
    SeasonGamesTable1.prototype.match_prob2 = function (match) {
        var harm = 1 / match['OddH'] + 1 / match['OddD'] + 1 / match['OddA'];
        return {
            'H': 1 / match['OddH'] / harm,
            'D': 1 / match['OddD'] / harm,
            'A': 1 / match['OddA'] / harm,
        };
    };
    SeasonGamesTable1.prototype.res_prob = function (match) {
        return this.match_prob2(match)[this.match_res1(match)];
    };
    SeasonGamesTable1.prototype.find_match = function (place, team1, team2) {
        var res;
        this.matches.forEach(function (match) {
            if (match['HTeam'] == team1 &&
                match['ATeam'] == team2 &&
                place == 'Home' ||
                match['ATeam'] == team1 &&
                    match['HTeam'] == team2 &&
                    place == 'Away') {
                res = match;
            }
        });
        return res;
    };
    return SeasonGamesTable1;
}());
exports.SeasonGamesTable1 = SeasonGamesTable1;
var SeasonsPositions1 = (function () {
    function SeasonsPositions1(matches) {
        this.matches = matches;
        this.divisions = ['E0', 'E1', 'E2', 'E3', 'EC'];
        this.seasons = d3.range(1993, 2015 + 1).map(function (x) { return '' + x; });
        this.div_titles = {
            'E0': 'Premier league',
            'E1': 'Division 1',
            'E2': 'Division 2',
            'E3': 'Division 3',
            'EC': 'Conference',
        };
        this.vm = {};
        for (var cur_season in this.matches) {
            if (this.seasons.indexOf(cur_season) == -1)
                continue;
            for (var cur_division in this.matches[cur_season]) {
                if (this.divisions.indexOf(cur_division) == -1)
                    continue;
                var scores = this.matches[cur_season][cur_division];
                var positions = R.fromPairs(R.sortBy(R.prop('1'), R.toPairs(scores)).map(function (v, i) { return [v[0], i]; }));
                for (var team in scores) {
                    if (!(team in this.vm)) {
                        this.vm[team] = this.seasons.map(function () { return undefined; });
                    }
                    var score = positions[team];
                    this.vm[team][this.seasons.indexOf(cur_season)] = [cur_season, cur_division, score];
                }
            }
        }
    }
    ;
    return SeasonsPositions1;
}());
exports.SeasonsPositions1 = SeasonsPositions1;
