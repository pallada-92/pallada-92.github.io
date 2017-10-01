//--------------------------------------------------------------------

function p(...msg: any[]) {
    if (msg.length == 0) {
        msg = ['ok'];
    }
    console.log.apply(null, msg);
}

// https://stackoverflow.com/questions/22697936/
function bin_search(ar, el) {
    var m = 0;
    var n = ar.length - 1;
    while (m <= n) {
        var k = (n + m) >> 1;
        var cmp = el - ar[k];
        if (cmp > 0) {
            m = k + 1;
        } else if (cmp < 0) {
            n = k - 1;
        } else {
            return k;
        }
    }
    return m - 0.5;
}

function inside_range(
    val: number,
    range: [number, number]
): boolean {
    return range[0] <= val && val <= range[1];
}

function ceil(num: number, step: number = 1): number {
    return Math.ceil(num / step) * step;
}

function floor(num: number, step: number = 1): number {
    return Math.floor(num / step) * step;
}

function two_digit(num: number): string {
    if (num <= 9) {
        return '0' + ('' + num);
    }
    return '' + num;
}

function const_array(len, val) {
    let a = new Array(len);
    for (let i = 0; i < len; i++) {
        a[i] = val;
    }
    return a;
}

class Download<T> {
    counter: number;
    downloading: boolean;
    downloaded: boolean;
    data: T | undefined;
    clear() {
        this.counter += 1;
        this.downloading = false;
        this.downloaded = false;
        this.data = undefined;
    }
    constructor(
        public name: string,
        public callback: () => void,
    ) {
        this.counter = 0;
        this.clear();
    }
    load() {
        this.clear();
        this.downloading = true;
        $.getJSON(
            '/json/' + this.name + '.json',
            this.after_load.bind(this, this.counter),
        )
    }
    subclass_after_load() { };
    after_load(counter: number, data: T) {
        if (counter != this.counter) return;
        this.downloading = false;
        this.downloaded = true;
        this.data = data as T;
        this.subclass_after_load();
        this.callback();
    }
}
