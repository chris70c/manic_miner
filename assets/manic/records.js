  class Records {
    constructor() {
      this.color  = 0;
      this.frame  = 0;
      this.timer  = 0;
      this.charx  = 0;
      this.cursor = 0;
      this.index  = 0;
      this.entry  = "";
      this.player = "";

      this.xhr = new XMLHttpRequest();

      if (MOBILE) {
        this.input = document.createElement("input");
        this.input.type = "email";
        this.input.disabled = true;
        this.input.setAttribute("novalidate", "");

        this.form = document.createElement("form");
        this.form.appendChild(this.input);
      }

      this.cycleScores = () => {
        if (controls.start) {
          game.startGame(true);

        } else if (++this.timer == 64) {
          game.startGame(false);

        } else {
          render.setBlend(false);
          this.drawSprites(16);

          const records = config.records;
          const players = config.players;

          let color = this.color;
          let y = 40;

          for (let i = 0; i < 7; i++) {
            const r = records[i].toString().padStart(6, "0");
            const p = players[i].padEnd(18, ".");

            render.setTint(colors[color]);

            if (++color > 7) {
              color = 1;
            }

            font.print(24, y, r +"  "+ p);
            y += SPRITE_SIZE;
          }

          if (++this.color == TILE_SIZE) {
            this.color = 1;
          }

          render.setTint();
          render.setBlend(true);
        }
      }

      this.blinkCursor = () => {
        if (++this.timer == 6) {
          this.timer = 0;
          render.setBlend(false);

          this.drawSprites(112);

          if (this.cursor) {
            render.fill(this.charx, 56, 1, TILE_SIZE, colors[16]);
          } else {
            render.fill(this.charx, 56, 1, TILE_SIZE, colors[15]);
          }

          render.setBlend(false);
          this.cursor ^= 1;
        }
      }

      this.waitUser = (e) => {
        this.input.removeEventListener("click", this.waitUser);

        game.update = this.blinkCursor;
        timer.frameRate = 30;
        timer.start();
      }

      this.keydown = (e) => {
        if (e.keyCode == 13) {
          e.preventDefault();
          this.disable();

          if (MOBILE) {
            container.removeChild(this.form);
            this.input.value = "";
            this.input.disabled = true;
          }

          setTimeout(() => {
            controls.enable();
          }, 300);

          this.updateScores();
          this.hallScreen();

        } else if (e.keyCode == 8 && this.charx > 56) {
          this.deleteChar();
          this.entry = this.player;

        } else if (this.charx >= 200) {
          e.preventDefault();
        }
      }

      this.keypress = (e) => {
        if (this.charx < 200) {
          this.printChar(e.key);
          this.player += e.key;
        }
      }

      this.mobile = (e) => {
        const value = this.input.value;

        if (value.length < this.entry.length) {
          this.deleteChar();
        } else {
          this.printChar(value.substr(-1));
          this.player = value;
        }

        this.entry = value;
      }
    };

    enable() {
      if (MOBILE) {
        this.input.addEventListener("keydown", this.keydown);
        this.input.addEventListener("textInput", this.keydown);
        this.input.addEventListener("input", this.mobile);
      } else {
        document.addEventListener("keydown", this.keydown);
        document.addEventListener("keypress", this.keypress);
      }
    };

    disable() {
      if (MOBILE) {
        this.input.removeEventListener("keydown", this.keydown);
        this.input.removeEventListener("textInput", this.keydown);
        this.input.removeEventListener("input", this.mobile);
      } else {
        document.removeEventListener("keydown", this.keydown);
        document.removeEventListener("keypress", this.keypress);
      }
    };

    hallScreen() {
      game.reset();
      state = 3;

      this.color = 1;
      this.frame = 0;
      this.timer = 0;

      this.drawScreen();
      this.drawSprites(16);

      font.print(-1, 24, "Hall of Fame");

      game.update = this.cycleScores;
      timer.frameRate = 5;
    };

    nameEntry() {
      state = 4;

      this.frame  = 0;
      this.timer  = 0;
      this.charx  = 56;
      this.cursor = 0;
      this.entry  = "";
      this.player = "";

      controls.disable();
      this.enable();

      this.drawScreen();
      this.drawSprites(112);

      const tile = sprites[102][0][0];

      let x = this.charx;

      for (let i = 0; i < 18; i++) {
        render.copy(tile.x, tile.y, TILE_SIZE, TILE_SIZE, x, 72);
        x += TILE_SIZE;
      }

      font.print(-1, 120, "Congratulations!");

      font.print(this.charx, 56, "..................");

      if (MOBILE) {
        font.print(-1, 16, "Touch the screen");
        font.print(-1, 24, "to enter your name");

        container.appendChild(this.form);
        this.input.addEventListener("click", this.waitUser);
        this.input.disabled = false;

        timer.stop();
      } else {
        font.print(-1, 16, "Please enter your name");
        font.print(-1, 24, "for the Hall of Fame");

        game.update = this.blinkCursor;
        timer.frameRate = 30;
      }
    };

    deleteChar() {
      render.fill(this.charx, 56, 1, TILE_SIZE, colors[16]);

      this.player = this.player.slice(0, -1);
      this.charx -= TILE_SIZE;

      render.setBlend(false);
      font.print(this.charx, 56, ".");
      render.setBlend(true);
    };

    printChar(value) {
      render.setBlend(false);
      font.print(this.charx, 56, value);
      render.setBlend(true);

      this.charx += TILE_SIZE;
    };

    drawScreen() {
      const tile = sprites[104][0][0];

      render.clear();

      borderColor = colors[0];

      let r = 22;
      let x = 0;
      let y = 184;
      let p = 160;

      if (landscape) {
        r = 20;
        y = 168;
        p = 152;
      }

      for (let i = 0; i < ROOM_COLUMNS; i++) {
        render.copy(tile.x, tile.y, TILE_SIZE, TILE_SIZE, x, 0);
        render.copy(tile.x, tile.y, TILE_SIZE, TILE_SIZE, x, y);
        x += TILE_SIZE;
      }

      y = TILE_SIZE;

      for (let i = 0; i < r; i++) {
        render.copy(tile.x, tile.y, TILE_SIZE, TILE_SIZE,   0, y);
        render.copy(tile.x, tile.y, TILE_SIZE, TILE_SIZE, 248, y);
        y += TILE_SIZE;
      }

      font.print(-1, p, "2018 Christian Corti");
    };

    drawSprites(y) {
      const x = this.frame * SPRITE_SIZE;

      render.copy(x, 0, SPRITE_SIZE, SPRITE_SIZE,  40, y);
      render.copy(x, 0, SPRITE_SIZE, SPRITE_SIZE, 200, y);

      this.frame += 2;

      if (this.frame == TILE_SIZE) {
        this.frame = 0;
      }
    };

    checkEntry() {
      const records = config.records;

      this.index = 0;

      let i = 0;
      let len = records.length;

      for (; i < len; i++) {
        if (records[i] < score) {
          break;
        }
      }

      if (i == len) {
        return true;
      }

      this.index = i;
      this.nameEntry();

      return false;
    };

    updateScores() {
      const records = config.records;
      const players = config.players;

      if (score > hiscore) {
        hiscore = score;
      }

      records.splice(this.index, 0, score);
      players.splice(this.index, 0, this.player);

      records.pop();
      players.pop();

      const data = "index="+ this.index +"&score="+ score +"&name="+ encodeURIComponent(this.player);

      this.xhr.open("post", "highscore.php");
      this.xhr.setRequestHeader("content-type", "application/x-www-form-urlencoded");
      this.xhr.send(data);
    };
  }