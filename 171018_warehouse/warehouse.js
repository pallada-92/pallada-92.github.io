if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var stats;
var camera, controls, scene, renderer;

init();
render();

function panel(mat_main, mat_spacing, w, h, spacing_w, spacing_h, side) {
  var res = new THREE.Group(),
      rect_w = w - spacing_w * 2,
      rect_h = h - spacing_h * 2,
      geometry, mesh;
  geometry = new THREE.PlaneGeometry(w, h);
  if (side == 1) {
    geometry.scale(-1, 1, 1);
  }
  geometry.translate(w/2, h/2, w * 0.01 * (1 - side * 2));
  mesh = new THREE.Mesh(geometry, mat_spacing);
  mesh.matrixAutoUpdate = false;
  res.add(mesh);
  geometry = new THREE.PlaneGeometry(rect_w, rect_h);
  if (side == 1) {
    geometry.scale(-1, 1, 1);
  }
  geometry.translate(rect_w/2 + spacing_w, rect_h/2 + spacing_h, w * 0.02 * (1 - side * 2));
  mesh = new THREE.Mesh(geometry, mat_main);
  mesh.matrixAutoUpdate = false;
  res.add(mesh);
  return res;
}

function generate_warehouse(params) {
  var res = new THREE.Group(),
      red = new THREE.MeshBasicMaterial( { color: 0xaa0000 } ); //, side: THREE.DoubleSide} ),
      gray1 = new THREE.MeshBasicMaterial( { color: 0xaaaaaa } ); //, side: THREE.DoubleSide} );
      gray1_both = new THREE.MeshBasicMaterial( { color: 0xaaaaaa, side: THREE.DoubleSide} );
      gray2 = new THREE.MeshBasicMaterial( { color: 0xdddddd } ); //, side: THREE.DoubleSide} );
  for (var dir=0; dir<4; dir++) {
    for (var side=0; side<2; side++) {
      var rows;
      if (dir == 0) {
        if (side == 0) {
          rows = [14];
        } else {
          rows = [10, 4];
        }
      } else if (side == 0) {
        rows = [11];
      } else {
        rows = [10, 1];
      }
      var columns;
      if (dir == 0 || dir == 2) {
        columns = params.cols_x;
      } else {
        columns = params.cols_z;
      }
      var group = new THREE.Group();
      for (var column=0; column<columns; column++) {
        var draw_door = (column == 9 || column == 23) && (dir == 1 || dir == 3),
            row_accum = draw_door;
        for (var row=0; row<rows.length; row++) {
          var p = panel(red, gray1, 1, rows[row] - draw_door, 0.1, 0.1, side);
          p.translateX(column);
          p.translateY(row_accum);
          group.add(p);
          row_accum += rows[row] - draw_door;
          draw_door = false;
        }
      }
      group.rotateY(Math.PI / 2 * (dir - 1));
      if (dir == 0) {
        group.translateX(-params.cols_x);
      } else if (dir == 2) {
        group.translateZ(params.cols_z);
      } else if (dir == 3) {
        group.translateX(-params.cols_z);
        group.translateZ(params.cols_x);
      }
      res.add(group);
    }
  }

  var ceil = new THREE.Group();
  geometry = new THREE.PlaneGeometry(params.cols_z, params.cols_x);
  geometry.translate(params.cols_z/2, params.cols_x/2, 0);
  var mesh = new THREE.Mesh(geometry, gray1_both);
  mesh.matrixAutoUpdate = false;
  ceil.add(mesh);
  for (var i=1; i<params.cols_x; i++) {
    var geometry = new THREE.BoxGeometry( params.cols_z, 0.2, 0.2 );
    geometry.translate(params.cols_z/2, 0.1, 0.11);
    geometry.translate(0, i - 0.1, 0);
    mesh = new THREE.Mesh(geometry, gray2);
    ceil.add(mesh);
  }
  for (var i=1; i<params.cols_z; i++) {
    var geometry = new THREE.BoxGeometry( 0.2, params.cols_x, 0.2 );
    geometry.translate(0.1, params.cols_x/2, 0.11);
    geometry.translate(i - 0.1, 0, 0);
    mesh = new THREE.Mesh(geometry, gray2);
    ceil.add(mesh);
  }
  ceil.rotateX(-Math.PI / 2);
  ceil.translateZ(9);
  res.add(ceil);
  
  res.translateX(-params.cols_z / 2);
  res.translateZ(params.cols_x / 2);
  return res;
}

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color( 0xeeeeee );
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  var container = document.getElementById( 'root' );
  container.appendChild( renderer.domElement );
  camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 10000 );
  camera.position.z = 40;
  camera.position.y = 30;
  camera.position.x = 30;
  controls = new THREE.OrbitControls( camera, renderer.domElement );
  controls.addEventListener( 'change', render ); // remove when using animation loop
  controls.enableZoom = true;
  // world
  scene.add(
    generate_warehouse({
      cols_x: 27,
      cols_z: 37,
    })
  );
  // lights
  // var light = new THREE.AmbientLight( 0x222222 );
  // scene.add( light );
  //
  // stats = new Stats();
  // container.appendChild( stats.dom );
  //
  window.addEventListener( 'resize', onWindowResize, false );
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
  render();
}

function animate() {
  requestAnimationFrame( animate );
  controls.update(); // required if controls.enableDamping = true, or if controls.autoRotate = true
  stats.update();
  render();
}

function render() {
  renderer.render( scene, camera );
}
