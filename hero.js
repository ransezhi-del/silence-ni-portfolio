/* Photo-textured mesh animation. All coordinates are relative to the original
   image; hands and torso move locally while the desk, laptop and chair stay put. */
(() => {
  const canvas = document.querySelector('#workstation-canvas');
  const photo = document.querySelector('#workstation-image');
  const scene = document.querySelector('.workstation');
  const hero = document.querySelector('#home');
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  let gl;
  try { gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false, powerPreference: 'low-power' }); }
  catch { return; }
  if (!gl) return; // The original image is the static fallback.

  const vertexSource = `
    precision highp float;
    attribute vec2 a_position;
    uniform float u_time;
    uniform float u_motion;
    uniform vec2 u_pointer;
    varying vec2 v_uv;
    float region(vec2 p, vec2 center, vec2 radius) {
      return 1.0 - smoothstep(0.42, 1.0, length((p - center) / radius));
    }
    vec2 rotateAround(vec2 p, vec2 pivot, float angle) {
      vec2 q = p - pivot;
      float c = cos(angle), s = sin(angle);
      return vec2(c*q.x - s*q.y, s*q.x + c*q.y) + pivot - p;
    }
    void main() {
      vec2 p = a_position;
      v_uv = p;
      float t = u_time;
      float cycle = mod(t, 12.0);
      float typing = (1.0 - smoothstep(7.2, 8.1, cycle)) + smoothstep(10.8, 11.9, cycle);
      float thinking = smoothstep(7.0, 8.6, cycle) * (1.0 - smoothstep(10.2, 11.9, cycle));
      float breath = sin(t * 1.25);
      vec2 delta = vec2(0.0);

      // Head pivots gently at the neck, including a brief thinking pause.
      float head = region(p, vec2(0.666, 0.146), vec2(0.132, 0.150));
      float headAngle = sin(t * 0.63) * 0.009 + thinking * 0.021 + u_pointer.x * 0.008;
      delta += (rotateAround(p, vec2(0.692, 0.255), headAngle)
        + vec2(0.0, breath * 0.0014 + u_pointer.y * 0.0014)) * head;

      // Breathing belongs to the shirt, and fades out before reaching the chair.
      float chest = region(p, vec2(0.733, 0.340), vec2(0.128, 0.118));
      delta += vec2(breath * 0.0011, breath * -0.0019) * chest;
      float sleeve = region(p, vec2(0.561, 0.444), vec2(0.110, 0.094));
      delta += vec2(0.0, breath * -0.0009) * sleeve;

      // Asynchronous finger presses, with quiet intervals every twelve seconds.
      float leftHand = region(p, vec2(0.416, 0.356), vec2(0.058, 0.043));
      float rightHand = region(p, vec2(0.496, 0.323), vec2(0.061, 0.041));
      float leftPress = sin(t * 21.0) * 0.65 + sin(t * 31.7) * 0.35;
      float rightPress = sin(t * 18.6 + 1.6) * 0.65 + sin(t * 28.2) * 0.35;
      delta += vec2(leftPress * 0.0008, leftPress * 0.0025) * leftHand * typing;
      delta += vec2(rightPress * -0.0007, rightPress * 0.0024) * rightHand * typing;
      p += delta * u_motion;
      gl_Position = vec4(p.x * 2.0 - 1.0, 1.0 - p.y * 2.0, 0.0, 1.0);
    }
  `;
  const fragmentSource = `
    precision mediump float;
    uniform sampler2D u_image;
    varying vec2 v_uv;
    void main() { gl_FragColor = texture2D(u_image, v_uv); }
  `;
  const resources = [];
  function compile(type, source) {
    const shader = gl.createShader(type);
    resources.push(['shader', shader]);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error('Hero shader unavailable');
    return shader;
  }
  let program;
  try {
    program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Hero renderer unavailable');
  } catch {
    resources.forEach(([, shader]) => gl.deleteShader(shader));
    if (program) gl.deleteProgram(program);
    return;
  }
  gl.useProgram(program);
  const grid = 112;
  const vertices = [];
  const indices = [];
  for (let row = 0; row <= grid; row++) {
    for (let col = 0; col <= grid; col++) vertices.push(col / grid, row / grid);
  }
  for (let row = 0; row < grid; row++) {
    for (let col = 0; col < grid; col++) {
      const a = row * (grid + 1) + col, b = a + grid + 1;
      indices.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  const attribute = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(attribute);
  gl.vertexAttribPointer(attribute, 2, gl.FLOAT, false, 0, 0);
  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
  const timeUniform = gl.getUniformLocation(program, 'u_time');
  const motionUniform = gl.getUniformLocation(program, 'u_motion');
  const pointerUniform = gl.getUniformLocation(program, 'u_pointer');
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.uniform1i(gl.getUniformLocation(program, 'u_image'), 0);
  gl.clearColor(0, 0, 0, 0);

  let ready = false, inView = true, paused = media.matches, lost = false;
  let frame = 0, lastTime = 0, elapsed = 0, lastDraw = 0;
  let pointer = [0, 0], target = [0, 0];
  function resize() {
    const pixels = Math.min(1280, Math.round(scene.getBoundingClientRect().width * Math.min(devicePixelRatio || 1, 2)));
    if (canvas.width !== pixels || canvas.height !== pixels) {
      canvas.width = pixels; canvas.height = pixels;
      gl.viewport(0, 0, pixels, pixels);
    }
    if (ready && !lost) draw();
  }
  function draw() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(timeUniform, elapsed);
    gl.uniform1f(motionUniform, media.matches && paused ? 0 : 1);
    gl.uniform2f(pointerUniform, pointer[0], pointer[1]);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
  }
  function tick(now) {
    frame = 0;
    if (!ready || lost || paused || !inView || document.hidden) return;
    if (lastTime) elapsed += Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    // Cap at 30 fps: enough for these small movements and less GPU work.
    if (now - lastDraw >= 32) {
      pointer = pointer.map((value, i) => value + (target[i] - value) * 0.05);
      draw(); lastDraw = now;
    }
    frame = requestAnimationFrame(tick);
  }
  function sync() {
    cancelAnimationFrame(frame); frame = 0; lastTime = 0;
    const running = ready && !lost && !paused && inView && !document.hidden;
    scene.classList.toggle('is-idle', !running);
    if (ready && !lost && media.matches) draw();
    if (running) frame = requestAnimationFrame(tick);
  }
  function loadTexture() {
    if (!photo.naturalWidth) return;
    if (!photo.src.endsWith('/assets/hero-workstation-v2.png')) { ready = false; scene.classList.remove('is-rendered'); sync(); return; }
    try {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, photo);
      ready = true;
      resize();
      scene.classList.add('is-rendered');
      sync();
    } catch { scene.classList.remove('is-rendered'); }
  }
  photo.addEventListener('load', loadTexture);
  window.addEventListener('hero-image-change', () => { ready=false; scene.classList.remove('is-rendered'); sync(); });
  if (photo.complete) loadTexture();
  window.addEventListener('hero-motion', event => { paused = event.detail.paused; sync(); });
  document.addEventListener('visibilitychange', sync);
  media.addEventListener('change', () => { paused = media.matches; sync(); });
  new ResizeObserver(resize).observe(scene);
  new IntersectionObserver(entries => { inView = entries[0].isIntersecting; sync(); }, { threshold: 0.02 }).observe(hero);
  hero.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || paused) return;
    const box = hero.getBoundingClientRect();
    target = [(event.clientX - box.left) / box.width * 2 - 1, (event.clientY - box.top) / box.height * 2 - 1];
  });
  hero.addEventListener('pointerleave', () => { target = [0, 0]; });
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault(); lost = true; scene.classList.remove('is-rendered'); sync();
  });
})();
