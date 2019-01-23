  const MOBILE = /Mobi/i.test(navigator.userAgent);

  const SCREEN_WIDTH = 256;
  const ROOM_COLUMNS = 32;
  const ROOM_ROWS    = 16;
  const ROOM_HEIGHT  = 128;
  const TILE_SIZE    = 8;
  const SPRITE_SIZE  = 16;

  const PLATFORM = 1;
  const SOLID    = 2;
  const MOVING   = 4;
  const DAMAGE   = 8;
  const SWITCH   = 16;
  const CRUMBLE  = 32;
  const ITEM     = 64;

  const WALKING = 0;
  const JUMPING = 1;
  const FALLING = 2;
  const DYING   = 255;

  const spectrum = document.querySelector("img");
  const colors   = [];
  const sprites  = [];

  let scaleFactor  = 4;
  let fullWidth    = 272;
  let fullHeight   = 208;
  let screenHeight = 0;
  let borderWidth  = 0;
  let panelHeight  = 0;
  let landscape    = true;

  let background  = [0.0, 0.0, 0.0, 1.0];
  let borderColor = [0.0, 0.0, 0.0, 1.0];
  let tintColor   = null;
  let config      = null;
  let fallingKong = null;
  let state       = 0;
  let clock       = 0;
  let level       = 0;
  let lastLevel   = 0;
  let lives       = 0;
  let items       = 0;
  let remains     = 0;
  let score       = 0;
  let hiscore     = 0;

  const container = document.querySelector("div");

  const xhr = new XMLHttpRequest();

  const bootstrap = new Bootstrap();
  const render    = new WebGL();
  const controls  = new Controls();
  const timer     = new Timer();
  const audio     = new Audio();
  const font      = new Font();
  const records   = new Records();
  const room      = new Room();
  const panel     = new Panel();
  const hero      = new Hero();
  const portal    = new Portal();
  const game      = new Game();