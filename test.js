// Real-click test for Giant Dash: Number Gates. Usage: node test.js <file-url> <outdir>
// Uses playwright-core + /opt/meta-chromium/chrome (same harness as other playables).
const { chromium } = require('playwright-core');
const fs = require('fs');
const [url, outdir] = process.argv.slice(2);
fs.mkdirSync(outdir, { recursive: true });
const results = [];
function check(name, ok, detail) {
  results.push({ name, ok: !!ok, detail: detail || '' });
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + name + (detail ? '  — ' + detail : ''));
}
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/meta-chromium/chrome',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files', '--hatch-webgl-allowed-domains-file=/home/hatch/workspace/tools/pw-shot/webgl-policy.txt', '--hatch-webgl-allowed-domains-sha256=dc8a0e5eec744f6590a4c1889139c00568ffedc3eced6d0a1a5127e35f9ccd16'] });
  const page = await browser.newPage({ viewport: { width: 480, height: 860 } });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text().slice(0, 200)); });
  const state = () => page.evaluate(() => window.__giantDash ? window.__giantDash() : null);
  const dbg = (expr) => page.evaluate(expr);
  const waitFor = async (fn, timeoutMs, label) => {
    const t0 = Date.now();
    while (Date.now() - t0 < timeoutMs) { const s = await state(); if (fn(s)) return s; await page.waitForTimeout(120); }
    return await state();
  };

  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(800);
  let s = await state();
  check('loads, hook present, menu screen', s && s.screen === 'menu', JSON.stringify(s));
  await page.screenshot({ path: outdir + '/01-menu.png' });

  await page.click('#btn-start');
  await page.waitForTimeout(400);
  s = await state();
  check('start -> playing level 1', s && s.screen === 'playing' && s.level === 1 && s.lives === 3, JSON.stringify(s));
  await page.screenshot({ path: outdir + '/02-level1.png' });

  // --- Legit auto-play of level 1: steer to good/mult/coin lanes, avoid rock/bad ---
  const pickLane = (cells) => {
    const pref = ['mult', 'good', 'coin', null];
    for (const p of pref) { const i = cells.indexOf(p); if (i >= 0) return i; }
    return 1;
  };
  let played = false, grew = false;
  const t0 = Date.now();
  while (Date.now() - t0 < 150000) {
    s = await state();
    if (!s) break;
    if (s.screen === 'boss') { played = true; break; }
    if (s.screen !== 'playing') break;
    if (s.size > 10 || s.gatesHit > 0) grew = true;
    if (s.nearest && s.nearest.dist < 520) {
      const target = pickLane(s.nearest.cells);
      if (target < s.lane) await page.keyboard.press('ArrowLeft');
      else if (target > s.lane) await page.keyboard.press('ArrowRight');
    }
    await page.waitForTimeout(90);
  }
  s = await state();
  check('level 1 played legitimately to boss (gates hit, size grew)', played && grew, JSON.stringify(s));
  await page.screenshot({ path: outdir + '/03-boss.png' });

  // --- Boss: grow big, dash 3x to squash Grumple ---
  s = await waitFor(st => st && st.screen === 'boss' && st.bossState === 'fight', 40000, 'boss fight');
  check('boss fight state reached', s && s.bossState === 'fight', JSON.stringify(s));
  await dbg(`window.__giantDashDebug.setSize(200)`);
  for (let i = 0; i < 3; i++) {
    await page.click('#btn-dash');
    await page.waitForTimeout(800);
    s = await state();
    if (s.screen === 'clear') break;
  }
  check('boss defeated x3 dashes -> level clear', s && s.screen === 'clear', JSON.stringify(s));
  await page.screenshot({ path: outdir + '/04-clear.png' });

  // --- Next level ---
  await page.click('#btn-next');
  await page.waitForTimeout(400);
  s = await state();
  check('next -> playing level 2', s && s.screen === 'playing' && s.level === 2, JSON.stringify(s));

  // --- Pause / resume / mute ---
  await page.click('#btn-pause'); await page.waitForTimeout(250); s = await state();
  check('pause -> paused', s.screen === 'paused', JSON.stringify(s));
  await page.screenshot({ path: outdir + '/05-paused.png' });
  await page.click('#btn-resume'); await page.waitForTimeout(250); s = await state();
  check('resume -> playing', s.screen === 'playing', JSON.stringify(s));
  await page.click('#btn-mute'); s = await state();
  check('mute toggles on', s.muted === true, JSON.stringify(s));
  await page.click('#btn-mute'); s = await state();
  check('mute toggles off', s.muted === false, JSON.stringify(s));

  // --- Game over path: 1 life, too small for the boss, dash bounces -> game over ---
  await dbg(`window.__giantDashDebug.setLives(1)`);
  await dbg(`window.__giantDashDebug.warpToBoss()`);
  s = await waitFor(st => st && st.screen === 'boss' && st.bossState === 'fight', 40000, 'boss fight 2');
  await dbg(`window.__giantDashDebug.setSize(5)`);
  await page.click('#btn-dash');
  await page.waitForTimeout(600);
  s = await state();
  check('undersized dash bounce with 1 life -> game over', s && s.screen === 'gameover', JSON.stringify(s));
  await page.screenshot({ path: outdir + '/06-gameover.png' });
  await page.click('#btn-retry');
  await page.waitForTimeout(400);
  s = await state();
  check('retry -> playing same level, lives restored', s && s.screen === 'playing' && s.level === 2 && s.lives === 3, JSON.stringify(s));

  // --- Win path: level 20 boss defeated ---
  await dbg(`window.__giantDashDebug.setLevel(20)`);
  await page.waitForTimeout(300);
  s = await state();
  check('debug jump to level 20 playing', s && s.screen === 'playing' && s.level === 20, JSON.stringify(s));
  await dbg(`window.__giantDashDebug.warpToBoss()`);
  s = await waitFor(st => st && st.screen === 'boss' && st.bossState === 'fight', 40000, 'boss fight 20');
  await dbg(`window.__giantDashDebug.setSize(300)`);
  for (let i = 0; i < 3; i++) {
    await page.click('#btn-dash');
    await page.waitForTimeout(800);
    s = await state();
    if (s.screen === 'win') break;
  }
  check('level 20 boss defeated -> win screen', s && s.screen === 'win', JSON.stringify(s));
  await page.screenshot({ path: outdir + '/07-win.png' });

  check('no console errors / page errors', errors.length === 0, errors.slice(0, 5).join(' | ') || 'none');
  const failed = results.filter(r => !r.ok).length;
  console.log(failed === 0 ? 'ALL TESTS PASSED' : failed + ' TEST(S) FAILED');
  await browser.close();
  process.exit(failed === 0 ? 0 : 1);
})().catch(e => { console.error('TEST CRASH: ' + e.message); process.exit(2); });
