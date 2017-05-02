function CherryFall(params) {
  var canvas = params.canvas;
  canvas.width = params.width;
  canvas.height = params.height;
  var ctx = canvas.getContext('2d');

  function rgb(r, g, b) {
    return 'rgb(' + Math.floor(r) + ',' +
      Math.floor(g) + ',' + Math.floor(b) + ')';
  }

  function gray(val) {
    val *= 255;
    return rgb(val, val, val);
  }

  function load_image(fname, onload) {
    var img = new Image();
    img.src = fname;
    if (onload) {
      img.onload = onload;
    }
    return img;
  }
  
  function load_images() {
    var images = [];
    for (var i=0; i<5; i++) {
      images[i] = load_image('i/cherry' + (i + 1) + '.png');
    }
    return images;
  }

  var images = load_images();
  var bg = load_image('i/bg.jpg');
  var effect = load_image('i/effect1.png');
  var cherries_pat = null;
  var cherries_bg = load_image('i/cherries.jpg', function() {
    cherries_pat = ctx.createPattern(cherries_bg, 'repeat');
  });

  function calc_neighbors(dist) {
    var bodies = engine.world.bodies;
    var res = {};
    var res_pairs = [];
    for (var i=0; i<bodies.length; i++) {
      res[bodies[i].id] = [];
    }
    for (var i=0; i<bodies.length; i++) {
      var body = bodies[i];
      if (body.id <= 3) continue;
      if (body.position.x < 0 || body.position.x > canvas.width) {
        continue;
      }
      if (body.position.y + dist >= canvas.height) {
        res[1].push(body.id);
        res[body.id].push(1);
        res_pairs.push([1, body.id])
      }
      if (body.position.x - dist <= 0) {
        res[2].push(body.id);
        res[body.id].push(2);
        res_pairs.push([2, body.id])
      }
      if (body.position.x + dist >= canvas.width) {
        res[3].push(body.id);
        res[body.id].push(3);
        res_pairs.push([3, body.id])
      }
    }
    for (var i=0; i<bodies.length; i++) {
      var posA = bodies[i].position;
      var idA = bodies[i].id;
      if (idA <= 3) continue;
      for (var j=i+1; j<bodies.length; j++) {
        var posB = bodies[j].position;
        var dx = posA.x - posB.x;
        var dy = posA.y - posB.y;
        if (dx * dx + dy * dy <= 4 * dist * dist) {
          var idB = bodies[j].id;
          if (idB <= 3) continue;
          res[idA].push(idB);
          res[idB].push(idA);
          res_pairs.push([idA, idB])
        }
      }
    }
    return {
      dict: res,
      pairs: res_pairs,
    }
  }

  function calc_ground(neighbors) {
    var ground = {};
    var lground = {};
    var rground = {};
    for (var i=0; i<engine.world.bodies.length; i++) {
      var vert_id = engine.world.bodies[i].id;
      ground[vert_id] = false;
      lground[vert_id] = false;
      rground[vert_id] = false;
    }
    ground[1] = true;
    lground[1] = true;
    lground[2] = true;
    rground[1] = true;
    rground[3] = true;
    var changed = true;
    while (changed) {
      changed = false;
      for (var i=0; i<neighbors.length; i++) {
        bodyA = neighbors[i][0];
        bodyB = neighbors[i][1];
        var posA = Matter.Composite.get(engine.world, bodyA, 'body').position;
        var posB = Matter.Composite.get(engine.world, bodyB, 'body').position;
        if (ground[bodyA] && !ground[bodyB] && bodyB > 3) {
          ground[bodyB] = true;
          changed = true;
        }
        if (ground[bodyB] && !ground[bodyA] && bodyA > 3) {
          ground[bodyA] = true;
          changed = true;
        }
        if (bodyA == 1) {
            if (!lground[bodyB]) {
              lground[bodyB] = true;
              changed = true;
            }
            if (!rground[bodyB]) {
              rground[bodyB] = true;
              changed = true;
            }
        }
        if (posA.x > posB.x) {
          var t = posA;
          posA = posB;
          posB = t;
          t = bodyA;
          bodyA = bodyB;
          bodyB = t;
        }
        if (lground[bodyA] && !lground[bodyB]) {
          lground[bodyB] = true;
          changed = true;
        }
        if (rground[bodyB] && !rground[bodyA]) {
          rground[bodyA] = true;
          changed = true;
        }
      }
    }
    return {
      b: ground,
      l: lground,
      r: rground,
    };
  }

  var once_pairs = {};
  function calc_max_y() {
    var neighbors = calc_neighbors(50);
    window.neighbors = neighbors;
    var ground = calc_ground(neighbors.pairs);
    ground.b[2] = true;
    ground.b[3] = true;
    window.ground = ground;
    // var bodies = engine.world.bodies;
    // for (var i=0; i<bodies.length; i++) {
    //   var body = bodies[i];
    //   if (body.id <= 3) continue;
    //   if (ground[body.id]) {
    //     var body_x = Math.round(body.position.x);
    //     var body_y = Math.round(body.position.y);
    //     for (var dx=-50; dx<=50; dx++) {
    //       var x = body_x + dx;
    //       if (x < 0 || x >= max_y.length) continue;
    //       max_y[x] = Math.max(max_y[x], (canvas.height - body_y) - Math.abs(dx));
    //     }
    //   }
    // }
    max_y = new Int16Array(canvas.width);
    for (var i=0; i<neighbors.pairs.length; i++) {
      var bodyA = neighbors.pairs[i][0];
      var bodyB = neighbors.pairs[i][1];
      if (!ground.l[bodyA] || !ground.r[bodyA] || !ground.b[bodyA]) continue;
      if (!ground.l[bodyB] || !ground.r[bodyB] || !ground.b[bodyB]) continue;
      once_pairs[bodyA + '_' + bodyB] = true;
    }
    for (var pair in once_pairs) {
      var t = pair.split('_');
      var bodyA = +t[0];
      var bodyB = +t[1];
      var posA = Matter.Composite.get(engine.world, bodyA, 'body').position;
      var posB = Matter.Composite.get(engine.world, bodyB, 'body').position;
      if (bodyA == 2 || bodyA == 3) {
        posA = {x: posA.x, y: posB.y};
      }
      if (bodyA == 1) continue;
      if (posA.x > posB.x) {
        var t = posA;
        posA = posB;
        posB = t;
      }
      for (var cur_x=Math.floor(posA.x); cur_x<=Math.ceil(posB.x); cur_x++) {
        if (cur_x < 0 || cur_x >= max_y.length) continue;
        var cur_a = (cur_x - posA.x) / (posB.x - posA.x);
        var cur_y = posA.y * (1 - cur_a) + posB.y * cur_a;
        max_y[cur_x] = Math.max(max_y[cur_x], canvas.height - cur_y);
      }
    }
    return max_y;
  }
  
  function draw(cur_time) {
    max_y = calc_max_y();
    ctx.drawImage(
      bg,
      0, 0, bg.width, bg.height,
      0, 0, canvas.width, canvas.height
    );
    var bodies = engine.world.bodies;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    for (var i=0; i<max_y.length; i++) {
      ctx.lineTo(i, canvas.height - max_y[i]);
    }
    ctx.lineTo(canvas.width, canvas.height);
    ctx.closePath();
    ctx.fillStyle = cherries_pat;
    ctx.fill();
    for (var i=0; i<bodies.length; i++) {
      var body = bodies[i];
      if (i < 3) continue;
      // if (neighbors[1].indexOf(body.id) == -1) continue;
      var x = body.position.x;
      var y = body.position.y;
      var r = body.position.radius;
      var img = body.img;
      ctx.save()
      ctx.translate(x, y);
      ctx.rotate(body.angle);
      ctx.drawImage(img, - img.width / 2, - img.height / 2);
      ctx.restore();
      // ctx.textAlign = 'center';
      // ctx.verticalAlign = 'middle';
      // ctx.font = '20px Helvetica';
      // ctx.fillStyle = 'white';
      // ctx.fillText(body.id, x, y);
      // ctx.beginPath();
      // ctx.arc(x, y, params.radius, 0, 2 * Math.PI);
      // ctx.fillStyle = gray(i / bodies.length);
      // ctx.fill();
    }
    // ctx.save();
    // ctx.globalCompositeOperation = 'destination-over';
    ctx.drawImage(
      effect,
      0, 0, effect.width, effect.height,
      0, 0, canvas.width, canvas.height
    );
    // ctx.restore();
  }

  function init_cherry_falls(count) {
    var cherry_falls = [];
    var rad = 47;
    var count = canvas.width * canvas.height / rad / rad;
    for (var i=0; i<count; i++) {
      var t = Math.random();
      cherry_falls.push({
        // t: i / count,
        t: t,
        x: canvas.width * Math.random(),
        y: - 300 - t * canvas.height,
        r: rad,
        img: images[i % images.length],
      });
    }
    return cherry_falls;
  }
  var cherry_falls = init_cherry_falls();

  function make_world() {
    var world = Matter.World.create({
      gravity: {x: 0, y: 1},
      bounds: Matter.Bounds.create([
        {x: 0, y: -canvas.height},
        {x: canvas.width, y: canvas.height},
      ])
    });
    var rect = Matter.Bodies.rectangle;
    var w = 47;
    Matter.World.add(world, [
      rect(canvas.width / 2, canvas.height + w, canvas.width, 2 * w, { isStatic: true }), // id == 1
      rect(-w, canvas.height / 2, 2 * w, canvas.height, { isStatic: true }),
      rect(canvas.width + w, canvas.height / 2, 2 * w, canvas.height, { isStatic: true }),
    ]);
    return world;
  }

  var engine = Matter.Engine.create({
    world: make_world()
  });
  Matter.Events.on(engine, "collisionActive", on_collision);

  window.engine = engine;

  var freezed = {1: true, 2: true, 3: true};
  var contacted = {};
  var last_collisions = [];
  function on_collision(obj) {
    var hit_freezed = {};
    var pairs = obj.pairs;
    last_collisions = pairs;
    for (var i=0; i<pairs.length; i++) {
      var bodyA = pairs[i].bodyA.id;
      var bodyB = pairs[i].bodyB.id;
      if ((bodyA in freezed) == (bodyB in freezed)) continue;
      var new_connection = false;
      if ((bodyA in hit_freezed) || bodyB == 1) {
        freezed[bodyA] = true;
        Matter.Body.setStatic(pairs[i].bodyA, true);
        new_connection = true;
      }
      if ((bodyB in hit_freezed) || bodyA == 1) {
        freezed[bodyB] = true;
        Matter.Body.setStatic(pairs[i].bodyB, true);
        new_connection = true;
      }
      hit_freezed[bodyA] = true;
      contacted[bodyA] = true;
      hit_freezed[bodyB] = true;
      if (bodyA > 3) {
        contacted[bodyB] = true;
      }
      if (new_connection) {
        // var posA = pairs[i].bodyA.position;
        // var posB = pairs[i].bodyB.position;
        // if (bodyA == 2 || bodyA == 3) {
        //   posA = {x: posA.x, y: posB.y};
        // }
        // if (posA.x > posB.x) {
        //   var t = posA;
        //   posA = posB;
        //   posB = t;
        // }
        // for (var cur_x=Math.floor(posA.x); cur_x<=Math.ceil(posB.x); cur_x++) {
        //   var cur_a = (cur_x - posA.x) / (posB.x - posA.x);
        //   var cur_y = posA.y * (1 - cur_a) + posB.y * cur_a;
        //   max_y[cur_x] = Math.max(max_y[cur_x], canvas.height - cur_y);
        // }
      }
    }
  }

  function update(cur_t, delta_t) {
    for (var i=0; i<cherry_falls.length; i++) {
      var elem = cherry_falls[i];
      if (elem.t > cur_t - delta_t && elem.t <= cur_t) {
        var body = Matter.Bodies.circle(elem.x, elem.y, elem.r);
        body.img = elem.img;
        Matter.World.add(engine.world, body);
      }
      // break;
    }
    Matter.Engine.update(engine, delta_t * 1000 * 10);
  }

  var requestAnimationFrame = window.requestAnimationFrame;
  if (!requestAnimationFrame) {
    requestAnimationFrame = (function() {
      return window.webkitRequestAnimationFrame ||
        // comment out if FF4 is slow (it caps framerate at ~30fps:
        // https://bugzilla.mozilla.org/show_bug.cgi?id=630127)
        window.mozRequestAnimationFrame || 
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function(
          /* function FrameRequestCallback */ callback,
          /* DOMElement Element */ element
        ) {
          window.setTimeout(callback, 1000 / 60);
        };
    })();
  }

  // var prev_t = -1;
  // function animate() {
  //   var cur_t = (+new Date() - t_start) / 1000 / 10;
  //   var delta_t = cur_t - prev_t;
  //   if (cur_t > 1) return;
  //   update(cur_t, delta_t);
  //   draw();
  //   requestAnimationFrame(animate);
  //   prev_t = cur_t;
  // }
  // var t_start = +new Date();

  var cur_t = 0;
  function animate() {
    var delta_t = 1/500;
    cur_t += delta_t;
    if (cur_t > 1) return;
    update(cur_t, delta_t);
    draw();
    requestAnimationFrame(animate);
    // setTimeout(animate, 100);
  }

  animate();
}
