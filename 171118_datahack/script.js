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

loader.load(
	'map_inv_70.jpg',
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

function flag(params) {
  var res = new THREE.Group();
  return res;
}

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x333333);
  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  var container = document.getElementById('root');
  container.appendChild(renderer.domElement);
  camera = new THREE.PerspectiveCamera(
    60, window.innerWidth / window.innerHeight,
    1, 1000000
  );
  window.addEventListener('resize', onWindowResize, false);
  map_texture.minFilter = THREE.LinearFilter;
  var map_geo = [[55880.45, 55853.72], [37479.55, 37515.24]],
      map_geo_center = [
        map_geo[0][0] + map_geo[0][1],
        map_geo[1][0] + map_geo[1][1],
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
    map_material = new THREE.MeshBasicMaterial({
	map: map_texture,
  }),
      map_geometry = new THREE.PlaneGeometry(
        Math.abs(map_geo[0][0] - map_geo[0][1]),
        Math.abs(map_geo[1][0] - map_geo[1][1]),
      );
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
  // map_geometry.rotateX(Math.PI);
  map_geometry.rotateX(-Math.PI / 2 );
  map_geometry.translate(map_geo_center[0], 0, map_geo_center[1]);
  map_geometry.faceVertexUvs = [[
    [map_px_pts[1], map_px_pts[0], map_px_pts[2]],
    [map_px_pts[0], map_px_pts[3], map_px_pts[2]],
  ]];
  var map_plane = new THREE.Mesh(map_geometry, map_material);
  scene.add(map_plane);
  var col = 0xffffff,
      grid_scale =  50,
      grid_helper = new THREE.GridHelper(10, 10, col, col);
  grid_helper.position.set(, -0.1, map_geo_center[1]);
  grid_helper.scale.set(10, 1, 10);
  scene.add(grid_helper);
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

