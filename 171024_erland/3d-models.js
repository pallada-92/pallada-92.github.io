'use strict';

if (!Detector.webgl) {
  Detector.addGetWebGLMessage();
}

var camera, controls, scene, renderer;

function smooth(res, dim, axis, pos, rad) {
  var ax = [(axis + 1) % 3, (axis + 2) % 3, axis];
  var s = [], e = [];
  s[ax[0]] = e[ax[0]] = pos[0] * (dim[ax[0]] / 2 - rad);
  s[ax[1]] = e[ax[1]] = pos[1] * (dim[ax[1]] / 2 - rad);
  s[ax[2]] = -1/2 * dim[ax[2]];
  e[ax[2]] = 1/2 * dim[ax[2]];
  var cylinder = new CSG.cylinder({
    radius: rad,
    start: s,
    end: e,
  });
  var r = [], c = [];
  r[ax[0]] = r[ax[1]] = rad / 2;
  r[ax[2]] = dim[ax[2]] / 2;
  c[ax[0]] = pos[0] * (dim[ax[0]] - rad) / 2;
  c[ax[1]] = pos[1] * (dim[ax[1]] - rad) / 2;
  c[ax[2]] = 0;
  var cube = new CSG.cube({
    radius: r,
    center: c,
  });
  return res.subtract(cube.subtract(cylinder));
}

function smooth_cube(dim, axes) {
  var res = CSG.cube({
    radius: [dim[0] / 2, dim[1] / 2, dim[2] / 2],
  });
  for (var i=0; i<axes.length; i++) {
    res = smooth(res, dim, axes[i][0], [axes[i][1], axes[i][2]], axes[i][3]);
  }
  return res;
}

function smooth3_cube(dim, rad) {
  return smooth_cube(dim, [
    [0, +1, +1, rad[0]], [0, -1, +1, rad[0]], [1, +1, +1, rad[0]], [1, +1, -1, rad[0]],
    [0, +1, -1, rad[1]], [0, -1, -1, rad[1]], [1, -1, +1, rad[1]], [1, -1, -1, rad[1]],
    [2, +1, +1, rad[2]], [2, -1, +1, rad[2]], [2, +1, -1, rad[2]], [2, -1, -1, rad[2]],
  ]);
}

function assign_uv(geometry) {
  geometry.computeBoundingBox();
  var max = geometry.boundingBox.max,
      min = geometry.boundingBox.min;
  var offset = new THREE.Vector2(0 - min.x, 0 - min.y);
  var range = new THREE.Vector2(max.x - min.x, max.y - min.y);
  var faces = geometry.faces;
  geometry.faceVertexUvs[0] = [];
  for (var i = 0; i < faces.length ; i++) {
    var v1 = geometry.vertices[faces[i].a], 
        v2 = geometry.vertices[faces[i].b], 
        v3 = geometry.vertices[faces[i].c];
    geometry.faceVertexUvs[0].push([
      new THREE.Vector2((v1.x + offset.x)/range.x ,(v1.y + offset.y)/range.y),
      new THREE.Vector2((v2.x + offset.x)/range.x ,(v2.y + offset.y)/range.y),
      new THREE.Vector2((v3.x + offset.x)/range.x ,(v3.y + offset.y)/range.y)
    ]);
  }
  geometry.uvsNeedUpdate = true;
}

var model_params = {

  width: 30,
  height: 47,
  depth: 0.6,
  corner_radius: 0.3,

  has_base: true,

  holes: [{
      top: 3,
      left: 3,
      rad: 0.3,
    }, {
      top: 47 - 3,
      left: 3,
      rad: 0.3,
    }, {
      top: 47 - 3,
      left: 30 - 3,
      rad: 0.3,
    }, {
      top: 3,
      left: 30 - 3,
      rad: 0.3,
  }],

  has_envelope: true,
  envelope_thick: 0.1,
  no_envelope_at_back: true,
  back_envelope_margin: [2, 2],
  // envelope_color: 0x2272c4,
  envelope_color: 0x748293,
  show_holes: true,
  
  text: 'УГОЛОК\nПОТРЕБИТЕЛЯ',
  font: 'droid/droid_sans_bold.typeface.json',
  text_margin_top: 1,
  line_height: 4,
  font_size: 2.5,

  files: [{
    top: 11.5,
    left: 3.5,
    inner_width: 21,
    inner_height: 29.7,
    inner_depth: 1.5,
    glass_thick: 0.1,
    left_skew_width: 0,
    left_skew_height: 0,
    right_skew_width: 6,
    right_skew_height: 2,
    padding: {
      top: 1,
      left: 1,
      right: 1,
      bottom: 1,
    },
  }],

};

function tr(ax, vec) {
  if (vec.isVector3) {
    vec = [vec.x, vec.y, vec.z];
  }
  var res = [0, 0, 0];
  res[ax[0]] = vec[0];
  res[ax[1]] = vec[1];
  res[ax[2]] = vec[2];
  return new THREE.Vector3(res[0], res[1], res[2]);
}

function rev_tr(ax, vec) {
  if (vec.isVector3) {
    vec = [vec.x, vec.y, vec.z];
  }
  return [vec[ax[0]], vec[ax[1]], vec[ax[2]]];
}

function draw_dimension(ax, dim, pos, line_material, arrow_dir, font, font_size, font_material, align, text) {
  var res = new THREE.Group(),
      lines = new THREE.Geometry(),
      triangles = new THREE.Geometry(),
      rad = rev_tr(ax, [dim[0] / 2, dim[1] / 2, dim[2] / 2]),
      margin = 3, arrow_width = 1, arrow_height = 1/6;
  if (pos[1] == -1 || pos[1] == 1) {
    var y = pos[1] * (rad[1] + margin * 0.66),
        z = pos[2] * rad[2];
    for (var i=-1; i<=1; i+=2) {
      lines.vertices.push(
        tr(ax, [i * rad[0], pos[1] * rad[1], z]),
        tr(ax, [i * rad[0], pos[1] * (rad[1] + margin), z]),
      );
      triangles.vertices.push(
        tr(ax, [i * (rad[0] - arrow_width * arrow_dir), y - arrow_height , z]),
        tr(ax, [i * rad[0], y, z]),
        tr(ax, [i * (rad[0] - arrow_width * arrow_dir), y + arrow_height , z]),
      );
    }
    triangles.faces.push(
      new THREE.Face3(0, 1, 2),
      new THREE.Face3(3, 4, 5),
    );
    lines.vertices.push(
      tr(ax, [-rad[0], y, z]),
      tr(ax, [+rad[0], y, z]),
    );
  }
  var center = tr(ax, [0, y, z]);
  var lines = new THREE.LineSegments(lines, line_material);
  res.add(lines);
  var triangles = new THREE.Mesh(triangles, font_material);
  res.add(triangles);
  var text = font.generateShapes(text, font_size, 1);
  var text = new THREE.ShapeGeometry(text);
  text.computeBoundingBox();
  var width = text.boundingBox.max.x - text.boundingBox.min.x;
  var dx = width * (align - 1) / 2;
  text.translate(dx + center.x, center.y + margin * 0.1, center.z);
  var text = new THREE.Mesh(text, font_material);
  res.add(text);
  return res;
}

function box(x, y, z, w, h, d) {
  var res = new THREE.BoxGeometry(w, h, d);
  res.translate(w / 2 + x, - h / 2 - y, d / 2 + z);
  return res;
}

function draw_file(file, base_material, glass_material) {
  var res = new THREE.Group(),
      p = file.padding;
  file.outer_width = p.left + file.inner_width + p.right;
  file.outer_height = p.top + file.inner_height + p.bottom;

  var left_base = box(
    0,
    file.left_skew_height,
    0,
    p.left,
    file.outer_height - file.left_skew_height,
    file.inner_depth,
  );
  var left_base = new THREE.Mesh(
    left_base, base_material,
  );
  res.add(left_base);

  var right_base = box(
    file.inner_width + p.left,
    file.right_skew_height,
    0,
    p.right,
    file.outer_height - file.right_skew_height,
    file.inner_depth,
  );
  var right_base = new THREE.Mesh(
    right_base, base_material,
  );
  res.add(right_base);

  var gap = 0.1;
  var bottom_base = box(
    p.left + gap,
    p.top + file.inner_height,
    0,
    file.inner_width - gap * 2,
    p.bottom,
    file.inner_depth,
  );
  var bottom_base = new THREE.Mesh(
    bottom_base, base_material,
  );
  res.add(bottom_base);

  var glass = new THREE.Shape();
  glass.moveTo(
    0,
    -file.outer_height,
  );
  glass.lineTo(
    0,
    -file.left_skew_height,
  );
  glass.lineTo(
    file.left_skew_width,
    0,
  );
  glass.lineTo(
    file.outer_width - file.right_skew_width,
    0,
  );
  glass.lineTo(
    file.outer_width,
    -file.right_skew_height,
  );
  glass.lineTo(
    file.outer_width,
    -file.outer_height,
  );
  var glass = new THREE.ExtrudeGeometry(glass, {
    amount: file.glass_thick,
    bevelEnabled: false,
  });
  var glass = new THREE.Mesh(
    glass,
    glass_material
  );
  glass.translateZ(file.inner_depth);
  res.add(glass);

  return res;
}

function draw_book(width, height, depth, texture) {
  var res = new THREE.Group();
  return res;
}

function make_model(params) {
  var res = new THREE.Group();
  if (params.has_base) {
    var csg_base = smooth3_cube([
      params.width,
      params.height,
      params.depth,
    ], [
      params.corner_radius,
      params.corner_radius,
      params.corner_radius,
    ]);
    var holes_wireframe = new THREE.Geometry();
    for (var i=0; i<params.holes.length; i++) {
      var hole = params.holes[i];
      var pt = [hole.left - params.width / 2, hole.top - params.height / 2];
      var cylinder = CSG.cylinder({
        start: [pt[0], pt[1], -params.depth],
        end: [pt[0], pt[1], params.depth],
        radius: hole.rad,
      });
      csg_base = csg_base.subtract(cylinder);
      var hole_lines = 10;
      for (var j=0; j<hole_lines; j++) {
        var a = 2 * Math.PI / hole_lines * j,
            pos = [
              pt[0] + Math.cos(a) * hole.rad,
              pt[1] + Math.sin(a) * hole.rad
            ];
        holes_wireframe.vertices.push(new THREE.Vector3(
          pos[0], pos[1], -params.depth / 2,
        ), new THREE.Vector3(
          pos[0], pos[1], +params.depth / 2,
        ));
      }
      var hole_axis_len = 3;
      holes_wireframe.vertices.push(new THREE.Vector3(
        pt[0], pt[1], -hole_axis_len,
      ), new THREE.Vector3(
        pt[0], pt[1], +hole_axis_len,
      ));
    }
    var base_geometry = THREE.CSG.fromCSG(csg_base);
    assign_uv(base_geometry);
  }
  if (params.has_envelope) {
    var csg_envelope = smooth3_cube(
      [
        params.width + params.envelope_thick * 2,
        params.height + params.envelope_thick * 2,
        params.depth + params.envelope_thick * 2,
      ], [
        params.corner_radius,
        params.corner_radius,
        params.corner_radius,
      ]);
    if (params.no_envelope_at_back) {
      var margin = params.back_envelope_margin;
      var cube_hole = CSG.cube({
        center: [0, 0, -params.depth / 2],
        radius: [
          params.width / 2 - margin[0],
          params.height / 2 - margin[1],
          params.depth / 2,
        ],
      });
      csg_envelope = csg_envelope.subtract(cube_hole);
    }
    if (params.show_holes && 0) {
      for (var i=0; i<params.holes.length; i++) {
        var hole = params.holes[i];
        csg_envelope = csg_envelope.subtract(CSG.sphere({
          center: [
            hole.left - params.width / 2,
            hole.top - params.height / 2,
            0,
          ],
          radius: hole.rad * 5,
        }));
      }
    }
    var envelope_geometry = THREE.CSG.fromCSG(csg_envelope);
  }
  // var material = new THREE.MeshBasicMaterial({
  //   color: 0x0000ff,
  //   reflectivity: 1,
  // });
  // var material = new THREE.MeshLambertMaterial({
  //   color: new THREE.Color(0x0000ff),
  //   emissive: new THREE.Color(0x333333),
  //   reflectivity: 1,
  //   emissiveIntensity: 1,
  // });
  var tex_loader = new THREE.TextureLoader();
  var font_loader = new THREE.FontLoader();
  font_loader.load('/lib/three@0.87.1/fonts/' + params.font, function ( font ) {
    var text_material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.5,
      metalness: 0,
      flatShading: false,
      // transparent: true,
      // opacity: 0.5,
    });
    var lines = params.text.split('\n');
    for (var i=0; i<lines.length; i++) {
      var line = lines[i];
	  var geometry = new THREE.TextGeometry(line, {
	    font: font,
	    size: params.font_size,
	    height: params.envelope_thick,
	    curveSegments: 1,
	    bevelEnabled: false,
	  });
      geometry.computeBoundingBox();
      var width = geometry.boundingBox.max.x - geometry.boundingBox.min.x;
      geometry.translate(
        -width/2,
        params.height / 2 - params.text_margin_top - (i + 1) * params.line_height,
        params.depth / 2 + (params.has_envelope || 0) * params.envelope_thick * 1,
      );
      var object = new THREE.Mesh(geometry, text_material);
      res.add(object);
    }
    var dimension = draw_dimension(
      [0, 1, 2],
      [params.width, params.height, params.depth],
      [0, 1, 0],
      wireframe_material,
      1,
      font,
      1,
      dim_text_material,
      0,
      params.width + ' см',
    );
    res.add(dimension);
    var dimension = draw_dimension(
      [1, 0, 2],
      [params.width, params.height, params.depth],
      [0, -1, 0],
      wireframe_material,
      1,
      font,
      1,
      dim_text_material,
      -1.2,
      params.height + ' см',
    );
    res.add(dimension);
    var dimension = draw_dimension(
      [2, 0, 1],
      [params.width, params.height, params.depth],
      [0, 1, 1],
      wireframe_material,
      -1,
      font,
      1,
      dim_text_material,
      1.2,
      params.depth + ' см',
    );
    res.add(dimension);
    render();
  });
  var fiber_texture = tex_loader.load('fiber_256.jpg', render);
  fiber_texture.wrapS = THREE.MirroredRepeatWrapping;
  fiber_texture.wrapT = fiber_texture.wrapS;
  fiber_texture.repeat.set(4, 4);
  var document_texture = tex_loader.load('document.jpg', render);
  var document_texture = new THREE.MeshPhongMaterial({
    // color: 0xffffff,
    shininess: 0,
    map: document_texture,
  });
  var oracal_material = new THREE.MeshStandardMaterial({
    color: params.envelope_color,
    roughness: 0.5,
    metalness: 0,
    flatShading: false,
    // transparent: true,
    // opacity: 0.5,
  });
  var fiber_material = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    shininess: 10,
    map: fiber_texture,
  });
  var wireframe_material = new THREE.LineBasicMaterial({
    // color: 0xffffff,
    color: 0x000000,
    linewidth: 0.5,
    depthTest: false,
  });
  var tick_material = new THREE.LineBasicMaterial({
    color: 0x999999,
    linewidth: 0.5,
    depthTest: true,
  });
  var dim_text_material = new THREE.MeshBasicMaterial({
    color: 0x000000,
    depthTest: false,
    side: THREE.DoubleSide,
  });
  var file_base_material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 1,
    metalness: 0,
    flatShading: false,
    depthTest: true,
    // transparent: true,
    // opacity: 0.5,
  });
  var glass_material = new THREE.MeshStandardMaterial({
    color: 0x222222,
    emissive: 0x000000,
    blending: THREE.AdditiveBlending,
    roughness: 0.3,
    metalness: 0.0,
    flatShading: false,
    depthWrite: false,
    depthTest: true,
    transparent: true,
    opacity: 0.5,
  });
  var base = new THREE.Mesh(base_geometry, fiber_material);
  res.add(base);
  var envelope = new THREE.Mesh(envelope_geometry, oracal_material);
  res.add(envelope);
  for (var i=0; i<params.files.length; i++) {
    var file_params = params.files[i];
    var file = draw_file(
      file_params,
      file_base_material,
      glass_material,
    );
    var pad = 0.3;
    var document = box(
      file_params.padding.top + pad,
      file_params.padding.left + pad,
      0,
      file_params.inner_width - pad * 2,
      file_params.inner_height - pad * 2,
      0.1,
    );
    var document = new THREE.Mesh(document, document_texture);
    file.add(document);
    res.add(file);
    file.translateX(-params.width / 2 + file_params.left);
    file.translateY(+params.height / 2 - file_params.top);
    file.translateZ(params.depth / 2 + params.envelope_thick * (params.has_envelope || 0));
  }
  var holes_wireframe = new THREE.LineSegments(holes_wireframe, wireframe_material);
  res.add(holes_wireframe);
  var ticks_count = 60,
      ticks = new THREE.Geometry();
  for (var i=0; i<ticks_count; i++) {
    var a = 2 * Math.PI / ticks_count * i,
        r = params.width / 2, y = -params.height * 0.50,
        pos = [r * Math.cos(a), r * Math.sin(a)], c = 0.90;
    ticks.vertices.push(
      new THREE.Vector3(pos[0] * c, y, pos[1] * c),
      new THREE.Vector3(pos[0], y, pos[1]),
    );
  }
  var ticks = new THREE.LineSegments(ticks, tick_material);
  res.add(ticks);
  var light = new THREE.AmbientLight(0xffffff, 0.4);
  res.add(light);
  var light = new THREE.PointLight(0xffffff, 0.6);
  light.position.set(-30, 50, -100);
  res.add(light);
  var light = new THREE.PointLight(0xffffff, 0.6);
  light.position.set(30, 50, 100);
  res.add(light);
  // var pointLightHelper = new THREE.PointLightHelper(light, 1, 0x000000);
  // scene.add(pointLightHelper);
  return res;
}


function init() {
  scene = new THREE.Scene();
  // scene.background = new THREE.Color(model_params.envelope_color);
  scene.background = new THREE.Color(0xffffff);
  // scene.background = new THREE.Color(0x000000);
  renderer = new THREE.WebGLRenderer({antialias: true});
  // renderer = new THREE.CanvasRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  var container = document.getElementById('root');
  container.appendChild(renderer.domElement);
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 10000);
  // camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 100, 10000);
  camera.position.z = 500;
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.addEventListener('change', render);
  controls.enableZoom = true;
  window.addEventListener('resize', onWindowResize, false);

  var model = make_model(model_params);
  var scale = 9;
  model.scale.set(scale, scale, scale);
  scene.add(model);

}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  render();
}


function render() {
  var camera2 = camera.clone();
  var angle = Math.atan2(camera.position.z, camera.position.x),
      radius = Math.sqrt(
        Math.pow(camera.position.z, 2) +
        Math.pow(camera.position.x, 2)
      ),
      angle_step = 2 * Math.PI / 60;
  angle = Math.round(angle / angle_step) * angle_step;
  camera2.position.setX(Math.cos(angle) * radius);
  camera2.position.setZ(Math.sin(angle) * radius);
  camera2.lookAt(new THREE.Vector3(0, 0, 0));
  renderer.render(scene, camera2);
}

window.onload = function() {
  init();
  render();
}
