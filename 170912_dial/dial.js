(function() {
  var lastTime = 0;
  var vendors = ['ms', 'moz', 'webkit', 'o'];
  for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
    window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
    window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] ||
      window[vendors[x]+'CancelRequestAnimationFrame'];
  }
  
  if (!window.requestAnimationFrame)
    window.requestAnimationFrame = function(callback, element) {
      var currTime = new Date().getTime();
      var timeToCall = Math.max(0, 16 - (currTime - lastTime));
      var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
                                 timeToCall);
      lastTime = currTime + timeToCall;
      return id;
    };
  
  if (!window.cancelAnimationFrame)
    window.cancelAnimationFrame = function(id) {
      clearTimeout(id);
    };
}());

var Dial = function(params) {
  var cnv = params.canvas;
  cnv.width = params.width;
  cnv.height = params.height;
  var ctx = cnv.getContext('2d');
  if (!('cx' in params)) {
    params.cx = params.width / 2;
  }
  if (!('cy' in params)) {
    params.cy = params.height / 2;
  }
  if (!('scale' in params)) {
    params.scale = 1;
  }
  this.value = params.min_value;
  this.target_value = 0;
  this.value_speed = 0;
  this.value_acceleration = 0;

  function rgb(c) {
    return 'rgb(' + Math.floor(c[0]) +
      ', ' + Math.floor(c[1]) +
      ', ' + Math.floor(c[2]) + ')';
  }

  this.get_angle = function(value) {
    var rel = (value - params.min_value) /
        (params.max_value - params.min_value);
    return params.min_angle + rel *
        (params.max_angle - params.min_angle);
  }

  this.get_pos = function(value, radius) {
    radius *= params.radius;
    var angle = this.get_angle(value);
    return [
      radius * Math.cos(angle),
      radius * Math.sin(angle),
    ];
  }
  
  this.draw = function() {
    ctx.clearRect(0, 0, cnv.width, cnv.height);
    ctx.save();
    ctx.translate(params.cx, params.cy);
    ctx.scale(params.scale, params.scale);

    for (var i=0; i<params.segments.length; i++) {
      var segment = params.segments[i];
      ctx.beginPath();
      ctx.lineCap = 'round';
      ctx.strokeStyle = rgb(segment.color);
      ctx.lineWidth = params.segment_width;
      ctx.arc(
        0, 0, params.radius,
        this.get_angle(segment.min_value + params.segments_spacing),
        this.get_angle(segment.max_value - params.segments_spacing),
        0
      );
      ctx.stroke();
    }

    ctx.font = params.score_font;
    ctx.fillStyle = rgb(params.score_color);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(Math.round(this.value), 0, 0);

    var pt = this.get_pos(this.value, 1);
    ctx.beginPath();
    ctx.arc(
      pt[0], pt[1], params.pointer_radius,
      0, 2 * Math.PI, 0
    );
    ctx.fillStyle = rgb(params.pointer_color);
    ctx.fill();
    ctx.strokeStyle = rgb(params.pointer_border_color);
    ctx.lineWidth = params.pointer_line_width;
    ctx.stroke()

    ctx.font = params.caption_font;
    ctx.fillStyle = rgb(params.caption_color);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    var rad = params.caption_radius;
    for (var i=0; i<params.captions.length; i++) {
      var caption = params.captions[i];
      var angle = this.get_angle(caption.value);
      var len = ctx.measureText(caption.text).width;
      angle -= len / 2 / rad;
      for (var j=0; j<caption.text.length; j++) {
        var ch = caption.text[j];
        ctx.save();
        ctx.rotate(angle + Math.PI / 2);
        ctx.translate(0, -rad);
        ctx.fillText(ch, 0, 0);
        ctx.restore();
        var len = ctx.measureText(ch).width;
        angle += len / rad;
      }
    }
    ctx.restore();
  }

  this.set_value = function(value) {
    this.target_value = value;
    this.value_set_time = (+new Date()) / 1000;
  }

  this.start_animation = function() {
    this.prev_tick = (+new Date()) / 1000;
    this.value_set_time = this.prev_tick;
    this.do_frame();
  }

  this.do_frame = function() {
    var cur_t = (+new Date()) / 1000
    var dt = cur_t - this.prev_tick;
    this.prev_tick = cur_t;
    var last_set_passed = (+new Date()) / 1000 - this.value_set_time;
    dt *= 8;
    this.value += dt * this.value_speed;
    this.value_speed += dt * (this.target_value - this.value);
    console.log(cur_t, dt, last_set_passed, this.value, this.value_speed)
    this.draw();
    requestAnimationFrame(this.do_frame.bind(this));
  }
  
};
