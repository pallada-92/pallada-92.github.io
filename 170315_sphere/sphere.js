function Sphere(id, size) {

  var canvas = document.getElementById(id);
  canvas.width = size;
  canvas.height = size;
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
      var t = tri[j] + '-' + tri[(j + 1) % 3];
      if (!pair_map[t]) {
        var v1 = vertices[tri[j]];
        var v2 = vertices[tri[(j + 1) % 3]];
        pair_map[t] = vertices.push(
          normalize(middle(v1, v2))
        ) - 1;
      }
      pairs[j] = pair_map[t];
    }
    // console.log(pairs);
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
      (vector[1] * 0.9 + 1) * size / 2,
      (vector[2] * 0.9 + 1) * size / 2,
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
    return Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1] + vec[2] * vec[2]);
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

  var img = new Image();
  img.src = 'firefox.png';

  function draw_poly(vect, dir, selected, text) {
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
    if (selected && mousedown) {
      ctx.fillStyle = 'rgb(162, 185, 215)';
    } else {
      ctx.fillStyle = 'rgb(255, 251, 255)';
    }
    if (dropShadow) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
      ctx.shadowOffsetX = -5;
      ctx.shadowOffsetY = 5;
      ctx.shadowBlur = 4;
    }
    ctx.fill();
    if (dropShadow) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.05)';
      ctx.shadowOffsetX = -3;
      ctx.shadowOffsetY = 3;
    }
    ctx.save();
    ctx.lineWidth = 1.5;
    if (selected) {
      ctx.strokeStyle = 'rgb(162, 185, 215)';
    } else {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    }
    ctx.stroke();
    ctx.restore();
    if (text) {
      var vp = proj(vect);
      var c = 0.13 * size / img.width;
      ctx.setTransform(-c * v2[1], -c * v2[2], c * v1[1], c * v1[2], vp[0], vp[1]);
      ctx.drawImage(img, -img.width/2, -img.height/2);
    }
    ctx.restore();
    return cur_poly;
  }

  var mousedown = false;
  var mousedown_pos = [0, 0];
  var polygons = [];
  var rot_x = 0.7 / Math.PI;
  var rot_y = 0.45 / Math.PI;
  var selected_poly = -1;
  this.draw = function() {
    var trans_vert = [];
    for (var i=0; i<vertices.length; i++) {
      var vert = vertices[i];
      vert = rotate(vert, 2, rot_x * Math.PI);
      vert = rotate(vert, 1, rot_y * Math.PI);
      trans_vert.push(vert);
    }
    dir = [trans_vert[0], trans_vert[1]];
    var vert_order = sortIndices(trans_vert);
    var trans_tri_mid = [];
    for (var i=0; i<triangles.length; i++) {
      var tri = triangles[i];
      var v0 = trans_vert[tri[0]];
      var v1 = trans_vert[tri[1]];
      var v2 = trans_vert[tri[2]];
      trans_tri_mid.push(v0[0] + v1[0] + v2[0]);
    }
    var tri_order = sortIndices(trans_tri_mid);
    ctx.fillStyle = 'rgb(221, 221, 221)';
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = 'rgb(255, 255, 255)';
    ctx.lineWidth = 2.5;
    var line_pad = 0.3;
    for (var i=0; i<vertices.length; i++) {
      var tv = trans_vert[i];
      if (tv[0] <= 0) {
        draw_poly(tv, dir, false);
      }
    }
    // ctx.lineCap = 'round';
    // ctx.lineJoin = 'round';
    for (var i=0; i<triangles.length; i++) {
      var tri = triangles[tri_order[i]];
      var v0 = proj(trans_vert[tri[0]]);
      var v1 = proj(trans_vert[tri[1]]);
      var v2 = proj(trans_vert[tri[2]]);
      ctx.fillStyle = 'rgba(229, 229, 229, 0.8)';
      for (var stroke=0; stroke<=1; stroke++) {
        if (!stroke) {
          ctx.beginPath();
        }
        for (var j=0; j<3; j++) {
          var v1 = proj(trans_vert[tri[j]]);
          var v2 = proj(trans_vert[tri[(j + 1) % 3]]);
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
      var tv = trans_vert[i];
      if (tv[0] > 0) {
        polygons[i] = draw_poly(tv, dir, i == selected_poly, i + 1);
      } else {
        polygons[i] = [];
      }
    }
  }

  function mouse_coords(e) {
    // http://stackoverflow.com/questions/1114465/getting-mouse-location-in-canvas
    var mouseX, mouseY;
    if(e.offsetX) {
      return [e.offsetX, e.offsetY];
    } else if(e.layerX) {
      return [e.layerX, e.layerY];
    }
  }

  function clamp(x, min, max) {
    if (x > max) return max;
    if (x < min) return min;
    return x;
  }

  var mouseoversphere = false;
  this.onmousemove = function(e) {
    var rect = canvas.getBoundingClientRect();
    var pos = [e.clientX - rect.left, e.clientY - rect.top];
    selected_poly = -1;
    canvas.style.cursor = 'default';
    mouseoversphere = len([pos[0] - size/2, pos[1] - size/2, 0]) <= size / 2;
    console.log(mouseoversphere);
    for (var i=0; i<polygons.length; i++) {
      var cur_poly = polygons[i];
      if (inside(pos, cur_poly)) {
        selected_poly = i;
        canvas.style.cursor = 'pointer';
      }
    }
    if (mousedown) {
      var dx = pos[0] - mousedown_pos[0];
      var dy = pos[1] - mousedown_pos[1];
      var c = 0.005 / Math.PI;
      rot_x = mousedown_rot[0] - dx * c;
      rot_y = mousedown_rot[1] + dy * c;
      rot_y = clamp(rot_y, -1/2, 1/2);
    }
  }

  canvas.onmousedown = function(e) {
    mousedown = true;
    mousedown_pos = mouse_coords(e);
    mousedown_rot = [rot_x, rot_y];
  }

  canvas.onmouseout = function() {
    
  }

  canvas.onmouseup = function() {
    mousedown = false;
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

  this.play = true;
  var this1 = this;
  var autorotate_dir = 1;
  var prev_frame = +new Date();
  
  function animate() {
    var tdelta = (+new Date()) - prev_frame;
    prev_frame = +new Date;
    requestAnimationFrame(animate);
    if (this1.play) {
      // if (!mouseoversphere && !mousedown) {
      if (selected_poly == -1 && !mousedown) {
        var c = 0.01 * tdelta / 100;
        rot_x += c;
        var rot_y_thresh = 0.4;
        if (Math.abs(rot_y) > rot_y_thresh) {
          autorotate_dir = -Math.sign(rot_y);
          rot_y += c * autorotate_dir * (Math.abs(rot_y) - rot_y_thresh + 0.1) * 5;
        } else {
          rot_y += c * autorotate_dir * Math.sqrt(1.01 - Math.pow(rot_y / rot_y_thresh, 2));
        }
        // console.log(autorotate_dir);
      }
      this1.draw();
    }
  }

  this.onmouseup = function() {
    mousedown = false;
  }

  animate();

}


var s;
window.onload = function() {
  s = new Sphere('sphere', window.innerHeight - 50);
  window.onmouseup = s.onmouseup;
  window.onmousemove = s.onmousemove;
}
