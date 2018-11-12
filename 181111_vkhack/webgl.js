let webglEnabled = false;
let webglNeedsUpdate = true;

const dpi = window.devicePixelRatio;

webglCanvas.style.width = width;
webglCanvas.style.height = height;
webglCanvas.width = Math.round(width * dpi);
webglCanvas.height = Math.round(height * dpi);

let avatarsCoords = [];
let avatarsTextures = [];
let edgesCoords = [];

let drawAvatars = () => {};

window.addEventListener('load', () => {
  const avatars = new Image();
  avatars.crossOrigin = "Anonymous";
  avatars.src = 'https://i.imgur.com/EaxS9EB.jpg';
  // avatars.src = './avatars/comp1.jpg';
  avatars.onload = function() {
    drawAvatars = makeDrawAvatars(avatars);
    loaded();
  }  
})

const setupCamera2d = regl({
  uniforms: {
    cam: () => [
      transform.x,
      transform.y,
      transform.k,
    ],
    screen: [width, height],
    dpi,
  }
});

function makeDrawAvatars(avatars) {
  return regl({
    frag: `
      precision mediump float;
      uniform sampler2D texture;
      uniform float textureRatio;
      varying vec3 v_textureCoords;
      void main() {
        vec2 pc = gl_PointCoord;
        float d = length(pc - 0.5);
        if (d > 0.5) {
          discard;
        } else if ((0.5 - d) / 0.5 < 0.04) {
          gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
          return;
        }
        float tx0 = v_textureCoords.x;
        float ty0 = v_textureCoords.y;
        float tw = v_textureCoords.z;
        float th = tw / textureRatio;
        vec2 uv = vec2(tx0 + pc.x * tw, ty0 + pc.y * th);
        gl_FragColor = texture2D(texture, uv);
      }`,

    vert: `
      precision mediump float;
      uniform float dpi;
      uniform vec3 cam;
      uniform vec2 screen;
      attribute vec3 position;
      attribute vec3 textureCoords;
      varying vec3 v_textureCoords;
      void main() {
        vec2 pos = vec2((cam.x + position.x * cam.z) / screen.x * 2.0 - 1.0, 1.0 - (cam.y + position.y * cam.z) / screen.y * 2.0);
        gl_Position = vec4(pos, 0, 1.0);
        gl_PointSize = position.z * dpi * cam.z;
        v_textureCoords = textureCoords;
      }`,

    attributes: {
      position: regl.prop('avatarsCoords'),
      textureCoords: regl.prop('avatarsTextures'),
      /*[
        [0, 0 / 12, 1 / 16],
        [0, 1 / 12, 1 / 16],
        [0, 2 / 12, 1 / 16],
      ],*/
    },

    uniforms: {
      texture: regl.texture({
        data: avatars,
        mag: 'linear',
      }),
      textureRatio: 12 / 16,
    },
  
    primitive: 'points',
    count: (ctx, props) => props.avatarsCoords.length,
  });
}

const drawEdges = regl({
  frag: `
    precision mediump float;
    void main() {
      gl_FragColor = vec4(0.5, 0.5, 1.0, 0.5);
    }`,

  vert: `
    precision mediump float;
    attribute vec2 coords;
    uniform float dpi;
    uniform vec3 cam;
    uniform vec2 screen;
    void main() {
      vec2 pos = vec2((cam.x + coords.x * cam.z) / screen.x * 2.0 - 1.0, 1.0 - (cam.y + coords.y * cam.z) / screen.y * 2.0);
      gl_Position = vec4(pos, 0.5, 1.0);
    }`,

  lineWidth: 2,

  blend: {
    func: {
      srcRGB: 'src alpha',
      dstRGB: 1,
      srcAlpha: 'src alpha',
      dstAlpha: 1,
    },
    equation: {
      rgb: 'add',
      alpha: 'add'
    },
    enable: true,
  },

  attributes: {
    coords: regl.prop('coords'),
  },

  primitive: 'lines',
  count: (ctx, props) => props.coords.length * 2,
});

let usersData = null;

function generateUsers() {
  usersData = [];
  avatarsCoords = [];
  bloodStationsData.forEach(({r1, x1, y1, r1steps}) => {
    const pattern = patterns[{0.5: '0.5', 0.75: '0.75', 1.0: '1.0', 1.25: '1.25', 1.5: '1.5', 1.75: '1.75', 2.0: '2.0', 2.25: '2.25', 2.5: '2.5', 2.75: '2.75', 3.0: '3.0'}[r1steps]];
    const coeff = 1 / r1steps * 3;
    const coeff2 = 1 / 20;
    pattern.forEach(([x, y, r]) => {
      // inverseGroup([x * coeff, y * coeff, r * coeff]);
      avatarsCoords.push([x1 + x * coeff2, y1 + y * coeff2, r * coeff2]);
    });
  });
  edgesCoords = [];
  for (let i=0; i<avatarsCoords.length-1; i++) {
    const source = avatarsCoords[i].slice(0, 2);
    const target = avatarsCoords[i+1].slice(0, 2);
    const dist = Math.sqrt(Math.pow(source[0] - target[0], 2) + Math.pow(source[1] - target[1], 2));
    if (dist < 100) {
      let prob;
      if (dist < 3) {
        prob = 0.3;
      } else if (dist < 10) {
        prob = 0.3; // 0.5;
      } else if (dist < 100) {
        prob = 0.05; // 1;
      } else {
        prob = 0;
      }
      if (Math.random() < prob) {
        edgesCoords.push([source, target]);
      }
    }
  }
  for (let i=0; i<avatarsCoords.length-1; i++) {
    const source = avatarsCoords[i].slice(0, 2);
    const target = avatarsCoords[Math.floor(Math.random() * avatarsCoords.length)].slice(0, 2);
    const dist = Math.sqrt(Math.pow(source[0] - target[0], 2) + Math.pow(source[1] - target[1], 2));
    let prob;
    if (dist > 100) {
      prob = 0.00;
    } else if (dist > 50) {
      prob = 0.1;
    } else if (dist > 5) {
      prob = 0.0;
    } else if (dist > 1) {
      prob = 0.0;
    } else {
      prob = 0.0;
    }
    if (Math.random() < prob) {
      edgesCoords.push([source, target]);
    }
  }
  const avatarsTexturesBank = d3.range(36).map(i => {
    const row = i % 16;
    const col = Math.floor(i / 16);
    return [row / 16, col / 12, 1 / 16];
  });
  avatarsTextures = [];
  for (let i=0; i<30000; i++) {
    avatarsTextures.push(avatarsTexturesBank[Math.floor(Math.random() * avatarsTexturesBank.length)]);
  }
}

function webglUpdate() {
  if (webglEnabled) {
    if (webglNeedsUpdate) {
      console.log('webgl redraw', avatarsCoords);
      setupCamera2d({}, () => {
        drawAvatars({avatarsCoords, avatarsTextures});
        drawEdges({coords: edgesCoords});
      });
      webglNeedsUpdate = false;  
    }
  }
}

function cycleInit() {
  regl.frame(() => {
    update();
    webglUpdate();
  });
}