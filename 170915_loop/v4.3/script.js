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

window.onerror = function (errorMsg, url, lineNumber) {
  alert('Error: ' + errorMsg + ' Script: ' + url + ' Line: ' + lineNumber);
};

function id(id) {
  return document.getElementById(id);
}

function make_svg_circles(count) {
  var svg = id('particles');
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

function char_geom(char) {
  var points = [],
      ascii = window.chars[char],
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
  };
}

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
      line_w += 1;
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
  };
}

function place_circles(lines_geom, pos) {
  var scale = 1;
  if (lines_geom.w / lines_geom.h > pos.width / pos.height) {
    scale = pos.width / lines_geom.w;
  } else {
    scale = pos.height / lines_geom.h;
  }
  var circles = lines_geom.circles;
  for (var i=0; i<circles.length; i++) {
    var circle = circles[i];
    circle[0] *= scale;
    circle[0] += 50;
    circle[1] *= scale;
    circle[1] += pos.top;
    circle[3] *= scale;
  }
  return {
    cx: 50,
    cy: pos.top + lines_geom.h * scale / 2,
  };
}

function rgb(c) {
  return 'rgb(' + Math.floor(c[0]) +
    ', ' + Math.floor(c[1]) +
    ', ' + Math.floor(c[2]) + ')';
}

function show_circles(circles) {
  for (var i=0; i<window.svg_circles.length; i++) {
    var svg_circle = window.svg_circles[i];
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
  temp.sort(function(a, b) {return a[0] - b[0];});
  var res = [];
  for (i=0; i<len; i++) {
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

function clamp(min, max, t) {
  if (t < min) return min;
  if (t > max) return max;
  return t;
}

var clamp01 = clamp.bind(null, 0, 1);

function set_blocks_opacity(blocks) {
  for (var block_id in blocks) {
    var block = id(block_id);
    if (blocks[block_id] == 0) {
      block.style.display = 'none';
    } else {
      block.style.display = 'block';
      block.style.opacity = clamp01(blocks[block_id]);
    }
  }
}

function blend(a, b, t) {
  t = clamp01(t);
  return a * (1 - t) + b * t;
}

function draw_change_color(t) {
  t = cos_easing(t);
  var geom1 = lines_geom(window.hyperloop1, 1),
      geom2 = lines_geom(window.hyperloop2, 1);
  geom1.circles = permute(
    geom1.circles,
    window.hyperloop_perm
  );
  geom2.circles = permute(
    geom2.circles,
    window.hyperloop_perm
  );
  set_blocks_opacity({
    'logo': 1,
    'logo-click-area': 1,
    'pre-block': 1,
    'post-block1': t * 2,
    'post-block2': t * 2 - 0.3,
    'post-block3': t * 2 - 0.6,
    'post-block4': t * 2 - 1,
  });
  place_circles(geom1, window.hyperloop_pos);
  place_circles(geom2, window.hyperloop_pos);
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

function circle_3d(params) {
  return [
    (params.x - params.camera.cx) / params.z + params.camera.cx,
    (params.y - params.camera.cy) / params.z + params.camera.cy,
    params.color,
    params.r / params.z,
    params.opacity,
  ];
}

function lin(x0, y0, x1, y1, x) {
  return y0 + (x - x0) / (x1 - x0) * (y1 - y0);
}

function lin_circles(t0, circles1, t1, circles2, t) {
  var res = [];
  for (var i=0; i<circles1.length; i++) {
    var c1 = circles1[i],
        c2 = circles2[i];
    res.push({
      x: lin(t0, c1.x, t1, c2.x, t),
      y: lin(t0, c1.y, t1, c2.y, t),
      z: lin(t0, c1.z, t1, c2.z, t),
      r: c1.r,
      color: c1.color,
      camera: c1.camera,
      opacity: c1.opacity,
    });
  }
  return res;
}

function blend_circles(circles1, circles2, t) {
  var res = [];
  for (var i=0; i<circles1.length; i++) {
    var c1 = circles1[i],
        c2 = circles2[i];
    res.push({
      x: blend(c1.x, c2.x, t),
      y: blend(c1.y, c2.y, t),
      z: blend(c1.z, c2.z, t),
      r: blend(c1.r, c2.r, t),
      color: c1.color,
      camera: c1.camera,
      opacity: blend(c1.opacity, c2.opacity, t),
    });
  }
  // console.log(res);
  return res;
}


function map(fun, list) {
  var res = [];
  for (var i=0; i<list.length; i++) {
    res.push(fun(list[i]));
  }
  return res;
}

function transition_circles(geom1, geom2, camera1, camera2, t) {
  var camera = {
    cx: blend(camera1.cx, camera2.cx, t),
    cy: blend(camera1.cy, camera2.cy, t),
  };
  var circles = [];
  for (var i=0; i<Math.max(geom1.circles.length, geom2.circles.length); i++) {
    var source = geom1.circles[i],
        dest = geom2.circles[i];
    if (!dest) {
      dest = random_elem(i + 0.13, geom2.circles).slice();
      dest[4] = 0;
    }
    circles.push({
      x: blend(
        source[0],
        dest[0],
        t
      ),
      y: blend(
        source[1],
        dest[1],
        t
      ),
      z: 1 - t * Math.pow(1 - t, 3) * random(i + 0.17) * 9,
      r: blend(source[3], dest[3], t),
      color: dest[2],
      camera: camera,
      opacity: blend(source[4], dest[4], t),
    });
  }
  return circles;
}

function draw_race_intro(t) {
  t = cos_easing(clamp01(t));
  var lin_intro_time = 0.3;
  set_blocks_opacity({
    'logo': 1,
    'logo-click-area': 1,
    'particles': clamp01(t / lin_intro_time * 2),
    'pre-block': 0,
    'post-block1': 0,
    'post-block2': 0,
    'post-block3': 0,
    'post-block4': 0,
  });
  var geom1 = lines_geom(window.race_is_on, window.race_line_spacing);
  geom1.circles = permute(
    geom1.circles,
    window.race_is_on_perm_1
  );
  for (var i=0; i<geom1.circles.length; i++) {
    geom1.circles[i][4] = random(i + 0.99);
  }
  var geom2 = lines_geom(window.race_is_on, window.race_line_spacing);
  geom2.circles = permute(
    geom2.circles,
    window.race_is_on_perm_2
  );
  var camera1 = place_circles(geom1, window.race_is_on_pos),
      camera2 = place_circles(geom2, window.race_is_on_pos),
      circles3, tt;
  if (t < lin_intro_time) {
    tt = t / lin_intro_time;
    var circles1 = transition_circles(geom1, geom2, camera1, camera2, 0.26),
        circles2 = transition_circles(geom1, geom2, camera1, camera2, 0.25),
        dt = (1 - lin_intro_time) / 75 / lin_intro_time / 2;
    circles3 = lin_circles(1, circles1, 1 - dt, circles2, tt);
  } else {
    tt = (t - lin_intro_time) / (1 - lin_intro_time);
    circles3 = transition_circles(geom1, geom2, camera1, camera2, blend(0.25, 1, tt));
  }
  var circles4 = [],
      r = 2 * (1 - t),
      t_speed = 0.5;
  for (i=0; i<circles3.length; i++) {
    var cam = circles3[i].camera;
    circles4.push({
      x: cam.cx * (1 + r * Math.cos((i / circles3.length + t * t_speed) * 2 * Math.PI)),
      y: cam.cy * (1 + r * Math.sin((i / circles3.length + t * t_speed) * 2 * Math.PI)),
      z: blend(random(i + 0.243), random(i + 0.123), t),
      opacity: blend(0, 1, t),
      camera: cam,
      color: circles3[i].color,
      r: random(i + 0.283),
    });
  }
  var circles = blend_circles(circles4, circles3, t);
  show_circles(map(circle_3d, circles));
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
    'logo': 1,
    'logo-click-area': 1,
    'pre-block': 2 * t - 1,
    'post-block1': 0,
    'post-block2': 0,
    'post-block3': 0,
    'post-block4': 0,
  });
  var geom1 = lines_geom(window.race_is_on, window.race_line_spacing),
      geom2 = lines_geom(window.hyperloop1, 1);
  geom1.circles = permute(
    geom1.circles,
    window.race_is_on_perm_2
  );
  geom2.circles = permute(
    geom2.circles,
    window.hyperloop_perm
  );
  var camera1 = place_circles(geom1, window.race_is_on_pos),
      camera2 = place_circles(geom2, window.hyperloop_pos),
  circles = transition_circles(geom1, geom2, camera1, camera2, t);
  show_circles(map(circle_3d, circles));
}

function draw(t) {
  var prev_fun;
  for (var i=0; i<window.scenes.length; i++) {
    var dur = window.scenes[i][0],
        fun = window.scenes[i][1];
    if (0 <= t && t < dur || t >= dur && i == window.scenes.length - 1) {
      if (fun) {
        fun(clamp01(t / dur));
      } else {
        prev_fun(1);
      }
    }
    prev_fun = fun;
    t -= dur;
  }
}

function set_css(elem_id, style) {
  var elem = id(elem_id);
  for (var prop in style) {
    elem.style[prop] = style[prop];
  }
}

function set_lines(count) {
  var post1 = [
    'rLoop is delivering the vision for ', 'the Hyperloop. ',
    'Now you can be ', 'part of the engineering revolution. ',
  ],
  post2 = [
    "For over two years, we've created the world's top Hyperloop technology as ", "a decentralised team. Now we are ",
    'bringing the Hyperloop onto ', 'the Blockchain, allowing individuals to own and be part of the future. ',
  ];
      br = '<br />';
  if (count == 2) {
    id('post-block1').innerHTML = [post1[0] + post1[1], post1[2] + post1[3]].join(br);
    id('post-block2').innerHTML = [post2[0] + post2[1], post2[2] + post2[3]].join(br);
  } else if (count == 3) {
    id('post-block1').innerHTML = [post1[0], post1[1] + post1[2], post1[3]].join(br);
    id('post-block2').innerHTML = [post2[0], post2[1] + post2[2], post2[3]].join(br);
  }
}

function expand_pos(pos, factor) {
  return {
    top: pos.top - pos.height * (factor - 1) / 2,
    left: pos.left - pos.width * (factor - 1) / 2,
    width: pos.width * factor,
    height: pos.height * factor,
  };
}

function map_pos(pos, fun) {
  var res = {};
  for (var key in pos) {
    res[key] = fun(pos[key]);
  }
  return res;
}

function set_layout() {
  var ww = window.innerWidth,
      wh = window.innerHeight,
      ratio = ww / wh,
      mobility,
      mob0h = 0.57,
      mob1h = 1.5;
  if (ratio * mob0h > 1) {
    mobility = 1 - ratio * mob0h;
  } else if (ratio * mob1h < 1) {
    mobility = 1;
  } else {
    mobility = 1 - (1 / ratio - mob1h) / (mob0h - mob1h);
  }
  // mobility = 1;
  // console.log(mobility);
  var w = mobility < 0 ? 1 / (1 - mobility) : 1,
      pad = 50 / w - 50;
  function len(num) {
    return (w * num).toFixed(2) + 'vw';
  }
  if (mobility > 0.5) {
    set_lines(3);
  } else {
    set_lines(2);
  }
  var logo_pos = {
    left: blend(
      pad + 5.19,
      8.503,
      mobility
    ),
    top: blend(
      3.602,
      6.259,
      mobility
    ),
    width: blend(
      11.506,
      26.228,
      mobility
    ),
    height: blend(
      6.037,
      13.761,
      mobility
    ),
  };
  set_css('logo', map_pos(logo_pos, len));
  set_css('logo-click-area', map_pos(expand_pos(
    logo_pos, 1.3
  ), len));
  // set_css('logo-click-area', {background: 'rgba(255, 0, 0, 0.1)'});
  var font_size = len(blend(
    2.4,
    3.4,
    mobility
  ));
  set_css('pre-block', {
    left: 0,
    right: 0,
    top: len(blend(
      17.05,
      62.37,
      mobility
    )),
    fontSize: font_size,
  });
  set_css('post-block1', {
    top: len(blend(
      35.6,
      95,
      mobility
    )),
    lineHeight: 1.25,
    fontSize: len(blend(
      2.4,
      4.5,
      mobility
    ))
  });
  font_size = len(blend(
    1.05,
    2.3,
    mobility
  ));
  set_css('post-block2', {
    top: len(blend(
      42.5,
      114,
      mobility
    )),
    fontSize: font_size,
    lineHeight: 1.6,
  });
  set_css('post-block3', {
    left: 0,
    right: 0,
    top: len(blend(
      46.21,
      127,
      mobility
    )),
    fontSize: font_size,
    lineHeight: blend(
      1.8,
      2.2,
      mobility
    ),
  });
  set_css('post-block4', {
    left: 0,
    right: 0,
    top: len(blend(
      50.8,
      139.47,
      mobility
    )),
    fontSize: len(blend(
      1.2,
      2.8,
      mobility
    )),
  });
  var bg_w = len(blend(105, 140, mobility)),
      bg_h = len(blend(75, 110, mobility)),
      bg_x = blend(50, 50, mobility) + '%',
      bg_y = len(blend(-15, 14, mobility)),
      bg_size = bg_w + ' ' + bg_h + ', 100vw ' + bg_h;
  if (ratio > 0.5) {
      bg_size = bg_size + ', ' + bg_w + ' 100vh';
  } else {
      bg_size = bg_size + ', ' + bg_w + ' 100px';
  }
  set_css('body', {
    backgroundImage: 'url(pod_conv.jpg), url(pod_h.png), url(pod_v.png)',
    backgroundSize: bg_size,
    backgroundPosition: bg_x + ' ' + bg_y + ', 0 ' + bg_y + ', ' + bg_x + ' 0%',
    backgroundRepeat: 'no-repeat, no-repeat, no-repeat',
    // height: len(blend(100 * (mob0h - 0.03), 100 * (mob1h - 0.03), mobility)),
  });
  if (mobility <= 0.3) {
    window.race_is_on = window.race_is_on_1;
    window.race_is_on_pos = {
      top: blend(23, 70, mobility) * w,
      width: 90 * w,
      height: 7 * w,
    };
  } else if (mobility <= 0) {
    window.race_is_on = window.race_is_on_2;
    window.race_is_on_pos = {
      top: blend(40, 50, mobility) * w,
      width: blend(80, 80, mobility) * w,
      height: blend(300, 300, mobility) * w,
    };
  } else {
    window.race_is_on = window.race_is_on_3;
    window.race_is_on_pos = {
      top: blend(5, 40, mobility) * w,
      width: blend(200, 48, mobility) * w,
      height: blend(45, 87, mobility) * w,
    };
  }
  window.hyperloop_pos = {
    top: blend(22.5, 72, mobility) * w,
    width: blend(64, 91, mobility) * w,
    height: blend(9, 10, mobility) * w,
  };
  // draw(20);
}

function onresize() {
  set_layout();
  draw_frame();
}

function draw_frame() {
  var time = +new Date() / 1000 - window.animation_started;
  draw(time);
}

function next_frame() {
  var time = +new Date() / 1000 - window.animation_started;
  draw_frame();
  if (time <= window.total_duration) {
    requestAnimationFrame(next_frame);
  } else {
    window.animation_active = false;
  }
}

function start_animation(delta) {
  window.animation_started = +new Date() / 1000 - delta;
  if (!window.animation_active) {
    window.animation_active = true;
    next_frame();
  }
}

function all_loaded() {
  set_layout();
  start_animation(0);
  window.addEventListener('resize', onresize);
}

function start_loading_imgs() {
  for (var i=0; i<window.imgs_to_load.length; i++) {
    var image = new Image();
    image.onload = function() {
      window.loaded_imgs.push(this);
      if (window.loaded_imgs.length >= window.imgs_to_load.length) {
        all_loaded();
      }
    }.bind(image);
    image.src = window.imgs_to_load[i];
    window.imgs_to_load[i] = image;
  }
}

function onload() {
  window.total_duration = 0;
  for (var i=0; i<window.scenes.length; i++) {
    window.total_duration += window.scenes[i][0];
  }
  make_svg_circles(200);
  all_loaded();
  // start_loading_imgs();
}

window.addEventListener('load', onload);

window.svg_circles = [];
window.chars = {
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
};

window.white = [255, 255, 255];
window.aqua = [0, 252, 254];

window.race_is_on_1 = [[
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

window.race_is_on_2 = [[
  ['T', white, 1],
  ['H', white, 1],
  ['E', white, 1],
  [' ', white, 1],
  ['R', white, 1],
  ['A', white, 1],
  ['C', white, 1],
  ['E', white, 1],
], [
  ['I', white, 1],
  ['S', white, 1],
  [' ', white, 1],
  ['O', white, 1],
  ['N', white, 1],
  ['.', white, 1],
  ['.', white, 1],
  ['.', white, 1],
]];

window.race_is_on_3 = [[
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

window.hyperloop1 = [[
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

window.bigger_rad = 1.2;

window.hyperloop2 = [[
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

window.imgs_to_load = ['pod_conv.jpg', 'pod_h.png', 'pod_v.png'];
window.loaded_imgs = [];

window.total_duration = 0;

window.hyperloop_perm = permutation4lines(window.hyperloop1);
window.race_is_on_1_perm_1 = permutation4lines(window.race_is_on_1);
window.race_is_on_1_perm_2 = permutation4lines(window.race_is_on_1);
window.race_is_on_2_perm_1 = permutation4lines(window.race_is_on_2);
window.race_is_on_2_perm_2 = permutation4lines(window.race_is_on_2);
window.race_is_on_3_perm_1 = permutation4lines(window.race_is_on_3);
window.race_is_on_3_perm_2 = permutation4lines(window.race_is_on_3);

window.race_line_spacing = 5;
window.race_is_on = window.race_is_on_1;
window.race_is_on_perm_1 = window.race_is_on_1_perm_1;
window.race_is_on_perm_2 = window.race_is_on_1_perm_2;
window.race_is_on_pos = {
  top: 40.1,
  width: 90,
  height: 15,
};

window.hyperloop_pos = {
  top: 22.5,
  width: 90,
  height: 9,
};

window.animation_active = false;
