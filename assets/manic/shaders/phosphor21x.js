  //Phosphor21x shader by Caligari
  class Phosphor21x extends WebGLExt {
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

        //#define distortion 0.15
        #define factor_adjust 2.5
        #define scale 21.0
        #define spot_width 1.2
        #define x_size_adjust 2.0

        //#define TRIAD1
        //#define TRIAD2
        //#define USE_ALL

        #ifdef distortion
          vec2 barreldistortion(vec2 coord) {
            vec2 cc = coord - 0.5;
            float dist = dot(cc, cc);
            return 0.5 + cc * (1.0 + (dist + distortion * dist * dist) * distortion) / (1.0 + (0.25 + distortion * 0.25 * 0.25) * distortion);
          }

          #define texcoords barrelDistortion(v_texcoord * u_texture_size / u_input_size) * u_input_size / u_texture_size
        #else
          #define texcoords v_texcoord
        #endif

        const vec4 lumi_weights = vec4(0.2126, 0.7152, 0.0722, 0.0);

        float factor(float lumi, vec2 dxy) {
          float dist = sqrt(dxy.x * dxy.x + dxy.y * dxy.y * x_size_adjust) / scale;
          return (2.0 + lumi) * (1.0 - smoothstep(0.0, spot_width, dist)) / factor_adjust;
        }

        void main() {
          vec2 coords_scaled  = floor(texcoords * u_texture_size * scale);
          vec2 coords_snes    = floor(coords_scaled / scale);
          vec2 coords_texture = (coords_snes + vec2(0.5)) / u_texture_size;

          vec2 ecart = coords_scaled - (scale * coords_snes + vec2(scale * 0.5 - 0.5));

          vec4 color = texture2D(u_texture, coords_texture);

          float lumi = dot(color, lumi_weights);

          color *= factor(lumi, ecart);

          vec2 onex = vec2(1.0 / u_texture_size.x, 0.0);

          vec4 pcol = texture2D(u_texture, coords_texture + onex);
          lumi = dot(pcol, lumi_weights);
          color += pcol * factor(lumi, ecart + vec2(-scale, 0.0));

          pcol = texture2D(u_texture, coords_texture - onex);
          lumi = dot(pcol, lumi_weights);
          color += pcol * factor(lumi, ecart + vec2(scale, 0.0));

          #ifdef USE_ALL
            vec2 oney = vec2(0.0, 1.0 / u_texture_size.y);

            pcol = texture2D(u_texture, coords_texture + oney);
            lumi = dot(pcol, lumi_weights);
            color += pcol * factor(lumi, ecart + vec2(0.0, -scale));

            pcol = texture2D(u_texture, coords_texture + oney - onex);
            lumi = dot(pcol, lumi_weights);
            color += pcol * factor(lumi, ecart + vec2(scale, -scale));

            pcol = texture2D(u_texture, coords_texture + oney + onex);
            lumi = dot(pcol, lumi_weights);
            color += pcol * factor(lumi, ecart + vec2(-scale, -scale));

            pcol = texture2D(u_texture, coords_texture - oney);
            lumi = dot(pcol, lumi_weights);
            color += pcol * factor(lumi, ecart + vec2(0.0, scale));

            pcol = texture2D(u_texture, coords_texture - oney - onex);
            lumi = dot(pcol, lumi_weights);
            color += pcol * factor(lumi, ecart + vec2(scale, scale));

            pcol = texture2D(u_texture, coords_texture - oney + onex);
            lumi = dot(pcol, lumi_weights);
            color += pcol * factor(lumi, ecart + vec2(-scale, scale));
          #endif

          #if defined(TRIAD1) || defined(TRIAD2)
            vec2 coords_screen = floor(v_texcoord.xy * u_output_size);
          #endif

          #ifdef TRIAD1
            float modulo1 = mod(coords_screen.y + coords_screen.x, 3.0);

            if (modulo1 == 0.0) {
              color.rgb *= vec3(1.0, 0.5, 0.5);
            } else if (modulo1 <= 1.0) {
              color.rgb *= vec3(0.5, 1.0, 0.5);
            } else {
              color.rgb *= vec3(0.5, 0.5, 1.0);
            }
          #endif

          #ifdef TRIAD2
            color = clamp(color, 0.0, 1.0);

            float modulo2 = mod(coords_screen.x, 3.0);

            if (modulo2 == 0.0) {
              color.gb *= 0.8;
            } else if (modulo2 == 1.0) {
              color.rb *= 0.8;
            } else {
              color.rg *= 0.8;
            }
          #endif

          gl_FragColor = clamp(color, 0.0, 1.0);
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