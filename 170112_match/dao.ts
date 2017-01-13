import * as R from 'ramda';
import * as d3 from 'd3';

type EventsPeriod = {
    E: string,
    P: string,
    T: string,
    X: string,
    Y: string,
}

type FitnessPeriod = {
    T0: number,
    X: string,
    Y: string,
    V: string,
}

type Data = {
    HTeam: string,
    ATeam: string,
    events: {
        event_names: string[],
        period1: EventsPeriod,
        period2: EventsPeriod,
    },
    players: {
        [player_code: string]: {
            name: string,
            fitness: {
                period1: FitnessPeriod | null,
                period2: FitnessPeriod | null,
            } | null,
        }
    }
}

function trim(str: string) {
    return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
}

class FixString {
    empty: string;
    constructor(
        public str: string,
        public width: number,
    ) {
        this.empty = '';
        while (width > 0) {
            this.empty += ' ';
            width--;
        }
    };
    get length(): number {
        return Math.floor(this.str.length / this.width);
    }
    at_raw(id: number): string | undefined {
        if (id < 0 || id >= this.length) {
            return undefined;
        }
        let res = this.str.slice(id * this.width, (id + 1) * this.width);
        if (res == this.empty) {
            return undefined;
        } else {
            return res;
        }
    }
    at_int(id: number): number | undefined {
        let res = this.at_raw(id);
        if (res == undefined) {
            return undefined;
        } else {
            return parseInt(res);
        }
    }
    find_ids(min: number, max: number): number[] {
        let res: number[] = [];
        for (let i = 0; i < this.length; i++) {
            let val = this.at_int(i);
            if (val == undefined) continue;
            if (val >= min && val < max) {
                res.push(i);
            }
        }
        return res;
    }
    max(): number {
        for (let i = this.length - 1; i >= 0; i--) {
            let val = this.at_int(i);
            if (val != undefined) {
                return val;
            }
        }
        return 0;
    }
}

function polar_decart(phi, r): [number, number] {
    return [Math.cos(phi) * r, Math.sin(phi) * r];
}

export class Dao {
    data: Data;
    onload: () => void;
    load() {
        d3.json('data.json', (data: Data) => {
            this.data = data;
            this.onload();
        })
    }
    max_event_time(period: number) {
        let e: EventsPeriod = this.data.events[`period${period}`];
        return new FixString(e.T, 6).max();
    }
    get event_count() {
        return this.data.events.event_names.length;
    }
    field_width: number = 68;
    field_height: number = 105;
    event(period: number, id: number, events?: EventsPeriod) {
        let e = events || this.data.events[`period${period}`];
        let code = new FixString(e.E, 3).at_int(id) as number;
        let player_id = new FixString(e.P, 3).at_raw(id);
        let inverse = player_id && player_id[0] == 'H';
        let x = new FixString(e.X, 5).at_int(id) / 100 * this.field_height / 105;
        let y = new FixString(e.Y, 5).at_int(id) / 100 * this.field_width / 68;
        return {
            id,
            code,
            title: this.data.events.event_names[code] || '-',
            P: player_id,
            T: new FixString(e.T, 6).at_int(id),
            X: inverse ? this.field_height - x : x,
            Y: inverse ? this.field_width - y : y,
        }
    }
    events(period: number, min_t: number, max_t: number) {
        let e: EventsPeriod = this.data.events[`period${period}`];
        let ids = new FixString(e.T, 6).find_ids(min_t, max_t);
        return ids.map((id) => this.event(period, id, e))
            .filter(({code}) => code != undefined);
    }
    player_info(player_id: number) {
        return {
            name: this.data.players[player_id].name,
            team: this.data[`${player_id[0]}Team`],
        }
    }
    fitness_shift: number = 12 * 100;
    player_positions(period: number, time: number) {
        time = Math.floor(time / 100) * 100;
        time -= this.fitness_shift;
        let res: {
            [player_id: string]: {
                X: number,
                Y: number,
                V: number,
            }
        } = {};
        for (let player_id in this.data.players) {
            let f = this.data.players[player_id].fitness;
            if (f == null) continue;
            let p: FitnessPeriod = f[`period${period}`];
            if (p == null || time < p.T0) continue;
            let row_id = Math.floor((time - p.T0) / 100);
            let x = new FixString(p.X, 5).at_int(row_id);
            if (x == undefined) continue;
            let y = new FixString(p.Y, 4).at_int(row_id);
            if (y == undefined) continue;
            let v = new FixString(p.V, 3).at_int(row_id);
            if (v == undefined) continue;
            res[player_id] = {
                X: ((x - 10000) / 10324 + 0.5) * this.field_height,
                Y: (y / 6567) * this.field_width,
                V: v / 100,
            };
        }
        return res;
    }
    player_directions(period: number, time: number) {
        let res: {
            [player_id: string]: {
                player_id: string,
                pos: [number, number],
                prev_pos: [number, number],
                dir: [number, number],
                speed: number,
            }
        } = {};
        let cur_pos = this.player_positions(period, time);
        let prev_pos = this.player_positions(period, time - 100);
        for (let player_id in cur_pos) {
            let cur_x = cur_pos[player_id].X;
            let cur_y = cur_pos[player_id].Y;
            let prev_x = 0, prev_y = 0;
            if (player_id in prev_pos) {
                prev_x = prev_pos[player_id].X;
                prev_y = prev_pos[player_id].Y;
            }
            let phi = Math.atan2(cur_y - prev_y, cur_x - prev_x);
            res[player_id] = {
                player_id,
                pos: [cur_x, cur_y],
                prev_pos: [prev_x, prev_y],
                dir: polar_decart(phi, cur_pos[player_id].V),
                speed: cur_pos[player_id].V
            }
        }
        return res;
    }
    player_time_range(player_id: string, period: number): [number, number] {
        let f = this.data.players[player_id].fitness;
        if (f == null) {
            return [0, -1];
        }
        let p: FitnessPeriod | null = f[`period${period}`];
        if (p == null) {
            return [0, -1];
        }
        let res = [p.T0, p.T0 + new FixString(p.X, 5).length * 100];
        return [
            res[0] + this.fitness_shift,
            res[1] + this.fitness_shift
        ];
    }
    max_time(period: number) {
        let res = this.max_event_time(period);
        for (let player_id in this.data.players) {
            let val = this.player_time_range(player_id, period)[1];
            res = Math.max(val, res);
        }
        return res;
    }
}
