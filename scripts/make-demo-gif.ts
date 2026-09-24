// Joins the videos recorded by playwright.demo.config.ts into docs/demo.gif.
// Usage: node scripts/make-demo-gif.ts

import { execFileSync, spawnSync } from 'node:child_process';
import { readdirSync, statSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createRequire } from 'node:module';

const ffmpeg: string = createRequire(import.meta.url)('ffmpeg-static');
const root = 'demo-results';
const out = 'docs/demo.gif';

// Publish first, then comment: the order tells the story.
const order = ['publish', 'comment'];
const videos = readdirSync(root)
  .filter((dir) => statSync(join(root, dir)).isDirectory())
  .map((dir) => ({ dir, file: join(root, dir, 'video.webm') }))
  .sort((a, b) => order.findIndex((k) => a.dir.includes(k)) - order.findIndex((k) => b.dir.includes(k)));

if (videos.length === 0) throw new Error(`no videos in ${root}, run "npm run demo" first`);

// The page opens before the fixtures finish creating data through the API, so each video starts white.
// Negating the image turns that white into black, which ffmpeg's blackdetect can measure.
function blankIntro(file: string): number {
  const { stderr: log } = spawnSync(ffmpeg, ['-i', file, '-vf', 'negate,blackdetect=d=0.2:pix_th=0.05', '-an', '-f', 'null', '-'], {
    encoding: 'utf8',
  });
  const intro = log.match(/black_start:0(?:\.0+)? black_end:([\d.]+)/);
  return intro ? Number(intro[1]) : 0;
}

const list = join(root, 'videos.txt');
writeFileSync(
  list,
  videos.map((v) => `file '${resolve(v.file).replace(/\\/g, '/')}'\ninpoint ${blankIntro(v.file)}`).join('\n'),
);
mkdirSync('docs', { recursive: true });

// Two passes: build a palette from the video, then use it. Without it the GIF gets banding and doubles in size.
const filters = 'fps=10,scale=960:-1:flags=lanczos';
const palette = join(root, 'palette.png');
execFileSync(ffmpeg, ['-y', '-f', 'concat', '-safe', '0', '-i', list, '-vf', `${filters},palettegen=stats_mode=diff`, palette], { stdio: 'ignore' });
execFileSync(
  ffmpeg,
  ['-y', '-f', 'concat', '-safe', '0', '-i', list, '-i', palette, '-lavfi', `${filters} [x]; [x][1:v] paletteuse=dither=bayer:bayer_scale=5`, out],
  { stdio: 'ignore' },
);
rmSync(palette);

console.log(`${out}: ${(statSync(out).size / 1024 / 1024).toFixed(1)} MB from ${videos.length} videos`);
