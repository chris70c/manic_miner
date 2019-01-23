  //CRT simple shader by DOLLS
  class CRTSimple extends WebGLExt {
    constructor() {
      super();
    };

    setExt() {
      super.setExt();

      this.gl.uniform2fv(this.ext.inputSize, [fullWidth, fullHeight]);
      this.gl.uniform2fv(this.ext.outputSize, [this.buffer.width, this.buffer.height]);
      this.gl.uniform2fv(this.ext.textureSize, [fullWidth, fullHeight]);
    };

    createExt() {
      const vertexSource = `
        precision mediump float;

        attribute vec4 a_position;

        uniform mat4 u_vmatrix;
        uniform mat4 u_tmatrix;
        uniform vec2 u_input_size;
        uniform vec2 u_output_size;
        uniform vec2 u_texture_size;

        varying vec2 v_texcoord;
        varying vec2 v_one;
        varying float v_mod_factor;

        void main() {
          gl_Position = u_vmatrix * a_position;

          v_texcoord = (u_tmatrix * a_position).xy;
          v_one = 1.0 / u_texture_size;
          v_mod_factor = v_texcoord.x * u_texture_size.x * u_output_size.x / u_input_size.x;
        }
      `;

      const fragmentSource = `
        precision mediump float;

        uniform sampler2D u_texture;
        uniform vec2 u_input_size;
        uniform vec2 u_output_size;
        uniform vec2 u_texture_size;

        varying vec2 v_texcoord;
        varying vec2 v_one;
        varying float v_mod_factor;

        #define distortion 0.1
        #define inputGamma 2.4
        #define outputGamma 2.2

        #define CURVATURE
        #define TEX2D(c) pow(texture2D(u_texture, (c)), vec4(inputGamma))

        vec2 radialDistortion(vec2 coord) {
          coord *= u_texture_size / u_input_size;
          vec2 cc = coord - 0.5;
          float dist = dot(cc, cc) * distortion;
          return (coord + cc * (1.0 + dist) * dist) * u_input_size / u_texture_size;
        }

        vec4 scanlineWeights(float distance, vec4 color) {
          vec4 wid = 2.0 + 2.0 * pow(color, vec4(4.0));
          vec4 weights = vec4(distance / 0.3);
          return 1.4 * exp(-pow(weights * inversesqrt(0.5 * wid), wid)) / (0.6 + 0.2 * wid);
        }

        void main() {
          #ifdef CURVATURE
            vec2 xy = radialDistortion(v_texcoord);
          #else
            vec2 xy = v_texcoord;
          #endif

          vec2 ratio_scale = xy * u_texture_size - vec2(0.5);
          vec2 uv_ratio = fract(ratio_scale);

          xy.y = (floor(ratio_scale.y) + 0.5) / u_texture_size.y;

          vec4 col1 = TEX2D(xy);
          vec4 col2 = TEX2D(xy + vec2(0.0, v_one.y));

          vec4 weights1 = scanlineWeights(uv_ratio.y, col1);
          vec4 weights2 = scanlineWeights(1.0 - uv_ratio.y, col2);
          vec3 mul_res  = (col1 * weights1 + col2 * weights2).rgb;

          vec3 dotmask_weights = mix(
            vec3(1.0, 0.7, 1.0),
            vec3(0.7, 1.0, 0.7),
            floor(mod(v_mod_factor, 2.0))
          );

          mul_res *= dotmask_weights;

          gl_FragColor = vec4(pow(mul_res, vec3(1.0 / outputGamma)), 1.0);
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
        inputSize:   this.gl.getUniformLocation(program, "u_input_size"),
        outputSize:  this.gl.getUniformLocation(program, "u_output_size"),
        textureSize: this.gl.getUniformLocation(program, "u_texture_size")
      };
    };
  }