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
    var ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);
    this.draw_note();
    var t = +new Date() - this.anim_start;
    var total_alpha = 0;
    for (var i=0; i<params.sphere_count; i++) {
      total_alpha += calc_max_alpha(divide(i, params.sphere_count - 1));
    }
    total_alpha = params.sphere_count - 1;
    var cur_alpha = total_alpha * (t / params.duration / 1000);
    // console.log(total_alpha, cur_alpha);
    var active_step;
    for (var i=0; i<params.sphere_count - 1; i++) {
      var rel_pos = divide(i, params.sphere_count - 1);
      var max_alpha = calc_max_alpha(rel_pos);
      if (cur_alpha <= 0) break;
      ctx.save();
      ctx.globalAlpha = max_alpha; // * clamp(0, 1, cur_alpha);
      if (!this.steps[i]) {
        var buf = document.createElement('canvas');
        this.steps[i] = buf;
        buf.width = this.offscr.width;
        buf.height = this.offscr.height;
        copy_canvas(this.offscr, buf);
      }
      this.draw_sphere(rel_pos, this.steps[i]);
      ctx.restore();
      cur_alpha -= 1;
      active_step = i;
      // if (cur_alpha <= 0) break;
    }
    ctx.save();
    rel_pos = clamp(0, 1, t / params.duration / 1000);
    ctx.globalAlpha = calc_max_alpha(rel_pos);
    this.draw_sphere(rel_pos, this.offscr);
    ctx.restore();
    if (active_step >= params.sphere_count - 2) {
      this.sphere.params.not_draw_orbits = false;
      // copy_canvas(this.offscr, this.steps[active_step]);
    }
  }
  
  /*
  this.start_animation = function() {
    this.sphere.animate();
    var f = function() {
      var ctx = this.ctx;
      ctx.clearRect(0, 0, this.w, this.h);
      ctx.save();
      var t;
      var dt = 1 / 5;
      t = Math.floor(this.t / dt) * dt;
      this.draw(0, 1);
      if (this.t >= 1) {
        this.sphere.ondraw = function() {
          var ctx = this.ctx;
          ctx.clearRect(0, 0, this.w, this.h);
          this.draw_note();
          this.draw(1);
        }.bind(this);
      } else {
        ctx.globalAlpha = (1 - (this.t - t) / dt) * (1 + this.t) / 2;
        var s = ctx.globalAlpha;
        this.sphere.anim_step();
        this.draw(this.half_easing(Math.min(1, t)));
        t += dt;
        ctx.globalAlpha = (1 - (t - this.t) / dt) * (1 + this.t) / 2;
        s += ctx.globalAlpha;
        // console.log(s);
        this.draw(this.half_easing(Math.min(1, t)));
        ctx.restore();
        this.t += params.step;
        setTimeout(function() {
          requestAnimationFrame(f);
        }, 1000 * params.delay);
      }
    }.bind(this);
    f();
  }
  */

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
        this.anim_start = +new Date();
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
