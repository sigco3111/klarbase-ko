import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// 한국어판(klarbase-ko): GitHub Pages 하위 경로 배포 + 한글화 오버레이 주입.
// 원작과 달라진 점은 이 세 가지뿐이다: base, SITE(사이트맵), koOverlay 플러그인.
const BASE = '/klarbase-ko/';
const SITE = 'https://sigco3111.github.io/klarbase-ko';
const ISLES = fileURLToPath(new URL('../isles/', import.meta.url));
const json = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const dirs = d => fs.readdirSync(d, { withFileTypes:true }).filter(e => e.isDirectory()).map(e => e.name);
function sitemapXml(){
  const today = new Date().toISOString().slice(0, 10);
  const paths = ['/', '/play', '/daily', '/community', '/create', '/how-to-build', '/privacy'];
  for(const ch of json(path.join(ISLES, 'official/chapters.json'))) for(const id of ch.isles) paths.push('/isle/' + id);
  for(const a of dirs(path.join(ISLES, 'community')))
    for(const f of fs.readdirSync(path.join(ISLES, 'community', a)).filter(f => f.endsWith('.json'))){
      const d = json(path.join(ISLES, 'community', a, f)); if(d.author && d.id) paths.push('/c/' + d.author + '/' + d.id);
    }
  for(const f of fs.readdirSync(path.join(ISLES, 'daily'))){ const m = /^(\d{4}-\d{2}-\d{2})\.json$/.exec(f); if(m && m[1] < today) paths.push('/daily/' + m[1]); }
  const head = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  return head + paths.map(p => '  <url><loc>' + SITE + BASE + p.replace(/^\//, '') + '</loc></url>').join('\n') + '\n</urlset>\n';
}
const sitemap = () => ({
  name:'klarbase-sitemap',
  configureServer(server){ server.middlewares.use(BASE + 'sitemap.xml', (_req, res) => { res.setHeader('content-type', 'application/xml'); res.end(sitemapXml()); }); },
  generateBundle(){ this.emitFile({ type:'asset', fileName:'sitemap.xml', source:sitemapXml() }); },
});

// index.html 은 원문 그대로 두고, 한글화 스타일·스크립트만 head 에 끼워 넣는다.
const koOverlay = () => ({
  name:'ko-overlay',
  transformIndexHtml(){
    return [
      { tag:'link', attrs:{ rel:'stylesheet', href: BASE + 'ko/ko.css' }, injectTo:'head' },
      { tag:'script', attrs:{ type:'module', src: BASE + 'ko/ko.js' }, injectTo:'head-prepend' },
    ];
  },
});

export default defineConfig({
  base: BASE,
  plugins: [koOverlay(), sitemap()],
  server: {
    port: 5173,
  },
  build: { outDir: 'dist', target: 'es2022' },
});
