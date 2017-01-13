function require(module) {
    if (module == 'ramda') {
        return R;
    } else if (module == 'd3') {
        return d3;
    } else if (module == './cross') {
        return { Cross1 };
    } else if (module == './weeks') {
        return { Weeks1 };
    } else if (module == './seasons') {
        return { Seasons1 };
    } else if (module == './phases_graph') {
        return { PhasesGraph1 };
    } else if (module == './minimatch') {
        return { Minimatch1 };
    } else if (module == './common') {
        return { Common1 };
    } else if (module == './dao') {
        return { SeasonGamesTable1, SeasonsPositions1 };
    }
}

exports = {};
