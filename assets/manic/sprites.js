  class Sprite {
    constructor() {
      this.foil = null;
      this.next = null;

      this.totalStates = 0;
      this.totalFrames = 0;

      this.start = {
        cell:   0,
        x:      0,
        y:      0,
        min:    0,
        max:    0,
        altMin: 0,
        altMax: 0,
        state:  0,
        frame:  0
      };

      this.type  = 0;
      this.cell  = 0;
      this.x     = 0;
      this.y     = 0;
      this.min   = 0;
      this.max   = 0;
      this.state = 0;
      this.frame = 0;

      this.bound = {top:0, right:0, bottom:0, left:0};
    };

    initialize(info, coords) {
      this.foil = sprites[info.foil];
      this.type = info.type + 1;

      this.start.state = 0;
      this.totalStates = this.foil.length - 1;

      this.start.frame = info.frame || 0;
      this.totalFrames = this.foil[0].length - 1;

      if (!coords) {
        coords = info.coords;
      }

      const split = coords.split(",");
      this.x = split[0] >> 0;
      this.y = split[1] >> 0;

      if (info.alternate) {
        coords = info.alternate.split(",");

        this.start.altMin = (coords[0] >> 0);
        this.start.altMax = (coords[1] >> 0);

        info.cell.affected.push(this);
      }

      if (this.start.frame > this.totalFrames) {
        this.start.state = this.totalStates;
        this.start.frame -= (this.totalFrames + 1);
        return 1;
      }

      return 0;
    };

    reset() {
      this.cell  = this.start.cell;
      this.x     = this.start.x;
      this.y     = this.start.y;
      this.min   = this.start.min;
      this.max   = this.start.max;
      this.state = this.start.state;
      this.frame = this.start.frame;
    };

    getBoundsRect() {
      const r = this.foil[this.state][this.frame];

      this.bound.top    = r.top    + this.y;
      this.bound.right  = r.right  + this.x;
      this.bound.bottom = r.bottom + this.y;
      this.bound.left   = r.left   + this.x;

      return this.bound;
    };

    draw() {
      const src = this.foil[this.state][this.frame];
      render.copy(src.x, src.y, SPRITE_SIZE, SPRITE_SIZE, this.x, this.y);
    };

    trigger() {
      this.min = this.start.altMin;
      this.max = this.start.altMax;
    };
  }

  class Horizontal extends Sprite {
    constructor(info) {
      super();

      let coords = info.coords.split(":");

      this.facing = this.initialize(info, coords[0]);
      this.moving = 0;
      this.slow   = info.slow || 0;

      const row = this.y * ROOM_COLUMNS;

      coords = coords[1].split(",");

      this.start.cell = this.x + row;
      this.start.x    = this.x * TILE_SIZE;
      this.start.y    = this.y * TILE_SIZE;
      this.start.min  = (coords[0] >> 0) + row;
      this.start.max  = (coords[1] >> 0) + row;

      if (this.start.altMin) {
        this.start.altMin += row;
        this.start.altMax += row;
      }

      this.reset();
    };

    reset() {
      super.reset();

      this.moving = this.facing;
      this.position(room.map[this.cell]);
      this.draw();

      if (this.next) {
        this.next.reset();
      }
    };

    move() {
      if (!(this.slow && !(clock & 4))) {
        const tile = room.map[this.cell];

        if (this.moving) {
          if (this.frame == 0) {
            if (this.cell == this.min) {
              this.moving = 0;
              this.state  = 0;
            } else {
              this.cell--;
              this.frame = this.totalFrames;
              this.position(tile);
            }
          } else {
            this.frame--;
          }
        } else {
          if (this.frame == this.totalFrames) {
            if (this.cell == this.max) {
              this.moving = 1;
              this.state  = this.totalStates;
            } else {
              this.cell++;
              this.frame = 0;
              this.position(tile);
            }
          } else {
            this.frame++;
          }
        }
      }

      if (this.next) {
        this.next.move();
      }
    };

    draw() {
      super.draw();

      if (this.next) {
        this.next.draw();
      }
    };

    position(tile) {
      tile.sprite     = 0;
      tile.s.sprite   = 0;
      tile.e.sprite   = 0;
      tile.e.s.sprite = 0;

      const next = room.map[this.cell];

      next.sprite     = this.type;
      next.s.sprite   = this.type;
      next.e.sprite   = this.type;
      next.e.s.sprite = this.type;

      this.x = (this.cell & 31) * TILE_SIZE;
    };
  }

  class Vertical extends Sprite {
    constructor(info, reset = true) {
      super();

      let coords = info.coords.split(":");

      this.initialize(info, coords[0]);

      coords = coords[1].split(",");

      this.start.cell  = this.x + ((this.y >> 3) * ROOM_COLUMNS);
      this.start.x     = this.x * TILE_SIZE;
      this.start.y     = this.y;
      this.start.speed = info.speed || 2;
      this.start.min   = (coords[0] >> 0);
      this.start.max   = (coords[1] >> 0);

      if (reset) {
        this.reset();
      }
    };

    reset() {
      super.reset();

      this.speed = this.start.speed;
      this.position();
      this.draw();

      if (this.next) {
        this.next.reset();
      }
    };

    move() {
      if (++this.frame > this.totalFrames) {
        this.frame = 0;
      }

      const y = this.y + this.speed;

      if (y < this.min || y >= this.max) {
        this.speed = -this.speed;
      } else {
        this.y = y;
        this.position();
      }

      this.draw();

      if (this.next) {
        this.next.move();
      }
    };

    position(cell = 0) {
      let tile = room.map[this.cell];

      tile.sprite     = 0;
      tile.e.sprite   = 0;
      tile.e.s.sprite = 0;

      tile = tile.s;

      tile.sprite     = 0;
      tile.s.sprite   = 0;
      tile.s.e.sprite = 0;

      if (!cell) {
        this.cell = (this.cell & 31) + ((this.y >> 3) * ROOM_COLUMNS);
      } else {
        this.cell = cell + ((this.y >> 3) * ROOM_COLUMNS);
      }

      let next = room.map[this.cell];

      next.sprite     = this.type;
      next.e.sprite   = this.type;
      next.e.s.sprite = this.type;

      next = next.s;

      next.sprite     = this.type;
      next.s.sprite   = this.type;
      next.s.e.sprite = this.type;
    };
  }

  class Eugene extends Vertical {
    constructor(info) {
      super(info, false);

      this.moving  = 0;
      this.resting = false;
      this.stop    = info.stop || this.start.max;

      this.reset();
    };

    reset() {
      this.moving  = 0;
      this.resting = false;
      super.reset();
    };

    move() {
      if (remains) {
        const y = this.y + this.speed;

        if (y < this.min || y >= this.max) {
          this.speed = -this.speed;
        } else {
          this.y = y;
          this.position();
        }
      } else {
        if (++this.frame > this.totalFrames) {
          this.frame = 0;
        }

        if (!this.resting) {
          const y = this.y + this.start.speed;

          if (this.y >= this.stop) {
            this.resting = true;
          } else {
            this.y = y;
            this.position();
          }
        }
      }

      this.draw();

      if (this.next) {
        this.next.move();
      }
    };
  }

  class Kong extends Vertical {
    constructor(info) {
      super(info, false);

      this.falling = 0;
      this.reset();
    };

    reset() {
      fallingKong = null;

      this.falling = 0;
      super.reset();
    };

    move() {
      if (this.falling < 2) {
        this.frame = (clock & 32) ? 0 : 1;

        if (this.falling == 1) {
          const y = this.y + 4;

          if (y >= portal.y || y >= this.max) {
            fallingKong = null;

            this.falling = 2;

            render.fill(this.x, this.y, SPRITE_SIZE, SPRITE_SIZE, colors[16]);
            return;
          } else {
            this.y = y;
            this.position();
            panel.addScore(100);
          }
        } else {
          const tile = room.map[(this.cell + 64) & 511];

          if (!(tile.hasAttribute(PLATFORM) || tile.e.hasAttribute(PLATFORM))) {
            fallingKong = this;

            this.state = 1;
            this.falling = 1;
          }
        }

        this.draw();
      }

      if (this.next) {
        this.next.move();
      }
    };
  }

  class Skylab extends Vertical {
    constructor(info) {
      super(info);
    };

    move() {
      if (this.y >= this.max) {
        if (++this.frame > this.totalFrames) {
          this.frame = 0;

          const cell = (this.cell + 8) & 31;

          this.x = cell * TILE_SIZE;
          this.y = this.min;
          this.position(cell);
        }
      } else {
        this.y += this.speed;
        this.position();
      }

      this.draw();

      if (this.next) {
        this.next.move();
      }
    };
  }

  class Solar {
    constructor(info) {
      const coords = info.coords.split(",");
      this.x = coords[0] >> 0;
      this.y = coords[1] >> 0;

      this.cell  = this.x + (this.y * ROOM_COLUMNS);
      this.color = colors[info.color || 14];

      this.move();
    };

    move() {
      let cell = this.cell;
      let move = ROOM_COLUMNS;

      do {
        let tile = room.map[cell];

        if (tile.hasAttribute(PLATFORM) || tile.hasAttribute(SOLID)) {
          break;
        }

        if (!tile.attributes) {
          render.fill(tile.x, tile.y, TILE_SIZE, TILE_SIZE, this.color);

          if (tile.sprite < 1) {
            if (tile.sprite < 0) {
              panel.decreaseAir();
              panel.decreaseAir();
              panel.decreaseAir();
              panel.decreaseAir();
            }

            cell += move;
            continue;
          }
        }

        if (move < 0) {
          move = ROOM_COLUMNS;
        } else {
          move = -1;
        }

        cell += move;
      } while (true);
    };
  }

  class Portal extends Sprite {
    constructor() {
      super();
      this.open = false;
    };

    initialize(info) {
      super.initialize(info);

      this.start.cell = this.x + (this.y * ROOM_COLUMNS);
      this.start.x    = this.x * TILE_SIZE;
      this.start.y    = this.y * TILE_SIZE;

      this.reset();
    };

    reset() {
      super.reset();
      this.open = false;
    };

    collides() {
      this.draw();

      return this.open && (this.cell == hero.tile.cell);
    };

    draw() {
      if (this.open) {
        if (++this.max == 3) {
          this.max = 0;
          this.frame ^= 1;
        }
      }

      super.draw();
    };
  }