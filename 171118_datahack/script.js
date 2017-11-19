'use strict'

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
    yellow_mat = new THREE.MeshNormalMaterial({
      side: THREE.DoubleSide,
    }),
    /*yellow_mat = new THREE.MeshLambertMaterial({
      color: 'yellow',
      
    });*/
    heatmap_mat = new THREE.MeshBasicMaterial({
      // color: 'yellow',
      transparent: true,
      blending: THREE.AdditiveBlending,
      vertexColors: THREE.VertexColors,
      side: THREE.DoubleSide,
    }),
    map_mat,
    cur_height_map = {
      active: false,
      array: null,
      gridx: null,
      gridy: null,
    },
    c = cx / 1000,
    gridx1 = make_grid_fun(clat - 0.017845, clat + 0.017845, 50),
    gridx2 = make_grid_fun(
      gridx1.min * c, gridx1.max * c, gridx1.count),
    gridy = make_grid_fun(clon - 0.013365, clon + 0.013365, 50),
    hmap = make_heatmap(
      [[clat * c, clon, 2]],
      0.005, 100,
      gridx2, gridy,
    );
cur_height_map.active = true;
cur_height_map.array = hmap;
cur_height_map.gridx = gridx1;
cur_height_map.gridy = gridy;


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
      var t = (i - idx_min) / (idx_max - idx_min),
          x = t * (max - min) + min;
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
  var res = new Uint32Array(gridx.count * gridy.count),
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
          base = iiy * heatmap.w + iix,
          ty = iy / (pts_y.length - 1);
      positions[base * 3] = x * cx - dx;
      if (typeof(heightmap) == 'undefined') {
        positions[base * 3 + 1] = 0;
      } else {
        positions[base * 3 + 1] = (heightmap[base] + dz) * cz;
      }
      positions[base * 3 + 2] = y * cy - dy;
      if (mode == 'color') {
        var color = pallete(heatmap[base]);
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
      index[i++] = v1;
      index[i++] = v1 + 1;
      index[i++] = v2;
      //
      index[i++] = v2 + 1;
      index[i++] = v2;
      index[i++] = v1 + 1;
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
  var map_plane = new THREE.Mesh(map_geometry, map_mat),
      map_mesh = heatmap_mesh(
        hmap, hmap, gridx1, gridy, 'texture', map_px, 0,
        (x) => [x / 100, 0, 0],
      ),
      hmap_mesh = heatmap_mesh(
        hmap, hmap, gridx1, gridy, 'color', map_px, 0.01,
        (x) => [x / 100, 0, 0],
      );
  // scene.add(map_plane);
  scene.add(grid_helper);
  // scene.add(light);
  // add_flats_flags(scene);
  scene.add(map_mesh);
  scene.add(hmap_mesh);
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

