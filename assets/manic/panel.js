  class Panel {
    constructor() {
      this.air = 0;
      this.frame = 0;

      this.calculateScore = () => {
        for (let i = 0; i < 8; i++) {
          if (this.decreaseAir()) {
            tintColor = null;
            room.initialize(true);

            game.update = room.playMode;
            timer.frameRate = 12;
            break;
          }

          this.addScore(1);
        }
      }
    };

    reset() {
      this.air = 63;
      this.frame = 0;

      render.copy(256, 288, 256, 16, 0, 128);
      render.fill(0, 144, 256, panelHeight - SPRITE_SIZE, colors[0]);
    };

    draw() {
      this.reset();

      render.setTint(colors[0]);
      font.print(0, 128, room.info.name);

      render.setTint(colors[15]);
      font.print(0, 136, "AIR");

      this.printScore();
      this.drawLives();
      this.decreaseAir();
    };

    printScore() {
      render.setTint(colors[14]);

      let dx = 0;
      let dy = 152;

      if (landscape) {
        dx = 120;
        dy = 160;
      }

      font.print(dx, dy, "High Score "+ hiscore.toString().padStart(6, "0"));
      font.print(160, 152, "Score "+ score.toString().padStart(6, "0"));
      render.setTint();
    };

    addScore(value) {
      score += value;

      if ((score % 10000) == 0) {
        lives++;
        room.paper = 7;
        this.drawLives();
      }

      render.fill(208, 152, 48, 8, colors[0]);

      render.setTint(colors[14]);
      font.print(208, 152, score.toString().padStart(6, "0"));
      render.setTint();
    };

    decreaseAir() {
      clock = (clock - 4) & 255;

      if (clock == 252) {
        if (this.air == 36) {
          return true;
        }

        this.air--;
      }

      const w = (SCREEN_WIDTH - ((64 - this.air) * TILE_SIZE)) + (clock >> 5) - 32;

      render.copy(288, 296, 224, 8, 32, 136);
      render.copy(256, 306,   w, 4, 32, 138);

      return false;
    };

    drawLives() {
      let dx = 0;
      let dy = landscape ? 152 : 168;
      let sx = this.frame * SPRITE_SIZE;

      render.fill(0, dy, 120, SPRITE_SIZE, colors[0]);
      render.setTint(colors[13]);

      for (let i = 0; i < lives; i++) {
        render.copy(sx, 0, SPRITE_SIZE, SPRITE_SIZE, dx, dy);
        dx += SPRITE_SIZE;
      }

      this.frame = (++this.frame) & 3;
      render.setTint();
    };

    resize() {
      render.fill(0, 144, 256, panelHeight - SPRITE_SIZE, colors[0]);

      this.printScore();
      this.drawLives();
    };

    update() {
      if (this.decreaseAir()) {
        room.paper = 15;

        game.update = room.heroDied;
        timer.frameRate = 30;

      } else if ((clock & 12) == 12) {
        this.drawLives();
      }
    };
  }