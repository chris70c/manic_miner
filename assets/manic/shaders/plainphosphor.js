  //Plain Phosphor shader by Themaister
  class PlainPhosphor extends WebGLExt {
    constructor() {
      super();
    };

    setExt() {
      super.setExt();

      this.gl.uniform2fv(this.ext.textureSize, [fullWidth, fullHeight]);
    };

    createExt() {
      const vertexSource = `
        precision mediump float;

        attribute vec4 a_position;

        uniform mat4 u_vmatrix;
        uniform mat4 u_tmatrix;

        varying vec2 v_texcoord;

        void main() {
          gl_Position = u_vmatrix * a_position;
          v_texcoord = (u_tmatrix * a_position).xy;
        }
      `;

      const fragmentSource = `
        precision mediump float;

        uniform sampler2D u_texture;
        uniform vec2 u_texture_size;

        varying vec2 v_texcoord;

        vec3 toFocus(float pixel) {
          pixel = mod(pixel + 3.0, 3.0);

          if (pixel >= 2.0) {
            return vec3(pixel - 2.0, 0.0, 3.0 - pixel);
          } else if (pixel >= 1.0) {
            return vec3(0.0, 2.0 - pixel, pixel - 1.0);
          } else {
            return vec3(1.0 - pixel, pixel, 0.0);
          }
        }

        void main() {
          float y = mod(v_texcoord.y * u_texture_size.y, 1.0);
          float intensity = exp(-0.2 * y);

          vec2 one_x = vec2(1.0 / (3.0 * u_texture_size.x), 0.0);

          vec3 color1 = texture2D(u_texture, v_texcoord.xy - 0.0 * one_x).rgb;
          vec3 color2 = texture2D(u_texture, v_texcoord.xy - 1.0 * one_x).rgb;
          vec3 color3 = texture2D(u_texture, v_texcoord.xy - 2.0 * one_x).rgb;

          float pixel_x = 3.0 * v_texcoord.x * u_texture_size.x;

          vec3 focus1 = toFocus(pixel_x - 0.0);
          vec3 focus2 = toFocus(pixel_x - 1.0);
          vec3 focus3 = toFocus(pixel_x - 2.0);

          vec3 result =
            0.8 * color1 * focus1 +
            0.6 * color2 * focus2 +
            0.3 * color3 * focus3;

          result = 2.3 * pow(result, vec3(1.4));

          gl_FragColor = vec4(intensity * result, 1.0);
        }
      `;

      const program = this.compileProgram(vertexSource, fragmentSource);

      this.ext = {
        program:     program,
        buffer:      this.createVertexBuffer(new Float32Array([0,0,0,1,1,0,1,0,0,1,1,1])),
        position:    this.gl.getAttribLocation(program, "a_position"),
        vmatrix:     this.gl.getUniformLocation(program, "u_vmatrix"),
        tmatrix:     this.gl.getUniformLocation(program, "u_tmatrix"),
        texture:     this.gl.getUniformLocation(program, "u_texture"),
        textureSize: this.gl.getUniformLocation(program, "u_texture_size")
      };
    };
  }