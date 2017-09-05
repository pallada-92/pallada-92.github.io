function SphereJump(params) {
  this.canvas = document.getElementById(params.id);
  this.recalc_canvas_size = function() {
    var cs = getComputedStyle(this.canvas.parentNode);
    this.w = parseInt(cs.getPropertyValue('width'), 10);
    this.h = parseInt(cs.getPropertyValue('height'), 10);
    this.canvas.width = this.w;
    this.canvas.height = this.h;
  }
  this.recalc_canvas_size();
  this.ctx = this.canvas.getContext('2d');
  this.offscr = document.createElement('canvas');
  this.steps = [];
  this.images = {};
  this.images[params.bg_pc] = null; 
  for (var i in params.items) {
    this.images[params.items[i].icon] = null;
  }
  this.start_loading = function() {
    for (var src in this.images) {
      var image = new Image();
      image.src = src
      this.images[src] = image;
      image.onload = function() {
        for (var src in this.images) {
          if (!this.images[src].complete) return;
        }
        this.images_loaded();
      }.bind(this);
    }
  }
  this.cos_easing = function(x) {
    return (1 - Math.cos(x * Math.PI)) / 2;
  }
  this.half_easing = function(x) {
    return - Math.cos((x + 1) * Math.PI / 2);
  }
  this.calc_note = function() {
    this.note = {};
    var note = this.note;
    note.img = this.images[params.bg_pc];
    note.h = this.h * 1.2;
    note.w = note.img.width * note.h / note.img.height;
    note.x0 = this.w - note.w - params.note_right_margin;
    note.y0 = 0;
    note.cx = note.x0 + note.w * 0.6;
    note.cy = note.y0 + note.h * 0.315;
    note.rad = note.h * 0.24;
    return note;
  }
  this.draw_note = function() {
    var ctx = this.ctx;
    var note = this.calc_note();
    ctx.drawImage(note.img, note.x0, note.y0, note.w, note.h);
  }
  this.draw_sphere = function(t, img) {
    var ctx = this.ctx;
    var note = this.calc_note();
    var pt0 = [this.w - note.cx, note.cy];
    var pt1 = [this.w / 2, this.h * 0.7];
    var pt2 = [note.cx, note.cy];
    var pt = [
      this.w / 2 + t * (note.cx - this.w / 2),
      note.cy - t * (1 - t) * 1 * note.cy + (this.h - note.cy) * (1 - t),
    ]
    var size_coeff = note.rad / this.sphere.params.rad * (2 + t) / 3;
    var w = img.width * size_coeff;
    var h = img.height * size_coeff;
    ctx.drawImage(img, pt[0] - w / 2, pt[1] - h / 2, w, h);
  }
  function divide(a, b) {
    if (a == 0 && b == 0) return 1;
    return a / b;
  }
  function clamp(a, b, x) {
    if (x < a) return a;
    if (x > b) return b;
    return x;
  }
  function calc_max_alpha(rel_pos) {
    return Math.pow((rel_pos - 1) / 5 + 1, 5);
  }
  function copy_canvas(canvas_from, canvas_to) {
    var ctx = canvas_to.getContext('2d');
    ctx.clearRect(0, 0, canvas_to.width, canvas_to.height);
    ctx.drawImage(canvas_from, 0, 0);
  }
  this.draw = function() {
    var t = (+new Date() / 1000 - this.anim_start)
            % params.cycle_duration,
        show_t = clamp(0, 1, t / params.move_duration),
        hide_t = clamp(
          0, 1 - 1 / params.sphere_count,
          t / params.move_duration - 1
        ),
        ctx = this.ctx;
    var tt1 = params.move_duration / params.sphere_count;
    var tt2 = t - (params.cycle_duration - tt1 - params.pause_between);
    if (tt2 > 0) {
      hide_t = clamp(0, 1, 1 - (1 - tt2 / tt1) / params.sphere_count);
    }
    ctx.clearRect(0, 0, this.w, this.h);
    this.draw_note();
    for (var i=0; i<params.sphere_count; i++) {
      var rel_pos = divide(i, params.sphere_count - 1);
      ctx.save();
      var cur_alpha = 1;
      if (show_t < 1) {
        cur_alpha = show_t * params.sphere_count - i;
      } else if (hide_t > 0) {
        cur_alpha = 1 - (hide_t * params.sphere_count - i);
      }
      cur_alpha = clamp(0, 1, cur_alpha);
      ctx.globalAlpha = calc_max_alpha(rel_pos) * cur_alpha;
      if (!this.steps[i]) {
        var buf = document.createElement('canvas');
        this.steps[i] = buf;
        buf.width = this.offscr.width;
        buf.height = this.offscr.height;
        copy_canvas(this.offscr, buf);
      }
      if (i == params.sphere_count - 1) {
        this.sphere.params.not_draw_orbits = false;
        copy_canvas(this.offscr, this.steps[i]);
      }
      this.draw_sphere(rel_pos, this.steps[i]);
      ctx.restore();
    }
  }

  this.images_loaded = function() {
    var note = this.calc_note();
    var buf_side = Math.round(note.rad * 6);
    this.sphere = new Sphere({
      canvas: this.offscr,
      width: buf_side,
      height: buf_side,
      cx: buf_side / 2,
      cy: buf_side / 2,
      rad: note.rad,
      line_coeff: 0.5,
      less_vertices: false,
      circ_rel_size: 0.19,
      circ_exp: 0.5, 
      vect0_shift: 0.1,
      icon_size: 150,
      orbits: true,
      hide_menu: true,
      popup: false,
      no_autoplay: true,
      onload: function() {
        this.anim_start = (+new Date()) / 1000;
        this.sphere.animate();
      }.bind(this),
      no_glow: false,
      grad_stop: 0.3,
      not_draw_orbits: true,
    }, {
      onclick: function() {},
      menu: [],
      items: params.items,
    });
    this.sphere.ondraw = this.draw.bind(this);
    this.images_loaded = function() {};
  }
  this.start_loading();
}
