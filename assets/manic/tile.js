  class Tile {
    constructor(cell, x, y) {
      this.cell = cell;
      this.x = x;
      this.y = y;
      this.n = 0;
      this.e = 0;
      this.s = 0;
      this.w = 0;

      this.sh = TILE_SIZE;
      this.dy = this.y;

      this.draw = this.fill;
      this.foil = null;
      this.next = null;

      this.startFrame  = 0;
      this.totalFrames = 0;

      this.affected   = null;
      this.attributes = 0;
      this.direction  = 0;
      this.frame      = 0;
      this.sprite     = 0;
      this.stepped    = 0;
      this.visible    = false;
    };

    initialize(info) {
      this.draw = this.copy;
      this.foil = sprites[info.foil];
      this.next = null;

      this.startFrame  = 0;
      this.totalFrames = this.foil[0].length - 1;

      switch (info.type) {
        case 0:   // floor
          this.attributes = PLATFORM;
          return 0;

        case 1:   // crumble
          this.attributes = PLATFORM | CRUMBLE;
          return -1;

        case 2:   // wall
          this.attributes = PLATFORM | SOLID;
          return 0;

        case 3:   // conveyor
          this.attributes = PLATFORM | MOVING;
          this.direction = info.direction || 0;
          this.draw = this.update;
          break;

        case 4:   // nasty
          this.attributes = DAMAGE;
          return 0;

        case 5:   // switch
          this.attributes = SWITCH;
          this.affected = [];

          const tiles = info.tiles.split(":");

          for (let i = 0, len = tiles.length; i < len; i++) {
            const coord = tiles[i].split(",");
            const x = coord[0] >> 0;
            const y = coord[1] >> 0;

            this.affected.push(room.map[x + (y * ROOM_COLUMNS)]);
          }

          if (info.enemies) {
            const limits = info.enemies.split(":");

            for (let i = 0, len = limits.length; i < len; i++) {
              const coord = limits[i].split(";");
              const enemy = room.info.enemies[coord[0] >> 0];

              if (enemy.type < 3) {
                enemy.cell = this;
                enemy.alternate = coord[1];
              }
            }
          }

          return -1;

        case 6:   // item
          this.attributes = ITEM;
          this.startFrame = info.colors[items++];
          this.draw = this.collect;
          break;
      }

      return 1;
    };

    hasAttribute(attribute) {
      return this.visible && ((this.attributes & attribute) == attribute);
    };

    flush() {
      this.sh = 0;
      this.dy = 0;

      this.draw = this.fill;
      this.foil = null;
      this.next = null;

      this.startFrame  = 0;
      this.totalFrames = 0;

      this.affected   = null;
      this.attributes = 0;
      this.direction  = 0;
      this.frame      = 0;
      this.sprite     = 0;
      this.stepped    = 0;
      this.visible    = false;
    };

    reset() {
      this.sh = TILE_SIZE;
      this.dy = this.y;

      this.frame   = this.startFrame;
      this.sprite  = 0;
      this.stepped = 0;
      this.visible = Array.isArray(this.foil);

      if (this.affected) {
        const len = this.affected.length;

        for (let i = 0; i < len; i++) {
          this.affected[i].reset();
        }
      }

      if (this.next) {
        this.next.reset();
      }
    };

    copy() {
      const src = this.foil[0][this.frame];

      this.fill();
      render.copy(src.x, src.y, TILE_SIZE, this.sh, this.x, this.dy);

      if (this.next) {
        this.next.draw();
      }
    };

    fill() {
      render.fill(this.x, this.y, TILE_SIZE, TILE_SIZE, colors[16]);
    };

    update() {
      if (this.visible) {
        if (++this.frame > this.totalFrames) {
          this.frame = 0;
        }

        const src = this.foil[0][this.frame];
        render.copy(src.x, src.y, TILE_SIZE, this.sh, this.x, this.dy);
      }

      if (this.next) {
        this.next.draw();
      }
    };

    collect() {
      if (this.visible) {
        if (++this.frame > this.totalFrames) {
          this.frame = 0;
        }

        const src = this.foil[0][this.frame];
        render.copy(src.x, src.y, TILE_SIZE, this.sh, this.x, this.dy);

        if (this.sprite < 0 && hero.status != DYING) {
          this.visible = false;
          panel.addScore(100);

          if (--remains == 0) {
            portal.open = true;
          }
        }
      }

      if (this.next) {
        this.next.draw();
      }
    };

    step() {
      if (this.visible) {
        render.setBuffer(render.fb_base);
        render.fill(this.x, this.y, TILE_SIZE, TILE_SIZE, colors[16]);

        if (++this.stepped < 7) {
          const src = this.foil[0][0];

          this.sh = TILE_SIZE - this.stepped;
          this.dy = this.y + this.stepped;

          render.copy(src.x, src.y, TILE_SIZE, this.sh, this.x, this.dy);
        } else {
          this.visible = false;
        }

        render.setBuffer(render.fb_room);
      }
    };

    toggle() {
      if (!this.frame) {
        const len = this.affected.length;

        for (let i = 0; i < len; i++) {
          this.affected[i].trigger();
        }

        const src = this.foil[0][++this.frame];

        render.setBuffer(render.fb_base);
        render.fill(this.x, this.y, TILE_SIZE, TILE_SIZE, colors[16]);
        render.copy(src.x, src.y, TILE_SIZE, TILE_SIZE, this.x, this.y);
        render.setBuffer(render.fb_room);
      }
    };

    trigger() {
      this.visible = false;

      render.setBuffer(render.fb_base);
      render.fill(this.x, this.y, TILE_SIZE, TILE_SIZE, colors[16]);
      render.setBuffer(render.fb_room);
    };
  }