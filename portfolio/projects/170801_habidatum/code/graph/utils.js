function p() {
    var msg = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        msg[_i] = arguments[_i];
    }
    if (msg.length == 0) {
        msg = ['ok'];
    }
    console.log.apply(null, msg);
}
function bin_search(ar, el) {
    var m = 0;
    var n = ar.length - 1;
    while (m <= n) {
        var k = (n + m) >> 1;
        var cmp = el - ar[k];
        if (cmp > 0) {
            m = k + 1;
        }
        else if (cmp < 0) {
            n = k - 1;
        }
        else {
            return k;
        }
    }
    return m - 0.5;
}
function inside_range(val, range) {
    return range[0] <= val && val <= range[1];
}
function ceil(num, step) {
    if (step === void 0) { step = 1; }
    return Math.ceil(num / step) * step;
}
function floor(num, step) {
    if (step === void 0) { step = 1; }
    return Math.floor(num / step) * step;
}
function two_digit(num) {
    if (num <= 9) {
        return '0' + ('' + num);
    }
    return '' + num;
}
function const_array(len, val) {
    var a = new Array(len);
    for (var i = 0; i < len; i++) {
        a[i] = val;
    }
    return a;
}
var Download = (function () {
    function Download(name, callback) {
        this.name = name;
        this.callback = callback;
        this.counter = 0;
        this.clear();
    }
    Download.prototype.clear = function () {
        this.counter += 1;
        this.downloading = false;
        this.downloaded = false;
        this.data = undefined;
    };
    Download.prototype.load = function () {
        this.clear();
        this.downloading = true;
        $.getJSON('/json/' + this.name + '.json', this.after_load.bind(this, this.counter));
    };
    Download.prototype.subclass_after_load = function () { };
    ;
    Download.prototype.after_load = function (counter, data) {
        if (counter != this.counter)
            return;
        this.downloading = false;
        this.downloaded = true;
        this.data = data;
        this.subclass_after_load();
        this.callback();
    };
    return Download;
}());
