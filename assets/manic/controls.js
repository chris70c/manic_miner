  class Controls {
    constructor() {
      this.gamepad = navigator.getGamepads()[0];
      this.press   = [];
      this.release = [];

      this.keyLeft  = 37;
      this.keyRight = 39;
      this.keyJump  = 32;
      this.keyStart = 13;
      this.keyExit  = 27;
      this.keyMusic = 77;
      this.keyPause = 80;

      if (MOBILE) {
        this.buttons = [];

        this.buttons[0] = new Button("left",  this.keyLeft);
        this.buttons[1] = new Button("right", this.keyRight);
        this.buttons[2] = new Button("jump1", this.keyJump);
        this.buttons[3] = new Button("jump2", this.keyJump);
        this.buttons[4] = new Button("start", this.keyStart);
        this.buttons[5] = new Button("exit",  this.keyExit);
        this.buttons[6] = new Button("music", this.keyMusic);
      }

      this.keyDown = (e) => {
        switch (e.keyCode) {
          case this.keyLeft:
          case this.keyRight:
          case this.keyJump:
          case this.keyStart:
          case this.keyExit:
            this.press[e.keyCode] = 1;
            e.preventDefault();
        }
      }

      this.keyUp = (e) => {
        switch (e.keyCode) {
          case this.keyLeft:
          case this.keyRight:
          case this.keyJump:
          case this.keyStart:
          case this.keyExit:
            this.release[e.keyCode] = 1 & this.press[e.keyCode];
            break;
          case this.keyMusic:
            if (state > 4) {
              audio.muted ^= 1;
            }
            break;
          case this.keyPause:
            if (state == 6) {
              timer.stop();
              audio.context.suspend();
              state = 7;
            } else if (state == 7) {
              state = 6;
              audio.context.resume();
              timer.start();
            }
            break;
        }
      }

      this.touchStart = (e) => {
        e.preventDefault();

        for (let i = 0, len = e.changedTouches.length; i < len; i++) {
          const t = e.changedTouches[i];
          const x = t.pageX;
          const y = t.pageY;

          for (let j = 0; j < 7; j++) {
            const b = this.buttons[j];

            if (b.contains(x, y)) {
              this.press[b.key] = 1;
              b.node.classList.add("pressed");

              if (b.key == this.keyStart) {
                if (state == 6) {
                  b.node.classList.add("toggled");
                  timer.stop();
                  audio.context.suspend();
                  state = 7;
                } else if (state == 7) {
                  b.node.classList.remove("toggled");
                  state = 6;
                  audio.context.resume();
                  timer.start();
                }
              } else if (b.key == this.keyMusic) {
                if (state > 4) {
                  b.node.classList.toggle("toggled");
                  audio.muted ^= 1;
                }
              }
            }
          }
        }
      }

      this.touchMove = (e) => {
        e.preventDefault();

        this.release[this.keyLeft]  = this.press[this.keyLeft];
        this.release[this.keyRight] = this.press[this.keyRight];
        this.release[this.keyJump]  = this.press[this.keyJump];
        this.release[this.keyStart] = this.press[this.keyStart];
        this.release[this.keyExit]  = this.press[this.keyExit];
        this.release[this.keyMusic] = this.press[this.keyMusic];

        for (let i = 0; i < 7; i++) {
          if (this.release[this.buttons[i].key]) {
            this.buttons[i].node.classList.remove("pressed");
          }
        }

        for (let i = 0, len = e.targetTouches.length; i < len; i++) {
          const t = e.targetTouches[i];
          const x = t.pageX;
          const y = t.pageY;

          for (let j = 0; j < 7; j++) {
            const b = this.buttons[j];

            if (b.contains(x, y)) {
              this.press[b.key] = 1;
              b.node.classList.add("pressed");
              this.release[b.key] = 0;
            }
          }
        }
      }

      this.touchEnd = (e) => {
        e.preventDefault();

        for (let i = 0, len = e.changedTouches.length; i < len; i++) {
          const t = e.changedTouches[i];
          const x = t.pageX;
          const y = t.pageY;

          for (let j = 0; j < 7; j++) {
            const b = this.buttons[j];

            if (b.contains(x, y)) {
              if (this.press[b.key]) {
                b.node.classList.remove("pressed");
                this.release[b.key] = 1;
              }
            }
          }
        }
      }

      window.addEventListener("gamepadconnected", (e) => {
        this.gamepad = navigator.getGamepads()[0];
        game.detectGamepad();
      });

      window.addEventListener("gamepaddisconnected", (e) => {
        this.gamepad = null;
        game.detectGamepad();
      });

      this.reset();
    };

    get left() {
      if (this.gamepad) {
        return this.gamepad.buttons[14].pressed;
      } else {
        return this.press[this.keyLeft];
      }
    };

    get right() {
      if (this.gamepad) {
        return this.gamepad.buttons[15].pressed;
      } else {
        return this.press[this.keyRight];
      }
    };

    get jump() {
      if (this.gamepad) {
        return this.gamepad.buttons[0].pressed;
      } else {
        return this.press[this.keyJump];
      }
    };

    get start() {
      return this.press[this.keyStart] || (this.gamepad && this.gamepad.buttons[9].pressed);
    };

    get exit() {
      return this.press[this.keyExit]  || (this.gamepad && this.gamepad.buttons[8].pressed);
    };

    enable() {
      if (MOBILE) {
        document.addEventListener("touchstart", this.touchStart, {passive:false});
        document.addEventListener("touchmove",  this.touchMove,  {passive:false});
        document.addEventListener("touchend",   this.touchEnd,   {passive:false});
      } else {
        document.addEventListener("keydown", this.keyDown);
        document.addEventListener("keyup",   this.keyUp);
      }
    };

    disable() {
      if (MOBILE) {
        document.removeEventListener("touchstart", this.touchStart, {passive:false});
        document.removeEventListener("touchmove",  this.touchMove,  {passive:false});
        document.removeEventListener("touchend",   this.touchEnd,   {passive:false});
      } else {
        document.removeEventListener("keydown", this.keyDown);
        document.removeEventListener("keyup",   this.keyUp);
      }
    };

    resize() {
      for (let i = 0; i < 7; i++) {
        this.buttons[i].update();
      }
    };

    reset() {
      this.restore(this.press);
      this.restore(this.release);
    };

    restore(state) {
      state[this.keyLeft]  = 0;
      state[this.keyRight] = 0;
      state[this.keyJump]  = 0;
      state[this.keyStart] = 0;
      state[this.keyExit]  = 0;
      state[this.keyMusic] = 0;
    };

    update() {
      this.gamepad = navigator.getGamepads()[0];

      this.press[this.keyLeft]  ^= this.release[this.keyLeft];
      this.press[this.keyRight] ^= this.release[this.keyRight];
      this.press[this.keyJump]  ^= this.release[this.keyJump];
      this.press[this.keyStart] ^= this.release[this.keyStart];
      this.press[this.keyExit]  ^= this.release[this.keyExit];

      this.restore(this.release);
    };
  }

  class Button {
    constructor(id, key) {
      this.node = document.getElementById(id);
      this.key  = key;
      this.rect = null;
    };

    contains(x, y) {
      return (x >= this.rect.left
           && x <= this.rect.right
           && y >= this.rect.top
           && y <= this.rect.bottom);
    };

    update() {
      this.rect = this.node.getBoundingClientRect();
    };
  }