  //Dot 'n Bloom shader by Themaister
  class DotnBloom extends WebGLExt {
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
        uniform vec2 u_texture_size;

        varying vec2 c00;
        varying vec2 c10;
        varying vec2 c20;
        varying vec2 c01;
        varying vec2 c11;
        varying vec2 c21;
        varying vec2 c02;
        varying vec2 c12;
        varying vec2 c22;
        varying vec2 pixel_no;

        void main() {
          gl_Position = u_vmatrix * a_position;

          float dx = 1.0 / u_texture_size.x;
          float dy = 1.0 / u_texture_size.y;

          vec2 texcoord = (u_tmatrix * a_position).xy;

          c00 = texcoord + vec2(-dx, -dy);
          c10 = texcoord + vec2(  0, -dy);
          c20 = texcoord + vec2( dx, -dy);
          c01 = texcoord + vec2(-dx,   0);
          c11 = texcoord + vec2(  0,   0);
          c21 = texcoord + vec2( dx,   0);
          c02 = texcoord + vec2(-dx,  dy);
          c12 = texcoord + vec2(  0,  dy);
          c22 = texcoord + vec2( dx,  dy);

          pixel_no = texcoord * u_texture_size;
        }
      `;

      const fragmentSource = `
        precision mediump float;

        uniform sampler2D u_texture;
        uniform vec2 u_texture_size;

        varying vec2 c00;
        varying vec2 c10;
        varying vec2 c20;
        varying vec2 c01;
        varying vec2 c11;
        varying vec2 c21;
        varying vec2 c02;
        varying vec2 c12;
        varying vec2 c22;
        varying vec2 pixel_no;

        const float gamma = 2.4;
        const float blend = 0.65;
        const float shine = 0.05;

        float dist(vec2 coord, vec2 source) {
          vec2 delta = coord - source;
          return sqrt(dot(delta, delta));
        }

        float colorBloom(vec3 color) {
          const vec3 gray_coeff = vec3(0.30, 0.59, 0.11);
          float bright = dot(color, gray_coeff);
          return mix(1.0 + shine, 1.0 - shine, bright);
        }

        vec3 lookup(float offsetx, float offsety, vec2 coord) {
          vec2 offset = vec2(offsetx, offsety);
          vec3 color = texture2D(u_texture, coord).rgb;
          float delta = dist(fract(pixel_no), offset + vec2(0.5));
          return color * exp(-gamma * delta * colorBloom(color));
        }

        void main() {
          vec3 mid_color = lookup(0.0, 0.0, c11);

          vec3 color = vec3(0.0);

          color += lookup(-1.0, -1.0, c00);
          color += lookup( 0.0, -1.0, c10);
          color += lookup( 1.0, -1.0, c20);
          color += lookup(-1.0,  0.0, c01);
          color += mid_color;
          color += lookup( 1.0,  0.0, c21);
          color += lookup(-1.0,  1.0, c02);
          color += lookup( 0.0,  1.0, c12);
          color += lookup( 1.0,  1.0, c22);

          gl_FragColor = vec4(mix(1.2 * mid_color, color, blend), 1.0);
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