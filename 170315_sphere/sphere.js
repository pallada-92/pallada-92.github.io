function Sphere(id, size, items) {

  var canvas = document.getElementById(id);
  canvas.style.width = size + 'px';
  canvas.style.height = size + 'px';
  var pxratio = window.devicePixelRatio;
  canvas.width = size * pxratio;
  canvas.height = size * pxratio;
  var ctx = canvas.getContext('2d');

  // 0 - north pole, 1..5 - top, 6..10 - bottom, 11 - south pole
  var vertices = [];
  vertices.push([0, 0, 1]);
  var icoedge = 4 / Math.sqrt(2 * (5 + Math.sqrt(5)));
  var poly5edge = Math.sqrt((5 - Math.sqrt(5)) / 2);
  for (var i=0; i<5; i++) {
    var angle = 2 * Math.PI * i / 5;
    var r = icoedge / poly5edge;
    var z = 1 - icoedge * icoedge / 2;
    vertices.push([r * Math.cos(angle), r * Math.sin(angle), z]);
  }
  for (var i=0; i<5; i++) {
    var angle = 2 * Math.PI * (i + 0.5) / 5;
    var r = icoedge / poly5edge;
    var z = - 1 + icoedge * icoedge / 2;
    vertices.push([r * Math.cos(angle), r * Math.sin(angle), z]);
  }
  vertices.push([0, 0, -1]);

  var triangles = [
    // north
    [0, 1, 2],
    [0, 2, 3],
    [0, 3, 4],
    [0, 4, 5],
    [0, 5, 1],
    // middle - up
    [1, 2, 6],
    [2, 3, 7],
    [3, 4, 8],
    [4, 5, 9],
    [5, 1, 10],
    // middle - bottom
    [1, 6, 10],
    [2, 7, 6],
    [3, 8, 7],
    [4, 9, 8],
    [5, 9, 10],
    // south
    [6, 7, 11],
    [7, 8, 11],
    [8, 9, 11],
    [9, 10, 11],
    [10, 6, 11],
  ];

  function middle(v1, v2) {
    return add(mul(v1, 1/2), mul(v2, 1/2));
  }
  
  var pair_map = {};
  var base_triangles = triangles;
  var triangles = [];
  for (var i=0; i<base_triangles.length; i++) {
    var tri = base_triangles[i];
    var pairs = []
    for (var j=0; j<3; j++) {
      var t;
      if (tri[j] > tri[(j + 1) % 3]) {
        t = tri[j] + '-' + tri[(j + 1) % 3];
      } else {
        t = tri[(j + 1) % 3] + '-' + tri[j];
      }
      if (!pair_map[t]) {
        var v1 = vertices[tri[j]];
        var v2 = vertices[tri[(j + 1) % 3]];
        pair_map[t] = vertices.push(
          normalize(middle(v1, v2))
        ) - 1;
      }
      pairs[j] = pair_map[t];
    }
    triangles.push([tri[0], pairs[0], pairs[2]]);
    triangles.push([tri[1], pairs[1], pairs[0]]);
    triangles.push([tri[2], pairs[2], pairs[1]]);
    triangles.push([pairs[0], pairs[1], pairs[2]]);
  }
  
  function rotate(vect, axis, angle) {
    var c1 = (axis + 1) % 3;
    var c2 = (axis + 2) % 3;
    var res = [0, 0, 0];
    res[axis] = vect[axis];
    var sin = Math.sin(angle);
    var cos = Math.cos(angle);
    res[c1] = cos * vect[c1] + sin * vect[c2];
    res[c2] = -sin * vect[c1] + cos * vect[c2];
    return res;
  }

  function inside(point, vs) {
    // http://stackoverflow.com/questions/22521982/js-check-if-point-inside-a-polygon
    var x = point[0], y = point[1];
    var inside = false;
    for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
      var xi = vs[i][0], yi = vs[i][1];
      var xj = vs[j][0], yj = vs[j][1];
      var intersect = ((yi > y) != (yj > y))
          && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

  function sortIndices(toSort) {
    var temp = []
    for (var i = 0; i < toSort.length; i++) {
      temp[i] = [toSort[i], i];
    }
    temp.sort(function(left, right) {
      return left[0] < right[0] ? -1 : 1;
    });
    res = [];
    for (var j = 0; j < temp.length; j++) {
      res.push(temp[j][1]);
    }
    return res;
  }

  function proj(vector) {
    return [
      (vector[1] * 1 + 1) * size / 2,
      (vector[2] * 1 + 1) * size / 2,
    ];
  }
  
  function dot(vec1, vec2) {
    return vec1[0] * vec2[0] + vec1[1] * vec2[1] + vec1[2] * vec2[2];
  }

  function add(vec1, vec2) {
    return [vec1[0] + vec2[0], vec1[1] + vec2[1], vec1[2] + vec2[2]];
  }

  function mul(vec, a) {
    return [vec[0] * a, vec[1] * a, vec[2] * a];
  }

  function len(vec) {
    return Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1] + (vec[2] * vec[2] || 0));
  }

  function outer(u, v) {
    return [
      u[1] * v[2] - u[2] * v[1],
      u[2] * v[0] - u[0] * v[2],
      u[0] * v[1] - u[1] * v[0],
    ];
  }

  function normalize(vec) {
    return mul(vec, 1 / len(vec));
  }

  function ort(vec, dir) {
    if (len(outer(vec, dir[0])) < 0.001) {
      dir = dir[1];
    } else {
      dir = dir[0];
    }
    var t = dot(vec, dir);
    var res1 = dir;
    var v1 = mul(vec, -Math.sign(t));
    var t1 = dot(vec, dir);
    if (Math.abs(t) > 0.001) {
      var beta = - dot(v1, v1) / dot(v1, dir);
      res1 = add(v1, mul(dir, beta));
    }
    var res2 = outer(vec, res1);
    return [
      normalize(vec),
      normalize(res1),
      normalize(res2),
    ];
  }

  for (var i=0; i<vertices.length; i++) {
    items[i].img = new Image();
    items[i].img.src = items[i].icon;
  }

  function draw_poly(vect, dir, img) {
    ctx.save();
    var circ_pts = 33;
    var circ_size = 0.17;
    var circ_lower = 0.05;
    vect = mul(vect, 1 - circ_lower);
    var t = ort(vect, dir);
    var v1 = t[1];
    var v2 = t[2];
    var cur_poly = [];
    for (var j=0; j<circ_pts; j++) {
      var a = 2 * Math.PI * j / circ_pts;
      var pt = proj(add(vect, add(
        mul(v1, circ_size * Math.cos(a)),
        mul(v2, circ_size * Math.sin(a))
      )));
      cur_poly.push(pt);
    }
    ctx.beginPath();
    ctx.moveTo(cur_poly[0][0], cur_poly[0][1]);
    for (var j=1; j<cur_poly.length; j++) {
      ctx.lineTo(cur_poly[j][0], cur_poly[j][1]);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    if (img) {
      ctx.save();
      var vp = proj(vect);
      var c = 0.13 * size / img.width;
      ctx.setTransform(-c * v2[1], -c * v2[2], c * v1[1], c * v1[2], vp[0], vp[1]);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();
    }
    return cur_poly;
  }

  function rotate_vertices(rot_x, rot_y) {
    var trans_vert = [];
    for (var i=0; i<vertices.length; i++) {
      var vert = vertices[i];
      vert = rotate(vert, 2, rot_x * Math.PI);
      vert = rotate(vert, 1, rot_y * Math.PI);
      trans_vert.push(vert);
    }
    vertices = trans_vert;
  }
  rotate_vertices(0.7 / Math.PI, 0.45 / Math.PI);

  var polygons = [];
  var selected_poly = -1;
  function draw() {
    dir = [[0, 0, 1], [0, 1, 0]];
    var trans_tri_mid = [];
    for (var i=0; i<triangles.length; i++) {
      var tri = triangles[i];
      var v0 = vertices[tri[0]];
      var v1 = vertices[tri[1]];
      var v2 = vertices[tri[2]];
      trans_tri_mid.push(v0[0] + v1[0] + v2[0]);
    }
    var tri_order = sortIndices(trans_tri_mid);
    ctx.clearRect(0, 0, size, size);
    var line_pad1 = 0.28;
    var line_pad2 = 0.32;
    ctx.lineWidth = 1.5;
    for (var i=0; i<vertices.length; i++) {
      var tv = vertices[i];
      if (tv[0] <= 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.strokeStyle = 'rgba(0,0,0,0)';
        draw_poly(tv, dir, null, 'white', 'white');
      }
    }
    ctx.lineWidth = 2;
    for (var i=0; i<triangles.length; i++) {
      var tri = triangles[tri_order[i]];
      var v0 = proj(vertices[tri[0]]);
      var v1 = proj(vertices[tri[1]]);
      var v2 = proj(vertices[tri[2]]);
      if (trans_tri_mid[tri_order[i]] > 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.strokeStyle = 'white';
      } else {
        ctx.fillStyle = 'rgba(229, 229, 229, 0)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      }
      for (var stroke=0; stroke<=1; stroke++) {
        if (!stroke) {
          ctx.beginPath();
        }
        for (var j=0; j<3; j++) {
          var v1 = proj(vertices[tri[j]]);
          var v2 = proj(vertices[tri[(j + 1) % 3]]);
          var line_pad = tri[j] > 11 && tri[(j + 1) % 3] > 11 ?
              line_pad1 : line_pad2;
          var d = mul(add(v2, mul(v1, -1)), line_pad);
          var v1n = add(v1, d);
          var v2n = add(v2, mul(d, -1));
          if (stroke) {
            ctx.beginPath();
            ctx.moveTo(v1n[0], v1n[1]);
            ctx.lineTo(v2n[0], v2n[1]);
            ctx.stroke();
          } else {
            ctx.lineTo(v1n[0], v1n[1]);
            ctx.lineTo(v2n[0], v2n[1]);
          }
        }
        if (!stroke) {
          ctx.closePath();
          ctx.fill();
        }
      }
    }
    polygons = [];
    for (var i=0; i<vertices.length; i++) {
      var tv = vertices[i];
      if (tv[0] > 0) {
        if (selected_poly == i && rotating) {
          ctx.fillStyle = 'rgb(162, 185, 215)';
        } else {
          ctx.fillStyle = 'white';
        }
        if (selected_poly == i) {
          ctx.strokeStyle = 'rgb(162, 185, 215)';
        } else {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        }
        polygons[i] = draw_poly(tv, dir, items[i].img, 'white', 'white');
      } else {
        polygons[i] = [];
      }
    }
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

  function clamp(v, min, max) {
    if (v < min) return min;
    if (v > max) return max;
    return v;
  }
  
  var in_sphere = false;
  var mousedist = 0;
  var rotating = false;
  var mousedown_pos = [0, 0];
  var last_mouse_pos = [0, 0];
  var rel_pos = [0, 0]
  var mouseclick_radius = 50;
  var mousedelta = [0, 0];

  function update_pos(x, y) {
    mousedist = len([
      mousedown_pos[0] - x,
      mousedown_pos[1] - y,
    ]);
    mousedelta = [
      x - last_mouse_pos[0],
      y - last_mouse_pos[1],
    ];
    last_mouse_pos = [x, y];
    var rect = canvas.getBoundingClientRect();
    rel_pos = [x - rect.left, y - rect.top];
    in_sphere = len(
      [rel_pos[0] - size/2, rel_pos[1] - size/2]
    ) <= size / 2;
    selected_poly = -1;
    for (var i=0; i<polygons.length; i++) {
      var cur_poly = polygons[i];
      if (inside(rel_pos, cur_poly)) {
        console.log('selected item = ' + i);
        selected = false;
        if (rotating) {
          if (mousedist < mouseclick_radius) {
            selected = true;
          }
        } else {
          selected = true;
        }
        if (selected) {
          selected_poly = i;
        }
      }
    }
  }

  function onmouseup() {
    if (rotating && selected_poly != -1) {
      var item = items[selected_poly];
      item.action.call(item);
    }
    rotating = false;
  }
  window.addEventListener('mouseup', onmouseup);
  window.addEventListener('touchend', onmouseup);

  function onmousedown(x, y) {
    update_pos(x, y);
    if (in_sphere) {
      mousedown_pos = [x, y];
      last_mouse_pos = [x, y];
      rotating = true;
    }
  }
  canvas.onmousedown = function(e) {
    onmousedown(e.clientX, e.clientY);
  }
  canvas.ontouchstart = function(e) {
    onmousedown(e.touches[0].clientX, e.touches[0].clientY);
    e.preventDefault();
    return false;
  }

  var delta_opt_len = 0.004;
  var last_delta = [
    delta_opt_len / Math.sqrt(2),
    delta_opt_len / Math.sqrt(2)
  ];
  function onmousemove(x, y) {
    update_pos(x, y);
    if (rotating) {
      var c = 1/size/2;
      last_delta = [-c * mousedelta[0], c * mousedelta[1]];
      rotate_vertices(last_delta[0], last_delta[1]);
    }
    if (selected_poly != -1) {
      canvas.style.cursor = 'pointer';
    } else {
      canvas.style.cursor = 'default';
    }
  }
  window.addEventListener('mousemove', function(e) {
    onmousemove(e.clientX, e.clientY);
  });
  window.addEventListener('touchmove', function(e) {
    onmousemove(e.touches[0].clientX, e.touches[0].clientY);
    e.preventDefault();
    return false;
  });
  

  this.play = true;
  var this1 = this;
  var prev_frame = +new Date();

  function animate() {
    if (this1.play) {
      if (!document.hidden) {
        if (selected_poly == -1 && !rotating) {
          var tdelta = (+new Date()) - prev_frame;
          prev_frame = +new Date();
          var a = 0.01;
          last_delta[0] = last_delta[0] * Math.cos(a) - last_delta[1] * Math.sin(a);
          last_delta[1] = last_delta[0] * Math.sin(a) + last_delta[1] * Math.cos(a);
          last_delta = mul(last_delta, Math.pow(delta_opt_len / len(last_delta), 0.05 * tdelta / 50));
          rotate_vertices(last_delta[0], last_delta[1]);
        }
        draw();
      }
    }
    requestAnimationFrame(animate);
  }

  animate();

}


