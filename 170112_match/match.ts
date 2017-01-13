import * as d3 from 'd3';
import * as R from 'ramda';

import { Dao } from './dao';

function f00(num: number): string {
    return ('0' + num).slice(-2);
}

function ftime1(stamp100: number): string {
    let seconds = Math.floor(stamp100 / 100);
    let frac = stamp100 - seconds * 100;
    let minutes = Math.floor(seconds / 60);
    seconds -= minutes * 60;
    return `${f00(minutes)}:${f00(seconds)}.${f00(frac)}`;
}

function ftime2(stamp100: number): string {
    let seconds = Math.floor(stamp100 / 100);
    let minutes = Math.floor(seconds / 60);
    seconds -= minutes * 60;
    return `${f00(minutes)}:${f00(seconds)}`;
}

class App {
    dao: Dao;
    display_events(period: number) {
        let max_time = this.dao.max_event_time(period);
        let step = 100;
        let root = document.getElementById('events');
        if (root == null) return;
        let html = '';
        let bg_scale = d3.interpolateHslLong(
            d3.color('hsl(90, 100%, 90%)'),
            d3.color('hsl(350, 100%, 90%)'),
        )
        for (let t = 0; t < max_time + step; t += step) {
            html += '<div class="time_interval" onMouseOver=';
            html += `"app.over_time_interval(${period}, ${t}, ${t + step})">`;
            html += `<div class="timestamp">${ftime2(t)}</div>`;
            let events = this.dao.events(period, t, t + step);
            for (let i = 0; i < events.length; i++) {
                let event = events[i];
                let bg = bg_scale(event.code / (this.dao.event_count - 1))
                html += `<div class="event"
                onMouseOver="app.over_event(${period}, ${event.id})"
                onMouseOut="app.out_event(${period}, ${event.id})"
                style="background-color: ${bg}">`;
                html += event.title;
                html += '</div>';
            }
            html += '</div>';
        }
        root.innerHTML = html;
    }
    field_height: number;
    field_width: number;
    onresize() {
        this.field_height = window.innerHeight;
        this.field_width = this.field_height / 105 * 68;
        let events = document.getElementById('events');
        if (events == null) return;
        events.style.marginRight = this.field_width + 50 + 'px';
        let field = document.getElementById('field');
        if (field == null) return;
        field.style.width = this.field_width + 'px';
        field.style.height = this.field_height + 'px';
        field.innerHTML = '';
        this.draw_field();
    }
    draw_field() {
        let field = d3.select('#field');
        let color = 'lightgray';
        let meter = this.field_height / 105;
        let line = meter * 0.1;
        field.append('line')
            .attr('x1', 0)
            .attr('y1', this.field_height / 2)
            .attr('x2', this.field_width)
            .attr('y2', this.field_height / 2)
            .attr('stroke', color)
            .attr('stroke-width', line)
        field.append('circle')
            .attr('cx', this.field_width / 2)
            .attr('cy', this.field_height / 2)
            .attr('fill', color)
            .attr('r', 0.15 * meter)
        field.append('circle')
            .attr('cx', this.field_width / 2)
            .attr('cy', this.field_height / 2)
            .attr('stroke', color)
            .attr('fill', 'none')
            .attr('stroke-width', line)
            .attr('r', 9.15 * meter)
        field.append('rect')
            .attr('x', 3)
            .attr('y', 3)
            .attr('width', this.field_width - 6)
            .attr('height', this.field_height - 6)
            .attr('fill', 'none')
            .attr('stroke', color)
            .attr('stroke-width', line)
        let draw_half = (g) => {
            g.append('rect')
                .attr('x', (this.field_width - 18.32 * meter) / 2)
                .attr('y', 3)
                .attr('width', 18.32 * meter)
                .attr('height', 5.5 * meter - 3)
                .attr('fill', 'none')
                .attr('stroke', color)
                .attr('stroke-width', line)
            g.append('rect')
                .attr('x', (this.field_width - 40.32 * meter) / 2)
                .attr('y', 3)
                .attr('width', 40.32 * meter)
                .attr('height', 16.5 * meter - 3)
                .attr('fill', 'none')
                .attr('stroke', color)
                .attr('stroke-width', line)
            g.append('circle')
                .attr('cx', this.field_width / 2)
                .attr('cy', 11 * meter)
                .attr('fill', color)
                .attr('r', 0.15 * meter)
            let arc = d3.arc()({
                innerRadius: (9.15 * meter - line / 2),
                outerRadius: (9.15 * meter + line / 2),
                startAngle: (Math.PI - Math.acos((16.5 - 11) / 9.15)),
                endAngle: (Math.PI + Math.acos((16.5 - 11) / 9.15)),
                padAngle: 0,
            })
            g.append('path')
                .attr('transform', `
                translate(${this.field_width / 2}, ${meter * 11}) `)
                .attr('d', arc || '')
                .attr('fill', color)
        }
        draw_half(field.append('g'))
        draw_half(
            field.append('g').attr('transform', `rotate(180
            ${this.field_width / 2}, ${this.field_height / 2})`))
        field.append('circle')
            .classed('ball', true)
            .attr('r', 7)
            .attr('fill', 'black')
            .attr('stroke', 'white')
            .attr('stroke-width', 2)
            .attr('visibility', 'hidden')
        field.append('circle')
            .classed('cur_player', true)
            .attr('r', 5)
            .attr('fill', 'red')
            .attr('stroke', 'black')
            .attr('stroke-width', 2)
            .attr('visibility', 'hidden')
    }
    over_time_interval(period: number, t_min: number, t_max: number) {
        let coeff = this.field_width / this.dao.field_width;
        let field = d3.select('#field');
        let players = field.selectAll('.player')
            .data(R.values(this.dao.player_directions(period, t_min)))
        players.exit().remove();
        let enter_g = players.enter().append('g')
            .classed('player', true)
        d3.select('.cur_player').each(function () {
            this.parentNode.appendChild(this);
        });
        enter_g.append('line')
            .attr('stroke', 'black')
        enter_g.append('circle')
            .attr('fill', 'orange')
            .attr('stroke', 'black')
            .attr('stroke-width', 1)
            .attr('r', 4)
        enter_g.append('text')
            .attr('fill', 'orange')
            .attr('x', 10)
            .attr('y', 10)
            .attr('text-anchor', 'start')
            .style('font-size', '10px')
            .text('')
        enter_g
            .merge(players)
            .attr('transform', (d) => {
                return `translate(
                    ${d.pos[1] * coeff}, ${d.pos[0] * coeff}) `
            })
        players.select('line')
            .attr('x2', (d) => -d.dir[1] * coeff)
            .attr('y2', (d) => -d.dir[0] * coeff)
        players.select('text')
            .text((d) => d.player_id)
    }
    over_event(period: number, event_id: number) {
        let coeff = this.field_width / this.dao.field_width;
        let event = this.dao.event(period, event_id);
        if (event.X && event.Y) {
            d3.select('.ball')
                .attr('visibility', 'visible')
                .attr('transform', `translate(
                ${event.Y * coeff},
                ${event.X * coeff})`)
        }
        if (event.P && event.T) {
            let players = this.dao.player_positions(period, event.T);
            if (event.P in players) {
                let player = players[event.P];
                d3.select('.cur_player')
                    .attr('visibility', 'visible')
                    .attr('transform', `translate(
                 ${player.Y * coeff},
                 ${player.X * coeff})`)
            }
        }
    }
    out_event(period: number, event_id: number) {
        d3.select('.cur_player')
            .attr('visibility', 'hidden')
        d3.select('.ball')
            .attr('visibility', 'hidden')
    }
    on_data_load() {
        this.display_events(1);
    }
    onload() {
        this.dao = new Dao();
        this.dao.onload = this.on_data_load.bind(this);
        this.dao.load();
        this.onresize();
    }
    mount() {
        window.onload = this.onload.bind(this);
        window.onresize = this.onresize.bind(this);
    }
}

let app = new App();
app.mount();
