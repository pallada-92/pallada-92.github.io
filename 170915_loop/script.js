window.onerror = function (errorMsg, url, lineNumber) {
  alert('Error: ' + errorMsg + ' Script: ' + url + ' Line: ' + lineNumber);
}

var circles_count = 200;
var circles = [];

function make_circles() {
  var svg = document.getElementById('particles');
  for (var i=0; i<circles_count; i++) {
    var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', 0);
    circle.setAttribute('cy', 0);
    circle.setAttribute('r', 0);
    circle.setAttribute('opacity', 0);
    svg.appendChild(circle);
    circles.push(circle);
  }
}

var letters = {
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
}

function draw_letter(letter, x, y, color) {
  var res = [];
  var ascii = letters[letter];
  var cur_x = x, cur_y = y;
  for (var i=0; i<ascii.length; i++) {
    var ch = ascii[i];
    if (ch == '#') {
      res.push([cur_x, cur_y, color]);
      cur_x += 1;
    } else if (ch == ' ') {
      cur_x += 1;
    } else if (ch == '\n') {
      cur_x = x;
      cur_y += 1;
    }
  }
  return res;
}

var iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream; 

function draw_hyperloop() {
  var text = 'HYPERLOOP';
  var cur_x = 0, cur_y = 0;
  var cur_circ = 0;
  var max_x = 0;
  var all_circs = [];
  for (var i=0; i<text.length; i++) {
    var letter = text[i];
    var color = i >= 4 ? 'rgb(0, 252, 254)' : 'rgb(255, 255, 255)';
    var letter_circs = draw_letter(letter, cur_x, cur_y, color);
    for (var j=0; j<letter_circs.length; j++) {
      var circ = letter_circs[j];
      max_x = Math.max(max_x, circ[0]);
      all_circs.push(circ);
    }
    cur_x = max_x + 2;
  }
  var container = document.getElementById('container');
  var cont_width = container.offsetWidth;
  var cont_height = container.offsetHeight;
  var top = cont_height * 0.401;
  var cell_dist = cont_height * 0.13 / 6;
  var left = cont_width / 2 - max_x * cell_dist / 2;
  for (var i=0; i<all_circs.length; i++) {
    var circ = all_circs[i];
    var svg_circ = circles[cur_circ];
    cur_circ++;
    svg_circ.setAttribute('cx', left + circ[0] * cell_dist);
    svg_circ.setAttribute('cy', top + circ[1] * cell_dist);
    svg_circ.setAttribute('r', cell_dist * 0.4);
    svg_circ.setAttribute('fill', circ[2]);
    svg_circ.setAttribute('opacity', 1);
  }
}

function onload() {
  make_circles();
  draw_hyperloop();
  window.addEventListener('resize', draw_hyperloop)
}

window.addEventListener('load', onload)

