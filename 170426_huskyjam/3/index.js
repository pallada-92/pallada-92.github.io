function CherryFall(params) {
  var canvas = params.canvas;
  canvas.width = params.width;
  canvas.height = params.height;
  var ctx = canvas.getContext('2d');

  function rgb(r, g, b) {
    return 'rgb(' + Math.floor(r) + ',' +
      Math.floor(g) + ',' + Math.floor(b) + ')';
  }

  function gray(val) {
    val *= 255;
    return rgb(val, val, val);
  }

  function generate_canters_naive(radius) {
    ctx.fillStyle = 'gray';
    for (i=0; i<1800; i++) {
      var x = Math.floor(Math.random() * canvas.width);
      var y = Math.floor(Math.random() * canvas.height);
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fill();
    }
  }

  // generate_canters_naive(params.radius);

  function generate_centers(radius) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var centers = [];
    var prime = 2011;
    var finished = [];
    var circ_no = 0;
    ctx.fillStyle = rgb(0, 45, 0);
    for (var iter1=0; iter1<100; iter1++) {
      var changed = false;
      for (var px=0; px<2; px++) {
        for (var py=0; py<2; py++) {
          var imdata = ctx.getImageData(
            0, 0, canvas.width, canvas.height);
          for (var sx=radius*2*px; sx<canvas.width; sx+=radius*4) {
            for (var sy=radius*2*py; sy<canvas.height; sy+=radius*4) {
              var key = sx + ':' + sy;
              if (key in finished) continue;
              changed = true;
              var l_area = radius * radius * 4;
              var ilcoord = Math.floor(Math.random() * l_area);
              var found = false;
              for (var iter2=0; iter2<l_area; iter2++) {
                var lcoord = (ilcoord + iter2 * prime) % l_area;
                var x = sx + lcoord % (radius * 2);
                var y = sy + Math.floor(lcoord / (radius * 2));
                var coord = y * canvas.width + x;
                if (coord >= canvas.width * canvas.height) continue;
                if (imdata.data[coord * 4 + 3] == 255) continue;
                circ_no++;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, 2 * Math.PI);
                // ctx.fillStyle = gray(circ_no/1000);
                ctx.fill();
                centers.push([x, y]);
                found = true;
                break;
              }
              if (!found) {
                finished[key] = iter1;
              }
            }
          }
        }
      }
      if (!changed) {
        break;
      }
    }
    // console.log(finished, iter1, circ_no);
    return centers;
  }

  var t1 = +new Date();
  var centers = generate_centers(params.radius);
  var t2 = +new Date();
  // console.log(t2 - t1);

  function add_timing(centers) {
    for (var i=0; i<centers.length; i++) {
      centers[i].push(i);
    }
    centers.sort(function(c1, c2){return - c1[1] + c2[1]});
    for (var i=0; i<centers.length; i++) {
      centers[i].push(i / centers.length);
    }
    centers.sort(function(c1, c2){return c1[2] - c2[2]});
  }

  add_timing(centers);

  function load_image(fname) {
    var img = new Image();
    img.src = fname;
    return img;
  }
  
  function load_images() {
    var images = [];
    for (var i=0; i<5; i++) {
      images[i] = load_image('i/cherry' + (i + 1) + '.png');
    }
    return images;
  }

  var images = load_images();
  var bg = load_image('i/bg.jpg');
  var effect = load_image('i/effect1.png');
  
  function draw(cur_time) {
    // ctx.fillStyle = rgb(0, 45, 0);
    // ctx.fillRect(0, 0, canvas.width, canvas.height);
    // console.log(cur_time);
    ctx.drawImage(
      bg,
      0, 0, bg.width, bg.height,
      0, 0, canvas.width, canvas.height
    );
    for (var i=0; i<centers.length; i++) {
      var c = centers[i];
      var x = c[0];
      var t = c[3];
      if (cur_time < t) continue;
      var y = params.drop_height + params.a * Math.pow(cur_time - t, 2);
      y = Math.min(c[1], y);
      if (y + params.radius < 0) continue;
      var img = images[i % images.length];
      ctx.drawImage(img, x - img.width / 2, y - img.height / 2);
      // ctx.beginPath();
      // ctx.arc(x, y, params.radius, 0, 2 * Math.PI);
      // ctx.fillStyle = gray(t);
      // ctx.fill();
    }
    // ctx.save();
    // ctx.globalCompositeOperation = 'destination-over';
    ctx.drawImage(
      effect,
      0, 0, effect.width, effect.height,
      0, 0, canvas.width, canvas.height
    );
    // ctx.restore();
  }

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

  var cur_t;
  function animate() {
    cur_t = +new Date() / 1000 - t_start;
    var local_t = cur_t / 10;
    if (local_t <= 10) {
      draw(local_t);
    }
    requestAnimationFrame(animate);
  }

  var t_start = +new Date() / 1000;
  animate();
}
