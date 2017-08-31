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
  this.images = {'bg_pc_small.png': null};
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
    var note = {};
    note.img = this.images['bg_pc_small.png'];
    note.h = this.h * 1.2;
    note.w = note.img.width * note.h / note.img.height;
    note.x0 = this.w - note.w * 1.05;
    note.y0 = 0;
    note.cx = note.x0 + note.w * 0.6;
    note.cy = note.y0 + note.h * 0.33;
    note.rad = note.h * 0.5;
    return note;
  }
  this.draw = function(t, draw_note) {
    var ctx = this.ctx;
    var note = this.calc_note();
    if (draw_note) {
      ctx.drawImage(note.img, note.x0, note.y0, note.w, note.h);
      return;
    }
    img = this.offscr;
    var sphere_w = note.rad * 2;
    var sphere_h = note.rad * 2 / img.width * img.height;
    var pt0 = [this.w - note.cx, note.cy];
    var pt1 = [this.w / 2, this.h * 0.7];
    var pt2 = [note.cx, note.cy];
    var pt = [
      this.w / 2 + t * (note.cx - this.w / 2),
      note.cy - t * (1 - t) * 1 * note.cy + 100 * (1 - t),
    ]
    var size_coeff = (1 + t) / 2;
    var sphere_x, sphere_y;
    ctx.drawImage(
      img,
      pt[0] - sphere_w / 2,
      pt[1] - sphere_h / 2,
      sphere_w * size_coeff,
      sphere_h * size_coeff,
    )
  }
  this.t = 0;
  var requestAnimationFrame = window.requestAnimationFrame;
  if (!requestAnimationFrame) {
    requestAnimationFrame = (function() {
      return window.webkitRequestAnimationFrame ||
        // comment out if FF4 is slow (it caps framerate at ~30fps:
        // https://bugzilla.mozilla.org/show_bug.cgi?id=630127)
        window.mozRequestAnimationFrame || 
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function(
          /* function FrameRequestCallback */ callback,
          /* DOMElement Element */ element
        ) {
          window.setTimeout(callback, 1000 / 60);
        };
    })();
  }
  
  this.start_animation = function() {
    var f = function() {
      var ctx = this.ctx;
      ctx.clearRect(0, 0, this.w, this.h);
      ctx.save();
      var t;
      var dt = 1 / 5;
      t = Math.floor(this.t / dt) * dt;
      this.draw(0, 1);
      if (this.t >= 1) {
        this.draw(1);
        this.sphere.animate();
      } else {
        ctx.globalAlpha = (1 - (this.t - t) / dt) * this.t;
        var s = ctx.globalAlpha;
        this.draw(this.half_easing(Math.min(1, t)));
        t += dt;
        ctx.globalAlpha = (1 - (t - this.t) / dt) * this.t;
        s += ctx.globalAlpha;
        // console.log(s);
        this.draw(this.half_easing(Math.min(1, t)));
        ctx.restore();
        this.t += params.speed;
      }
      setTimeout(function() {
        requestAnimationFrame(f);
      }, 1000 * params.speed);
    }.bind(this);
    f();
  }
  this.images_loaded = function() {
    this.sphere = new Sphere({
      canvas: this.offscr,
      width: 500,
      height: 500,
      cx: 250,
      cy: 250,
      rad: 110,
      line_coeff: 1,
      less_vertices: false,
      circ_rel_size: 0.19,
      circ_exp: 0.5, 
      vect0_shift: 0.1,
      icon_size: 150,
      orbits: true,
      hide_menu: true,
      popup: false,
      no_autoplay: true,
      onload: this.sphere_loaded.bind(this),
    }, {
      onclick: function() {},
      menu: [],
      items: params.items,
    });
    console.log('ok1');
    this.images_loaded = function() {};
  }
  this.sphere_loaded = function() {
    console.log('ok2');
    this.sphere.draw();
    this.start_animation();
  }
  this.start_loading();
}
