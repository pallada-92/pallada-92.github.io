(function() {
  var lastTime = 0;
  var vendors = ['ms', 'moz', 'webkit', 'o'];
  for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
    window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
    window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] ||
      window[vendors[x]+'CancelRequestAnimationFrame'];
  }
  
  if (!window.requestAnimationFrame)
    window.requestAnimationFrame = function(callback, element) {
      var currTime = new Date().getTime();
      var timeToCall = Math.max(0, 16 - (currTime - lastTime));
      var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
                                 timeToCall);
      lastTime = currTime + timeToCall;
      return id;
    };
  
  if (!window.cancelAnimationFrame)
    window.cancelAnimationFrame = function(id) {
      clearTimeout(id);
    };
}());

var Defocused = function(params) {
  var cnv = params.canvas;
  cnv.width = params.width;
  cnv.height = params.height;
  var ctx = cnv.getContext('2d');

  function rgb(c) {
    return 'rgb(' + Math.floor(c[0]) +
      ', ' + Math.floor(c[1]) +
      ', ' + Math.floor(c[2]) + ')';
  }

  function rgba(c, alpha) {
    return 'rgba(' + Math.floor(c[0]) +
      ', ' + Math.floor(c[1]) +
      ', ' + Math.floor(c[2]) +
      ', ' + alpha.toFixed(2) + ')';
  }

  function gradient(ctx, color, sharp) {
    var grad = ctx.createRadialGradient(
      0, 0, 0,
      0, 0, 1
    );
    var i_max = 20;
    for (var i=0; i<=i_max; i++) {
      var t = i / i_max;
      var a = Math.exp(-Math.pow(t, sharp) * 5);
      if (i >= i_max * 0.9) {
        a *= 1 - t;
      }
      grad.addColorStop(t, rgba(color, a));
    }
    ctx.fillStyle = grad;
    ctx.fillRect(-1 - sharp, -1 - sharp, 2 + 2 * sharp, 2 + 2 * sharp);
  }

  this.stub = function(rad, sharp, t) {
    t = Math.abs(t) - rad;
    if (t >= sharp) {
      return 0;
    } else if (t <= 0) {
      return 1;
    } else {
      return (1 + Math.cos(t / sharp * Math.PI)) / 2;
    }
  }

  this.mod = function(x, m) {
    var res = x % m;
    if (res < 0) {
      return res + m
    } else {
      return res;
    }
  }

  function vec(pt1, pt2) {
    return [
      pt2[0] - pt1[0],
      pt2[1] - pt1[1],
    ];
  }
  
  function len(vec) {
    return Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1]);
  }

  this.diag = len([cnv.width, cnv.height]);
  this.attractor = [170, 110];
  this.paths = [];
  while(this.paths.length < 200) {
    var dist = Math.pow(Math.random(), 1.1) * this.diag;
    var angle = Math.random() * 2 * Math.PI;
    var pt = [
        Math.cos(angle) * dist,
        Math.sin(angle) * dist,
    ];
    if (pt[0] < 0 || pt[0] > cnv.width || pt[1] < 0 || pt[1] > cnv.height) {
      continue;
    }
    var blinks = [];
    var blinks_count = Math.round(Math.pow(Math.random(), 2) * 3);
    for (var j=0; j<blinks_count; j++) {
      blinks.push(Math.random());
    }
    this.paths.push({
      // pt_from : [
      //   Math.random() * cnv.width,
      //   Math.random() * cnv.height,
      // ],
      pt_from : pt,
      dir: Math.random() * 2 * Math.PI,
      speed: Math.random() * 30 + 50,
      curvature: Math.random() < 0.5 ? Math.random() * 0.5 : 0,
      sharp: Math.round(1 + Math.random() * 6),
      radius: Math.pow(Math.random(), 3) * 40 + 20,
      visible_period: Math.random() * 3 + 3,
      visible_shift: Math.random() * 7,
      blinks: blinks,
    });
  }

  this.mouse_pos = [0, 0];
  
  this.draw = function(t) {
    var grad_pt = this.attractor;
    var bg_grad = ctx.createRadialGradient(
      grad_pt[0], grad_pt[1], 0,
      grad_pt[0], grad_pt[1], cnv.width + cnv.height
    );
    bg_grad.addColorStop(0, 'rgb(163, 243, 80)');
    // bg_grad.addColorStop(0.20,'rgb(108, 197, 63)');
    bg_grad.addColorStop(0.2,'rgb(63, 140, 38)');
    bg_grad.addColorStop(0.3, 'rgb(36, 108, 37)');
    bg_grad.addColorStop(0.6, 'rgb(7, 51, 17)');
    bg_grad.addColorStop(1, 'rgb(0, 0, 0)');
    ctx.fillStyle = bg_grad;
    ctx.fillRect(0, 0, cnv.width, cnv.height);
    for (var i=0; i<this.paths.length; i++) {
      var path = this.paths[i];
      var path_t = this.mod(t - path.visible_shift, path.visible_period);
      var path_t_cnt = path_t - path.visible_period / 2;
      var path_t_rel = path_t / path.visible_period;
      var cur_pt = [
        path.pt_from[0] + path_t_cnt * path.speed * (
          Math.cos(path.dir) + Math.sin(path.dir) *
            path_t_cnt * path.curvature
        ),
        path.pt_from[1] + path_t_cnt * path.speed * (
          Math.sin(path.dir) - Math.cos(path.dir) *
            path_t_cnt * path.curvature
        ),
      ];
      var alpha = 1;
      if (i == -1) {
        console.log(
          // path_t_rel,
        );
      }
      alpha *= (this.stub(0, 0.3, path_t_rel - 0.7));
      alpha *= (1 - path.radius / 60) * 0.2 + 0.8;
      for (var j=0; j<path.blinks.length; j++) {
        var blink = path.blinks[j];
        var dist = Math.abs(path_t_rel - blink) / 0.03;
        if (dist < 1) {
          alpha *= dist;
          if (i == 0) {
            console.log(dist);
          }
        }
      }
      alpha *= 2;
      if (alpha > 1) {
        alpha = 1;
      }
      ctx.save();
      ctx.translate(cur_pt[0], cur_pt[1]);
      ctx.scale(path.radius, path.radius);
      ctx.globalAlpha = alpha;
      var color;
      if (len(vec(this.mouse_pos, cur_pt)) < path.radius) {
        color = [255, 100, 100];
        ctx.globalCompositeOperation = 'normal';
      } else {
        color = [255, 255, 255];
      ctx.globalCompositeOperation = 'overlay';
      }
      gradient(ctx, color, path.sharp);
      ctx.restore();
    }
  }

  this.next_frame = function() {
    this.draw((+new Date()) / 1000 - this.animation_started);
    requestAnimationFrame(this.next_frame.bind(this));
  }

  this.animate = function() {
    this.animation_started = (+new Date()) / 1000;
    this.next_frame();
  }

};
