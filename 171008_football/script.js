if (!Detector.webgl) Detector.addGetWebGLMessage();

var camera, controls, scene, font,
    renderer, dao, raycaster,
    loader = new THREE.FontLoader(),
    mouse = new THREE.Vector2();

window.addEventListener('load', onload1);

function onload1() {
  var oReq = new XMLHttpRequest();
  oReq.addEventListener('load', function() {
    dao = new Dao(JSON.parse(this.responseText));
    loader.load(
      '/lib/three@0.87.1/fonts/droid/droid_sans_regular.typeface.json',
      function (font) {
        window.font = font;
        init();
        render();
      },
    )
  });
  oReq.open('GET', '/170112_match/data.json');
  oReq.send();
};


function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x222222);
  renderer = new THREE.WebGLRenderer({antialias: true});
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  var container = document.getElementById('root');
  container.appendChild(renderer.domElement);
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 10000);
  // camera = new THREE.OrthographicCamera(0, 100, dao.field_height, 0, 1, 10000);
  camera.position.x = -200;
  camera.position.y = dao.field_width * 2;
  camera.position.z = dao.field_height / 2;
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableZoom = true;
  controls.target = new THREE.Vector3(200, dao.field_width/2, dao.field_height/2);
  controls.update();
  controls.addEventListener('change', render);
  window.addEventListener('resize', onWindowResize, false);

  raycaster = new THREE.Raycaster();
  raycaster.linePrecision = 3;
  
  var players = dao.all_players(),
      prev_pos = {},
      geometries = {}, height_geometries = {};

  for (var i=0; i<0+1*players.length; i++) {
    geometries[players[i]] = new THREE.Geometry();
    height_geometries[players[i]] = new THREE.Geometry();
  }

  function get_color(v) {
    var c = 0.2;
    return new THREE.Color(
      v * c,
      1 - v * c,
      1 - v * c,
    )
  }

  var text_material = new THREE.MeshBasicMaterial({
	color: 0xffffff,
	transparent: true,
	opacity: 0.5,
	side: THREE.DoubleSide,
  });
  for (var t=0; t<100000; t+=10000) {
    var shapes = font.generateShapes(t / 1000, 0.1, 1);
    var geometry = new THREE.ShapeGeometry(shapes);
    geometry.scale(100, 100, 100);
    geometry.rotateY(-Math.PI / 2);
    geometry.translate(t / 100, dao.field_width, dao.field_height);
    text = new THREE.Mesh(geometry, text_material);
    scene.add(text);
  }
  
  traj_times = {};
  for (var t=0; t<100000; t+=100) {
    var positions = dao.player_positions(1, t);
    for (var i=0; i<players.length; i++) {
      var player = players[i],
          player_pos = positions[player],
          player_prev_pos = prev_pos[player];
      if (player_pos && 0) {
        height_geometries[player].vertices.push(
	      new THREE.Vector3(t/100, player_pos.Y, player_pos.X),
	      new THREE.Vector3(t/100, dao.field_width/2, dao.field_height/2),
        );
      }
      if (!player_pos || !player_prev_pos) continue;
      geometries[player].vertices.push(
	    new THREE.Vector3((t - 100)/100, player_prev_pos.Y, player_prev_pos.X),
	    new THREE.Vector3(t/100, player_pos.Y, player_pos.X),
      );
      if (!(player in traj_times)) {
        traj_times[player] = [];
      }
      player_pos.T = t;
      traj_times[player].push(player_pos);
      geometries[player].colors.push(
        get_color(player_prev_pos.V),
        get_color(player_pos.V),
      );
      geometries[player].colorsNeedUpdate = true;
    }
    prev_pos = positions;
  }
  
  window.sel_player = 'H77';

  for (var i=0; i<players.length; i++) {
    if (players[i] != sel_player) {
      var material = new THREE.LineBasicMaterial({
        color: 0x444444,
        linewidth: 0.5,
        transparent: true,
        opacity: 0.7,
      });
    } else {
      var material = new THREE.LineBasicMaterial({
        linewidth: 1,
        vertexColors: THREE.VertexColors,
      });
    }
    var line = new THREE.LineSegments(
      geometries[players[i]],
      material
    );
    line.userData.type = 'trajectory';
    line.userData.player = players[i];
    scene.add(line);
    var material = new THREE.LineBasicMaterial({
      color: 0xffffff,
	  transparent: true,
	  opacity: 0.1,
      linewidth: 1,
    });
    var line = new THREE.LineSegments(
      height_geometries[players[i]],
      material
    );
    scene.add(line);
  }

  var white_line_material = new THREE.LineBasicMaterial({
    color: 0xffffff,
    linewidth: 1,
  });
  var geometry = new THREE.BoxGeometry(1000, dao.field_width, dao.field_height),
      geometry = new THREE.EdgesGeometry( geometry );
  geometry.translate(500, dao.field_width/2, dao.field_height/2);
  var box = new THREE.LineSegments(geometry, white_line_material);
  scene.add(box);

  var events = dao.events(1, 0, 100000),
      material = new THREE.MeshBasicMaterial({
        color: 0xbbbbbb
      }),
      ball_path = [];
  for (var i=0; i<events.length; i++) {
    var event = events[i];
    if (event.P == sel_player) {
      var shapes = font.generateShapes(event.title, 0.1, 1);
      var geometry = new THREE.ShapeGeometry(shapes);
      geometry.scale(20, 20, 20);
      geometry.rotateY(-Math.PI / 2);
      geometry.translate(event.T / 100, event.X, event.Y);
      text = new THREE.Mesh(geometry, text_material);
      scene.add(text);
    }
    var geometry = new THREE.DodecahedronGeometry(0.3, 0);
    geometry.translate(event.T/100, event.Y, event.X);
    var mesh = new THREE.Mesh(geometry, material);
    mesh.userData.type = 'event';
    mesh.userData.event = event;
    scene.add(mesh);
  }

  var plane = new THREE.Group();
  plane.name = 'plane';
  scene.add(plane);
  
  var geom = new THREE.Geometry();
  geom.vertices.push(
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, dao.field_height),
  );
  var x_line = new THREE.Line(
    geom,
    white_line_material,
  );
  x_line.name = 'x_line';
  plane.add(x_line);

  var geom = new THREE.Geometry();
  geom.vertices.push(
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, dao.field_width, 0),
  );
  var y_line = new THREE.Line(
    geom,
    white_line_material,
  );
  y_line.name = 'y_line';
  plane.add(y_line);

  
  document.addEventListener(
    'mousemove',
    onDocumentMouseMove,
    false
  );  
}

function update_selected_pos(selected) {
  var plane = scene.getObjectByName('plane'),
      x_line = scene.getObjectByName('x_line'),
      y_line = scene.getObjectByName('y_line');
  plane.position.setX(selected.T / 100);
  x_line.position.setY(selected.Y);
  y_line.position.setZ(selected.X);
}

function onDocumentMouseMove( event ) {
  event.preventDefault();
  mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  var intersects = raycaster.intersectObjects(
    scene.children, true
  );
  for (var i=0; i<intersects.length; i++) {
    var inter = intersects[i];
    if (inter.object.userData.type == 'trajectory') {
      player = inter.object.userData.player;
      if (player != sel_player) continue;
      update_selected_pos(traj_times[player][inter.index / 2]);
      render();
      break;
    }
  }
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
