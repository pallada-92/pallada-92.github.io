window.onerror = function (errorMsg, url, lineNumber) {
  alert('Error: ' + errorMsg + ' Script: ' + url + ' Line: ' + lineNumber);
}

var svg_circles = [];

function make_svg_circles(count) {
  var svg = document.getElementById('particles');
  for (var i=0; i<count; i++) {
    var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', 0);
    circle.setAttribute('cy', 0);
    circle.setAttribute('r', 0);
    circle.setAttribute('opacity', 0);
    svg.appendChild(circle);
    window.svg_circles.push(circle);
  }
}

var chars = {
  H: '' +
    '#   #\n' +
    '#   #\n' +
    '#   #\n' +
    '#####\n' +
    '#   #\n' +
    '#   #\n' +
    '#   #\n',
  Y: '' +
    '#   #\n' +
    '#   #\n' +
    '#   #\n' +
    ' # # \n' +
    '  #  \n' +
    '  #  \n' +
    '  #  \n',
  P: '' +
    '#### \n' +
    '#   #\n' +
    '#   #\n' +
    '#   #\n' +
    '#### \n' +
    '#    \n' +
    '#    \n',
  E: '' +
    '#####\n' +
    '#    \n' +
    '#    \n' +
    '#### \n' +
    '#    \n' +
    '#    \n' +
    '#####\n',
  R: '' +
    '#### \n' +
    '#   #\n' +
    '#   #\n' +
    '#### \n' +
    '#  # \n' +
    '#   #\n' +
    '#   #\n',
  L: '' +
    '#    \n' +
    '#    \n' +
    '#    \n' +
    '#    \n' +
    '#    \n' +
    '#    \n' +
    '#####\n',
  O: '' +
    ' ### \n' +
    '#   #\n' +
    '#   #\n' +
    '#   #\n' +
    '#   #\n' +
    '#   #\n' +
    ' ### \n',
  T: '' +
    '#####\n' +
    '  #  \n' +
    '  #  \n' +
    '  #  \n' +
    '  #  \n' +
    '  #  \n' +
    '  #  \n',
  A: '' +
    ' ### \n' +
    '#   #\n' +
    '#   #\n' +
    '#   #\n' +
    '#####\n' +
    '#   #\n' +
    '#   #\n',
  C: '' +
    ' ### \n' +
    '#   #\n' +
    '#    \n' +
    '#    \n' +
    '#    \n' +
    '#   #\n' +
    ' ### \n',
  I: '' +
    '#####\n' +
    '  #  \n' +
    '  #  \n' +
    '  #  \n' +
    '  #  \n' +
    '  #  \n' +
    '#####\n',
  S: '' +
    ' ####\n' +
    '#    \n' +
    '#    \n' +
    ' ### \n' +
    '    #\n' +
    '    #\n' +
    '#### \n',
  N: '' +
    '#   #\n' +
    '##  #\n' +
    '# # #\n' +
    '# # #\n' +
    '#  ##\n' +
    '#   #\n' +
    '#   #\n',
  '.': '' +
    ' \n' +
    ' \n' +
    ' \n' +
    ' \n' +
    ' \n' +
    ' \n' +
    '#\n',
  ' ': '' +
    '     \n' +
    '     \n' +
    '     \n' +
    '     \n' +
    '     \n' +
    '     \n' +
    '     \n',
}

function char_geom(ch) {
  var points = [],
      ascii = chars[ch],
      cur_x = 0, cur_y = 0, max_x = 0;
  for (var i=0; i<ascii.length; i++) {
    var ch = ascii[i];
    if (ch == '#') {
      points.push([cur_x, cur_y]);
      cur_x += 1;
    } else if (ch == ' ') {
      cur_x += 1;
    } else if (ch == '\n') {
      cur_x = 0;
      cur_y += 1;
    }
    max_x = Math.max(max_x, cur_x);
  }
  return {
    w: max_x,
    h: cur_y,
    points: points,
  }
}

var white = [255, 255, 255],
    aqua = [0, 252, 254];

var race_is_on_1 = [[
  ['T', white, 1],
  ['H', white, 1],
  ['E', white, 1],
  [' ', white, 1],
  ['R', white, 1],
  ['A', white, 1],
  ['C', white, 1],
  ['E', white, 1],
  [' ', white, 1],
  ['I', white, 1],
  ['S', white, 1],
  [' ', white, 1],
  ['O', white, 1],
  ['N', white, 1],
  ['.', white, 1],
  ['.', white, 1],
  ['.', white, 1],
]];

var race_is_on_2 = [[
  ['T', white, 1],
  ['H', white, 1],
  ['E', white, 1],
], [
  ['R', white, 1],
  ['A', white, 1],
  ['C', white, 1],
  ['E', white, 1],
], [
  ['I', white, 1],
  ['S', white, 1],
], [
  [' ', white, 1],
  ['O', white, 1],
  ['N', white, 1],
  ['.', white, 1],
  ['.', white, 1],
  ['.', white, 1],
]];

var hyperloop1 = [[
  ['H', white, 1],
  ['Y', white, 1],
  ['P', white, 1],
  ['E', white, 1],
  ['R', white, 1],
  ['L', white, 1],
  ['O', white, 1],
  ['O', white, 1],
  ['P', white, 1],
]];

var bigger_rad = 1.2;
var hyperloop2 = [[
  ['H', white, 1],
  ['Y', white, 1],
  ['P', white, 1],
  ['E', white, 1],
  ['R', aqua, bigger_rad],
  ['L', aqua, bigger_rad],
  ['O', aqua, bigger_rad],
  ['O', aqua, bigger_rad],
  ['P', aqua, bigger_rad],
]];

function move_circles(circles, dx, dy) {
  for (var i=0; i<circles.length; i++) {
    circles[i][0] += dx;
    circles[i][1] += dy;
  }
}

function lines_geom(lines, line_spacing) {
  var circles = [],
      res_w = 0, res_h = 0;
  for (var line_no=0; line_no<lines.length; line_no++) {
    if (res_h > 0) {
      res_h += line_spacing;
    }
    var line = lines[line_no],
        line_w = 0, line_h = 0, line_circles = [];
    for (var letter_no=0; letter_no<line.length; letter_no++) {
      if (line_w > 0) {
        line_w += 1;
      }
      var letter = line[letter_no],
          ch = letter[0],
          color = letter[1],
          size = letter[2] * 0.3,
          opacity = 1; 
      var geom = char_geom(ch);
      for (var pt_no=0; pt_no<geom.points.length; pt_no++) {
        var pt = geom.points[pt_no],
            circle = [line_w + pt[0], res_h + pt[1], color, size, opacity];
        line_circles.push(circle);
        circles.push(circle);
      }
      line_w += geom.w;
      line_h = Math.max(line_h, geom.h);
    }
    res_w = Math.max(res_w, line_w);
    res_h += line_h;
    move_circles(line_circles, -line_w / 2, 0);
  }
  return {
    w: res_w, h: res_h,
    circles: circles,
  }
}

function place_circles(lines_geom, top_percent, width_percent, height_percent) {
  var container = document.getElementById('container'),
      cont_width = container.offsetWidth,
      cont_height = container.offsetHeight,
      top = cont_height * top_percent,
      max_width = cont_width * width_percent,
      max_height = cont_height * height_percent,
      scale = 1;
  if (lines_geom.w / lines_geom.h > max_width / max_height) {
    scale = max_width / lines_geom.w;
  } else {
    scale = max_height / lines_geom.h;
  }
  var circles = lines_geom.circles;
  for (var i=0; i<circles.length; i++) {
    var circle = circles[i];
    circle[0] *= scale;
    circle[0] += cont_width / 2;
    circle[1] *= scale;
    circle[1] += top;
    circle[3] *= scale;
  }
  return {
    cx: cont_width / 2,
    cy: top + lines_geom.h * scale / 2,
  }
}

function rgb(c) {
  return 'rgb(' + Math.floor(c[0]) +
    ', ' + Math.floor(c[1]) +
    ', ' + Math.floor(c[2]) + ')';
}

function show_circles(circles) {
  for (var i=0; i<svg_circles.length; i++) {
    var svg_circle = svg_circles[i];
    if (i >= circles.length) {
      svg_circle.setAttribute('opacity', 0);
      continue;
    }
    var circle = circles[i];
    svg_circle.setAttribute('cx', circle[0]);
    svg_circle.setAttribute('cy', circle[1]);
    svg_circle.setAttribute('fill', rgb(circle[2]));
    svg_circle.setAttribute('r', circle[3]);
    svg_circle.setAttribute('opacity', circle[4]);
  }
}

function random_permutation(len) {
  var temp = [];
  for (var i=0; i<len; i++) {
    temp.push([Math.random(), i]);
  }
  temp.sort(function(a, b) {return a[0] - b[0]});
  var res = []
  for (var i=0; i<len; i++) {
    res.push(temp[i][1]);
  }
  return res;
}

function permute(list, permutation) {
  if (list.length != permutation.length) {
    throw '';
  }
  var res = [];
  for (var i=0; i<permutation.length; i++) {
    res.push(list[permutation[i]]);
  }
  return res;
}

function random(seed) {
  return +('0.'+Math.sin(seed).toString().substr(6));
}

function permutation4lines(lines) {
  return random_permutation(lines_geom(lines).circles.length);
}

var hyperloop_perm = permutation4lines(hyperloop1),
    race_is_on_1_perm = permutation4lines(race_is_on_1),
    race_is_on_2_perm = permutation4lines(race_is_on_2);

function clamp(min, max, t) {
  if (t < min) return min;
  if (t > max) return max;
  return t;
}

var clamp01 = clamp.bind(null, 0, 1);

function set_blocks_opacity(blocks) {
  for (var block_id in blocks) {
    var block = document.getElementById(block_id);
    block.style.opacity = clamp01(blocks[block_id]);
  }
}

function blend(a, b, t) {
  t = clamp01(t);
  return a * (1 - t) + b * t;
}

function draw_change_color(t) {
  var geom1 = lines_geom(hyperloop1, 1),
      geom2 = lines_geom(hyperloop2, 1);
  geom1.circles = permute(
    geom1.circles,
    hyperloop_perm
  );
  geom2.circles = permute(
    geom2.circles,
    hyperloop_perm
  );
  set_blocks_opacity({
    'pre-block': 1,
    'post-block1': t * 2,
    'post-block2': t * 2 - 0.3,
    'post-block3': t * 2 - 0.6,
    'post-block4': t * 2 - 1,
  });
  place_circles(geom1, 0.401, 0.9, 0.15);
  place_circles(geom2, 0.401, 0.9, 0.15);
  var circles = [];
  for (var i=0; i<geom1.circles.length; i++) {
    var diff = t * geom1.circles.length - i;
    if (diff > 0) {
      var circle2 = geom2.circles[i],
          circle1 = geom1.circles[i];
      circle2[3] = blend(circle1[3], circle2[3], diff);
      circles.push(circle2);
    } else {
      circles.push(geom1.circles[i]);
    }
  }
  show_circles(circles);
}

function wiggle(seed, monotonic, t) {
  return 0;
  if (random(seed + 0.342) > 0.5 || monotonic) {
    return t;
  } else {
    return t;
  }
}

function circle_3d(params) {
  return [
    (params.x - params.camera.cx) / params.z + params.camera.cx,
    (params.y - params.camera.cy) / params.z + params.camera.cy,
    params.color,
    params.r / params.z,
    params.opacity,
  ];
}

function draw_race_intro(t) {
  t = cos_easing(clamp01(t * 1.5));
  set_blocks_opacity({
    'particles': 1, //clamp01(0.3 + t * 10),
    'pre-block': 0,
    'post-block1': 0,
    'post-block2': 0,
    'post-block3': 0,
    'post-block4': 0,
  });
  var geom1 = lines_geom(race_is_on_1, 1);
  geom1.circles = permute(
    geom1.circles,
    race_is_on_1_perm
  );
  var geom2 = lines_geom(race_is_on_1, 1);
  geom2.circles = permute(
    geom2.circles,
    race_is_on_2_perm
  );
  var camera1 = place_circles(geom1, 0.401, 0.9, 0.15);
  var camera2 = place_circles(geom2, 0.401, 0.9, 0.15);
  draw_transition(geom1, geom2, camera1, camera2, blend(0.25, 1, t));
}

function random_elem(seed, list) {
  return list[Math.round(random(seed) * (list.length - 1))];
}

function cos_easing(t) {
  return (1 - Math.cos(t * Math.PI)) / 2;
}

function draw_race_transition(t) {
  t = cos_easing(t);
  set_blocks_opacity({
    'pre-block': 2 * t - 1,
    'post-block1': 0,
    'post-block2': 0,
    'post-block3': 0,
    'post-block4': 0,
  });
  var geom1 = lines_geom(race_is_on_1, 1),
      geom2 = lines_geom(hyperloop1, 1);
  geom1.circles = permute(
    geom1.circles,
    race_is_on_1_perm
  );
  geom2.circles = permute(
    geom2.circles,
    hyperloop_perm
  );
  var camera1 = place_circles(geom1, 0.401, 0.9, 0.15),
      camera2 = place_circles(geom2, 0.401, 0.9, 0.15);
  draw_transition(geom1, geom2, camera1, camera2, t);
}

function draw_transition(geom1, geom2, camera1, camera2, t) {
  var camera = {
    cx: blend(camera1.cx, camera2.cx, t),
    cy: blend(camera1.cy, camera2.cy, t),
  }
  var circles = [];
  for (var i=0; i<Math.max(geom1.circles.length, geom2.circles.length); i++) {
    var source = geom1.circles[i],
        dest = geom2.circles[i];
    if (!dest) {
      dest = random_elem(i + 0.13, geom2.circles).slice();
      dest[4] = 0;
    }
    circles.push(circle_3d({
      x: blend(
        source[0] + wiggle(i + 0.1, false, t) * geom1.w,
        dest[0] + wiggle(i + 0.2, false, 1 - t) * geom2.w,
        t
      ),
      y: blend(
        source[1] + wiggle(i + 0.3, false, t) * geom1.h,
        dest[1] + wiggle(i + 0.4, false, 1 - t) * geom2.h,
        t
      ),
      z: 1 - t * Math.pow(1 - t, 3) * random(i + 0.17) * 9 + 0 * blend(
        wiggle(i + 0.5, true, 0.1 + 0.9 * t),
        wiggle(i + 0.6, true, 0.1 + 0.9 * t),
        t
      ),
      r: blend(source[3], dest[3], t),
      color: dest[2],
      camera: camera,
      opacity: blend(source[4], dest[4], t),
    }));
  }
  show_circles(circles);
}

function update() {
  var max_scroll = Math.max(
    document.body.scrollHeight,
    document.body.offsetHeight,
    document.documentElement.clientHeight,
    document.documentElement.scrollHeight,
    document.documentElement.offsetHeight
  ) - window.innerHeight;
  var scroll = window.pageYOffset / max_scroll;
  if (0 <= scroll && scroll <= 1 / 3) {
    draw_race_intro(scroll * 3)
  } else if (1 / 3 <= scroll && scroll <= 2 / 3) {
    draw_race_transition(scroll * 3 - 1)
  } else if (2 / 3 <= scroll && scroll <= 1) {
    draw_change_color(scroll * 3 - 2);
  }
}

function onload() {
  make_svg_circles(200);
  update();
  window.addEventListener('resize', update)
  window.addEventListener('scroll', update);
}

window.addEventListener('load', onload)

