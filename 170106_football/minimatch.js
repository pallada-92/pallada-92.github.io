"use strict";
var d3 = require('d3');
var R = require('ramda');
var common_1 = require('./common');
var dao_1 = require('./dao');
var Minimatch1 = (function () {
    function Minimatch1() {
        this.height = 650;
        this.width = 60;
        this.margin = { top: 30.5, right: 70, bottom: 40, left: 30.5 };
    }
    Minimatch1.prototype.precalc = function () {
        this.dao = new dao_1.SeasonGamesTable1(this.matches);
        this.teams_scale = d3.scaleBand()
            .domain(this.dao.team_names)
            .paddingInner(0.1)
            .range([0, this.height]);
        this.place_scale = d3.scaleBand()
            .domain(['Home', 'Away'])
            .paddingInner(0.1)
            .range([0, this.width]);
    };
    Minimatch1.prototype.first_draw = function () {
        var _this = this;
        this.team_label = this.svg.append('text')
            .text('')
            .attr('x', 75)
            .attr('y', -57)
            .attr('text-anchor', 'end');
        this.teams = this.svg.selectAll('.nothing')
            .data(this.dao.team_names)
            .enter().append('text')
            .text(R.identity)
            .attr('transform', function (team) { return ("\n                translate(-10, " + _this.teams_scale(team) + ")\n                translate(0, " + _this.teams_scale.bandwidth() * 0.7 + ")\n                rotate(-45)\n            "); })
            .attr('text-anchor', 'end')
            .style('cursor', 'pointer')
            .on('click', function (team) {
            _this.select_team(team);
            _this.select_team_handler(team);
        });
        this.places = this.svg.selectAll('.nothing')
            .data(['Home', 'Away'])
            .enter().append('text')
            .text(R.identity)
            .attr('transform', function (place) { return ("\n                translate(" + _this.place_scale(place) + ", -10)\n                translate(" + _this.place_scale.bandwidth() * 0.7 + ")\n                rotate(-45)"); })
            .attr('text-anchor', 'start')
            .attr('visibility', 'hidden');
        this.cells = this.svg.selectAll('.nothing')
            .data(R.xprod(this.dao.team_names, ['Home', 'Away']))
            .enter()
            .append('g')
            .attr('transform', function (_a) {
            var team = _a[0], place = _a[1];
            return ("\n                translate(\n                    " + _this.place_scale(place) + ",\n                    " + _this.teams_scale(team) + "\n                )");
        });
        this.cells.append('rect')
            .attr('width', this.place_scale.bandwidth())
            .attr('height', this.teams_scale.bandwidth())
            .attr('fill', 'white');
        this.cells.append('text')
            .attr('x', this.place_scale.bandwidth() / 2)
            .attr('y', this.teams_scale.bandwidth() / 2)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .text('');
    };
    Minimatch1.prototype.select_team = function (team) {
        var _this = this;
        this.selected_team = team;
        this.team_label
            .text("vs " + this.selected_team);
        this.teams
            .style('font-weight', 'normal')
            .attr('fill', 'black')
            .filter(R.equals(team))
            .style('font-weight', 'bold')
            .attr('fill', 'darkblue');
        this.places
            .attr('visibility', 'visible');
        this.cells.select('text')
            .text(function (_a) {
            var team2 = _a[0], place = _a[1];
            var match = _this.dao.find_match(place, team, team2);
            if (!match) {
                return '—';
            }
            if (place == 'Home') {
                return match['HGoals'] + ":" + match['AGoals'];
            }
            else {
                return match['HGoals'] + ":" + match['AGoals'];
            }
        })
            .attr('fill', function (_a) {
            var team2 = _a[0], place = _a[1];
            var match = _this.dao.find_match(place, team, team2);
            if (!match) {
                return 'black';
            }
            if (_this.dao.res_prob(match) > 1 / 3) {
                return 'black';
            }
            else {
                return 'white';
            }
        });
        this.cells.select('rect')
            .attr('stroke', 'none')
            .attr('fill', function (_a) {
            var team2 = _a[0], place = _a[1];
            var match = _this.dao.find_match(place, team, team2);
            if (!match) {
                return 'lightgray';
            }
            return common_1.Common1.res_interp[common_1.Common1.mat[_this.dao.match_res1(match)][place[0]]](_this.dao.res_prob(match));
        });
        this.cells
            .on('mouseover', function (_a) {
            var team2 = _a[0], place = _a[1];
            _this.highlight_match(team, [team2, place]);
            _this.highlight_match_handler([team2, place]);
        })
            .on('mouseout', this.select_team.bind(this, team));
    };
    Minimatch1.prototype.highlight_match = function (team1, _a) {
        var team2 = _a[0], place = _a[1];
        var match = this.dao.find_match(place, team1, team2);
        if (!match)
            return;
        this.cells
            .filter(R.equals([team2, place]))
            .select('rect')
            .attr('stroke', 'black')
            .attr('fill', common_1.Common1.res_interp[common_1.Common1.mat[this.dao.match_res1(match)][place[0]]](1 / 3));
    };
    Minimatch1.prototype.launch = function () {
        this.precalc();
        this.first_draw();
    };
    return Minimatch1;
}());
exports.Minimatch1 = Minimatch1;
