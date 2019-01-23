  class Audio {
    constructor() {
      if (typeof AudioContext === "undefined") {
        try {
          this.context = new webkitAudioContext();
        } catch (e) {
          throw "Manic Miner cannot be played in this browser because it does not support WebAudio.";
        }
      } else {
        this.context = new AudioContext();
      }

      this.f = [0.167, 0.170, 0.210, 0.510, 0.715];
      this.t = [50, 125, 180, 183, 210, 360, 1710];

      this.notes1  = null;
      this.notes2  = null;
      this.node    = null;
      this.process = null;
      this.piano   = [];
      this.muted   = 0;

      this.position = 0;
      this.beeper   = 0;
      this.startD   = 0;
      this.loopD    = 0;
      this.startE   = 0;
      this.loopE    = 0;
      this.interval = 0;
      this.samples  = 0;

      this.mixSilent = (e) => {
        e.outputBuffer.getChannelData(0).fill(0);
      }

      this.mixTitle = (e) => {
        const c = e.outputBuffer.getChannelData(0);

        for (let i = 0; i < 4096; i++) {
          if (--this.samples <= 0) {
            if (this.process(e.playbackTime)) {
              c.fill(0, i);
              this.node.onaudioprocess = this.stop;
              break;
            }
          }

          c[i] = 0.5 * this.beeper;

          if (--this.loopD <= 0) {
            this.beeper ^= 1;
            this.loopD += this.startD;
          }

          if (--this.loopE <= 0) {
            this.beeper ^= 1;
            this.loopE += this.startE;
          }
        }
      }

      this.mixer = (e) => {
        const c = e.outputBuffer.getChannelData(0);

        for (let i = 0; i < 4096; i++) {
          if (--this.samples <= 0) {
            if (this.process()) {
              c.fill(0, i);
              this.node.onaudioprocess = this.stop;
              break;
            }
          }

          c[i] = 0.5 * this.beeper;

          if (this.interval >= this.samples) {
            this.beeper = 0;
          } else {
            if (--this.loopD <= 0) {
              this.beeper ^= 1;
              this.loopD += this.startD;
            }
          }
        }
      }

      this.stop = () => {
        if (this.node) {
          this.node.disconnect();
          this.node.onaudioprocess = null;
          this.node = null;

          this.resetPiano();

          if (level == lastLevel) {
            level = 0;
            game.update = room.levelDone;

            timer.frameRate = 60;
            timer.start();
          }
        }
      }

      document.addEventListener("visibilitychange", (e) => {
        if (document.hidden) {
          this.context.suspend();
        } else if (state < 7) {
          this.context.resume();
        }
      });
    };

    initialize() {
      this.notes1 = config.piano;
      this.notes2 = config.ingame;

      if (this.context.sampleRate != 44100) {
        const rate = this.context.sampleRate;

        for (let i = 0, len = this.f.length; i < len; i++) {
          this.f[i] = (this.f[i] / 44100) * rate;
        }

        for (let i = 0, len = this.t.length; i < len; i++) {
          this.t[i] = ((this.t[i] / 44100) * rate) >> 0;
        }
      }

      this.setupPiano();
    };

    title() {
      this.stop();

      this.beeper   = 1;
      this.position = 0;
      this.samples  = 0;

      this.process = this.processTitle;
      this.play(this.mixTitle);
    };

    ingame() {
      this.stop();
      this.resetIngame();
      this.play(this.mixer);
    };

    die() {
      this.position = 7;
      this.interval = this.t[2];
      this.samples  = 0;

      this.process = this.processDie;
    };

    air(clock, air) {
      this.position = clock;
      this.startE   = air;
      this.samples  = 0;

      this.process = this.processAir;
      this.play(this.mixer);
    };

    gameover() {
      this.stop();

      this.position = 0;
      this.interval = this.t[4];
      this.samples  = 0;

      this.process = this.processGameover;
      this.play(this.mixer);
    };

    win() {
      this.beeper   = 1;
      this.interval = 0;
      this.startD   = 0;
      this.startE   = 50;
      this.samples  = 0;

      this.process = this.processWin;
      this.play(this.mixer);
    };

    play(mixer) {
      if (this.context.state == "suspended") {
        this.context.resume();
      }

      this.node = this.context.createScriptProcessor(4096, 1, 1);
      this.node.onaudioprocess = mixer;
      this.node.connect(this.context.destination);
    };

    resetIngame() {
      this.position = 0;
      this.interval = this.t[6];
      this.samples  = 0;

      this.process = this.processIngame;
    };

    processTitle(time) {
      let index = this.position * 3;

      const tempo = this.notes1[index];

      if (tempo == 255) {
        return true;
      }

      const note1 = this.notes1[++index];
      const note2 = this.notes1[++index];

      this.piano[this.position++].time = time;

      this.startD = note1 * this.f[4];
      this.startE = note2 * this.f[4];

      if (this.startD && this.startE) {
        if (this.startD == this.startE) {
          this.startE++;
        }
      } else if (this.startE == 0) {
        this.startE = this.startD * 2;
      }

      this.loopD = this.startD;
      this.loopE = this.startE;

      this.samples = tempo * this.t[3];

      return false;
    };

    processIngame() {
      let length = 32;

      this.beeper  = 0;
      this.samples = this.interval;

      if (this.position & 1) {
        let note = 0;

        if (hero.status == 1 && hero.jumping) {
          note = 8 * (1 + Math.abs(hero.jumping - 8));

        } else if (hero.status > 2 && hero.status < 255) {
          const fall = hero.status;
          note = ((fall << 4) & 255) | (fall >>> 4);

        } else if (fallingKong) {
          note = fallingKong.y * 2;
          length = 16;
        }

        if (note) {
          this.beeper = 1;
          this.startD = note * this.f[1];
          this.loopD  = this.startD;

          this.samples += (this.startD * length) >> 0;
        }
      } else if (!this.muted) {
        const note = this.notes2[this.position >> 2];

        this.beeper = 1;
        this.startD = note * this.f[3];
        this.loopD  = this.startD;

        this.samples += this.t[5];
      }

      this.position = (++this.position) & 255;
    };

    processDie() {
      const note = 63 - (8 * this.position);

      this.beeper = 1;
      this.startD = note * this.f[2];
      this.loopD  = this.startD;

      this.samples = this.interval + (this.startD * (8 + (32 * this.position)));

      if (--this.position < 0) {
        this.resetIngame();
      }
    };

    processAir() {
      this.position = (this.position - 4) & 255;

      if (this.position == 252) {
        if (--this.startE < 36) {
          this.resetIngame();
        }
      } else {
        let note = 2 * (63 - this.startE);

        if (note) {
          this.interval = this.t[0];
        } else {
          note = 256;
          this.interval = this.t[1];
        }

        this.beeper = 1;
        this.startD = note * this.f[1];
        this.loopD  = this.startD;

        this.samples = this.interval + ((this.startD * 7) >> 0);
      }
    };

    processGameover() {
      const note = 255 - this.position;

      this.beeper = 1;
      this.startD = note * this.f[1];
      this.loopD  = this.startD;

      this.samples = this.interval + ((this.startD * 63) >> 0);

      this.position += 4;

      return (this.position == 196);
    };

    processWin() {
      this.beeper ^= 1;

      this.samples = (((this.startE * 3) + this.startD) & 255) * this.f[0];
      this.startD  = (--this.startD) & 255;
      this.loopD   = 999;

      if (this.startD == 0) {
        this.beeper = 1;

        if (--this.startE == 0) {
          return true;
        }
      }

      return false;
    };

    setupPiano() {
      const len = this.notes1.length;

      for (let i = 0; i < len;) {
        if (this.notes1[i++] == 255) {
          break;
        }

        const note1 = this.notes1[i++];
        const note2 = this.notes1[i++];

        const x1 = (256 - ((note1 >> 3) << 3)) & 255;
        const x2 = (256 - ((note2 >> 3) << 3)) & 255;

        const border = colors[~((note2 - 8) >> 3) & 7];

        this.piano.push({x1:x1, x2:x2, border:border, time:0});
      }
    };

    resetPiano() {
      const len = this.piano.length;

      for (let i = 0; i < len; i++) {
        this.piano[i].time = 0;
      }
    };
  }