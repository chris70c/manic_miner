  class Hero {
    constructor() {
      this.foil = null;
      this.look = [0,1,0,1, 1,3,1,3, 2,0,2,0, 0,1,2,3];

      this.startFrame  = 0;
      this.totalFrames = 0;
      this.facing      = 0;
      this.startCell   = 0;
      this.startY      = 0;

      this.status  = 0;
      this.moving  = 0;
      this.jumping = 0;
      this.tile    = null;
      this.x       = 0;
      this.y       = 0;
      this.frame   = 0;

      this.bound = {top:0, right:0, bottom:0, left:0};
    };

    initialize(info) {
      const split = info.coords.split(",");
      const x = split[0] >> 0;
      const y = split[1] >> 0;

      this.foil = sprites[info.foil || 0];

      this.startFrame  = info.frame || 0;
      this.totalFrames = this.foil[0].length - 1;
      this.facing      = 0;
      this.startCell   = x + (y * ROOM_COLUMNS);
      this.startY      = y * TILE_SIZE;

      if (this.startFrame > this.totalFrames) {
        this.startFrame -= (this.totalFrames + 1);
        this.facing = 1;
      }

      this.reset();
    };

    reset() {
      this.status  = WALKING;
      this.moving  = this.facing;
      this.jumping = 0;
      this.tile    = room.map[this.startCell];
      this.y       = this.startY;
      this.frame   = this.startFrame;

      this.position();
      this.draw();
    };

    getBoundsRect() {
      const r = this.foil[this.moving & 1][this.frame];

      this.bound.top    = r.top    + this.y;
      this.bound.right  = r.right  + this.x;
      this.bound.bottom = r.bottom + this.y;
      this.bound.left   = r.left   + this.x;

      return this.bound;
    };

    collides(sprite) {
      const r1 = this.getBoundsRect();

      do {
        const r2 = sprite.getBoundsRect();

        if (r1.top < r2.bottom
         && r2.top < r1.bottom
         && r1.left < r2.right
         && r2.left < r1.right)
        {
          this.status = DYING;
          break;
        }

      } while (sprite = sprite.next);
    };

    move() {
      this.clear();

      if (this.status == JUMPING) {
        const delta = ((this.jumping & 254) - 8) >> 1;

        this.y += delta;

        if (this.y < this.tile.y) {
          this.tile = this.tile.n;
        } else if (this.y >= this.tile.s.y) {
          this.tile = this.tile.s;
        }

        this.position();

        if (this.jumping++ < 8) {
          if (this.tile.hasAttribute(SOLID) || this.tile.e.hasAttribute(SOLID)) {
            this.status = FALLING;
            this.moving &= 1;

            this.tile = this.tile.s;
            this.y = this.tile.y;
            this.position();

            return;
          }
        } else if (this.jumping == 18) {
          this.status = 6;
          return;

        } else if (this.jumping == 13 || this.jumping == 16) {
          if (this.platform()) {
            return;
          }
        }

        this.update();
      } else if (!this.platform()) {
        this.moving &= 1;

        if (this.status == WALKING) {
          this.status = FALLING;
        }

        this.status++;
        this.y += 4;

        if (this.y >= this.tile.s.y) {
          this.tile = this.tile.s;

          if (this.y >= 128) {
            this.y = 0;
          }
        }

        this.position();
      }

      let nasty = false;

      if (this.y & 7) {
        const tile = this.tile.s;
        nasty = tile.s.hasAttribute(DAMAGE) || tile.s.e.hasAttribute(DAMAGE);
      }

      if (this.tile.hasAttribute(DAMAGE) || this.tile.e.hasAttribute(DAMAGE) || this.tile.s.hasAttribute(DAMAGE) || this.tile.s.e.hasAttribute(DAMAGE) || nasty) {
        this.status = DYING;
        return;
      }

      if (this.tile.hasAttribute(SWITCH)) {
        this.tile.switched();
      }

      if (this.tile.e.hasAttribute(SWITCH)) {
        this.tile.e.switched();
      }

      if (this.tile.s.hasAttribute(SWITCH)) {
        this.tile.s.switched();
      }

      if (this.tile.s.e.hasAttribute(SWITCH)) {
        this.tile.s.e.switched();
      }
    };

    draw() {
      const src = this.foil[this.moving & 1][this.frame];

      let height = SPRITE_SIZE;

      if ((this.y + height) > 128) {
        height = 128 - this.y;
      }

      if (this.x == 248) {
        render.copy(src.x + TILE_SIZE, src.y, TILE_SIZE, height, 0, this.y + TILE_SIZE);
        render.copy(src.x, src.y, TILE_SIZE, height, SCREEN_WIDTH - TILE_SIZE, this.y);
      } else {
        render.copy(src.x, src.y, SPRITE_SIZE, height, this.x, this.y);
      }
    };

    platform() {
      if (this.y & 7) {
        return false;
      }

      const tile = this.tile.s.s;

      if (tile.hasAttribute(CRUMBLE)) {
        tile.step();
      } else if (tile.hasAttribute(DAMAGE)) {
        return false;
      }

      if (tile.e.hasAttribute(CRUMBLE)) {
        tile.e.step();
      } else if (tile.e.hasAttribute(DAMAGE)) {
        return false;
      }

      if (tile.hasAttribute(PLATFORM) || tile.e.hasAttribute(PLATFORM)) {
        if (this.status >= 12) {
          this.status = DYING;
          return true;
        }

        this.status = WALKING;

        let isRight = controls.right;
        let isLeft  = controls.left;

        if (tile.hasAttribute(MOVING) || tile.e.hasAttribute(MOVING)) {
          const dir = tile.direction || tile.e.direction;

          if (dir) {
            isRight |= 1;
          } else {
            isLeft  |= 1;
          }
        }

        const move = (isLeft * 4) + (isRight * 8);

        this.moving = this.look[this.moving + move];

        if (controls.jump) {
          this.status = JUMPING;
          this.jumping = 0;
        }

        this.update();
        return true;
      }
    };

    update() {
      if (this.moving & 2) {
        if (this.moving & 1) {
          if (this.frame == 0) {
            const tile = this.tile.w;

            if (tile.hasAttribute(SOLID) || tile.s.hasAttribute(SOLID) || ((this.y & 7) && tile.s.s.hasAttribute(SOLID))) {
              return;
            }

            this.tile = tile;
            this.frame = this.totalFrames;
          } else {
            this.frame--;
          }
        } else {
          if (this.frame == this.totalFrames) {
            const tile = this.tile.e.e;

            if (tile.hasAttribute(SOLID) || tile.s.hasAttribute(SOLID) || ((this.y & 7) && tile.s.s.hasAttribute(SOLID))) {
              return;
            }

            this.tile = this.tile.e;
            this.frame = 0;
          } else {
            this.frame++;
          }
        }
      }

      this.position();
    };

    clear() {
      this.tile.sprite     = 0;
      this.tile.s.sprite   = 0;
      this.tile.e.sprite   = 0;
      this.tile.e.s.sprite = 0;

      if (this.y & 7 || this.tile.y < this.y) {
        const below = this.tile.s;

        below.s.sprite   = 0;
        below.s.e.sprite = 0;
      }
    };

    position() {
      this.tile.sprite     = -1;
      this.tile.s.sprite   = -1;
      this.tile.e.sprite   = -1;
      this.tile.e.s.sprite = -1;

      if (this.y & 7) {
        const below = this.tile.s;

        below.s.sprite   = -1;
        below.s.e.sprite = -1;
      }

      this.x = this.tile.x;
    };
  }