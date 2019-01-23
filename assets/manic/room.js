  class Room {
    constructor() {
      this.map      = [];
      this.counter  = 0;
      this.paper    = 0;
      this.ink      = 0;
      this.info     = null;
      this.enemies1 = null;
      this.enemies2 = null;
      this.solar    = null;
      this.animated = null;
      this.interact = null;

      this.attractMode = () => {
        if (controls.exit) {
          game.titleScreen();
        } else {
          render.restore();

          if (this.enemies1) {
            this.enemies1.move();
          }

          if (this.solar) {
            this.solar.move();
          }

          this.animated.draw();

          if (this.enemies1) {
            this.enemies1.draw();
          }

          if (this.enemies2) {
            this.enemies2.move();
          }

          portal.draw();
          panel.update();

          if (--this.counter == 0) {
            this.ink = 7;
            this.paper = 7;

            game.update = this.nextLevel;
            timer.frameRate = 60;
          }
        }
      }

      this.nextLevel = () => {
        background = colors[this.paper];

        if (!this.paper) {
          tintColor = null;

          if (++level == lastLevel) {
            game.titleScreen();
          } else {
            room.initialize(false);

            game.update = this.attractMode;
            timer.frameRate = 12;
          }
        } else {
          tintColor = Array.from(colors[this.ink]);

          if (--this.ink == 0) {
            this.paper--;
            this.ink = 7;
          }
        }
      }

      this.playMode = () => {
        if (controls.exit) {
          game.titleScreen();
        } else {
          if (this.paper >= 0) {
            background = colors[this.paper--];

            tintColor = colors[0];
          } else {
            tintColor = null;
          }

          render.restore();

          if (this.enemies1) {
            this.enemies1.move();
          }

          if (this.solar) {
            this.solar.move();
          }

          hero.move();
          this.animated.draw();
          hero.draw();

          if (this.enemies1) {
            this.enemies1.draw();
            hero.collides(this.enemies1);
          }

          if (this.enemies2) {
            this.enemies2.move();
            hero.collides(this.enemies2);
          }

          if (hero.status == DYING) {
            this.paper = 15;
            audio.die();

            game.update = this.heroDied;
            timer.frameRate = 30;
            return;
          }

          if (portal.collides()) {
            audio.stop();

            this.ink = 7;
            this.paper = 7;

            if (++level == lastLevel) {
              timer.stop();
              this.gameWon();
            } else {
              game.update = this.levelDone;
              timer.frameRate = 60;
            }
          } else {
            panel.update();
          }
        }
      }

      this.heroDied = () => {
        if (this.paper == 7) {
          tintColor = null;

          if (--lives < 0) {
            game.gameover();
          } else {
            this.reset();

            game.update = this.playMode;
            timer.frameRate = 12;
          }
        } else {
          tintColor = Array.from(colors[this.paper--]);
        }
      }

      this.levelDone = () => {
        background = colors[this.paper];

        if (!this.paper) {
          audio.air(clock, panel.air);
          game.update = panel.calculateScore;
        } else {
          tintColor = Array.from(colors[this.ink]);

          if (--this.ink == 0) {
            this.paper--;
            this.ink = 7;
          }
        }
      }

      this.gameWon = () => {
        audio.win();

        let sprite = sprites[0][0][3];

        render.fill(portal.x, portal.y + SPRITE_SIZE, SPRITE_SIZE, SPRITE_SIZE, colors[16]);
        render.copy(sprite.x, sprite.y, SPRITE_SIZE, SPRITE_SIZE, portal.x, portal.y - 24);

        sprite = sprites[101][0][0];

        render.fill(portal.x, portal.y, SPRITE_SIZE, SPRITE_SIZE, colors[16]);
        render.copy(sprite.x, sprite.y, SPRITE_SIZE, SPRITE_SIZE, portal.x, portal.y);
      }

      this.setupMap();
    };

    initialize(playing) {
      this.info = config.rooms[level];

      render.clear();

      this.decode(this.info.map);
      this.spriteFactory(this.info.enemies);

      if (playing) {
        hero.initialize(this.info.hero);
      } else {
        this.counter = 60;
      }

      portal.initialize(this.info.portal);
      this.setup();
    };

    reset() {
      if (this.interact) {
        render.setBuffer(render.fb_base);
        this.interact.reset();
        this.interact.draw();
        render.setBuffer(render.fb_room);
      }

      this.animated.reset();

      if (this.enemies1) {
        this.enemies1.reset();
      }

      if (this.enemies2) {
        this.enemies2.reset();
      }

      hero.reset();
      portal.reset();
      this.setup();
    };

    setup() {
      this.paper = -1;
      this.ink   = -1;

      clock = this.info.clock || 252;

      borderColor = colors[this.info.border || 2];

      if (this.info.background < 0) {
        background = colors[0];

        render.setBuffer(render.fb_base);
        render.copy(0, 264, 256, 64, 0, 0);
        render.setBuffer(render.fb_room);
      } else {
        background = colors[this.info.background || 0];
      }

      remains = items;
      panel.draw();
    };

    setupMap() {
      const len = ROOM_COLUMNS * ROOM_ROWS;

      let x = 0;
      let y = 0;
      let e = 1;
      let w = 511;

      for (let i = 0; i < len; i++) {
        const tile = this.map[i] = new Tile(i, x, y);

        tile.n = (i + 480) & 511;
        tile.e = (e++)     & 511;
        tile.s = (i + 32)  & 511;
        tile.w = (w++)     & 511;

        x += TILE_SIZE;

        if (x >= SCREEN_WIDTH) {
          x = 0;
          y += TILE_SIZE;
        }
      }

      for (let i = 0; i < len; i++) {
        const tile = this.map[i];

        tile.n = this.map[tile.n];
        tile.e = this.map[tile.e];
        tile.s = this.map[tile.s];
        tile.w = this.map[tile.w];
      }
    };

    decode(map) {
      const len = map.length;

      items = 0;

      this.animated = null;
      this.interact = null;

      let counter = 0;
      let decoded = 0;

      let tile1 = null;
      let tile2 = null;

      const setBlock = (index, value) => {
        const type = parseInt(value, 36) - 1;
        const cell = this.map[index];

        if (type < 0) {
          cell.flush();
        } else {
          let mode = cell.initialize(this.info.tiles[type]);
          cell.reset();

          if (mode < 0) {
            if (this.interact) {
              tile1.next = cell;
            } else {
              this.interact = cell;
            }

            tile1 = cell;
          } else if (mode > 0) {
            if (this.animated) {
              tile2.next = cell;
            } else {
              this.animated = cell;
            }

            tile2 = cell;
          } else {
            cell.draw();
          }
        }
      }

      render.setBuffer(render.fb_base);
      render.clear();

      do {
        let block = map.charAt(counter);

        if (block != "+") {
          setBlock(decoded++, block);
        } else {
          const cells = parseInt(map.charAt(++counter), 36);
          block = map.charAt(++counter);

          for (let i = 0; i < cells; i++) {
            setBlock(decoded++, block);
          }
        }
      } while (++counter < len);

      if (this.interact) {
        this.interact.draw();
      }

      render.setBuffer(render.fb_room);
    };

    spriteFactory(list) {
      this.enemies1 = null;
      this.enemies2 = null;
      this.solar    = null;

      let curr1 = null;
      let curr2 = null;
      let next1 = null;
      let next2 = null;

      for (let i = 0, len = list.length; i < len; i++) {
        const enemy = list[i];

        switch (enemy.type) {
          case 0:
            next1 = new Horizontal(enemy);

            if (this.enemies1) {
              curr1.next = next1;
            } else {
              this.enemies1 = next1;
            }

            curr1 = next1;
            continue;

          case 1:
            next2 = new Vertical(enemy);
            break;
          case 2:
            next2 = new Eugene(enemy);
            break;
          case 3:
            next2 = new Kong(enemy);
            break;
          case 4:
            next2 = new Skylab(enemy);
            break;
          case 5:
            this.solar = new Solar(enemy);
            continue;
        }

        if (this.enemies2) {
          curr2.next = next2;
        } else {
          this.enemies2 = next2;
        }

        curr2 = next2;
      }
    };
  }