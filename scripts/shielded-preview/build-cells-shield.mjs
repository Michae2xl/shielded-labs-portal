#!/usr/bin/env node
// Builds public/logos/shielded-labs-cells.svg: the Shielded Labs shield laid out in cells, the way the mark is built
// in the "2 years of code" film. The outline and the tones are measured on the official mark
// (public/logos/shielded-labs-shield-600.png), so the shape is the real one.
// Run: node scripts/shielded-preview/build-cells-shield.mjs
import { writeFileSync } from 'node:fs';

// Outline of the official mark on its 600 px canvas: left and right edges from the peak down, outer shield then inner field.
const outerL = [[274,11],[228,15],[176,24],[142,33],[119,41],[85,57],[76,122],[70,183],[69,270],[74,314],[78,333],[86,359],[102,395],[123,429],[153,466],[199,511],[255,557],[297,587]];
const outerR = [[343,11],[401,17],[444,26],[491,42],[513,53],[520,58],[528,125],[532,180],[533,181],[533,197],[534,198],[533,273],[527,316],[516,355],[495,402],[470,443],[457,460],[439,480],[403,514],[376,536],[346,558],[301,587]];
const innerL = [[289,47],[237,50],[192,56],[147,67],[125,77],[117,126],[112,175],[110,245],[111,246],[112,285],[115,307],[120,329],[131,361],[149,396],[161,414],[176,433],[213,471],[243,496],[285,525]];
const innerR = [[334,47],[389,51],[430,58],[460,67],[477,75],[480,79],[481,84],[490,149],[492,185],[493,186],[493,202],[494,203],[494,248],[491,279],[481,326],[466,368],[446,407],[425,437],[410,454],[388,475],[359,498],[316,525]];
const PEAK = [300, 10], TIP = [300, 588], INNER_PEAK = [300, 46], INNER_TIP = [300, 531];
const SHOULDER = [85, 57];

// The art sits at the right of the home header, which is 520 x 204 here. The shield is 150 tall, stays inside the header
// and stands alone: nothing leads to it.
const HEADER = 204, S = 150 / 576, CX = 432, Y0 = (HEADER - 150) / 2;
const X = x => CX + (x - 300) * S, Y = y => Y0 + (y - 11) * S;
const n1 = value => +value.toFixed(1), n2 = value => +value.toFixed(2);

const outer = [PEAK, ...outerR, TIP, ...[...outerL].reverse()];
const inner = [INNER_PEAK, ...innerR, INNER_TIP, ...[...innerL].reverse()];
const pathOf = points => `M${points.map(([x, y]) => `${n1(X(x))} ${n1(Y(y))}`).join('L')}Z`;
const inside = ([px, py], polygon) => polygon.reduce((hit, [x1, y1], index) => {
  const [x2, y2] = polygon[(index + 1) % polygon.length];
  return (y1 > py) !== (y2 > py) && px < (x2 - x1) * (py - y1) / (y2 - y1) + x1 ? !hit : hit;
}, false);

// Tones measured on the mark: the left half ramps from black to grey toward the split with a soft sheen, the right half is a glow on black.
const ramp = (stops, at) => {
  for (let index = 1; index < stops.length; index++) if (at <= stops[index][0]) {
    const [a, from] = stops[index - 1], [b, to] = stops[index];
    return from + (to - from) * (at - a) / (b - a);
  }
  return stops.at(-1)[1];
};
const tone = (x, y) => {
  if (x >= 300) return ramp([[0, 123], [.08, 110], [.22, 83], [.44, 46], [.72, 12], [1, 0]], Math.hypot((x - 300) / 140, (y - 270) / 190));
  const base = 76 * Math.min(1, Math.max(0, (x - 125) / 175));
  return base + ramp([[0, .34], [.33, .2], [.7, .06], [1, 0]], Math.hypot((x - 300) / 110, (y - 270) / 150)) * (255 - base);
};
const grey = level => `#${Math.round(Math.max(11, level)).toString(16).padStart(2, '0').repeat(3)}`;

// The field: square cells on a grid whose middle line is the split of the shield.
const CELL = 19.2, GAP = 2.6, cells = [];
for (let row = 0; INNER_PEAK[1] + row * CELL < INNER_TIP[1]; row++) for (let column = -11; column < 11; column++) {
  const x = 300 + column * CELL, y = INNER_PEAK[1] + row * CELL;
  const probes = [[x, y], [x + CELL, y], [x, y + CELL], [x + CELL, y + CELL], [x + CELL / 2, y + CELL / 2]];
  if (!probes.some(probe => inside(probe, inner))) continue;
  const side = n2((CELL - GAP) * S);
  cells.push(`<rect x="${n2(X(x + GAP / 2))}" y="${n2(Y(y + GAP / 2))}" width="${side}" height="${side}" fill="${grey(tone(x + CELL / 2, y + CELL / 2))}"/>`);
}

// A walk along a line of points by distance: where it is and which way it heads.
const walker = points => {
  const lengths = points.slice(1).map(([x, y], index) => Math.hypot(x - points[index][0], y - points[index][1]));
  const total = lengths.reduce((sum, length) => sum + length, 0);
  const at = distance => {
    let left = Math.min(Math.max(distance, 0), total);
    for (let index = 0; index < lengths.length; index++) {
      if (left <= lengths[index] || index === lengths.length - 1) {
        const [x1, y1] = points[index], [x2, y2] = points[index + 1], part = lengths[index] ? left / lengths[index] : 0;
        return [x1 + (x2 - x1) * part, y1 + (y2 - y1) * part, Math.atan2(y2 - y1, x2 - x1)];
      }
      left -= lengths[index];
    }
    return [...points.at(-1), 0];
  };
  return { total, at };
};

// The band: two rows of blocks set along the outline, laid one after another from the left shoulder, like the write head in the film.
const outline = walker([...outer, outer[0]]);
const count = Math.round(outline.total / 20.5), step = outline.total / count, DEPTH = 16.5, blocks = [];
let first = 0, nearest = Infinity;
for (let k = 0; k < count; k++) {
  const [x, y] = outline.at((k + .5) * step), distance = Math.hypot(x - SHOULDER[0], y - SHOULDER[1]);
  if (distance < nearest) { nearest = distance; first = k; }
}
const around = distance => outline.at(((distance % outline.total) + outline.total) % outline.total);
for (let k = 0; k < count; k++) {
  const at = (k + .5) * step, [x, y] = around(at), [ax, ay] = around(at - 12), [bx, by] = around(at + 12);
  const length = Math.hypot(bx - ax, by - ay), tx = (bx - ax) / length, ty = (by - ay) / length;
  let nx = -ty, ny = tx;
  if ((300 - x) * nx + (300 - y) * ny < 0) { nx = -nx; ny = -ny; }
  const delay = n2(.1 + ((k - first + count) % count) / count * 1.3), angle = n1(Math.atan2(ty, tx) * 180 / Math.PI);
  for (const [inset, scale] of [[10, 1], [28.5, .86]]) {
    const width = (step - 2.4) * scale * S, height = (DEPTH - 1) * S;
    blocks.push(`<rect class="b" x="${n2(-width / 2)}" y="${n2(-height / 2)}" width="${n2(width)}" height="${n2(height)}" rx=".5" transform="translate(${n1(X(x + nx * inset))} ${n1(Y(y + ny * inset))}) rotate(${angle})" style="animation-delay:${delay}s"/>`);
  }
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 ${HEADER}" width="520" height="${HEADER}">
<style>
.b{opacity:0;animation:on .28s ease-out forwards}.f{opacity:0;animation:on .8s 1.35s ease-out forwards}
@keyframes on{to{opacity:1}}
@media (prefers-reduced-motion:reduce){.b,.f{opacity:1;animation:none}}
</style>
<defs>
<linearGradient id="block" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f1f3f4"/><stop offset=".55" stop-color="#c3c7cb"/><stop offset="1" stop-color="#8d9297"/></linearGradient>
<radialGradient id="glow"><stop offset="0" stop-color="#fff" stop-opacity=".09"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
<clipPath id="field"><path d="${pathOf(inner)}"/></clipPath>
</defs>
<circle cx="${CX}" cy="${HEADER / 2}" r="98" fill="url(#glow)"/>
<path d="${pathOf(outer)}" fill="#08090a"/>
<path d="${pathOf(inner)}" fill="#030303"/>
<g class="f" clip-path="url(#field)">${cells.join('')}</g>
<g fill="url(#block)" stroke="#101214" stroke-width=".3">${blocks.join('')}</g>
</svg>
`;
writeFileSync(new URL('../../public/logos/shielded-labs-cells.svg', import.meta.url), svg);
console.log(`${cells.length} cells, ${blocks.length} blocks, ${(svg.length / 1024).toFixed(1)} KB`);
