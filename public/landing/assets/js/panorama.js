/* Swiss panorama in cells. Three ridgelines drift past at different speeds, the way a valley
   moves past a train window; a train crosses the viaduct, a gondola rides its cable and a coin
   with the Zcash mark rolls along the middle ridge.
   The scene is generated here: no image files, no libraries, and it takes its color from the theme.
   The one color of its own is the flag in the village. */
(function () {
  "use strict";

  var host = document.querySelector("[data-panorama]");
  if (!host || !host.querySelector("canvas")) return;
  var canvas = host.querySelector("canvas");
  var ctx = canvas.getContext("2d");
  var still = window.matchMedia("(prefers-reduced-motion: reduce)");

  var WORLD = 560; // columns before the scene repeats
  var CHUNK = 40; // columns per stored path, so only the visible stretch is filled
  var pitch = 6; // CSS pixels from one cell to the next
  var rows = 0;
  var width = 0;
  var height = 0;
  var dpr = 1;
  var ink = "238,234,224";
  var layers = [];
  var visible = true;
  var raf = 0;
  var started = 0;
  var last = 0;
  var rate = 1; // scene seconds per real second; ?tour=8 raises it for a review

  /* Small bitmaps, top row first: # is a cell. */
  var CHALET = [
    "...#...",
    "..###..",
    ".#####.",
    "#######",
    ".#.#.#.",
    ".#####.",
  ];
  var HOUSE = ["..#..", ".###.", "#####", "#.#.#", "#####"];
  var CHURCH = [
    "..#......",
    "..#......",
    ".###.....",
    ".###.....",
    ".#.#.....",
    ".###..#..",
    ".###.###.",
    ".########",
    ".#.##.#.#",
    ".########",
  ];
  var TOWER = [
    "...#...",
    "...#...",
    "..###..",
    "..###..",
    ".#####.",
    ".#####.",
    "#######",
    ".#####.",
    ".##.##.",
    ".#.#.#.",
    ".##.##.",
    ".#####.",
    ".##.##.",
    ".##.##.",
  ];
  var FIR_S = [".#.", ".#.", "###"];
  var FIR_M = ["..#..", "..#..", ".###.", ".###.", "#####", "..#.."];
  var FIR_L = [
    "...#...",
    "...#...",
    "..###..",
    "..###..",
    ".#####.",
    ".#####.",
    "#######",
    "...#...",
  ];
  /* The Swiss flag is a square, and the arms of its cross are a sixth longer than they are wide:
     five cells give that almost exactly. r is the red field, w the white cross, # the pole. */
  var FLAG = [
    "#rrrrr",
    "#rrwrr",
    "#rwwwr",
    "#rrwrr",
    "#rrrrr",
    "#.....",
    "#.....",
    "#.....",
    "#.....",
  ];
  var TINTS = { r: "#ff0000", w: "#ffffff" };
  var BOAT = ["...#...", "...##..", "...###.", "#######", ".#####."];
  var GONDOLA = [".#.", "###", "#.#", "###"];
  var TRAIN = ["##..................", "####.###.###.###.###"];
  /* The Zcash mark as a coin: a disc with the Z and its two ticks cut out. These are the corners of
     the glyph in the official mark, where the disc has radius 270 around 540,540. The coin keeps that
     outline exactly and is filled with cells like the rest of the scene. */
  var MARK = {
    center: 540,
    radius: 270,
    glyph: [
      [636.31, 414.7],
      [636.31, 455.79],
      [522.03, 610.79],
      [636.31, 610.79],
      [636.31, 665.29],
      [562.64, 665.29],
      [562.64, 710.45],
      [517.36, 710.45],
      [517.36, 665.29],
      [443.69, 665.29],
      [443.69, 624.2],
      [557.85, 469.2],
      [443.69, 469.2],
      [443.69, 414.7],
      [517.36, 414.7],
      [517.36, 369.42],
      [562.64, 369.42],
      [562.64, 414.7],
    ],
  };
  var COIN_CELLS = 9; // the coin is this many cells across
  var COIN_PACE = 24; // CSS pixels per scene second, to the right on screen
  var COIN_FROM = 0.14; // where the coin stands at the start, as a share of the width

  /* Two skylines people know: the Matterhorn, and the Eiger, Mönch and Jungfrau.
     Column offset from the summit, height as a share of the canvas. */
  var MATTERHORN = [
    [-27, 0.34],
    [-20, 0.47],
    [-13, 0.6],
    [-9, 0.66],
    [-7, 0.7],
    [-3, 0.86],
    [0, 0.94],
    [1.5, 0.9],
    [4, 0.8],
    [6, 0.74],
    [9, 0.64],
    [13, 0.52],
    [17, 0.42],
    [21, 0.34],
  ];
  var BERNESE = [
    [-34, 0.34],
    [-27, 0.46],
    [-21, 0.62],
    [-18.5, 0.72],
    [-16.5, 0.66],
    [-12, 0.6],
    [-7, 0.66],
    [-2, 0.77],
    [0, 0.8],
    [3, 0.76],
    [7, 0.7],
    [11, 0.74],
    [15, 0.84],
    [17.5, 0.9],
    [20, 0.84],
    [25, 0.66],
    [31, 0.46],
    [36, 0.34],
  ];
  var GORGE = { from: 296, to: 338, deck: 0.27 };
  var MID_PLACES = [
    [CHALET, 214],
    [CHALET, 226],
    [CHURCH, 452],
    [CHALET, 470],
    [CHALET, 506],
  ];
  var NEAR_PLACES = [
    [HOUSE, 119],
    [HOUSE, 125],
    [TOWER, 132],
    [CHALET, 140],
    [HOUSE, 147],
    [FLAG, 154],
    [FIR_L, 262],
    [FIR_L, 268],
    [CHALET, 275],
    [FIR_L, 283],
    [HOUSE, 400],
    [CHURCH, 410],
    [HOUSE, 420],
    [FIR_L, 427],
    [FIR_L, 541],
    [FIR_L, 549],
    [FIR_L, 9],
    [FIR_L, 16],
  ];
  var BOATS = [63, 343];

  function random(seed) {
    return function () {
      seed = (seed + 0x6d2b79f5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function tri(t) {
    var f = t - Math.floor(t);
    return 1 - 4 * Math.abs(f - 0.5);
  }
  function wave(t) {
    return Math.sin(t * Math.PI * 2);
  }
  function silhouette(points, x) {
    if (x <= points[0][0] || x >= points[points.length - 1][0]) return 0;
    for (var i = 1; i < points.length; i++) {
      if (x <= points[i][0]) {
        var a = points[i - 1];
        var b = points[i];
        return a[1] + ((b[1] - a[1]) * (x - a[0])) / (b[0] - a[0]);
      }
    }
    return 0;
  }

  /* Ridgelines, as a share of the canvas height. Every term repeats over WORLD, so the scene loops without a seam. */
  function far(x) {
    var u = x / WORLD;
    var base =
      0.34 +
      0.12 * tri(3 * u + 0.13) +
      0.085 * tri(7 * u + 0.57) +
      0.05 * tri(13 * u + 0.31) +
      0.03 * tri(29 * u + 0.77) +
      0.018 * tri(53 * u + 0.2) +
      0.01 * wave(97 * u + 0.4);
    return Math.max(
      base,
      silhouette(MATTERHORN, x - 150),
      silhouette(BERNESE, x - 408),
    );
  }
  function mid(x) {
    var u = x / WORLD;
    var h =
      0.19 +
      0.06 * wave(5 * u + 0.4) +
      0.04 * wave(11 * u + 0.1) +
      0.022 * tri(23 * u + 0.65) +
      0.012 * wave(47 * u + 0.3) +
      0.008 * wave(83 * u + 0.9);
    var a = GORGE.from;
    var b = GORGE.to;
    if (x >= a && x <= b) {
      return (
        GORGE.deck -
        (GORGE.deck - 0.07) *
          Math.pow(Math.sin((Math.PI * (x - a)) / (b - a)), 0.55)
      );
    }
    if (x > a - 9 && x < b + 9) {
      var e = x < a ? (a - x) / 9 : (x - b) / 9; // 0 at the tunnel mouth, 1 where the hills are untouched
      return (GORGE.deck + 0.04) * (1 - e) + h * e;
    }
    return h;
  }
  function near(x) {
    var u = x / WORLD;
    return (
      0.055 +
      0.04 * wave(4 * u + 0.3) +
      0.02 * tri(17 * u + 0.5) +
      0.008 * wave(61 * u + 0.2)
    );
  }

  /* A layer keeps its cells as paths, grouped by opacity. */
  function Layer(speed) {
    this.speed = speed;
    this.tops = [];
    this.chunks = [];
    for (var i = 0; i < WORLD / CHUNK; i++) this.chunks.push({});
  }
  Layer.prototype.cell = function (column, row, size, alpha, tint) {
    if (column < 0 || column >= WORLD) return;
    var groups = this.chunks[Math.floor(column / CHUNK)];
    var key = tint || alpha.toFixed(2);
    var path = groups[key] || (groups[key] = new Path2D());
    var side = size * pitch;
    path.rect(
      column * pitch + (pitch - side) / 2,
      height - (row + 1) * pitch + (pitch - side) / 2,
      side,
      side,
    );
  };
  Layer.prototype.stamp = function (shape, center, base, size, alpha) {
    var left = Math.round(center - (shape[0].length - 1) / 2);
    for (var r = 0; r < shape.length; r++) {
      for (var c = 0; c < shape[r].length; c++) {
        var mark = shape[r].charAt(c);
        if (mark !== ".")
          this.cell(
            left + c,
            base + shape.length - 1 - r,
            size,
            alpha,
            TINTS[mark],
          );
      }
    }
  };

  /* The body of a ridge is a halftone: full cells on the crest, smaller ones below, lit from the left.
     A tall peak keeps its body further down than a low hill. Above the snow line the crest is brighter.
     Low ground on the front layer is water. */
  function terrain(layer, spec) {
    var x;
    var y;
    for (x = 0; x < WORLD; x++)
      layer.tops.push(Math.max(0, Math.round(spec.shape(x) * rows)));
    var water =
      spec.water == null ? -1 : Math.max(1, Math.round(spec.water * rows));
    var chance = random(spec.seed || 1);
    layer.water = water;
    for (x = 0; x < WORLD; x++) {
      var top = layer.tops[x];
      if (top <= water) {
        layer.tops[x] = water;
        for (y = 0; y < water; y++)
          if (chance() < 0.22) layer.cell(x, y, 0.34, spec.alpha * 0.5);
        continue;
      }
      var slope =
        layer.tops[(x + 1) % WORLD] - layer.tops[(x + WORLD - 1) % WORLD];
      var lit = Math.max(0.5, Math.min(1, 0.74 + slope * 0.13));
      var fade = Math.max(spec.fade, top * spec.body);
      for (y = 0; y < top; y++) {
        var depth = top - 1 - y;
        var size =
          depth === 0
            ? spec.cell
            : spec.cell * lit * Math.pow(Math.max(0, 1 - depth / fade), 1.15);
        var alpha = spec.alpha;
        if (spec.snow && y >= spec.snow * rows && depth < 5) {
          size = spec.cell * (lit > 0.7 ? 1.25 : 1);
          alpha = Math.min(1, spec.alpha * 2.3);
        }
        // Ground mist: a distant range thins out toward its foot, so the nearer ground stays clear.
        if (spec.mist) size *= Math.min(1, y / (spec.mist * rows));
        if (size >= 0.15) layer.cell(x, y, Math.min(size, 0.9), alpha);
      }
    }
  }

  function summit(tops, center, reach) {
    var best = center;
    for (var x = center - reach; x <= center + reach; x++)
      if (tops[x] > tops[best]) best = x;
    return best;
  }
  function cableRow(cable, t) {
    return (
      cable.a + (cable.b - cable.a) * t - cable.sag * Math.sin(Math.PI * t)
    );
  }

  function dressMid(layer) {
    var tops = layer.tops;
    var a = GORGE.from;
    var b = GORGE.to;
    var deck = Math.round(GORGE.deck * rows);
    var i;
    var x;
    var y;
    layer.deck = deck;
    for (x = a; x <= b; x++) layer.cell(x, deck, 0.86, 0.8);
    for (x = a + 3; x <= b - 3; x += 6) {
      for (y = tops[x]; y < deck; y++) layer.cell(x, y, 0.62, 0.72);
      layer.cell(x - 1, deck - 1, 0.5, 0.72);
      layer.cell(x + 1, deck - 1, 0.5, 0.72);
    }

    var chance = random(11);
    for (x = 3; x < WORLD - 3; x++) {
      var taken = x > a - 12 && x < b + 12;
      for (i = 0; i < MID_PLACES.length && !taken; i++)
        taken = Math.abs(x - MID_PLACES[i][1]) < 8;
      var density = 0.04 + 0.2 * Math.max(0, wave((9 * x) / WORLD + 0.2));
      if (!taken && chance() < density)
        layer.stamp(FIR_S, x, tops[x], 0.72, 0.66);
    }
    for (i = 0; i < MID_PLACES.length; i++) {
      layer.stamp(
        MID_PLACES[i][0],
        MID_PLACES[i][1],
        tops[MID_PLACES[i][1]],
        0.78,
        0.78,
      );
    }

    var from = summit(tops, 72, 12);
    var to = summit(tops, 112, 12);
    var cable = {
      from: from,
      to: to,
      a: tops[from] + 5,
      b: tops[to] + 5,
      sag: 1.6,
    };
    layer.cable = cable;
    for (y = 0; y < 5; y++) {
      layer.cell(from, tops[from] + y, 0.46, 0.7);
      layer.cell(to, tops[to] + y, 0.46, 0.7);
    }
    for (x = from; x <= to; x++)
      layer.cell(x, cableRow(cable, (x - from) / (to - from)), 0.3, 0.9);
  }

  function dressNear(layer) {
    var tops = layer.tops;
    var chance = random(23);
    var i;
    var x;
    for (x = 4; x < WORLD - 4; x++) {
      var taken = tops[x] <= layer.water;
      for (i = 0; i < NEAR_PLACES.length && !taken; i++)
        taken = Math.abs(x - NEAR_PLACES[i][1]) < 6;
      if (!taken && chance() < 0.07) layer.stamp(FIR_M, x, tops[x], 0.82, 0.92);
    }
    for (i = 0; i < NEAR_PLACES.length; i++) {
      layer.stamp(
        NEAR_PLACES[i][0],
        NEAR_PLACES[i][1],
        tops[NEAR_PLACES[i][1]],
        0.84,
        0.96,
      );
    }
    for (i = 0; i < BOATS.length; i++) {
      if (tops[BOATS[i]] <= layer.water)
        layer.stamp(BOAT, BOATS[i], layer.water, 0.8, 0.9);
    }
  }

  /* What moves on its own: the train and the gondola. */
  function dot(x0, column, row, size, alpha) {
    var side = size * pitch;
    ctx.fillStyle = "rgba(" + ink + "," + alpha + ")";
    ctx.fillRect(
      x0 + column * pitch + (pitch - side) / 2,
      height - (row + 1) * pitch + (pitch - side) / 2,
      side,
      side,
    );
  }
  function liveMid(layer, x0, t) {
    var a = GORGE.from;
    var b = GORGE.to;
    var c;
    var r;
    var lap = t % 40;
    if (lap < 20) {
      var head = b + 2 - (lap / 20) * (b - a + TRAIN[0].length + 4);
      for (r = 0; r < TRAIN.length; r++) {
        for (c = 0; c < TRAIN[r].length; c++) {
          var column = head + c;
          if (
            TRAIN[r].charAt(c) === "#" &&
            column >= a - 0.5 &&
            column <= b + 0.5
          ) {
            dot(x0, column, layer.deck + TRAIN.length - r, 0.8, 0.96);
          }
        }
      }
    }
    var cable = layer.cable;
    var u = (t % 52) / 52;
    var k = u < 0.5 ? u * 2 : (1 - u) * 2;
    k = k * k * (3 - 2 * k);
    var at = cable.from + (cable.to - cable.from) * k;
    var hang = cableRow(cable, k);
    for (r = 0; r < GONDOLA.length; r++) {
      for (c = 0; c < GONDOLA[r].length; c++) {
        if (GONDOLA[r].charAt(c) === "#")
          dot(x0, at + c - 1, hang - r - 0.2, 0.74, 0.96);
      }
    }
  }

  /* The coin rolls on the middle ridge and over the viaduct. Its centre keeps one radius from the
     nearest ground, so it rides over a crest instead of sinking into it. The turn follows the distance
     rolled, with a whole number of turns per loop of the world, so the mark never snaps round. */
  function roll(layer) {
    var radius = COIN_CELLS / 2;
    var step = 0.25;
    var count = WORLD / step;
    var heights = [];
    var turns = [0];
    var i;
    var d;
    function ground(x) {
      var w = ((x % WORLD) + WORLD) % WORLD;
      if (w >= GORGE.from && w <= GORGE.to + 1) return layer.deck + 1;
      var at = Math.floor(w - 0.5);
      var a = layer.tops[(at + WORLD) % WORLD];
      var b = layer.tops[(at + 1) % WORLD];
      return a + (b - a) * (w - 0.5 - at);
    }
    for (i = 0; i < count; i++) {
      var best = 0;
      for (d = -radius; d <= radius; d += step)
        best = Math.max(
          best,
          ground(i * step + d) +
            Math.sqrt(Math.max(0, radius * radius - d * d)),
        );
      heights.push(best);
    }
    for (i = 1; i <= count; i++) {
      var rise = heights[i % count] - heights[i - 1];
      turns.push(turns[i - 1] + Math.sqrt(step * step + rise * rise));
    }
    return {
      radius: radius,
      step: step,
      heights: heights,
      turns: turns,
      laps: Math.max(1, Math.round(turns[count] / (2 * Math.PI * radius))),
    };
  }
  function rolled(path, column) {
    var count = path.heights.length;
    var at = (((column % WORLD) + WORLD) % WORLD) / path.step;
    var i = Math.floor(at) % count;
    var f = at - Math.floor(at);
    var next = (i + 1) % count;
    return {
      height: path.heights[i] + (path.heights[next] - path.heights[i]) * f,
      turn:
        ((path.turns[i] + (path.turns[i + 1] - path.turns[i]) * f) /
          path.turns[count]) *
        path.laps *
        2 *
        Math.PI,
    };
  }
  function liveCoin(layer, t) {
    var path = layer.roll;
    var reach = (path.radius + 1) * pitch; // it enters and leaves whole
    var lap = width + 2 * reach;
    var x = ((COIN_FROM * width + reach + COIN_PACE * t) % lap) - reach;
    var drift = (t * layer.speed) % (WORLD * pitch);
    var here = rolled(path, (x + drift) / pitch);
    var y = height - here.height * pitch;
    var turn = here.turn - rolled(path, (COIN_FROM * width) / pitch).turn;
    var size = path.radius * pitch;
    var side = 0.86 * pitch;
    var span = Math.ceil(path.radius);
    var i;
    var r;
    var c;
    ctx.save();
    ctx.translate(x, y);
    // The coin is solid: the range behind it does not show through the Z.
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(0, 0, size + 1.5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
    ctx.rotate(turn);
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, 2 * Math.PI);
    for (i = 0; i < MARK.glyph.length; i++) {
      var px = ((MARK.glyph[i][0] - MARK.center) / MARK.radius) * size;
      var py = ((MARK.glyph[i][1] - MARK.center) / MARK.radius) * size;
      if (i) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    }
    ctx.closePath();
    ctx.clip("evenodd");
    // Only the outline turns: the cells stay square to the screen and on whole pixels, as in the layers.
    ctx.rotate(-turn);
    ctx.translate(Math.round(x * dpr) / dpr - x, Math.round(y * dpr) / dpr - y);
    ctx.fillStyle = "rgba(" + ink + ",0.96)";
    for (r = -span; r <= span; r++) {
      for (c = -span; c <= span; c++)
        ctx.fillRect(c * pitch - side / 2, r * pitch - side / 2, side, side);
    }
    ctx.restore();
    // Where the coin is, in CSS pixels: read by the screen checks.
    host.coin = { x: x, y: y, turn: turn, radius: path.radius * pitch };
  }

  function build() {
    var box = host.getBoundingClientRect();
    width = Math.max(1, Math.round(box.width));
    height = Math.max(1, Math.round(box.height));
    dpr = Math.min(2, window.devicePixelRatio || 1);
    pitch = width < 700 ? 5 : 6;
    rows = Math.floor(height / pitch);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    var back = new Layer(4);
    var middle = new Layer(9);
    var front = new Layer(16);
    terrain(back, {
      shape: far,
      cell: 0.6,
      alpha: 0.36,
      fade: 14,
      body: 0.85,
      snow: 0.5,
      mist: 0.24,
    });
    terrain(middle, {
      shape: mid,
      cell: 0.72,
      alpha: 0.56,
      fade: 8,
      body: 0.8,
      mist: 0.1,
    });
    dressMid(middle);
    middle.live = liveMid;
    middle.roll = roll(middle);
    middle.after = liveCoin;
    terrain(front, {
      shape: near,
      cell: 0.84,
      alpha: 0.92,
      fade: 4,
      body: 0.9,
      water: 0.035,
      seed: 5,
    });
    dressNear(front);
    layers = [back, middle, front];
  }

  function readInk() {
    var parts = getComputedStyle(host).color.match(/[\d.]+/g);
    if (parts && parts.length >= 3)
      ink = parts[0] + "," + parts[1] + "," + parts[2];
  }

  function draw(now) {
    var t = still.matches ? 0 : ((now - started) / 1000) * rate;
    var span = WORLD * pitch;
    var edge = CHUNK * pitch;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      var off = (t * layer.speed) % span;
      for (var origin = -off; origin < width; origin += span) {
        var x0 = Math.round(origin * dpr) / dpr;
        ctx.save();
        ctx.translate(x0, 0);
        for (var k = 0; k < layer.chunks.length; k++) {
          var left = x0 + k * edge;
          if (left > width + pitch || left + edge < -pitch) continue;
          var groups = layer.chunks[k];
          for (var key in groups) {
            ctx.fillStyle =
              key.charAt(0) === "#" ? key : "rgba(" + ink + "," + key + ")";
            ctx.fill(groups[key]);
          }
        }
        ctx.restore();
        if (layer.live) layer.live(layer, x0, still.matches ? 9 : t);
      }
      if (layer.after) layer.after(layer, t);
    }
  }

  function tick(now) {
    raf = 0;
    if (!visible || document.hidden) return;
    if (still.matches) {
      draw(now);
      return;
    }
    if (now - last >= 30) {
      last = now;
      draw(now);
    }
    raf = requestAnimationFrame(tick);
  }
  function wake() {
    if (!raf) raf = requestAnimationFrame(tick);
  }
  function rebuild() {
    build();
    readInk();
    wake();
  }
  function recolor() {
    readInk();
    wake();
    setTimeout(function () {
      readInk();
      wake();
    }, 250);
  }

  // data-start="seconds" opens the scene further along the valley; without it the view starts at the Matterhorn.
  // ?tour=8 plays the valley eight times faster, so a reviewer sees the whole loop in half a minute.
  var tour = Number(new URLSearchParams(window.location.search).get("tour"));
  if (tour >= 1 && tour <= 20) rate = tour;
  started =
    performance.now() -
    ((Number(host.getAttribute("data-start")) || 0) * 1000) / rate;
  rebuild();

  var resizing = 0;
  window.addEventListener("resize", function () {
    clearTimeout(resizing);
    resizing = setTimeout(rebuild, 150);
  });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) wake();
    }).observe(host);
  }
  document.addEventListener("visibilitychange", wake);
  if (still.addEventListener) still.addEventListener("change", wake);
  new MutationObserver(recolor).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  var scheme = window.matchMedia("(prefers-color-scheme: dark)");
  if (scheme.addEventListener) scheme.addEventListener("change", recolor);
})();
