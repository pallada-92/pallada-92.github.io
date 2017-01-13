"use strict";
var d3 = require('d3');
var R = require('ramda');
var dao_1 = require('./dao');
function f00(num) {
    return ('0' + num).slice(-2);
}
function ftime1(stamp100) {
    var seconds = Math.floor(stamp100 / 100);
    var frac = stamp100 - seconds * 100;
    var minutes = Math.floor(seconds / 60);
    seconds -= minutes * 60;
    return f00(minutes) + ":" + f00(seconds) + "." + f00(frac);
}
function ftime2(stamp100) {
    var seconds = Math.floor(stamp100 / 100);
    var minutes = Math.floor(seconds / 60);
    seconds -= minutes * 60;
    return f00(minutes) + ":" + f00(seconds);
}
var App = (function () {
    function App() {
    }
    App.prototype.display_events = function (period) {
        var max_time = this.dao.max_event_time(period);
        var step = 100;
        var root = document.getElementById('events');
        if (root == null)
            return;
        var html = '';
        var bg_scale = d3.interpolateHslLong(d3.color('hsl(90, 100%, 90%)'), d3.color('hsl(350, 100%, 90%)'));
        for (var t = 1000; t < max_time + step; t += step) {
            html += '<div class="time_interval" onMouseOver=';
            html += "\"app.over_time_interval(" + period + ", " + t + ", " + (t + step) + ")\">";
            html += "<div class=\"timestamp\">" + ftime2(t) + "</div>";
            var events = this.dao.events(period, t, t + step);
            for (var i = 0; i < events.length; i++) {
                var event_1 = events[i];
                var bg = bg_scale(event_1.code / (this.dao.event_count - 1));
                html += "<div class=\"event\"\n                onMouseOver=\"app.over_event(" + period + ", " + event_1.id + ")\"\n                onMouseOut=\"app.out_event(" + period + ", " + event_1.id + ")\"\n                style=\"background-color: " + bg + "\">";
                html += event_1.title;
                html += '</div>';
            }
            html += '</div>';
        }
        root.innerHTML = html;
    };
    App.prototype.onresize = function () {
        this.field_height = window.innerHeight;
        this.field_width = this.field_height / 105 * 68;
        var events = document.getElementById('events');
        if (events == null)
            return;
        events.style.marginRight = this.field_width + 50 + 'px';
        var field = document.getElementById('field');
        if (field == null)
            return;
        field.style.width = this.field_width + 'px';
        field.style.height = this.field_height + 'px';
        field.innerHTML = '';
        this.draw_field();
    };
    App.prototype.draw_field = function () {
        var _this = this;
        var field = d3.select('#field');
        var color = 'lightgray';
        var meter = this.field_height / 105;
        var line = meter * 0.1;
        field.append('line')
            .attr('x1', 0)
            .attr('y1', this.field_height / 2)
            .attr('x2', this.field_width)
            .attr('y2', this.field_height / 2)
            .attr('stroke', color)
            .attr('stroke-width', line);
        field.append('circle')
            .attr('cx', this.field_width / 2)
            .attr('cy', this.field_height / 2)
            .attr('fill', color)
            .attr('r', 0.15 * meter);
        field.append('circle')
            .attr('cx', this.field_width / 2)
            .attr('cy', this.field_height / 2)
            .attr('stroke', color)
            .attr('fill', 'none')
            .attr('stroke-width', line)
            .attr('r', 9.15 * meter);
        field.append('rect')
            .attr('x', 3)
            .attr('y', 3)
            .attr('width', this.field_width - 6)
            .attr('height', this.field_height - 6)
            .attr('fill', 'none')
            .attr('stroke', color)
            .attr('stroke-width', line);
        var draw_half = function (g) {
            g.append('rect')
                .attr('x', (_this.field_width - 18.32 * meter) / 2)
                .attr('y', 3)
                .attr('width', 18.32 * meter)
                .attr('height', 5.5 * meter - 3)
                .attr('fill', 'none')
                .attr('stroke', color)
                .attr('stroke-width', line);
            g.append('rect')
                .attr('x', (_this.field_width - 40.32 * meter) / 2)
                .attr('y', 3)
                .attr('width', 40.32 * meter)
                .attr('height', 16.5 * meter - 3)
                .attr('fill', 'none')
                .attr('stroke', color)
                .attr('stroke-width', line);
            g.append('circle')
                .attr('cx', _this.field_width / 2)
                .attr('cy', 11 * meter)
                .attr('fill', color)
                .attr('r', 0.15 * meter);
            var arc = d3.arc()({
                innerRadius: (9.15 * meter - line / 2),
                outerRadius: (9.15 * meter + line / 2),
                startAngle: (Math.PI - Math.acos((16.5 - 11) / 9.15)),
                endAngle: (Math.PI + Math.acos((16.5 - 11) / 9.15)),
                padAngle: 0,
            });
            g.append('path')
                .attr('transform', "\n                translate(" + _this.field_width / 2 + ", " + meter * 11 + ") ")
                .attr('d', arc || '')
                .attr('fill', color);
        };
        draw_half(field.append('g'));
        draw_half(field.append('g').attr('transform', "rotate(180\n            " + this.field_width / 2 + ", " + this.field_height / 2 + ")"));
        field.append('circle')
            .classed('ball', true)
            .attr('r', 7)
            .attr('fill', 'black')
            .attr('stroke', 'white')
            .attr('stroke-width', 2)
            .attr('visibility', 'hidden');
        field.append('circle')
            .classed('cur_player', true)
            .attr('r', 5)
            .attr('fill', 'red')
            .attr('stroke', 'black')
            .attr('stroke-width', 2)
            .attr('visibility', 'hidden');
    };
    App.prototype.over_time_interval = function (period, t_min, t_max) {
        var coeff = this.field_width / this.dao.field_width;
        var field = d3.select('#field');
        var players = field.selectAll('.player')
            .data(R.values(this.dao.player_directions(period, t_min)));
        players.exit().remove();
        var enter_g = players.enter().append('g')
            .classed('player', true);
        d3.select('.cur_player').each(function () {
            this.parentNode.appendChild(this);
        });
        enter_g.append('line')
            .attr('stroke', 'black');
        enter_g.append('circle')
            .attr('fill', 'orange')
            .attr('stroke', 'black')
            .attr('stroke-width', 1)
            .attr('r', 4);
        enter_g.append('text')
            .attr('fill', 'orange')
            .attr('x', 10)
            .attr('y', 10)
            .attr('text-anchor', 'start')
            .style('font-size', '10px')
            .text('');
        enter_g
            .merge(players)
            .attr('transform', function (d) {
            return "translate(\n                    " + d.pos[1] * coeff + ", " + d.pos[0] * coeff + ") ";
        });
        players.select('line')
            .attr('x2', function (d) { return -d.dir[1] * coeff; })
            .attr('y2', function (d) { return -d.dir[0] * coeff; });
        players.select('text')
            .text(function (d) { return d.player_id; });
    };
    App.prototype.over_event = function (period, event_id) {
        var coeff = this.field_width / this.dao.field_width;
        var event = this.dao.event(period, event_id);
        if (event.X && event.Y) {
            d3.select('.ball')
                .attr('visibility', 'visible')
                .attr('transform', "translate(\n                " + event.Y * coeff + ",\n                " + event.X * coeff + ")");
        }
        if (event.P && event.T) {
            var players = this.dao.player_positions(period, event.T);
            if (event.P in players) {
                var player = players[event.P];
                d3.select('.cur_player')
                    .attr('visibility', 'visible')
                    .attr('transform', "translate(\n                 " + player.Y * coeff + ",\n                 " + player.X * coeff + ")");
            }
        }
    };
    App.prototype.out_event = function (period, event_id) {
        d3.select('.cur_player')
            .attr('visibility', 'hidden');
        d3.select('.ball')
            .attr('visibility', 'hidden');
    };
    App.prototype.on_data_load = function () {
        this.display_events(1);
    };
    App.prototype.onload = function () {
        this.dao = new dao_1.Dao();
        this.dao.onload = this.on_data_load.bind(this);
        this.dao.load();
        this.onresize();
    };
    App.prototype.mount = function () {
        window.onload = this.onload.bind(this);
        window.onresize = this.onresize.bind(this);
    };
    return App;
}());
var app = new App();
app.mount();
