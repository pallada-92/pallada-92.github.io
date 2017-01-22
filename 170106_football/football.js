"use strict";
var d3 = require('d3');
var R = require('ramda');
var common_1 = require('./common');
var cross_1 = require('./cross');
var weeks_1 = require('./weeks');
var seasons_1 = require('./seasons');
var phases_graph_1 = require('./phases_graph');
var minimatch_1 = require('./minimatch');
var Launcher = (function () {
    function Launcher() {
        this.slides = {};
    }
    Launcher.prototype.launch_slide = function (slide) {
        slide.launched = true;
        $(slide.elem)
            .css('background-image', 'none')
            .css('cursor', 'default')
            .empty();
        slide.launch();
    };
    Launcher.prototype.terminate_slide = function (slide) {
        slide.launched = false;
        slide.terminate();
        $(slide.elem)
            .css('background-image', "url(" + slide.image + ")")
            .css('cursor', 'pointer')
            .html('<div class="buttons"><i class="circular inverted black rocket icon"></i></div>');
    };
    Launcher.prototype.prepare_slide = function (elem) {
        var slide_id = $(elem).attr('id');
        var slide_class = window[slide_id];
        var slide = new slide_class();
        slide_class.obj = slide;
        this.slides[slide_id] = slide;
        slide.elem = elem;
        slide.launched = false;
        var launcher = this;
        $(elem)
            .css('background-size', slide.bg_size)
            .css('background-image', "url(\"" + slide.image + "\")")
            .html('<div class="buttons"><i class="circular inverted black rocket icon"></i></div>')
            .mouseover(function () {
            if (slide.launched)
                return;
            $(this).find('.buttons .icon').removeClass('black').addClass('teal');
        })
            .mouseout(function () {
            if (slide.launched)
                return;
            $(this).find('.buttons .icon').removeClass('teal').addClass('black');
        })
            .click(function () {
            if (slide.launched)
                return;
            R.values(launcher.slides).forEach(function (other_slide) {
                if (other_slide.launched) {
                    launcher.terminate_slide(other_slide);
                }
            });
            launcher.launch_slide(slide);
        })
            .css('width', slide.width)
            .css('height', slide.height);
    };
    Launcher.prototype.prepare_stage = function (elem) {
        var slide_id = $(elem).attr('id');
        var slide_class = window[slide_id];
        var slide = new slide_class();
        slide_class.obj = slide;
        this.slides[slide_id] = slide;
        slide.elem = elem;
        slide.launch();
    };
    Launcher.prototype.onload = function () {
        var _this = this;
        $('.slide').each(function (i, elem) { return _this.prepare_slide(elem); });
        $('.stage').each(function (i, elem) { return _this.prepare_stage(elem); });
    };
    Launcher.prototype.mount = function () {
        $(this.onload.bind(this));
    };
    return Launcher;
}());
var CrossSlide1 = (function () {
    function CrossSlide1() {
        this.image = 'shots/cropped/170122_cross1.png';
        this.bg_size = '80%';
        this.obj1 = new cross_1.Cross1();
        this.width = this.obj1.width + this.obj1.margin.left + this.obj1.margin.right;
        this.height = this.obj1.height + this.obj1.margin.top + this.obj1.margin.bottom;
    }
    CrossSlide1.prototype.launch = function () {
        var _this = this;
        var svg = d3.select(this.elem)
            .append('svg')
            .attr('width', this.width)
            .attr('height', this.height)
            .append('g')
            .attr('transform', "translate(50, 50) scale(0.9) translate(" + this.obj1.margin.left + ", " + this.obj1.margin.top + ")");
        this.obj1.svg = svg;
        this.obj1.elem = this.elem;
        d3.csv('2015_E0.csv', function (matches) {
            _this.obj1.matches = matches;
            _this.obj1.launch();
        });
    };
    CrossSlide1.prototype.terminate = function () {
        this.obj1 = new cross_1.Cross1();
    };
    return CrossSlide1;
}());
var WeeksSlide1 = (function () {
    function WeeksSlide1() {
        this.image = 'shots/cropped/170122_time_team1.png';
        this.bg_size = '80%';
        this.obj1 = new weeks_1.Weeks1();
        this.width = this.obj1.width + this.obj1.margin.left + this.obj1.margin.right;
        this.height = this.obj1.height + this.obj1.margin.top + this.obj1.margin.bottom;
    }
    WeeksSlide1.prototype.launch = function () {
        var _this = this;
        var svg = d3.select(this.elem)
            .append('svg')
            .attr('width', this.width)
            .attr('height', this.height)
            .append('g')
            .attr('transform', "translate(50, 50) scale(0.9) translate(" + this.obj1.margin.left + ", " + this.obj1.margin.top + ")");
        this.obj1.svg = svg;
        this.obj1.elem = this.elem;
        d3.csv('2015_E0.csv', function (matches) {
            _this.obj1.matches = matches;
            _this.obj1.launch();
        });
    };
    WeeksSlide1.prototype.terminate = function () {
        this.obj1 = new weeks_1.Weeks1();
    };
    return WeeksSlide1;
}());
var SeasonsSlide1 = (function () {
    function SeasonsSlide1() {
        this.image = 'shots/cropped/170122_seasons2.png';
        this.bg_size = '80%';
        this.obj1 = new seasons_1.Seasons1();
        this.width = this.obj1.width + this.obj1.margin.left + this.obj1.margin.right;
        this.height = this.obj1.height + this.obj1.margin.top + this.obj1.margin.bottom;
    }
    SeasonsSlide1.prototype.launch = function () {
        var _this = this;
        var svg = d3.select(this.elem)
            .append('svg')
            .attr('width', this.width)
            .attr('height', this.height)
            .append('g')
            .attr('transform', "\n                translate(50, 50)\n                scale(0.9)\n                translate(" + this.obj1.margin.left + ", " + this.obj1.margin.top + ")");
        this.obj1.svg = svg;
        this.obj1.elem = this.elem;
        d3.json('seasons.json', function (matches) {
            _this.obj1.matches = matches;
            _this.obj1.launch();
        });
    };
    SeasonsSlide1.prototype.terminate = function () {
        this.obj1 = new seasons_1.Seasons1();
    };
    return SeasonsSlide1;
}());
var PhasesGraphSlide1 = (function () {
    function PhasesGraphSlide1() {
        this.image = 'shots/cropped/170122_seasons1.png';
        this.bg_size = '80%';
        this.minimatch = new minimatch_1.Minimatch1();
        this.graph1 = new phases_graph_1.PhasesGraph1();
        this.minimatch_outer = common_1.Common1.outer(this.minimatch);
        this.graph_outer = common_1.Common1.outer(this.graph1);
        this.width = this.minimatch_outer[0] + this.graph_outer[0];
        this.height = this.minimatch_outer[1];
    }
    PhasesGraphSlide1.prototype.launch = function () {
        var _this = this;
        var svg1 = d3.select(this.elem)
            .append('svg')
            .attr('width', this.width)
            .attr('height', this.height)
            .append('g')
            .attr('transform', "\n                translate(50, 50)\n                scale(0.9)\n                translate(" + this.minimatch.margin.left + ", " + this.minimatch.margin.top + ")");
        this.minimatch.svg = svg1;
        this.minimatch.elem = this.elem;
        this.minimatch.select_team_handler = function (match) { };
        this.minimatch.highlight_match_handler = function (match) { };
        var svg2 = svg1.append('g')
            .attr('transform', "\n                translate(" + this.minimatch_outer[0] + ", 0)");
        this.graph1.svg = svg2;
        this.graph1.elem = this.elem;
        this.graph1.quantile = true;
        d3.csv('2015_E0.csv', function (matches) {
            _this.minimatch.matches = matches;
            _this.minimatch.launch();
            _this.graph1.matches = matches;
            _this.graph1.launch();
        });
    };
    PhasesGraphSlide1.prototype.terminate = function () {
        this.minimatch = new minimatch_1.Minimatch1();
        this.graph1 = new phases_graph_1.PhasesGraph1();
    };
    return PhasesGraphSlide1;
}());
var launcher = new Launcher();
launcher.mount();
