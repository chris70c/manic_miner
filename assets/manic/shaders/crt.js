  //CRT shader v5 by cgwg
  class CRT extends WebGLExt {
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

        varying vec2 v_texcoord;

        void main() {
          gl_Position = u_vmatrix * a_position;
          v_texcoord = (u_tmatrix * a_position).xy;
        }
      `;

      const fragmentSource = `
        precision mediump float;

        uniform sampler2D u_texture;
        uniform vec2 u_input_size;
        uniform vec2 u_output_size;
        uniform vec2 u_texture_size;

        varying vec2 v_texcoord;

        #define distortion 0.1
        #define inputGamma 2.2
        #define outputGamma 2.5

        #define TEX2D(c) pow(texture2D(u_texture, (c)), vec4(inputGamma))
        #define FIX(c) max(abs(c), 1e-6)
        #define PI 3.141592653589

        vec2 radialDistortion(vec2 coord) {
          coord *= u_texture_size / u_input_size;
          vec2 cc = coord - 0.5;
          float dist = dot(cc, cc) * distortion;
          return (coord + cc * (1.0 + dist) * dist) * u_input_size / u_texture_size;
        }

        vec4 scanlineWeights(float distance, vec4 color) {
          vec4 wid = 2.0 + 2.0 * pow(color, vec4(4.0));
          vec4 weights = vec4(distance * 3.333333);
          return 0.51 * exp(-pow(weights * sqrt(2.0 / wid), wid)) / (0.18 + 0.06 * wid);
        }

        void main() {
          vec2 one = 1.0 / u_texture_size;
          vec2 xy = radialDistortion(v_texcoord.xy);
          vec2 uv_ratio = fract(xy * u_texture_size) - vec2(0.5);

          xy = (floor(xy * u_texture_size) + vec2(0.5)) / u_texture_size;

          vec4 coeffs = PI * vec4(1.0 + uv_ratio.x, uv_ratio.x, 1.0 - uv_ratio.x, 2.0 - uv_ratio.x);

          coeffs = FIX(coeffs);
          coeffs = 2.0 * sin(coeffs) * sin(coeffs / 2.0) / (coeffs * coeffs);
          coeffs /= dot(coeffs, vec4(1.0));

          vec4 col1 = clamp(coeffs.x * TEX2D(xy + vec2(-one.x, 0.0))
                    + coeffs.y * TEX2D(xy)
                    + coeffs.z * TEX2D(xy + vec2(one.x, 0.0))
                    + coeffs.w * TEX2D(xy + vec2(2.0 * one.x, 0.0)), 0.0, 1.0);

          vec4 col2 = clamp(coeffs.x * TEX2D(xy + vec2(-one.x, one.y))
                    + coeffs.y * TEX2D(xy + vec2(0.0, one.y))
                    + coeffs.z * TEX2D(xy + one)
                    + coeffs.w * TEX2D(xy + vec2(2.0 * one.x, one.y)), 0.0, 1.0);

          vec4 weights1 = scanlineWeights(abs(uv_ratio.y) , col1);
          vec4 weights2 = scanlineWeights(1.0 - uv_ratio.y, col2);
          vec3 mul_res  = (col1 * weights1 + col2 * weights2).xyz;

          float mod_factor = v_texcoord.x * u_output_size.x * u_texture_size.x / u_input_size.x;

          vec3 dotmask_weights = mix(
            vec3(1.05, 0.75, 1.05),
            vec3(0.75, 1.05, 0.75),
            floor(mod(mod_factor, 2.0))
          );

          mul_res *= dotmask_weights;
          mul_res = pow(mul_res, vec3(1.0 / (2.0 * inputGamma - outputGamma)));

          gl_FragColor = vec4(mul_res, 1.0);
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