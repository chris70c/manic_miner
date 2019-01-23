  class WebGL {
    constructor() {
      const params = {alpha:false, antialias:false};

      this.canvas = document.querySelector("canvas");
      this.gl = this.canvas.getContext("webgl", params) || this.canvas.getContext("experimental-webgl", params);

      if (!(this.gl && this.gl instanceof WebGLRenderingContext)) {
        throw "Manic Miner cannot be played in this browser because it does not support WebGL.";
      }

      this.scaledWidth  = 0;
      this.scaledHeight = 0;
      this.scaledBorder = 0;
      this.scaledRoom   = 0;
      this.scaledPanel  = 0;

      this.gl.disable(this.gl.DEPTH_TEST);
      this.gl.blendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);
      this.gl.enable(this.gl.BLEND);

      this.shader = null;
      this.buffer = null;
      this.source = null;

      this.color  = [0.0, 0.0, 0.0, 1.0];
      this.matrix = new Matrix();
      this.tint   = false;

      this.atlas = this.createTexture(spectrum);
      this.base  = this.createTexture(null, SCREEN_WIDTH, ROOM_HEIGHT);
      this.room  = this.createTexture(null, SCREEN_WIDTH, ROOM_HEIGHT + (TILE_SIZE * 8));

      this.fb_base = this.createFramebuffer(this.base);
      this.fb_room = this.createFramebuffer(this.room);

      this.fb_screen = {
        object: null,
        width:  0,
        height: 0
      };

      this.createShader();
      this.setBuffer(this.fb_room);
      this.setSource(this.atlas);
    };

    setShader() {
      this.gl.useProgram(this.shader.program);
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.shader.buffer);
      this.gl.enableVertexAttribArray(this.shader.position);
      this.gl.vertexAttribPointer(this.shader.position, 2, this.gl.FLOAT, false, 0, 0);
    };

    setBuffer(buffer) {
      this.buffer = buffer;
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, buffer.object);
      this.gl.viewport(0, 0, buffer.width, buffer.height);
    };

    setSource(source) {
      this.source = source;
      this.gl.bindTexture(this.gl.TEXTURE_2D, source.texture);
    };

    setBlend(enable) {
      if (enable) {
        this.gl.enable(this.gl.BLEND);
      } else {
        this.gl.disable(this.gl.BLEND);
      }
    };

    setTint(color) {
      if (color) {
        this.color = Array.from(color);
        this.tint = true;
      } else {
        this.tint = false;
      }
    };

    clear() {
      this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    };

    resize() {
      this.scaledWidth  = SCREEN_WIDTH * scaleFactor;
      this.scaledHeight = screenHeight * scaleFactor;
      this.scaledBorder = borderWidth  * scaleFactor;
      this.scaledRoom   = ROOM_HEIGHT  * scaleFactor;
      this.scaledPanel  = panelHeight  * scaleFactor;

      this.canvas.width  = fullWidth  * scaleFactor;
      this.canvas.height = fullHeight * scaleFactor;

      this.fb_screen.width  = this.canvas.width;
      this.fb_screen.height = this.canvas.height;

      this.toScreen();
    };

    restore() {
      this.setSource(this.base);
      this.gl.disable(this.gl.BLEND);

      this.copy(0, 0, SCREEN_WIDTH, ROOM_HEIGHT);

      this.gl.enable(this.gl.BLEND);
      this.setSource(this.atlas);
    };

    copy(srcX, srcY, srcWidth, srcHeight, dstX = 0, dstY = 0, dstWidth = 0, dstHeight = 0) {
      if (!dstWidth) {
        dstWidth = srcWidth;
      }

      if (!dstHeight) {
        dstHeight = srcHeight;
      }

      let bottom = 0;
      let top = this.buffer.height;

      if (!this.buffer.object) {
        bottom = top;
        top = 0;
      }

      this.matrix.ortho(0, this.buffer.width, bottom, top);
      this.matrix.translate(dstX, dstY);
      this.matrix.scale(dstWidth, dstHeight);

      this.gl.uniformMatrix4fv(this.shader.vmatrix, false, this.matrix.value);

      this.matrix.identity();
      this.matrix.translate(srcX / this.source.width, srcY / this.source.height);
      this.matrix.scale(srcWidth / this.source.width, srcHeight / this.source.height);

      this.gl.uniformMatrix4fv(this.shader.tmatrix, false, this.matrix.value);
      this.gl.uniform1i(this.shader.texture, 0);

      this.gl.uniform1i(this.shader.fill, false);
      this.gl.uniform1i(this.shader.tint, this.tint);
      this.gl.uniform4fv(this.shader.color, this.color);

      this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    };

    fill(x, y, width, height, color) {
      const blend = this.gl.isEnabled(this.gl.BLEND);

      if (color) {
        this.color = Array.from(color);
      }

      let bottom = 0;
      let top = this.buffer.height;

      if (!this.buffer.object) {
        bottom = top;
        top = 0;
      }

      this.matrix.ortho(0, this.buffer.width, bottom, top);
      this.matrix.translate(x, y);
      this.matrix.scale(width, height);

      this.gl.uniformMatrix4fv(this.shader.vmatrix, false, this.matrix.value);

      this.matrix.identity();

      this.gl.uniformMatrix4fv(this.shader.tmatrix, false, this.matrix.value);
      this.gl.uniform1i(this.shader.texture, 0);

      this.gl.uniform1i(this.shader.fill, true);
      this.gl.uniform1i(this.shader.tint, false);
      this.gl.uniform4fv(this.shader.color, this.color);

      this.gl.disable(this.gl.BLEND);
      this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);

      if (blend) {
        this.gl.enable(this.gl.BLEND);
      }
    };

    toScreen() {
      const buffer = this.buffer;
      const source = this.source;

      this.setBuffer(this.fb_screen);
      this.setSource(this.room);

      if (borderWidth) {
        this.gl.clearColor(borderColor[0], borderColor[1], borderColor[2], 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        this.fill(this.scaledBorder, this.scaledBorder, this.scaledWidth, this.scaledHeight, background);
      } else {
        this.gl.clearColor(background[0], background[1], background[2], 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
      }

      if (tintColor) {
        this.setTint(tintColor);
        this.copy(0, 0, SCREEN_WIDTH, ROOM_HEIGHT, this.scaledBorder, this.scaledBorder, this.scaledWidth, this.scaledRoom);
        this.setTint();
        this.copy(0, ROOM_HEIGHT, SCREEN_WIDTH, panelHeight, this.scaledBorder, this.scaledBorder + this.scaledRoom, this.scaledWidth, this.scaledPanel);

      } else {
        this.copy(0, 0, SCREEN_WIDTH, screenHeight, this.scaledBorder, this.scaledBorder, this.scaledWidth, this.scaledHeight);
      }

      this.setBuffer(buffer);
      this.setSource(source);
    };

    createShader() {
      const vertexSource = `
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
        uniform bool u_fill;
        uniform bool u_tint;
        uniform vec4 u_color;

        varying vec2 v_texcoord;

        void main() {
          vec4 color = texture2D(u_texture, v_texcoord);

          if (u_fill || (u_tint && color.a != 0.0)) {
            color = u_color;
          }

          gl_FragColor = color;
        }
      `;

      const program  = this.compileProgram(vertexSource, fragmentSource);

      this.shader = {
        program:  program,
        buffer:   this.createVertexBuffer(new Float32Array([0,0,0,1,1,0,1,0,0,1,1,1])),
        position: this.gl.getAttribLocation(program, "a_position"),
        vmatrix:  this.gl.getUniformLocation(program, "u_vmatrix"),
        tmatrix:  this.gl.getUniformLocation(program, "u_tmatrix"),
        texture:  this.gl.getUniformLocation(program, "u_texture"),
        fill:     this.gl.getUniformLocation(program, "u_fill"),
        tint:     this.gl.getUniformLocation(program, "u_tint"),
        color:    this.gl.getUniformLocation(program, "u_color")
      };

      this.setShader();
    };

    createFramebuffer(source) {
      const fbo = {
        object: this.gl.createFramebuffer(),
        width:  source.width,
        height: source.height
      };

      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fbo.object);
      this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, source.texture, 0);

      return fbo;
    };

    createTexture(image, width, height) {
      const texture = this.gl.createTexture();

      this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);

      if (image) {
        width  = image.width;
        height = image.height;
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);
      } else {
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, width, height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null);
      }

      return {
        texture: texture,
        width:   width,
        height:  height
      };
    };

    createVertexBuffer(array) {
      const buffer = this.gl.createBuffer();

      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, array, this.gl.STATIC_DRAW);

      return buffer;
    };

    compileShader(type, source) {
      const shader = this.gl.createShader(type);

      this.gl.shaderSource(shader, source);
      this.gl.compileShader(shader);

      if (this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
        return shader;
      }

      const log = this.gl.getShaderInfoLog(shader);
      this.gl.deleteShader(shader);
      throw log;
    };

    compileProgram(vertexSource, fragmentSource) {
      const vertex   = this.compileShader(this.gl.VERTEX_SHADER, vertexSource);
      const fragment = this.compileShader(this.gl.FRAGMENT_SHADER, fragmentSource);
      const program  = this.gl.createProgram();

      this.gl.attachShader(program, vertex);
      this.gl.attachShader(program, fragment);
      this.gl.linkProgram(program);

      if (this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
        return program;
      }

      const log = this.gl.getProgramInfoLog(program);
      this.gl.deleteProgram(program);
      throw log;
    };
  }

  class Matrix {
    constructor() {
      this.value = new Float32Array(16);
      this.identity();
    };

    identity() {
      this.value.fill(0);

      this.value[ 0] = 1;
      this.value[ 5] = 1;
      this.value[10] = 1;
      this.value[15] = 1;
    };

    ortho(left, right, bottom, top, near = -1, far = 1) {
      this.value.fill(0);

      const lr = 1 / (left - right);
      const bt = 1 / (bottom - top);
      const nf = 1 / (near - far);

      this.value[ 0] = -2 * lr;
      this.value[ 5] = -2 * bt;
      this.value[10] =  2 * nf;
      this.value[12] = (left + right) * lr;
      this.value[13] = (bottom + top) * bt;
      this.value[14] = (near + far)   * nf;
      this.value[15] = 1;
    };

    scale(sx, sy, sz = 1) {
      this.value[ 0] *= sx;
      this.value[ 1] *= sx;
      this.value[ 2] *= sx;
      this.value[ 3] *= sx;
      this.value[ 4] *= sy;
      this.value[ 5] *= sy;
      this.value[ 6] *= sy;
      this.value[ 7] *= sy;
      this.value[ 8] *= sz;
      this.value[ 9] *= sz;
      this.value[10] *= sz;
      this.value[11] *= sz;
    };

    translate(tx, ty, tz = 0) {
      this.value[12] += (this.value[0] * tx + this.value[4] * ty + this.value[ 8] * tz);
      this.value[13] += (this.value[1] * tx + this.value[5] * ty + this.value[ 9] * tz);
      this.value[14] += (this.value[2] * tx + this.value[6] * ty + this.value[10] * tz);
      this.value[15] += (this.value[3] * tx + this.value[7] * ty + this.value[11] * tz);
    };
  }