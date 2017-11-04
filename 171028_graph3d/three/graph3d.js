if (!Detector.webgl) Detector.addGetWebGLMessage();

var camera, controls, scene, renderer,
    raycaster, intersects,
    mouse = new THREE.Vector2(),
    points_indices, rev_edges_indices;

function make_graph() {
  var vertices = [new THREE.Vector3(0, 0, 0)],
      edges = [],
      degrees = [],
      vertex_count = 1000,
      edge_count = vertex_count / 2 * 10,
      range = 1000;
  while (vertex_count > 0) {
    var pos = new THREE.Vector3(
      (2 * Math.random() - 1) * range,
      (2 * Math.random() - 1) * range,
      (2 * Math.random() - 1) * range,
    );
    var prop = pos.length() / range;
    if (prop > 1) continue;
    if (prop > 0.5) {
      var prob = (prop - 0.5) / 0.5;
      if (Math.random() > prob) {
        continue;
      }
    }
    vertices.push(pos);
    degrees.push(0);
    vertex_count--;
  }
  while (edge_count > 0) {
    var v1i = Math.floor(Math.random() * vertices.length),
        v2i = Math.floor(Math.random() * vertices.length),
        v1 = vertices[v1i],
        v2 = vertices[v2i],
        dist = v1.distanceTo(v2),
        prop = dist / range,
        prob = Math.pow(prop, 0.1);
    if (Math.random() < prob) continue;
    edges.push([v1i, v2i]);
    edge_count--;
    degrees[v1i]++;
    degrees[v2i]++;
  }
  for (var i=0; i<vertices.length; i++) {
    if (degrees[i] <= 0) {
      vertices[i] = null;
    }
  }
  for (var i=0; i<edges.length; i++) {
    if (
      vertices[edges[i][0]] === null ||
      vertices[edges[i][1]] === null
    ) {
      edges[i] = null;
    }
  }
  return {
    vertices: vertices,
    edges: edges,
  };
}

var graph = make_graph();

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  renderer = new THREE.WebGLRenderer({
    antialias: true,
  });
  renderer.sortObjects = false;
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  var container = document.getElementById('root');
  container.appendChild(renderer.domElement);
  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    1,
    10000
  );
  camera.position.z = 500;
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.addEventListener('change', render);
  controls.enableZoom = true;
  raycaster = new THREE.Raycaster();
  raycaster.params.Points.threshold = 4;
  stats = new Stats();
  container.appendChild(stats.dom);
  window.addEventListener('resize', onWindowResize, false);
  document.addEventListener('mousemove', onDocumentMouseMove, false);

  rev_edges_indices = [];
  var edges = new THREE.Geometry();
  for (var i=0; i<graph.edges.length; i++) {
    var edge = graph.edges[i];
    if (edge === null) continue;
    rev_edges_indices[i] = edges.vertices.length;
    edges.vertices.push(
      graph.vertices[edge[0]],
      graph.vertices[edge[1]],
    );
    edges.colors.push(
      new THREE.Color(0xffffff),
      new THREE.Color(0xffffff),
    );
  }
  var line_material = new THREE.LineBasicMaterial({
    color: 0xffffff,
	linewidth: 2,
    transparent: true,
    opacity: 0.1,
    depthTest: false,
    vertexColors: THREE.VertexColors,
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.SrcAlphaFactor,
    blendDst: THREE.OneFactor,
    // blendDst: THREE.OneMinusSrcAlphaFactor,
  });
  var edges = new THREE.LineSegments(edges, line_material);
  edges.name = 'edges';
  scene.add(edges);

  points_indices = [];
  var points = new THREE.Geometry();
  for (var i=0; i<graph.vertices.length; i++) {
    var vertex = graph.vertices[i];
    if (vertex === null) continue;
    points.vertices.push(vertex);
    points_indices.push(i);
  }
  var points_material = new THREE.PointsMaterial({
    color: 0xff0000,
    visible: false,
    size: 3,
    depthTest: false,
    transparent: true,
    opacity: 1,
  });
  var points = new THREE.Points(points, points_material);
  points.name = 'vertices';
  scene.add(points);

}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  render();
}

function render() {
  raycaster.setFromCamera(mouse, camera);
  renderer.render(scene, camera);
}

function onDocumentMouseMove(event) {
  if (controls.get_state() != -1) {
    console.log('control active');
    return;
  }
  event.preventDefault();
  mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
  var vertices = scene.getObjectByName('vertices');
  intersects = raycaster.intersectObject(vertices);
  if (intersects.length == 0) return;
  var vertex_id = intersects[0].index,
      graph_vertex_id = points_indices[vertex_id],
      edges = scene.getObjectByName('edges');
  var egi = 0;
  for (var i=0; i<graph.edges.length; i++) {
    var edge = graph.edges[i];
    if (edge === null) continue;
    if (
      edge[0] == graph_vertex_id ||
      edge[1] == graph_vertex_id
    ) {
      edges.geometry.colors[egi * 2].set(0xff8888);
      edges.geometry.colors[egi * 2 + 1].set(0xff8888);
    } else {
      edges.geometry.colors[egi * 2].set(0xffffff);
      edges.geometry.colors[egi * 2 + 1].set(0xffffff);
    }
    egi++;
  }
  edges.geometry.colorsNeedUpdate = true;
}

function animate() {
  requestAnimationFrame(animate);
  render();
  stats.update();
}

window.onload = function() {
  init();
  animate();
}
