(function() {
  var lastTime = 0;
  var vendors = ['ms', 'moz', 'webkit', 'o'];
  for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
    window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
    window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] 
      || window[vendors[x]+'CancelRequestAnimationFrame'];
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

function Straus(params) {
  this.points = [[1353,275],[1335,268],[1324,282],[1311,261],[1307,269],[1316,269],[1303,306],[1307,337],[1315,311],[1329,395],[1340,385],[1353,426],[1304,419],[1326,466],[1268,486],[1246,529],[1198,428],[1026,453],[1229,360],[1153,352],[1103,354],[1120,408],[1074,397],[1026,387],[1111,379],[996,428],[965,418],[954,360],[1199,459],[1159,444],[1172,494],[1055,538],[1125,462],[1131,508],[1118,606],[1134,563],[1144,715],[1099,732],[1096,683],[1132,661],[1117,670],[1072,532],[1261,668],[1279,668],[1251,559],[1284,650],[1296,542],[1266,649],[1158,499],[2095,188],[2077,181],[2066,194],[2064,158],[2040,151],[2037,158],[1998,190],[2010,154],[2002,154],[1915,164],[1929,114],[1911,134],[1907,211],[1880,136],[1872,162],[1861,221],[1872,211],[1840,164],[1954,235],[1981,194],[1932,188],[2144,301],[2068,243],[1994,236],[2057,294],[1908,228],[1952,304],[1883,283],[1870,241],[1834,275],[1784,333],[1840,222],[1734,230],[2052,356],[2110,336],[2089,288],[2016,371],[2042,338],[2003,322],[2004,390],[1959,315],[1909,318],[1854,358],[1932,376],[1837,304],[1767,424],[1815,368],[1938,400],[1922,478],[1992,403],[2025,384],[1960,458],[2064,365],[2078,414],[1899,487],[1889,457],[1804,466],[1751,565],[1800,508],[1751,499],[1720,622],[1720,556],[1692,596],[1728,671],[1758,682],[1788,640],[1926,618],[1908,618],[1936,510],[1861,658],[1876,650],[1808,541],[1890,646],[1830,516],[1813,523],[1970,565],[2192,641],[2144,540],[1973,734],[1991,735],[1963,626],[1879,772],[1916,666],[1891,676],[1850,811],[1840,658],[1824,701],[1771,807],[1804,738],[1768,758],[1696,748],[1757,717],[1686,690],[2680,733],[2713,708],[2622,702],[2743,712],[2768,685],[2689,686],[2709,690],[2752,642],[2673,623],[2565,695],[2712,512],[2630, 610],[2607,603],[2588,562],[2655,466],[2810,634],[2768,602],[2796,528],[2800,515],[2717,496],[2806,438],[2808,407],[2731,446],[2664,473],[2624,490],[2683,376],[2702,373],[2710,395],[2781,355],[2775,332],[2758,318],[2712,292],[2724,274],[2772,290],[2827,312],[2799,323],[2798,314],[2802,302],[2788,315],[2686,310],[2690,327],[2602, 554],[1512,521],[1262,510],[1246,429],[1115,634],[2051,184],[2031,183],[2019,221]];
  this.triangles = {
    1: [[27, 23, 26], [141, 140, 139], [154, 150, 144]],
    2: [[23, 26, 25], [114, 112, 113], [152, 153, 150]],
    3: [[23, 25, 17], [110, 111, 109], [152, 183, 151]],
    4: [[23, 22, 17], [108, 107, 106], [156, 152, 155]],
    5: [[24, 23, 21], [104, 105, 103], [164, 165, 152]],
    6: [[22, 16, 17], [95, 96, 94], [167, 164, 166]],
    7: [[20, 21, 16], [93, 91, 92], [168, 167, 164]],
    8: [[19, 20, 16], [89, 90, 88], [170, 169, 164]],
    9: [[16, 17, 15], [126, 124, 125], [159, 158, 157]],
    10: [[29, 28, 30], [87, 86, 85], [170, 163, 164]],
    11: [[29, 30, 31], [101, 102, 100], [163, 162, 161]],
    12: [[29, 32, 31], [99, 98, 97], [163, 164, 161]],
    13: [[41, 31, 39], [122, 123, 121], [161, 150, 149]],
    14: [[31, 39, 40], [120, 119, 118], [150, 149, 144]],
    15: [[39, 38, 37], [137, 138, 136], [144, 143, 142]],
    16: [[35, 34, 36], [134, 135, 133], [147, 146, 145]],
    17: [[48, 33, 34], [131, 132, 130], [149, 148, 144]],
    18: [[19, 12, 16], [74, 73, 75], [170, 168, 169]],
    19: [[19, 18, 12], [72, 71, 70], [172, 171, 168]],
    20: [[12, 16, 15], [80, 81, 79], [181, 168, 167]],
    21: [[12, 13, 14], [84, 83, 82], [171, 170, 168]],
    22: [[12, 11, 13], [69, 68, 67], [173, 172, 168]],
    23: [[10, 12, 11], [77, 78, 76], [173, 182, 168]],
    24: [[7, 10, 9], [66, 65, 64], [174, 181, 182]],
    25: [[8, 7, 10], [62, 63, 61], [175, 173, 172]],
    26: [[2, 6, 7], [59, 60, 58], [174, 175, 173]],
    27: [[1, 5, 6], [189, 188, 190], [176,172, 171]],
    28: [[5, 4, 6], [57, 56, 55], [175, 176, 172]],
    29: [[3, 1, 4], [53, 54, 52], [179, 178, 180]],
    30: [[1, 0, 2], [50, 49, 51], [178, 180, 177]],
    31: [[46, 45, 47], [117, 115, 116], [161, 160, 149]],
    32: [[44, 42, 43], [129, 127, 128], [162, 161, 160]],
  };
  this.colors = {"1":[[248,241,232],[248,241,232],[26,26,26]],"2":[[188,174,146],[188,174,146],[44,44,44]],"3":[[12,13,8],[12,13,8],[65,65,68]],"4":[[25,25,25],[25,25,25],[71,72,73]],"5":[[25,25,25],[25,25,25],[52,52,57]],"6":[[34,38,39],[34,38,39],[72,72,75]],"7":[[185,187,176],[185,187,176],[62,60,64]],"8":[[248,241,232],[248,241,232],[216,216,221]],"9":[[20,20,20],[20,20,20],[0,0,0]],"10":[[248,241,232],[248,241,232],[242,242,242]],"11":[[193,189,180],[193,189,180],[62,60,64]],"12":[[167,167,158],[167,167,158],[20,20,20]],"13":[[145,142,135],[145,142,135],[167,166,161]],"14":[[114,114,114],[114,114,114],[132,129,125]],"15":[[222,191,171],[222,191,171],[30,29,33]],"16":[[135,132,125],[135,132,125],[30,29,33]],"17":[[114,114,114],[114,114,114],[117,110,96]],"18":[[34,38,39],[34,38,39],[204,206,205]],"19":[[54,56,55],[54,56,55],[37,37,45]],"20":[[30,30,30],[30,30,30],[171,171,181]],"21":[[12,13,8],[12,13,8],[20,20,20]],"22":[[6,6,6],[6,6,6],[50,50,60]],"23":[[23,20,13],[23,20,13],[28,28,30]],"24":[[185,187,176],[185,187,176],[204,206,205]],"25":[[248,241,232],[248,241,232],[181,128,167]],"26":[[190,190,190],[190,190,190],[250,249,250]],"27":[[170,170,170],[170,170,170],[0,0,0]],"28":[[203,189,176],[203,189,176],[60,54,62]],"29":[[201,198,199],[201,198,199],[114,102,114]],"30":[[216,79,82],[216,79,82],[78,67,75]],"31":[[15,124,88],[15,124,88],[191,194,193]],"32":[[20,169,119],[20,169,119],[204,206,205]]};
  this.centers = [[1199, 465], [1922, 465], [2717, 465]];
  this.params = params;
  var canvas = params.canvas;
  var ctx = canvas.getContext('2d');
  var w = params.width;
  var h = params.height;
  canvas.width = w;
  canvas.height = h;

  this.get_triangle = function(id, state) {
    var center = this.centers[state];
    var tr = this.triangles[id][state];
    return [
      vec(center, this.points[tr[0]]),
      vec(center, this.points[tr[1]]),
      vec(center, this.points[tr[2]]),
    ];
  }

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

  function clamp(t, min, max) {
    if (t > max) return max;
    if (t < min) return min;
    return t;
  }

  function cos_easing(t) {
    return (1 - Math.cos(t * Math.PI)) / 2;
  }
  
  function lin(x0, y0, x1, y1, x) {
    var t = (x - x0) / (x1 - x0);
    return y0 + t * (y1 - y0);
  }

  function blend_colors(c1, c2, t) {
    return rgb([
      blend(c1[0], c2[0], t),
      blend(c1[1], c2[1], t),
      blend(c1[2], c2[2], t),
    ]);
  }

  function vec(pt1, pt2) {
    return [pt2[0] - pt1[0], pt2[1] - pt1[1]];
  }

  function add_mul(vec1, vec2, lambda) {
    return [
      vec1[0] + vec2[0] * lambda,
      vec1[1] + vec2[1] * lambda,
    ];
  }

  function unit_vec(angle) {
    return [Math.cos(angle), Math.sin(angle)];
  }

  function len(vec) {
    return Math.sqrt(
      vec[0] * vec[0] + vec[1] * vec[1]
    );
  }
  
  function dist(pt1, pt2) {
    return len(vec(pt1, pt2));
  }

  function ang(a) {
    a = a % (2 * Math.PI);
    if (a < 0) {
      return a + 2 * Math.PI;
    } else {
      return a;
    }
  }

  function angle(vec1, vec2) {
    var scalar = vec1[0] * vec2[0] + vec1[1] * vec2[1];
    return Math.acos(scalar / len(vec1) / len(vec2));
  }

  function get_angles(vertices) {
    var v0 = vertices[0], v1 = vertices[1], v2 = vertices[2];
    return [
      angle(vec(v1, v0), vec(v2, v0)),
      angle(vec(v0, v1), vec(v2, v1)),
      angle(vec(v0, v2), vec(v1, v2)),
    ];
  }

  function slope(v) {
    return Math.atan2(v[1], v[0]);
  }
  
  function tri2polar(vertices, mode) {
    var v0 = vertices[0], v1 = vertices[1], v2 = vertices[2];
    var angles = get_angles(vertices);
    var a0 = angles[0], a1 = angles[1], a2 = angles[2];
    var center = [
      (v0[0] + v1[0] + v2[0]) / 3,
      (v0[1] + v1[1] + v2[1]) / 3,
    ];
    var s0 = slope(vec(center, v0)),
        s1 = slope(vec(center, v1)),
        s2 = slope(vec(center, v2));
    if (mode == 0) {
      if (Math.abs(s0) <= Math.min(Math.abs(s1), Math.abs(s2))){
        return vert2polar(v1, v0, v2);
      } else if (Math.abs(s1) <= Math.min(Math.abs(s0), Math.abs(s2))){
        return vert2polar(v0, v1, v2);
      } else if (Math.abs(s2) <= Math.min(Math.abs(s0), Math.abs(s1))){
        return vert2polar(v0, v2, v1);
      }
    } else if (mode == 1) {
      if (a0 >= Math.max(a1, a2)) {
        return vert2polar(v1, v0, v2);
      } else if (a1 >= Math.max(a0, a2)) {
        return vert2polar(v0, v1, v2);
      } else if (a2 >= Math.max(a0, a1)) {
        return vert2polar(v0, v2, v1);
      } 
    }
  }

  function vert2polar(pt1, pt_c, pt2) {
    var vec1 = vec(pt_c, pt1);
    var vec2 = vec(pt_c, pt2);
    var a1 = ang(Math.atan2(vec1[1], vec1[0]));
    var a2 = ang(Math.atan2(vec2[1], vec2[0]));
    // console.log(vec1, vec2, a1, a2);
    if (a2 - a1 > Math.PI || a1 - a2 > 0 && Math.PI > a1 - a2) {
      // console.log('exchange');
      return [pt_c, a2, len(vec2), a1, len(vec1)];
    } else {
      return [pt_c, a1, len(vec1), a2, len(vec2)];
    }
  }

  function blend(v1, v2, t) {
    return v1 + (v2 - v1) * t;
  }

  function angle_dist(a1, a2, dir) {
    a1 = ang(a1);
    a2 = ang(a2);
    if (dir == 1) {
      if (a1 < a2) {
        return a2 - a1;
      } else {
        return 2 * Math.PI - (a1 - a2);
      }
    } else if (dir == -1) {
      if (a1 < a2) {
        return 2 * Math.PI - (a2 - a1);
      } else {
        return a1 - a2;
      }
    } else {
      throw 'angle_dist dir == 0';
    }
  }

  function angle_dir(a1, a2) {
    return angle_dist(a1, a2, 1) <= Math.PI ? 1: -1;
  }

  function blend_angle(a1, a2, dir, t) {
    a1 = ang(a1);
    a2 = ang(a2);
    if (dir == 1) {
      if (a1 < a2) {
        return blend(a1, a2, t);
      } else {
        return ang(blend(a1, a2 + 2 * Math.PI, t));
      }
    } else if (dir == -1) {
      if (a1 < a2) {
        return ang(blend(a1, a2 - 2 * Math.PI, t));
      } else {
        return blend(a1, a2, t);
      }
    } else if (dir == 0) {
      // console.log(a1, a2, t);
      // console.log(angle_dir(a1, a2));
      // console.log(blend_angle(a1, a2, angle_dir(a1, a2), t));
      return blend_angle(a1, a2, angle_dir(a1, a2), t);
    }
  }

  function blend_pt(pt1, pt2, t) {
    return [
      blend(pt1[0], pt2[0], t),
      blend(pt1[1], pt2[1], t),
    ];
  }

  function mid_angle(a1, a2) {
    return blend_angle(a1, a2, 0, 0.5);
  }

  function blend_polar(polar1, polar2, t) {
    var mid1 = mid_angle(polar1[1], polar1[3]);
    var mid2 = mid_angle(polar2[1], polar2[3]);
    var cur_mid = blend_angle(mid1, mid2, 0, t);
    // console.log(mid1, mid2, cur_mid);
    var delta = blend_angle(
      angle_dist(mid1, polar1[1], 1),
      angle_dist(mid2, polar2[1], 1),
      0, t
    );
    return [
      blend_pt(polar1[0], polar2[0], t),
      ang(cur_mid + delta),
      blend(polar1[2], polar2[2], t),
      ang(cur_mid - delta),
      blend(polar1[4], polar2[4], t),
    ];
  }

  this.polar_tests = function() {
    var pt1 = [2, 2], pt2 = [1, 1], pt3 = [2, 1];
    // console.log(angle([1, 1], [0, 1]), Math.PI / 4);
    // console.log(angle([1, 1], [1, 0]), Math.PI / 4);
    // console.log(tri2polar([pt1, pt2, pt3])[0], pt3);
    // console.log(tri2polar([pt2, pt3, pt1])[0], pt3);
    // console.log(tri2polar([pt3, pt1, pt2])[0], pt3);
    // console.log(vert2polar(pt2, pt3, pt1));
    // console.log(vert2polar(pt1, pt3, pt2));
    // console.log(mid_angle(-1, 1));
    // console.log(mid_angle(0, 1));
    // console.log(mid_angle(-2, 0));
    // console.log(angle_dist(4.17, 4.18, 1));
    // console.log(angle_dist(4.17, 4.18, -1));
    // console.log(angle_dir(5, 1));
    // console.log(angle_dist(5, 1, 1));
    // console.log(blend_angle(5, 1, 0, 0));
    // console.log(blend_angle(5, 1, 0, 0.1));
    // console.log(blend_angle(5, 1, 0, 0.2));
    // console.log(blend_angle(5, 1, 0, 0.3));
    // console.log(blend_angle(1, 3, 1, 0.5));
    // console.log(blend_angle(3, 1, 1, 0.5));
    // console.log(blend_angle(1, 3, -1, 0.5));
    // console.log(blend_angle(3, 1, -1, 0.5));
    // console.log(blend_angle(-1, 1, 1, 0.5));
    // console.log(blend_angle(-1, 1, -1, 0.5));
    // console.log(angle_dist(-1, 1, 1));
    // console.log(angle_dist(-1, 1, -1));
    // console.log(angle_dist(1, -1, 1));
    // console.log(angle_dist(1, , -1));
  }

  this.polar_tests();

  function draw_polar(ctx, p, color) {
    var pt_c = p[0];
    var pt1 = add_mul(pt_c, unit_vec(p[1]), p[2]);
    var pt2 = add_mul(pt_c, unit_vec(p[3]), p[4]);
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pt1[0], pt1[1]);
    ctx.lineTo(pt_c[0], pt_c[1]);
    ctx.lineTo(pt2[0], pt2[1]);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
  }

  function gradient(color1, color2, rad, max_rad) {
    var gradient = ctx.createRadialGradient(
      w / 2, h / 2, 0,
      w / 2, h / 2, max_rad,
    );
    gradient.addColorStop(0, color1);
    gradient.addColorStop(Math.min(1, rad / max_rad), color2);
    gradient.addColorStop(1, color2);
    return gradient;
  }

  function draw_shadow(ctx, pt, rad, color, alpha, scale_y) {
    // console.log(ctx, pt, rad, color, alpha, scale_y);
    ctx.save();
    ctx.translate(pt[0], pt[1]);
    ctx.scale(1, scale_y);
    ctx.translate(-pt[0], -pt[1]);
    var gradient = ctx.createRadialGradient(
      pt[0], pt[1], 0,
      pt[0], pt[1], rad,
    );
    gradient.addColorStop(0, rgba(color, alpha));
    gradient.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = gradient;
    ctx.fillRect(pt[0] - rad, pt[1] - rad, 2 * rad, 2 * rad);
    ctx.restore();
  }
  
  this.draw = function(t) {
    var state;
    // t = cos_easing(t);
    var t_orig = t;
    if (t > 0.5) {
      state = 1;
      t = (t - 0.5) * 2;
    } else {
      state = 0;
      t = t * 2;
    }
    t = cos_easing(t);
    var bg_color = blend_colors(
      [222, 137, 172],
      [60, 202, 209],
      t_orig
    );
    if (params.on_bg_change) {
      params.on_bg_change(bg_color);
    }
    ctx.fillStyle = gradient(
      blend_colors(
        [233, 190, 198],
        [183, 208, 209],
        t_orig,
      ),
      bg_color,
      Math.min(w / 2, h / 2) * params.scale,
      len([w / 2, h / 2])
    );
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2, h / 2);
    var s = Math.min(w, h) / 700 * params.scale;
    ctx.scale(s, s);
    ctx.save();
    if (t_orig < 0.5) {
      ctx.globalAlpha = 1 - t;
      draw_shadow(
        ctx, vec(this.centers[0], this.points[37]),
        70, [0, 0, 0], 0.4, 0.2,
      );
      draw_shadow(
        ctx, vec(this.centers[0], this.points[36]),
        70, [0, 0, 0], 0.4, 0.2,
      );
    } else {
      ctx.globalAlpha = t;
      var pt;
      pt = vec(this.centers[2], this.points[151]);
      pt[1] += 30;
      draw_shadow(ctx, pt, 70, [0, 0, 0], 0.4, 0.2);
      pt = vec(this.centers[2], this.points[144]);
      pt[1] -= 10;
      draw_shadow(ctx, pt, 100, [0, 0, 0], 0.25, 0.2);
      pt = vec(this.centers[2], this.points[146]);
      pt[1] += 10;
      draw_shadow(ctx, pt, 70, [0, 0, 0], 0.25, 0.2);
    }
    ctx.restore();
    for (var i in this.triangles) {
      // if (i != 18) continue;
      var color1 = this.colors[i][state];
      var color2 = this.colors[i][state + 1];
      var color = blend_colors(color1, color2, t);
      var tri1 = this.get_triangle(i, state);
      var tri2 = this.get_triangle(i, state + 1);
      var angles1 = get_angles(tri1);
      var angles2 = get_angles(tri2);
      var mode = 0;
      if (
        Math.max.apply(null, angles1) >= Math.PI * 0.5 &&
          Math.max.apply(null, angles2) >= Math.PI * 0.5
      ) {
        mode = 1;
      }
      var polar1 = tri2polar(tri1, mode);
      var polar2 = tri2polar(tri2, mode);
      // if (t == 0) console.log(polar1, polar2);
      // if (t == 1) console.log(polar1, polar2);
      var polar = blend_polar(polar1, polar2, t);
      draw_polar(ctx, polar, color);
    }
    ctx.restore();
  }

  var running = false;

  this.start_animation = function() {
    if (running) return;
    this.anim_started = (+new Date()) / 1000;
    running = true;
    this.next_frame();
  }

  this.on_anim_end = function() {
    running = false;
    if (params.on_anim_end) {
      params.on_anim_end();
    }
  }

  this.next_frame = function() {
    var t = ((+new Date()) / 1000 - this.anim_started) / params.duration;
    if (params.dir == -1) {
      t = 1 - t;
    }
    if (t > 1) {
      this.draw(1);
      this.on_anim_end();
    } else if (t < 0) {
      this.draw(0);
      this.on_anim_end();
    } else {
      this.draw(t);
      requestAnimationFrame(this.next_frame.bind(this));
    }
  }

}

alert(Straus);
