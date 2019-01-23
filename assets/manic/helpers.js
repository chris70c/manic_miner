  class Font {
    constructor() {
      this.chars = [];
    };

    initialize() {
      let x = 256;
      let y = 264;
      let w = 512;

      for (let i = 0; i < 96; i++) {
        this.chars[i] = {x:x, y:y};

        x += TILE_SIZE;

        if (x == w) {
          x = 256;
          y += TILE_SIZE;
        }
      }
    };

    print(x, y, text) {
      const len = text.length;

      if (x < 0) {
        x = (SCREEN_WIDTH - (len * TILE_SIZE)) >> 1;
        x += (x % TILE_SIZE);
      }

      const sx = x;

      for (let i = 0; i < len; i++) {
        let code = text.charCodeAt(i);

        if (code == 10) {
          x = sx;
          y += TILE_SIZE;
          continue;
        }

        if ((code -= 32) > 95) {
          x += TILE_SIZE;
          render.fill(x, y, TILE_SIZE, TILE_SIZE, colors[16]);
          continue;
        }

        const r = this.chars[code];

        render.copy(r.x, r.y, TILE_SIZE, TILE_SIZE, x, y);

        x += TILE_SIZE;
      }
    };
  }

  class Scroll {
    constructor(x, y, width) {
      this.x = x;
      this.y = y;
      this.w = width;

      this.chars  = "";
      this.length = 0;
      this.index  = 0;
      this.total  = 0;
    };

    start(text) {
      this.chars  = text;
      this.length = text.length;
      this.total  = (this.w / TILE_SIZE) >> 0;

      render.setTint(colors[14]);
      font.print(this.x, this.y, text.substr(this.index++, this.total));
      render.setTint();

      if (--this.length < this.total) {
        this.total = this.length;
      }
    };

    update() {
      render.setBlend(false);
      render.setTint(colors[14]);

      font.print(this.x, this.y, this.chars.substr(this.index++, this.total));

      render.setTint();
      render.setBlend(true);


      if (--this.length < this.total) {
        this.total = this.length;
      }

      if (!this.total) {
        this.index = 0;
        return true;
      }

      return false;
    };
  }

  class Timer {
    constructor() {
      this.call    = null;
      this.delay   = 60;
      this.id      = 0;
      this.step    = 0;
      this.running = false;

      this.update = (now) => {
        controls.update();

        if (++this.step == this.delay) {
          this.step = 0;
          this.call();
        }

        if (this.running) {
          this.id = requestAnimationFrame(this.update);
        }
      }
    };

    set frameRate(value) {
      this.delay = (60 / value) >> 0;
      this.step  = this.delay - 1;
    };

    start() {
      if (this.running) {
        this.stop();
      }

      this.running = true;
      this.id = requestAnimationFrame(this.update);
    };

    stop() {
      this.running = false;
      cancelAnimationFrame(this.id);
    };
  }