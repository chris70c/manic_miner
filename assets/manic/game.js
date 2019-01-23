  class Game {
    constructor() {
      this.piano  = null;
      this.scroll = new Scroll(0, 152, SCREEN_WIDTH);
      this.update = null;

      this.frame    = 0;
      this.interval = 0;
      this.position = 0;

      this.loop = () => {
        this.update();
        render.toScreen();
      }

      this.pianoIntro = () => {
        if (controls.start) {
          this.startGame(true);

        } else if (this.frame == audio.piano.length) {
          this.startScroll();

        } else {
          const piano = audio.piano[this.frame];

          if (piano.time && (audio.context.currentTime >= piano.time)) {
            render.fill(this.piano.x1, 120, 7, 8, colors[7]);
            render.fill(this.piano.x2, 120, 7, 8);

            render.fill(piano.x1, 120, 7, 8, colors[10]);
            render.fill(piano.x2, 120, 7, 8, colors[5]);

            borderColor = piano.border;

            this.frame++;
            this.piano = piano;
          }
        }
      }

      this.scrollIntro = () => {
        if (controls.start) {
          this.startGame(true);

        } else if (this.scroll.update()) {
          records.hallScreen();

        } else if (!(this.frame & 1)) {
          if (this.frame == TILE_SIZE) {
            this.frame = 0;
          }

          render.fill(232, 72, SPRITE_SIZE, SPRITE_SIZE, colors[2]);
          render.copy((this.frame * SPRITE_SIZE), 0, SPRITE_SIZE, SPRITE_SIZE, 232, 72);
        }

        this.frame++;
      }

      this.bootSequence = () => {
        if (++this.frame == this.interval) {
          render.fill(120, this.position, SPRITE_SIZE, SPRITE_SIZE, colors[16]);

          background = colors[8 + ((this.position >> 1) & 3)];

          const sprite = sprites[100][0][0];

          render.copy(sprite.x, sprite.y, SPRITE_SIZE, SPRITE_SIZE, 120, this.position);

          if (this.position < 32) {
            this.interval = 3;
          } else if (this.position < 96) {
            this.interval ^= 1;
          } else {
            this.frame = 0;
            this.interval = 0;

            this.update = this.flashText;
            timer.frameRate = 30;
            return;
          }

          this.frame = 0;
          this.position += 2;
        }
      }

      this.flashText = () => {
        let index = this.frame & 7;

        render.setTint(colors[8 + index]);
        font.print( 80, 48, "G");
        render.setTint(colors[8 + (++index & 7)]);
        font.print( 88, 48, "a");
        render.setTint(colors[8 + (++index & 7)]);
        font.print( 96, 48, "m");
        render.setTint(colors[8 + (++index & 7)]);
        font.print(104, 48, "e");

        render.setTint(colors[8 + (++index & 7)]);
        font.print(144, 48, "O");
        render.setTint(colors[8 + (++index & 7)]);
        font.print(152, 48, "v");
        render.setTint(colors[8 + (++index & 7)]);
        font.print(160, 48, "e");
        render.setTint(colors[8 + (++index & 7)]);
        font.print(168, 48, "r");

        render.setTint();

        if ((--this.frame & 255) == 128) {
          if (records.checkEntry()) {
            this.titleScreen();
          }
        }
      }
    };

    initialize() {
      lastLevel = config.rooms.length;
      hiscore   = config.records[0] >> 0;

      this.setupColors();
      this.setupSprites();

      font.initialize();
      audio.initialize();
      controls.enable();

      timer.call = this.loop;
      timer.start();

      this.titleScreen();
    };

    reset() {
      borderColor = colors[0];
      level = 0;
      lives = 2;
      score = 0;
    };

    titleScreen() {
      this.reset();
      state = 1;

      audio.title();

      render.copy(0, 264, 256, 128, 0, 0);
      render.copy(0, 0, SPRITE_SIZE, SPRITE_SIZE, 232, 72);

      panel.reset();

      this.frame = 0;
      this.piano = audio.piano[0];

      this.detectGamepad();

      this.update = this.pianoIntro;
      timer.frameRate = 60;
    };

    startScroll() {
      state = 2;

      render.fill(this.piano.x1, 120, 7, 8, colors[7]);
      render.fill(this.piano.x2, 120, 7, 8);

      this.frame = 0;
      this.scroll.start(config.scroll);

      this.update = this.scrollIntro;
      timer.frameRate = 10;
    };

    startGame(mode) {
      room.initialize(mode);
      audio.ingame();

      if (mode) {
        state = 6;
        this.update = room.playMode;
      } else {
        state = 5;
        this.update = room.attractMode;
      }

      timer.frameRate = 12;
    };

    gameover() {
      this.frame = 0;
      this.interval = 3;
      this.position = 0;

      render.fill(0, 0, SCREEN_WIDTH, ROOM_HEIGHT, colors[16]);

      let sprite = sprites[99][0][0];

      render.copy(sprite.x, sprite.y, SPRITE_SIZE, SPRITE_SIZE, 120, 112);

      sprite = sprites[0][0][2];

      render.setTint(colors[15]);
      render.copy(sprite.x, sprite.y, SPRITE_SIZE, SPRITE_SIZE, 120, 96);
      render.setTint();

      audio.gameover();

      this.update = this.bootSequence;
      timer.frameRate = 60;
    };

    detectGamepad() {
      if (state < 3) {
        if (controls.gamepad) {
          render.setTint(colors[14]);
          font.print(0, 168, "Gamepad detected");
          render.setTint();
        } else {
          render.fill(0, 168, 128, 8, colors[0]);
        }
      }
    };

    setupColors() {
      const info = config.colors;

      for (let i = 0, len = info.length; i < len; i++) {
        let color = info[i];

        if (color.startsWith("#")) {
          color = color.substring(1);
        }

        if (color.length == 3) {
          color += color;
        }

        const value = parseInt(color, 16);

        const r = ((value >> 16) & 255) / 255;
        const g = ((value >>  8) & 255) / 255;
        const b =  (value & 255) / 255;

        colors[i] = [r, g, b, 1.0];
      }

      colors.push([0.0, 0.0, 0.0, 0.0]);

      config.colors.length = 0;
    };

    setupSprites() {
      const info  = config.sprites;
      const width = spectrum.width;

      const canvas = document.createElement("canvas");
      const bitmap = canvas.getContext("2d");

      canvas.width  = width;
      canvas.height = spectrum.height;
      bitmap.drawImage(spectrum, 0, 0);

      let x = 0;
      let y = 0;
      let line = 0;

      for (let i = 0, len = info.length; i < len;) {
        const states = info[i++];
        const frames = info[i++];
        const size   = info[i++];
        const sheets = states * frames;
        const sprite = [];

        const pixels = (size * size) - 1;
        const border = size - 1;

        for (let j = 0; j < sheets; j++) {
          if (size > line) {
            line = size;
          }

          const data = {x:x, y:y, width:size, height:size};

          if (size == SPRITE_SIZE) {
            const binary = bitmap.getImageData(x, y, size, size);
            const buffer = new Uint32Array(binary.data.buffer);

            let t = 0;
            let r = size;
            let b = size;
            let l = 0;

            for (let p = 0; p <= pixels; p++) {
              if (buffer[p]) {
                t = p;
                break;
              }
            }

            for (let p = pixels; p >= 0; p--) {
              if (buffer[p]) {
                b = p;
                break;
              }
            }

            ltr: for (let p = 0; p < border; p++) {
              for (let s = p; s <= pixels; s += size) {
                if (buffer[s]) {
                  l = s;
                  break ltr;
                }
              }
            }

            rtl: for (let p = border; p > 0; p--) {
              for (let s = p; s <= pixels; s += size) {
                if (buffer[s]) {
                  r = s;
                  break rtl;
                }
              }
            }

            data.top    = (t / size) >> 0;
            data.right  = (r % size) + 1;
            data.bottom = ((b / size) >> 0) + 1;
            data.left   = l % size;
          }

          sprite.push(data);
          x += size;

          if (x >= width) {
            y = line + y;
            x = line = 0;
          }
        }

        if (states > 1) {
          sprites.push([sprite.splice(0, frames), sprite]);
        } else {
          sprites.push([sprite]);
        }
      }

      config.sprites.length = 0;
    };
  }