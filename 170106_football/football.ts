import * as d3 from 'd3';
import * as R from 'ramda';
import { Common1 } from './common';
import { Cross1 } from './cross';
import { Weeks1 } from './weeks';
import { Seasons1 } from './seasons';
import { PhasesGraph1 } from './phases_graph';
import { Minimatch1 } from './minimatch';

// <div class="buttons">
//   <i class="circular inverted black rocket icon"></i>
//   <i class="inverted circular notched circle loading icon"></i>
// </div>

interface Slide {
    width: number;
    height: number;
    bg_size: string;
    image: string;
    launched: boolean;
    launch: () => void;
    terminate: () => void;
    elem: Element;
}

class Launcher {
    slides: {
        [id: string]: Slide
    } = {};
    launch_slide(slide: Slide) {
        slide.launched = true;
        $(slide.elem)
            .css('background-image', 'none')
            .css('cursor', 'default')
            .empty();
        slide.launch();
    }
    terminate_slide(slide: Slide) {
        slide.launched = false;
        slide.terminate();
        $(slide.elem)
            .css('background-image', `url(${slide.image})`)
            .css('cursor', 'pointer')
            .html('<div class="buttons"><i class="circular inverted black rocket icon"></i></div>');
    }
    prepare_slide(elem: Element) {
        let slide_id = $(elem).attr('id');
        let slide_class = window[slide_id];
        let slide: Slide = new slide_class();
        slide_class.obj = slide;
        this.slides[slide_id] = slide;
        slide.elem = elem;
        slide.launched = false;
        let launcher = this;
        $(elem)
            .css('background-size', slide.bg_size)
            .css('background-image', `url("${slide.image}")`)
            .html('<div class="buttons"><i class="circular inverted black rocket icon"></i></div>')
            .mouseover(function () {
                if (slide.launched) return;
                $(this).find('.buttons .icon').removeClass('black').addClass('teal');
            })
            .mouseout(function () {
                if (slide.launched) return;
                $(this).find('.buttons .icon').removeClass('teal').addClass('black');
            })
            .click(function () {
                if (slide.launched) return;
                R.values(launcher.slides).forEach((other_slide) => {
                    if (other_slide.launched) {
                        launcher.terminate_slide(other_slide);
                    }
                })
                launcher.launch_slide(slide);
            })
            .css('width', slide.width)
            .css('height', slide.height)
    }
    prepare_stage(elem) {
        let slide_id = $(elem).attr('id');
        let slide_class = window[slide_id];
        let slide: Slide = new slide_class();
        slide_class.obj = slide;
        this.slides[slide_id] = slide;
        slide.elem = elem;
        slide.launch();
    }
    onload() {
        $('.slide').each((i, elem) => this.prepare_slide(elem));
        $('.stage').each((i, elem) => this.prepare_stage(elem));
    }
    mount() {
        $(this.onload.bind(this));
    }
}

class CrossSlide1 {
    image = 'shots/cropped/170105_cross.png';
    bg_size = '80%';
    obj1: Cross1;
    width: number;
    height: number;
    constructor() {
        this.obj1 = new Cross1();
        this.width = this.obj1.width + this.obj1.margin.left + this.obj1.margin.right;
        this.height = this.obj1.height + this.obj1.margin.top + this.obj1.margin.bottom;
    }
    elem;
    launch() {
        let svg = d3.select(this.elem)
            .append('svg')
            .attr('width', this.width)
            .attr('height', this.height)
            .append('g')
            .attr('transform', `translate(50, 50) scale(0.9) translate(${this.obj1.margin.left}, ${this.obj1.margin.top})`);
        this.obj1.svg = svg;
        this.obj1.elem = this.elem;
        d3.csv('2015_E0.csv', (matches) => {
            this.obj1.matches = matches;
            this.obj1.launch();
        });
    }
    terminate() {
        this.obj1 = new Cross1();
    }
}

class WeeksSlide1 {
    image = 'shots/cropped/170105_time_team.png';
    bg_size = '80%';
    obj1: Weeks1;
    width: number;
    height: number;
    constructor() {
        this.obj1 = new Weeks1();
        this.width = this.obj1.width + this.obj1.margin.left + this.obj1.margin.right;
        this.height = this.obj1.height + this.obj1.margin.top + this.obj1.margin.bottom;
    }
    elem;
    launch() {
        let svg = d3.select(this.elem)
            .append('svg')
            .attr('width', this.width)
            .attr('height', this.height)
            .append('g')
            .attr('transform', `translate(50, 50) scale(0.9) translate(${this.obj1.margin.left}, ${this.obj1.margin.top})`);
        this.obj1.svg = svg;
        this.obj1.elem = this.elem;
        d3.csv('2015_E0.csv', (matches) => {
            this.obj1.matches = matches;
            this.obj1.launch();
        });
    }
    terminate() {
        this.obj1 = new Weeks1();
    }
}

class SeasonsSlide1 {
    image = 'shots/cropped/170105_seasons.png';
    bg_size = '80%';
    obj1: Seasons1;
    width: number;
    height: number;
    constructor() {
        this.obj1 = new Seasons1();
        this.width = this.obj1.width + this.obj1.margin.left + this.obj1.margin.right;
        this.height = this.obj1.height + this.obj1.margin.top + this.obj1.margin.bottom;
    }
    elem;
    launch() {
        let svg = d3.select(this.elem)
            .append('svg')
            .attr('width', this.width)
            .attr('height', this.height)
            .append('g')
            .attr('transform', `
                translate(50, 50)
                scale(0.9)
                translate(${this.obj1.margin.left}, ${this.obj1.margin.top})`);
        this.obj1.svg = svg;
        this.obj1.elem = this.elem;
        d3.json('seasons.json', (matches) => {
            this.obj1.matches = matches;
            this.obj1.launch();
        });
    }
    terminate() {
        this.obj1 = new Seasons1();
    }
}

class PhasesGraphSlide1 {
    image = 'shots/cropped/170105_seasons.png';
    bg_size = '80%';
    minimatch: Minimatch1;
    graph1: PhasesGraph1;
    width: number;
    height: number;
    minimatch_outer: [number, number];
    graph_outer: [number, number];
    constructor() {
        this.minimatch = new Minimatch1();
        this.graph1 = new PhasesGraph1();
        this.minimatch_outer = Common1.outer(this.minimatch);
        this.graph_outer = Common1.outer(this.graph1);
        this.width = this.minimatch_outer[0] + this.graph_outer[0];
        this.height = this.minimatch_outer[1];
    }
    elem;
    launch() {
        let svg1 = d3.select(this.elem)
            .append('svg')
            .attr('width', this.width)
            .attr('height', this.height)
            .append('g')
            .attr('transform', `
                translate(50, 50)
                scale(0.9)
                translate(${this.minimatch.margin.left}, ${this.minimatch.margin.top})`);
        this.minimatch.svg = svg1;
        this.minimatch.elem = this.elem;
        this.minimatch.select_team_handler = (match) => { };
        this.minimatch.highlight_match_handler = (match) => { };
        let svg2 = svg1.append('g')
            .attr('transform', `
                translate(${this.minimatch_outer[0]}, 0)`);
        this.graph1.svg = svg2;
        this.graph1.elem = this.elem;
        this.graph1.quantile = true;
        d3.csv('2015_E0.csv', (matches) => {
            this.minimatch.matches = matches;
            this.minimatch.launch();
            this.graph1.matches = matches;
            this.graph1.launch();
        });
    }
    terminate() {
        this.minimatch = new Minimatch1();
        this.graph1 = new PhasesGraph1();
    }
}

let launcher = new Launcher();
launcher.mount();


