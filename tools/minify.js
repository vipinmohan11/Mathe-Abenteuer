/* Optionaler Build-Schritt: verkleinert <style> und <script> einer gebauten HTML (nur Leerraum/Kommentare, KEINE Umbenennung von Namen,
   damit alle Funktionen und der Speicherstand unverändert bleiben).
   Aufruf: node tools/minify.js in.html out.html   (benötigt: npm i terser clean-css – nicht Teil des Repos) */
const fs = require('fs');
const [,, inp, out] = process.argv;
const need = n => { try { return require(n); } catch (e) { return require(require('path').join(process.env.MIN_MODULES || '', n)); } };
const Terser = need('terser'), CleanCSS = need('clean-css');
(async () => {
  let h = fs.readFileSync(inp, 'utf8');
  h = h.replace(/<style>([\s\S]*?)<\/style>/, (m, c) => { const r = new CleanCSS({ level: 1, specialComments: 0 }).minify(c); if (r.errors.length) throw new Error(r.errors.join()); return '<style>' + r.styles + '</style>'; });
  const i = h.lastIndexOf('<script>'), j = h.lastIndexOf('</script>');
  const code = h.slice(i + 8, j).replace(/<\\\/script>/g, '</script>');
  const r = await Terser.minify(code, { mangle: false, compress: { passes: 1, toplevel: false, keep_fargs: true, keep_fnames: true, unsafe: false }, format: { comments: false, ascii_only: false } });
  if (r.error) throw r.error;
  h = h.slice(0, i + 8) + r.code.replace(/<\/script>/g, '<\\/script>') + h.slice(j);
  fs.writeFileSync(out, h);
  console.log('before', fs.statSync(inp).size, 'after', fs.statSync(out).size);
})().catch(e => { console.error(e); process.exit(1); });
