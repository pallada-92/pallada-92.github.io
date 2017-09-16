function Kaleidoscope(params) {

  var pxratio = window.devicePixelRatio || 1;

  var block, logo, loading_text;
  var canvas, ctx;
  var mounted = false;
  this.mount = function() {
    if (mounted) return;
    block = document.getElementById(params.id);
    logo = document.createElement('img');
    logo.src = params.logo_img.src;
    logo.className = 'logo';
    logo.ondragstart = function() { return false; };
    logo.style.position = 'absolute';
    block.appendChild(logo);
    loading_text = document.createElement('div');
    loading_text.style.color = 'gray';
    loading_text.style.textAlign = 'center';
    loading_text.style.position = 'absolute';
    loading_text.style.left = '0px';
    loading_text.style.font = '20px Helvetica';
    loading_text.innerHTML = 'Загрузка' +
      '<span class="dot1">.</span>' +
      '<span class="dot2">.</span>' +
      '<span class="dot3">.</span>';
    block.appendChild(loading_text);
    if (params.fallback) {
      // var fallback_img = document.createElement('img');
      // block.appendChild(fallback_img);
      // fallback_img.src = params.fallback_img;
      // fallback_img.width = params.width;
      // fallback_img.height = params.height;
    } else {
      canvas = document.createElement('canvas');
      block.appendChild(canvas);
      ctx = canvas.getContext('2d');
    }
    this.update();
  }

  this.load_resource = function(resource) {
    var i = params.resources.indexOf(resource);
    if (i == -1) {
      throw 'Invalid resource';
    }
    params.resources.splice(i, 1);
    if (params.resources.length != 0) return;
    params.loading = false;
    this.update();
  }

  function doublecos(t, c) {
    var u = t < 0.5 ? 2 * t : 2 * (t - 0.5);
    var a = (1 - Math.cos(u * Math.PI)) / 2;
    if (t < 0.5) {
      return (a * c + t) / 2;
    } else {
      return (c + a * (1 - c) + t) / 2;
    }
  }
  
  function draw_loader() {
    if (!params.loading) return;
    var t = Math.pow(Math.sin((+new Date()) / 1000 * 2), 2);
    var a = 0.5 + t * 0.5;
    a = a.toFixed(2);
    loading_text.style.color = 'rgba(200, 200, 200, ' + a + ')';
    for (var i=1; i<=3; i++) {
      var dot = loading_text.getElementsByClassName('dot' + i)[0];
      var t = (((+new Date()) / 1000) % 1) * 3 + 1;
      dot.style.visibility = t > i ? 'visible' : 'hidden';
    }
    if (params.fallback) return;
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.lineWidth = 2;
    ctx.beginPath();
    var t = (+new Date()) / 1000;
    var t1 = t % 1;
    var t2 = t % 2;
    var t6 = (t % 6) / 3;
    ctx.strokeStyle = 'rgb(150, 150, 200)';
    ctx.arc(
      0, 0, 30,
      (doublecos(t1, 0.1) - 0.25) * 2 * Math.PI,
      (doublecos(t1, 0.9) - 0.25) * 2 * Math.PI, false
    );
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(
      0, 0, 25,
      -t2 * Math.PI, -t2 * Math.PI - 1, true
    );
    ctx.strokeStyle = 'rgb(200, 150, 150)';
    ctx.stroke();
    ctx.save();
    ctx.beginPath();
    ctx.arc(
      0, 0, 12.9,
      t6 * Math.PI, (t6 + 1.99) * Math.PI, false
    );
    var tt = Math.pow(Math.sin(t * 2), 2) 
    ctx.lineWidth = 14 * tt;
    ctx.setLineDash([2, 8]);
    ctx.strokeStyle = 'rgba(150, 200, 150, 1)';
    ctx.stroke();
    ctx.restore();
    ctx.restore();
  }

  var angle = 0, shift_x = 0, shift_y = 0;
  this.draw = function() {
    draw_loader();
    if (params.loading || params.fallback) return;
    var pattern = ctx.createPattern(params.bg_img, 'repeat');
    ctx.fillStyle = pattern;
    ctx.save();
    ctx.translate(width / 2, height / 2);
    var m = Math.max(width, height);
    for (var i=0; i<3; i++) {
      for (var j=0; j<2; j++) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, m);
        ctx.lineTo(m * Math.sqrt(3), m);
        ctx.closePath();
        ctx.clip();
        ctx.save();
        ctx.translate(m/2, m/2);
        ctx.rotate(angle);
        ctx.translate(-m/2, -m/2);
        ctx.translate(-shift_x, -shift_y);
        ctx.fillRect(shift_x, shift_y, 2*m, 2*m);
        ctx.restore();
        ctx.restore();
        ctx.scale(-1, 1);
      }
      ctx.rotate(2 * Math.PI / 3);
    }
    ctx.restore();
  }

  this.update = function() {
    logo.style.display = params.loading ? 'none' : 'block';
    loading_text.style.display = params.loading ? 'block' : 'none';
    if (params.loading) {
      loading_text.style.top = Math.round(params.height/2 + 50) + 'px';
      loading_text.style.width = Math.round(params.width) + 'px';
    } else {
      logo.width = params.logo_img.width / 2;
      logo.height = params.logo_img.height / 2;
      logo.style.top = Math.round(
        (params.height - logo.height) / 2) + 'px';
      logo.style.left = Math.round(
        (params.width - logo.width) / 2) + 'px';
    }
    if (params.fallback) {
      if (!block) return;
      block.style.width = Math.round(params.width) + 'px';
      block.style.height = Math.round(params.height) + 'px';
      block.style.backgroundImage = params.loading ? 'none'
        : "url(" + params.fallback_img.src + ")";
      block.style.backgroundPosition = "50% 50%";
    } else {
      canvas.style.width = Math.round(params.width) + 'px';
      canvas.style.height = Math.round(params.height) + 'px';
      width = Math.round(params.width * pxratio);
      height = Math.round(params.height * pxratio);
      canvas.width = width;
      canvas.height = height;
    }
  }

  var shift_dx = 0, shift_dy = 0;
  var last_mouse_pos;
  function onmousemove(x, y) {
    var dx, dy;
    if (last_mouse_pos) {
      dx = x - last_mouse_pos[0];
      dy = y - last_mouse_pos[1];
    } else {
      dx = 0;
      dy = 0;
    }
    var c = 1;
    angle = Math.atan2(x, y) / 2 - Math.PI;
    shift_dx += dx * c;
    shift_dy += dy * c;
    last_mouse_pos = [x, y];
  }
  window.addEventListener('mousemove', function(e) {
    onmousemove(e.clientX * pxratio, e.clientY * pxratio);
  });
  
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

  function len(vec) {
    var res = 0;
    for (var i=0; i<vec.length; i++) {
      res += vec[i] * vec[i];
    }
    return Math.sqrt(res);
  }

  function mul(vec, k) {
    var res = [];
    for (var i=0; i<vec.length; i++) {
      res.push(vec[i] * k);
    }
    return res;
  }

  var prev_frame;
  var this1 = this;
  var opt_shift_len = 1;
  function animate() {
    var tdelta = Math.min((+new Date()) - prev_frame, 500);
    prev_frame = +new Date();
    if (!animating) return;
    var s = [shift_dx, shift_dy]
    if (len(s) < 0.001) {
      s = [opt_shift_len, 0];
    }
    var nd = mul(s, Math.pow(opt_shift_len / len(s), tdelta / 50 * 0.5));
    shift_dx = nd[0];
    shift_dy = nd[1];
    shift_x += shift_dx * tdelta / 50;
    shift_y += shift_dy * tdelta / 50;
    this1.draw();
    requestAnimationFrame(animate);
  }
  
  var animating = false;
  this.start = function() {
    if (animating) return;
    animating = true;
    prev_frame = +new Date();
    animate();
  }
  this.stop = function() {
    animating = false;
  }
}
