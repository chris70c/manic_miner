  class WebGLExt extends WebGL {
    constructor() {
      super();

      this.flip = this.createTexture(null, fullWidth, fullHeight);

      this.fb_flip = this.createFramebuffer(this.flip);

      this.ext = null;
      this.createExt();
    };

    resize() {
      const w = fullWidth  * scaleFactor;
      const h = fullHeight * scaleFactor;

      this.canvas.style.width  = w +"px";
      this.canvas.style.height = h +"px";

      const r = window.devicePixelRatio || 1;

      this.canvas.width  = (w * r) >> 0;
      this.canvas.height = (h * r) >> 0;

      this.fb_screen.width  = this.canvas.width;
      this.fb_screen.height = this.canvas.height;

      this.gl.bindTexture(this.gl.TEXTURE_2D, this.flip.texture);
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, fullWidth, fullHeight, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null);

      this.fb_flip.width  = fullWidth;
      this.fb_flip.height = fullHeight;

      this.toScreen();
    };

    toScreen() {
      const buffer = this.buffer;
      const source = this.source;

      this.setBuffer(this.fb_flip);
      this.setSource(this.room);

      if (borderWidth) {
        this.gl.clearColor(borderColor[0], borderColor[1], borderColor[2], 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        this.fill(borderWidth, borderWidth, SCREEN_WIDTH, screenHeight, background);
      } else {
        this.gl.clearColor(background[0], background[1], background[2], 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
      }

      if (tintColor) {
        this.setTint(tintColor);
        this.copy(0, 0, SCREEN_WIDTH, ROOM_HEIGHT, borderWidth, borderWidth);
        this.setTint();
        this.copy(0, ROOM_HEIGHT, SCREEN_WIDTH, panelHeight, borderWidth, borderWidth + ROOM_HEIGHT);
      } else {
        this.copy(0, 0, SCREEN_WIDTH, screenHeight, borderWidth, borderWidth);
      }

      this.setBuffer(this.fb_screen);
      this.setSource(this.flip);

      this.setExt();
      this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
      this.setShader();

      this.setBuffer(buffer);
      this.setSource(source);
    };

    setExt() {
      const w = this.buffer.width;
      const h = this.buffer.height;

      this.gl.useProgram(this.ext.program);
      this.gl.enableVertexAttribArray(this.ext.position);
      this.gl.vertexAttribPointer(this.ext.position, 2, this.gl.FLOAT, false, 0, 0);

      this.matrix.ortho(0, w, h, 0);
      this.matrix.scale(w, h);
      this.gl.uniformMatrix4fv(this.ext.vmatrix, false, this.matrix.value);

      this.matrix.identity();
      this.gl.uniformMatrix4fv(this.ext.tmatrix, false, this.matrix.value);
      this.gl.uniform1i(this.ext.texture, 0);
    };

    createExt() {};
  }