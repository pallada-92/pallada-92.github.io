function triangle_center(v, m) {
  var v0x = v[0][0], v0y = v[0][1],
      v1x = v[1][0], v1y = v[1][1],
      v2x = v[2][0], v2y = v[2][1],
      m0 = m[0], m1 = m[1], m2 = m[2];
  return [
    v0x * m0 + v1x * m1 + v2x * m2,
    v0y * m0 + v1y * m1 + v2y * m2,
  ];
}

function get_triangle_color(v, n) {
  var counts = {};
  var max_color, max_count = 0;
  for (var i=1; i+1+1<=n; i++) {
    for (var j=1; i+j+1<=n; j++) {
      var k = n - i - j;
      var pt = triangle_center(v, [i / n, j / n, k / n]);
      pt = [Math.floor(pt[0]), Math.floor(pt[1])];
      var color = ctx.getImageData(pt[0], pt[1], 1, 1).data;
      color = color[0] + ' ' + color[1] + ' ' + color[2];
      if (!(color in counts)) {
        counts[color] = 0;
      }
      counts[color]++;
      if (counts[color] > max_count) {
        max_count = counts[color];
        max_color = color;
      }
    }
  }
  max_color = max_color.split(' ');
  return [+max_color[0], +max_color[1], +max_color[2]];
}

function get_triangle(id, state) {
  var tr = triangles[id][state];
  return [
    points[tr[0]],
    points[tr[1]],
    points[tr[2]],
  ];
}

function load_data() {
  window.cur_vertex = null;
  window.show_numbers = true;
  // window.data = localStorage.getItem('data');
  window.data = points;
  return;
  if (!data) {
    data = '[]';
  }
  data = JSON.parse(data);
  if (!data.push) {
    data = [];
  }
}

function save_data() {
  localStorage.setItem('data', JSON.stringify(data));
}

function onload() {
  load_data();
  window.image = new Image();
  image.onload = image_onload;
  image.src = 'image.png';
}

function image_onload() {
  window.canvas = document.getElementById('canvas');
  window.ctx = canvas.getContext('2d');
  canvas.width = image.width;
  canvas.height = image.height;
  // canvas.addEventListener('click', onclick);
  draw1();
}

function rgb(c) {
  return 'rgb(' + Math.floor(c[0]) + ', ' + Math.floor(c[1]) + ', ' + Math.floor(c[2]) + ')';
}


function draw1() {
  ctx.drawImage(image, 0, 0);
  ctx.fillStyle = 'black';
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 1;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 10px Helvetica';
  var s = 1.5;
  for (var i=0; i<data.length; i++) {
    ctx.fillRect(data[i][0] - s, data[i][1] - s, 2 * s, 2 * s);
    ctx.strokeRect(data[i][0] - s, data[i][1] - s, 2 * s, 2 * s);
    if (show_numbers) {
      ctx.strokeText(i, data[i][0] + 3 * s, data[i][1]);
      ctx.fillText(i, data[i][0] + 3 * s, data[i][1]);
    }
  }
}

function draw2() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (var i in triangles) {
    for (var state in triangles[i]) {
      var tri = get_triangle(i, state);
      var color = colors[i][state];
      ctx.fillStyle = rgb(color);
      ctx.strokeStyle = rgb(color);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(tri[0][0], tri[0][1]);
      ctx.lineTo(tri[1][0], tri[1][1]);
      ctx.lineTo(tri[2][0], tri[2][1]);
      ctx.closePath();
      ctx.stroke();
      ctx.fill();
    }
  }
}

function onkeydown(e) {
  console.log('keydown', e.key);
  if (e.key == 'Shift') {
    window.show_numbers = false;
    draw1();
  }
  if (e.key == 'Control') {
    draw2();
  }
}

function onkeyup(e) {
  console.log('keyup', e.key);
  if (e.key == 'Shift') {
    window.show_numbers = true;
    draw1();
  }
  if (e.key == 'Control') {
    draw1();
  }
}

function onclick(e) {
  var x = e.pageX - this.offsetLeft,
      y = e.pageY - this.offsetTop;
  if (cur_vertex !== null) {
    data[cur_vertex] = [x, y];
    window.cur_vertex = null;
  } else {
    data.push([x, y]);
  }
  save_data();
  draw();
}

function get_colors(n) {
  var res = {};
  for (var i in triangles) {
    res[i] = [];
    for (var state in triangles[i]) {
      res[i][state] = get_triangle_color(get_triangle(i, state), n);
    }
  }
  return res;
}

window.addEventListener('load', onload);
window.addEventListener('keydown', onkeydown);
window.addEventListener('keyup', onkeyup);
