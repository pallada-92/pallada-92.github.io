'use strict'
// geomatrix
/*

  tl: 55.880.45, 37.479.55 - верх прибрежного проезда
      map: 356 / 5950, 283 / 7700
  br: 55.853.72, 37.515.24 - правый угол дороги
      map: 5314 / 5950, 6887 / 7700

 */

if (!Detector.webgl) Detector.addGetWebGLMessage();

var camera, controls, scene, renderer,
    loader = new THREE.TextureLoader(),
    map_texture, map_ratio = 8500 / 11000;

window.addEventListener('load', load_map);

function load_map() {
  loader.load(
	'map_inv_70_edited.jpg',
	function ( texture ) {
      map_texture = texture;
      init();
      render();
	},
	function ( xhr ) {
	  console.log((xhr.loaded / xhr.total * 100) + '% loaded');
	},
	function ( xhr ) {
	  console.log('Texture loading error');
	}
  );
}

var cx = 550, cy = -1000, cz = 0.05,
    clat = 37.497395, clon = 55.867085,
    dx = 20623.56725, dy = -55867.085,
    coord_matrix = new THREE.Matrix4(),
    corners_geo = [
      [37.47955, 37.51524],
      [55.88045, 55.85372],
    ],
    map_geo = [
      [37.47955 * cx - dx, 37.51524 * cx - dx],
      [55.88045 * cy - dy, 55.85372 * cy - dy],
    ],
    map_geo_center = [
      (map_geo[0][0] + map_geo[0][1]) / 2,
      (map_geo[1][0] + map_geo[1][1]) / 2,
    ],
    map_px = [
      [356 / 5950, 5314 / 5950],
      [1 - 6887 / 7700, 1 - 282 / 7700],
    ],
    map_geo_pts = [
      [map_geo[0][0], map_geo[1][0]],
      [map_geo[0][0], map_geo[1][1]],
      [map_geo[0][1], map_geo[1][1]],
      [map_geo[0][1], map_geo[1][0]],
    ],
    map_px_pts = [
      new THREE.Vector2(map_px[0][0], map_px[1][0]),
      new THREE.Vector2(map_px[0][0], map_px[1][1]),
      new THREE.Vector2(map_px[0][1], map_px[1][1]),
      new THREE.Vector2(map_px[0][1], map_px[1][0]),
    ],
    map_geometry = new THREE.PlaneGeometry(
      Math.abs(map_geo[0][0] - map_geo[0][1]),
      Math.abs(map_geo[1][0] - map_geo[1][1]),
    );
coord_matrix.makeScale(cx, 1, cy);

map_geometry.rotateX(-Math.PI / 2 );
map_geometry.translate(map_geo_center[0], 0, map_geo_center[1]);
map_geometry.faceVertexUvs = [[
  [map_px_pts[1], map_px_pts[0], map_px_pts[2]],
  [map_px_pts[0], map_px_pts[3], map_px_pts[2]],
]];
var col = 0x999999,
    grid_helper = new THREE.GridHelper(20, 2000, col, col);
grid_helper.applyMatrix(coord_matrix);
grid_helper.position.set(37.600 * cx - dx, -0.1, 55.750 * cy - dy);

var light = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.6 );
light.position.set( 0, 50, 0 );

function flag(params) {
  var res = new THREE.Group();
  return res;
}

var needle_mat = new THREE.LineBasicMaterial({
	color: 0xffffff,
}),
    // yellow_mat = new THREE.MeshNormalMaterial({
    //   side: THREE.DoubleSide,
    // }),
    yellow_mat = new THREE.MeshBasicMaterial({
      color: 'yellow',
      side: THREE.DoubleSide,
    }),
    heatmap_mat = new THREE.MeshBasicMaterial({
      // color: 'yellow',
      transparent: true,
      blending: THREE.AdditiveBlending,
      vertexColors: THREE.VertexColors,
      depthTest: false,
      depthWrite: false,
      side: THREE.FrontSide,
    }),
    map_mat,
    cur_height_map = {
      active: false,
      array: null,
      gridx: null,
      gridy: null,
    },
    c = cx / 1000,
    gridx1 = make_grid_fun(clat - 0.017845, clat + 0.017845, 200),
    gridx2 = make_grid_fun(
      gridx1.min * c, gridx1.max * c, gridx1.count),
    gridy = make_grid_fun(clon - 0.013365, clon + 0.013365, 200),
    hmap = make_heatmap(
      [[clat * c, clon, 2]],
      0.005, 100,
      gridx2, gridy,
    ),
    hmap = make_flats_heatmap(gridx2, gridy, 0.001, c),
    prices_hmap = make_prices_heatmap(gridx2, gridy, 0.001, c);

cur_height_map.active = true;
cur_height_map.array = hmap;
cur_height_map.gridx = gridx1;
cur_height_map.gridy = gridy;

function make_flats_heatmap(gridx, gridy, rad, c) {
  var pts = [],
      results = flats.result;
  for (var i=0; i<results.length; i++) {
    var item = results[i];
    pts.push([item.Lon * c, item.Lat, item.Flats / 1000]);
  }
  return make_heatmap(pts, rad, 100, gridx, gridy);
}

function make_prices_heatmap(gridx, gridy, rad, c) {
  var pts_s = [],
      pts_c = [],
      results = prices.result;
  for (var i=0; i<results.length; i++) {
    var item = results[i];
    pts_s.push([item.Lon * c, item.Lat, item.Price / 100000]);
    pts_c.push([item.Lon * c, item.Lat, 10]);
  }
  console.log(pts_s, pts_c);
  var h1 = make_heatmap(pts_s, rad, 100, gridx, gridy),
      h2 = make_heatmap(pts_c, rad, 100, gridx, gridy);
  for (var i=0; i<h1.length; i++) {
    if (h2[i] > 100 && h1[i] > 100) {
      h1[i] = Math.max(0, Math.min(0.08, h1[i] / h2[i] - 0.15));
    } else {
      h1[i] = 0;
    }
  }
  return h1;
}

function needle(params) {
  var geometry = new THREE.Geometry(),
      z = getz(params.lat, params.lon);
  geometry.vertices.push(
    new THREE.Vector3(
      params.lat * cx - dx, z, params.lon * cy - dy),
	new THREE.Vector3(
      params.lat * cx - dx, z + params.height * cz, params.lon * cy - dy),
  );
  return new THREE.Line(geometry, needle_mat);
}

function getz(lat, lon) {
  if (!cur_height_map.active) return 0;
  var iix = cur_height_map.gridx(lat, lat)[0],
      iiy = cur_height_map.gridy(lon, lon)[0],
      arr = cur_height_map.array;
  return arr[iiy * arr.w + iix] * cz;
}

function flag(params) {
  var res = new THREE.Group(),
      x = params.lat * cx - dx, y = params.lon * cy - dy,
      c = 0.05;
  for (var i=0; i<params.segments.length; i++) {
    var seg = params.segments[i],
        shape = new THREE.Shape();
    shape.moveTo(cz * seg.minh, seg.maxwmin * c);
    shape.lineTo(cz * seg.minh, c * (seg.minwmin || 0));
    shape.lineTo(cz * seg.maxh, c * (seg.minwmax || 0));
    shape.lineTo(cz * seg.maxh, c * seg.maxwmax);
    shape.closePath();
    var geometry = new THREE.ShapeGeometry(shape),
        z = getz(params.lat, params.lon);
    geometry.rotateZ(Math.PI / 2);
    geometry.rotateY(params.dir);
    geometry.translate(x, z, y);
    var mesh = new THREE.Mesh(geometry, seg.mat);
    res.add(mesh);
  }
  return res;
}

function add_cafes_flags(scene) {
  var needles = {},
      results = cafes.result;
  for (var i=0; i<results.length; i++) {
    var item = results[i],
        coords = item.geoData.coordinates,
        hash = coords[0].toFixed(12) + ':' + coords[1].toFixed(12);
    if (!(hash in needles)) {
      needles[hash] = [];
    }
    item.hash = hash;
    needles[hash].push(item);
  }
  for (var hash in needles) {
    var t = hash.split(':'),
        lat = +t[0], lon = +t[1],
        items = needles[hash],
        angle = 2 * Math.PI / items.length;
    scene.add(needle({
      lon: lon, lat: lat,
      height: 20,
    }));
    for (var i=0; i<items.length; i++) {
      var item = items[i],
          year1 = +item.LicenseBegin.split('.')[2],
          year2 = +item.LicenseExpire.split('.')[2];
      scene.add(flag({
        lat: lat, lon: lon, dir: angle * i,
        segments: [
          {
            minh: Math.max(0, year1 - 2000),
            maxh: Math.min(20, year2 - 2000),
            maxwmin: 1, maxwmax: 1,
            minwmin: 0, minwmax: 0,
            mat: yellow_mat
          },
        ],
      }));
    }
  }
}

function add_flats_flags(scene) {
  var needles = {},
      results = window.flats.result;
  for (var i=0; i<results.length; i++) {
    var item = results[i],
        coords = [item.Lon, item.Lat],
        hash = coords[0].toFixed(12) + ':' + coords[1].toFixed(12);
    if (hash in needles) {
      throw 'multiple flats';
    }
    item.hash = hash;
    needles[hash] = item;
  }
  for (var hash in needles) {
    var t = hash.split(':'),
        lat = +t[0], lon = +t[1],
        item = needles[hash];
        // angle = 2 * Math.PI / items.length;
    // if (item.Flats < 480) continue;
    scene.add(needle({
      lon: lon, lat: lat,
      height: item.Flats / 10,
    }));
  }
}

function make_grid_fun(min, max, count) {
  var inverse = function(x) {
    var idx = (x - min) / (max - min) * (count - 1);
    return Math.max(0, Math.min(count - 1, Math.round(idx)));
  };
  var res = function(rmin, rmax) {
    var idx_min = inverse(rmin),
        idx_max = inverse(rmax),
        pts = [];
    // console.log(min, max, count, rmin, rmax);
    // console.log(idx_min, idx_max);
    for (var i=idx_min; i<=idx_max; i++) {
      var x = i / Math.max(0, count - 1) * (max - min) + min;
      pts.push(i, x);
    }
    return pts;
  };
  res.count = count;
  res.min = min;
  res.max = max;
  return res;
}

function make_heatmap(pts, rad, coeff, gridx, gridy) {
  var res = new Float32Array(gridx.count * gridy.count),
      zero_rad = rad * 2;
  res.w = gridx.count;
  res.h = gridy.count;
  for (var i=0; i<pts.length; i++) {
    var pt = pts[i],
        pts_x = gridx(pt[0] - zero_rad, pt[0] + zero_rad),
        pts_y = gridy(pt[1] - zero_rad, pt[1] + zero_rad);
    // console.log(pts_x, pts_y);
    for (var ix = 0; ix<pts_x.length; ix+=2) {
      var iix = pts_x[ix],
          x = pts_x[ix + 1],
          dx = pt[0] - x;
      for (var iy = 0; iy<pts_y.length; iy+=2) {
        var iiy = pts_y[iy],
            y = pts_y[iy + 1],
            dy = pt[1] - y,
            dist = dx * dx + dy * dy,
            val = coeff * pt[2] * Math.exp(- dist / (rad * rad));
        // console.log(val);
        res[iiy * gridx.count + iix] += Math.round(val);
      }
    }
  }
  return res;
}

function add_heatmap_flags(scene, heatmap, gridx, gridy) {
  var pts_x = gridx(gridx.min, gridx.max),
      pts_y = gridy(gridy.min, gridy.max);
  for (var ix=0; ix<pts_x.length; ix+=2) {
    var iix = pts_x[ix],
        x = pts_x[ix + 1];
    for (var iy=0; iy<pts_y.length; iy+=2) {
      var iiy = pts_y[iy],
          y = pts_y[iy + 1];
      scene.add(needle({
        lat: x, lon: y,
        height: heatmap[iiy * heatmap.w + iix],
      }));
    }
  }
}

function normalize_heat(heatmap, new_max_val, step) {
  var old_max_val = -Infinity;
  for (var i=0; i<heatmap.length; i++) {
    old_max_val = Math.max(old_max_val, heatmap[i]);
  }
  for (var i=0; i<heatmap.length; i++) {
    heatmap[i] = Math.round(
      heatmap[i] / old_max_val * new_max_val / step) * step;
  }
  heatmap.max_val = new_max_val;
}

function heatmap_mesh(
  heightmap, heatmap, gridx, gridy, mode, map_px, dz, pallete
) {
  var geometry = new THREE.BufferGeometry(),
      positions = new Float32Array(gridx.count * gridy.count * 3),
      pts_x = gridx(gridx.min, gridx.max),
      pts_y = gridy(gridy.min, gridy.max),
      colors, uvs,
      index = new Array((gridx.count - 1) * (gridy.count - 1) * 6);
  if (mode == 'color') {
    colors = new Float32Array(gridx.count * gridy.count * 3);
  } else if (mode == 'texture') {
    uvs = new Float32Array(gridx.count * gridy.count * 2);
  }
  for (var ix=0; ix<pts_x.length; ix+=2) {
    var iix = pts_x[ix],
        x = pts_x[ix + 1],
        tx = ix / (pts_x.length - 1);
    for (var iy=0; iy<pts_y.length; iy+=2) {
      var iiy = pts_y[iy],
          y = pts_y[iy + 1],
          ty = iy / (pts_y.length - 1),
          base = iiy * heatmap.w + iix;
          // base2 = (1 * (heatmap.w - 1) - iix) * heatmap.h +
          // (1 * (heatmap.h - 1) - iiy),
          // base2 = iix * heatmap.w + iiy,
      positions[base * 3] = x * cx - dx;
      if (typeof(heightmap) == 'undefined') {
        positions[base * 3 + 1] = 0;
      } else {
        positions[base * 3 + 1] = (heightmap[base] + dz) * cz;
      }
      if (positions[base * 3 + 1] > dz * cz + 1) {
        // console.log(x, y);
        // console.log(tx, ty);
        // console.log(iix, iiy);
      }
      positions[base * 3 + 2] = y * cy - dy;
      if (mode == 'color') {
        var color = pallete(heatmap[base] / heatmap.max_val);
        colors[base * 3] = color[0]
        colors[base * 3 + 1] = color[1];
        colors[base * 3 + 2] = color[2];
      } else if (mode == 'texture') {
        uvs[base * 2] =
          tx * (map_px[0][1] - map_px[0][0]) + map_px[0][0];
        uvs[base * 2 + 1] =
          ty * (map_px[1][1] - map_px[1][0]) + map_px[1][0];
      }
    }
  }
  var i=0;
  for (var ix=0; ix<heatmap.w - 1; ix++) {
    for (var iy=0; iy<heatmap.h - 1; iy++) {
      var v1 = iy * heatmap.w + ix,
          v2 = (iy + 1) * heatmap.w + ix;
      // if (
      //   positions[v1 * 3 + 1] == positions[v1 * 3 + 4] &&
      //   positions[v1 * 3 + 1] == positions[v2 * 3 + 1]
      // ) {
        index[i++] = v1;
        index[i++] = v1 + 1;
        index[i++] = v2;
      // 
      //
      // if (
      //   positions[v2 * 3 + 1] == positions[v2 * 3 + 4] &&
      //   positions[v2 * 3 + 1] == positions[v1 * 3 + 1]
      // ) {
        index[i++] = v2 + 1;
        index[i++] = v2;
        index[i++] = v1 + 1;
      // }
    }
  }
  geometry.setIndex(index);
  geometry.addAttribute(
    'position', new THREE.BufferAttribute(positions, 3));
  if (mode == 'color') {
    geometry.addAttribute(
      'color', new THREE.BufferAttribute(colors, 3));
    return new THREE.Mesh(geometry, heatmap_mat);
  } else if (mode == 'texture') {
    geometry.addAttribute(
      'uv', new THREE.BufferAttribute(uvs, 2));
    return new THREE.Mesh(geometry, map_mat);
  }
}

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  renderer = new THREE.WebGLRenderer({
    antialias: true,
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  var container = document.getElementById('root');
  container.appendChild(renderer.domElement);
  camera = new THREE.PerspectiveCamera(
    60, window.innerWidth / window.innerHeight,
    0.1, 100
  );
  window.addEventListener('resize', onWindowResize, false);
  map_texture.minFilter = THREE.LinearFilter;
  camera.position.set(
    map_geo_center[0],
    10,
    map_geo_center[1] + 10,
  );
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.addEventListener('change', render);
  controls.enableZoom = true;
  controls.target = new THREE.Vector3(
    map_geo_center[0], 0, map_geo_center[1]
  )
  camera.lookAt(controls.target);
  map_mat = new THREE.MeshBasicMaterial({
	map: map_texture,
  });
  make_scene(6);
}

function make_scene(variant) {
  function varin() {
    var args = Array.prototype.slice.call(arguments);
    return args.indexOf(variant) >= 0;
  }
  scene = new THREE.Scene();
  var map_mesh, hmap_mesh,
      hmap1, col_fun;
  if (varin(3)) {
    normalize_heat(hmap, 20, 4,);
  } else if (varin(4, 5, 6)) {
    normalize_heat(hmap, 30, 1,);
  } else {
    normalize_heat(hmap, 30, 6,);
  }
  hmap1 = varin(2) ? hmap : undefined;
  map_mesh = heatmap_mesh(
    hmap1, hmap, gridx1, gridy, 'texture', map_px, 0,
  );
  hmap1 = varin(2, 3, 4, 5) ? hmap : undefined;
  if (varin(2)) {
    col_fun = (x) => [x / 1.5, 0, 0];
  } else {
    col_fun = (x) => [x, 0, 0];
  }
  if (varin(1, 2, 3, 5, 6)) {
    hmap_mesh = heatmap_mesh(
      hmap1, hmap, gridx1, gridy, 'color', map_px, 0.01,
      col_fun,
    );
    scene.add(hmap_mesh);
  }
  if (varin(4, 5, 6)) {
    col_fun = (x) => [0, 0, x];
    normalize_heat(prices_hmap, 30, 5,);
    var prices_hmap_mesh = heatmap_mesh(
      prices_hmap, prices_hmap, gridx1, gridy, 'color', map_px, 0.01,
      col_fun,
    );
    scene.add(prices_hmap_mesh);
  }
  scene.add(grid_helper);
  scene.add(map_mesh);
  cur_height_map.active = varin(2);
  add_cafes_flags(scene);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  render();
}

function render() {
  renderer.render(scene, camera);
}

window.addEventListener('keydown', (e) => {
  if ('0123456789'.indexOf(e.key) >= 0) {
    make_scene(+e.key);
    render();
  }
})