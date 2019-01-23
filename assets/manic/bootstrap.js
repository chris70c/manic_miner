  class Bootstrap {
    constructor() {
      this.timer = 0;
      this.delay = 30;

      this.bootAnimation = () => {
        if (--this.delay == 0) {
          this.delay = 30;
          this.timer ^= 1;

          container.className = "boot"+ this.timer;
        }

        this.id = requestAnimationFrame(this.bootAnimation);
      }

      this.loader = (e) => {
        cancelAnimationFrame(this.id);
        e.preventDefault();

        container.removeEventListener("click", this.loader);

        if (!MOBILE) {
          document.removeEventListener("keypress", this.loader);
        }

        if (document.fullscreenEnabled) {
          container.requestFullscreen();
          this.schedule(10);
        } else if (document.webkitFullscreenEnabled) {
          container.webkitRequestFullscreen();
          this.schedule(10);
        } else {
          this.startup();
        }

        audio.play(audio.mixSilent);
      }

      this.startup = () => {
        if (MOBILE) {
          window.addEventListener("orientationchange", (e) => {
            this.schedule(20);
          });

          container.className = "loaded mobile";
        } else {
          window.addEventListener("resize", (e) => {
            this.schedule(5);
          });

          container.className = "loaded";
        }

        if (document.fullscreenEnabled) {
          document.addEventListener("fullscreenchange", (e) => {
            this.schedule(10);
          });

        } else if (document.webkitFullscreenEnabled) {
          document.addEventListener("webkitfullscreenchange", (e) => {
            this.schedule(10);
          });
        }

        this.layout();
        this.update = this.layout;

        xhr.responseType = "json";
        xhr.open("get", "spectrum.json", true);
        xhr.setRequestHeader("cache-control", "no-cache");
        xhr.addEventListener("load", this.getData);
        xhr.send(null);
      }

      this.lock = () => {
        if (document.fullscreenElement || document.webkitFullscreenElement) {
          if (screen.orientation.lock) {
            screen.orientation.lock("landscape-primary");
          }
        } else {
          if (screen.orientation.unlock) {
            screen.orientation.unlock();
          }
        }

        this.update = this.startup;
        this.schedule(20);
      }

      this.loop = () => {
        if (--this.delay == 0) {
          this.update();
        } else {
          this.id = requestAnimationFrame(this.loop);
        }
      }

      this.id = requestAnimationFrame(this.bootAnimation);

      container.addEventListener("click", this.loader);

      if (MOBILE) {
        this.update = this.lock;
      } else {
        this.update = this.startup;
        document.addEventListener("keypress", this.loader);
      }
    };

    getData() {
      xhr.removeEventListener("load", this.getData);
      config = xhr.response;

      game.initialize();
    };

    schedule(delay) {
      cancelAnimationFrame(this.id);

      this.delay = delay;
      this.id = requestAnimationFrame(this.loop);
    };

    layout() {
      const ph = ROOM_HEIGHT + (TILE_SIZE * 8);
      const lh = ROOM_HEIGHT + (TILE_SIZE * 6);

      let w = window.innerWidth;
      let h = window.innerHeight;

      const before = landscape;
      landscape = true;

      screenHeight = lh;
      borderWidth  = 0;

      for (let i = 4; i > 0; i--) {
        let fw = SCREEN_WIDTH * i;
        let fh = screenHeight * i;

        if (fw <= w && fh <= h) {
          let border = (TILE_SIZE * 2) * i;

          fw += border;
          fh += border;

          if (fw <= w && fh <= h) {
            borderWidth = TILE_SIZE;
          }

          let th = ph * i;

          if (th <= h) {
            landscape = false;
            screenHeight = ph;

            th += border;

            if (th > h) {
              borderWidth = 0;
            }
          }

          border = borderWidth * 2;

          fullWidth  = SCREEN_WIDTH + border;
          fullHeight = screenHeight + border;

          panelHeight = screenHeight - ROOM_HEIGHT;
          scaleFactor = i;
          break;
        }
      }

      if (!scaleFactor) {
        throw "Manic Miner cannot be played on this device because the screen is too small.";
      }

      render.resize();

      if (state > 4 && (before != landscape)) {
        panel.resize();
      }

      if (MOBILE) {
        controls.resize();
      }
    };
  }