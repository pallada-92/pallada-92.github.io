

export class Common {

    static f00(num: number): string {
        return ('0' + num).slice(-2);
    }

    static ftime1(stamp100: number): string {
        let seconds = Math.floor(stamp100 / 100);
        let frac = stamp100 - seconds * 100;
        let minutes = Math.floor(seconds / 60);
        seconds -= minutes * 60;
        return Common.f00(minutes) +
            ':' + Common.f00(seconds) +
            '.' + Common.f00(frac);
    }

    static ftime2(stamp100: number): string {
        let seconds = Math.floor(stamp100 / 100);
        let minutes = Math.floor(seconds / 60);
        seconds -= minutes * 60;
        return Common.f00(minutes) +
            ':' + Common.f00(seconds);
    }

    static move_to_front() {
        let t = this;
        if (t) {
            t['parentNode']['appendChild'](t);
        }
    }

    static rng(n: number, fun: (i: number) => void) {
        for (let i = 0; i < n; i++) {
            fun(i);
        }
    }

    static clamp(num: number, min: number = 0, max: number = 1) {
        return Math.max(min, Math.min(max, num));
    }

}
