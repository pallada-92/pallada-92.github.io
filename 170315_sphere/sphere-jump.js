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
  /* this.sphere = new Sphere(
    {
      canvas: this.offscr,
      width: Math.round(w),
      height: Math.round(h),
      cx: 440 * r,
      cy: 325 * r,
      rad: 200 * r,
      line_coeff: r,
      less_vertices: false,
      circ_rel_size: 0.19,
      circ_exp: 0.5, 
      vect0_shift: 0.1,
      icon_size: 150,
      orbits: true,
      hide_menu: true,
      popup: false,
    }, {
      onclick: function() {},
      menu: [],
      items: params.items,
    }
  ); */
  this.images = {'bg_pc.png': null, 'sphere_static.png': null};
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
  this.draw = function(t) {
    var ctx = this.ctx;
    var img;
    img = this.images['bg_pc.png'];
    var note_h = this.h * 1.2;
    var note_w = img.width * note_h / img.height;
    var note_x0 = this.w - note_w * 1.05;
    var note_y0 = 0;
    var note_cx = note_x0 + note_w * 0.6;
    var note_cy = note_y0 + note_h * 0.33;
    var note_rad = note_h * 0.27;
    ctx.drawImage(img, note_x0, note_y0, note_w, note_h);
    img = this.images['sphere_static.png'];
    var sphere_w = note_rad * 2;
    var sphere_h = note_rad * 2 / img.width * img.height;
    var pt0 = [this.w - note_cx, note_cy];
    var pt1 = [this.w / 2, this.h * 0.7];
    var pt2 = [note_cx, note_cy];
    var pt = [
      (this.w - note_cx) + t * (2 * note_cx - this.w),
      note_cy + t * (1 - t) * 4 * note_cy,
    ]
    var sphere_x, sphere_y;
    ctx.drawImage(
      img,
      pt[0] - sphere_w / 2,
      pt[1] - sphere_h / 2,
      sphere_w,
      sphere_h,
    )
    /*
    ctx.arc(note_cx, note_cy, 10, 0, 2 * Math.PI, false);
    ctx.fillStyle = 'black';
    ctx.fill();
    */
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
      ctx.globalAlpha = 0.6;
      var t1 = this.t;
      var dt0 = 1 / 16;
      this.draw(this.half_easing(Math.min(1, this.t)));
      this.t += dt0;
      this.draw(this.half_easing(Math.min(1, this.t)));
      this.t += dt0;
      this.draw(this.half_easing(Math.min(1, this.t)));
      this.t = t1 + 1 / 25;
      ctx.restore();
      setTimeout(function() {
        requestAnimationFrame(f);
      }, 1000 / 24);
    }.bind(this);
    f();
  }
  this.images_loaded = function() {
    this.start_animation();
    this.images_loaded = function() {};
  }
  this.start_loading();
}
