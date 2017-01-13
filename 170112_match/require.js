function require(module) {
    if (module == 'ramda') {
        return R;
    } else if (module == 'd3') {
        return d3;
    } else if (module == './common') {
        return { Common };
    } else if (module == './dao') {
        return { Dao };
    }
}

exports = {};
