  //CRT emulator shader by Dave Eggleston
  class CRTEmulator extends WebGLExt {
    constructor() {
      super();
    };

    setExt() {
      const w = this.buffer.width;
      const h = this.buffer.height;

      this.gl.useProgram(this.ext.program);
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.ext.buffer);
      this.gl.enableVertexAttribArray(this.ext.position);
      this.gl.vertexAttribPointer(this.ext.position, 2, this.gl.FLOAT, false, 0, 0);

      this.gl.uniform1i(this.ext.texture, 0);

      this.gl.uniform2fv(this.ext.screenSize, [this.buffer.width, this.buffer.height]);
      this.gl.uniform1i(this.ext.curvature, false);
      this.gl.uniform1f(this.ext.blur, 1.4);
      this.gl.uniform1f(this.ext.light, 3.0);
      this.gl.uniform1f(this.ext.scanline, 1.0);
      this.gl.uniform1f(this.ext.brightness, 1.0);
      this.gl.uniform1f(this.ext.contrast, 1.0);
      this.gl.uniform1f(this.ext.gamma, 1.0);
      this.gl.uniform1f(this.ext.saturation, 1.0);
    };

    createExt() {
      const vertexSource = `
        precision mediump float;

        attribute vec4 a_position;

        void main() {
          gl_Position = a_position;
        }
      `;

      const fragmentSource = `
        precision mediump float;

        uniform sampler2D u_texture;
        uniform vec2 u_screen_size;
        uniform bool u_curvature;
        uniform float u_blur;
        uniform float u_light;
        uniform float u_scanline;
        uniform float u_brightness;
        uniform float u_contrast;
        uniform float u_gamma;
        uniform float u_saturation;

        vec3 correction(vec3 rgb) {
          rgb = pow(rgb, vec3(u_gamma));
          return mix(vec3(0.5), mix(vec3(dot(vec3(0.2125, 0.7154, 0.0721), rgb * u_brightness)), rgb * u_brightness, u_saturation), u_contrast);
        }

        vec3 gaussian(vec2 uv) {
          uv += 0.5;

          float b = u_blur / (u_screen_size.x / u_screen_size.y);

          float bx = b / u_screen_size.x;
          float by = b / u_screen_size.y;

          return vec3(texture2D(u_texture, vec2(uv.x - bx, uv.y - by)).rgb * 0.077847
                    + texture2D(u_texture, vec2(uv.x - bx, uv.y)).rgb      * 0.123317
                    + texture2D(u_texture, vec2(uv.x - bx, uv.y + by)).rgb * 0.077847
                    + texture2D(u_texture, vec2(uv.x, uv.y - by)).rgb      * 0.123317
                    + texture2D(u_texture, vec2(uv.x, uv.y)).rgb           * 0.195346
                    + texture2D(u_texture, vec2(uv.x, uv.y + by)).rgb      * 0.123317
                    + texture2D(u_texture, vec2(uv.x + bx, uv.y - by)).rgb * 0.077847
                    + texture2D(u_texture, vec2(uv.x + bx, uv.y)).rgb      * 0.123317
                    + texture2D(u_texture, vec2(uv.x + bx, uv.y + by)).rgb * 0.077847);
        }

        void main() {
          vec2 st = (gl_FragCoord.xy / u_screen_size) - vec2(0.5);
          st.y = -st.y;

          vec2 uv = st;

          float d = length(st * 0.5 * st * 0.5);
          float m = 1.0;

          if (u_curvature) {
            uv = (st * d) + (st * 0.935);

            m = max(0.0, 1.0 - 2.0 * max(abs(uv.x), abs(uv.y)));
            m = min(m * 200.0, 1.0);
          }

          float l = 1.0 - min(1.0, d * u_light);

          vec3 color = gaussian(uv) * l;

          float y = uv.y;
          float s = 1.0 - smoothstep(360.0, 1440.0, u_screen_size.y) + 1.0;
          float j = cos(y * u_screen_size.y * s) * 0.1;

          color = abs(u_scanline - 1.0) * color + u_scanline * (color - color * j);
          color *= 1.0 + (0.02 + ceil(mod((st.x + 0.5) * u_screen_size.x, 3.0)) * -0.025) * u_scanline;
          color = correction(color * m);

          gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
        }
      `;


      const program = this.compileProgram(vertexSource, fragmentSource);

      this.ext = {
        program:    program,
        buffer:     this.createVertexBuffer(new Float32Array([-1.0,-1.0,1.0,-1.0,-1.0,1.0,-1.0,1.0,1.0,-1.0,1.0,1.0])),
        position:   this.gl.getAttribLocation(program, "a_position"),
        texture:    this.gl.getUniformLocation(program, "u_texture"),
        screenSize: this.gl.getUniformLocation(program, "u_screen_size"),
        curvature:  this.gl.getUniformLocation(program, "u_curvature"),
        blur:       this.gl.getUniformLocation(program, "u_blur"),
        light:      this.gl.getUniformLocation(program, "u_light"),
        scanline:   this.gl.getUniformLocation(program, "u_scanline"),
        brightness: this.gl.getUniformLocation(program, "u_brightness"),
        contrast:   this.gl.getUniformLocation(program, "u_contrast"),
        gamma:      this.gl.getUniformLocation(program, "u_gamma"),
        saturation: this.gl.getUniformLocation(program, "u_saturation")
      };
    };
  }