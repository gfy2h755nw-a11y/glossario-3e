/* ---------- app installata sulla schermata Home (iPhone, iPad, Android) ----------
 * In questa modalità le finestre nuove (report, schede, cartelloni da stampare) e i file scaricati si aprono
 * senza un pulsante per tornare indietro: bisognava chiudere l'app. Qui si aprono in un visore dentro l'app,
 * con «← Torna all'app», «Stampa o salva PDF» e, per i file, «Condividi o salva» (Salva in File, Mail, AirDrop…).
 * Nel browser normale non cambia nulla. */
function appInstallata() {
  try { return window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches || window.matchMedia('(display-mode: fullscreen)').matches; } catch (e) { return false; }
}
var _apriFinestra = window.open;
window.open = function (u) {
  if (!appInstallata() || (u && u !== 'about:blank')) return _apriFinestra.apply(window, arguments);
  return apriVisore();
};
/* finestra finta: accetta document.write / document.close / location.href come una finestra vera */
function apriVisore(titolo) {
  chiudiVisore();
  var o = document.createElement('div'); o.id = 'visore'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true');
  o.innerHTML = '<div class="vbar"><button type="button" class="vtorna" id="vTorna">← Torna all\'app</button><b id="vTit">' + (titolo ? esc(titolo) : 'Documento') + '</b>' +
    '<span class="vazioni"><button type="button" class="vbtn" id="vStampa">Stampa o salva PDF</button><button type="button" class="vbtn" id="vCondividi" hidden>Condividi o salva</button></span></div>' +
    '<iframe id="vFrame" title="Documento"></iframe>';
  document.body.appendChild(o); document.documentElement.classList.add('visore-aperto');
  var ifr = o.querySelector('iframe'), buf = '', t = null;
  var mostra = function () {
    clearTimeout(t);
    t = setTimeout(function () {
      // la stampa automatica del documento si ferma: si stampa con il pulsante in alto
      var html = buf.replace(/<head([^>]*)>/i, '<head$1><script>window.__stampa=window.print;window.print=function(){};<\/script>');
      if (html === buf) html = '<script>window.__stampa=window.print;window.print=function(){};<\/script>' + buf;
      ifr.removeAttribute('src'); ifr.srcdoc = html;
      var m = /<title>([^<]*)<\/title>/i.exec(buf); if (m) $('vTit').textContent = m[1].replace(/&amp;/g, '&');
    }, 30);
  };
  var finta = {
    closed: false,
    document: { write: function (s) { buf += String(s); mostra(); }, writeln: function (s) { buf += String(s) + '\n'; mostra(); }, close: function () { mostra(); }, open: function () { buf = ''; } },
    location: {},
    focus: function () {}, blur: function () {},
    print: function () { stampaVisore(); },
    close: function () { chiudiVisore(); }
  };
  Object.defineProperty(finta.location, 'href', { set: function (u) { clearTimeout(t); ifr.removeAttribute('srcdoc'); ifr.src = u; }, get: function () { return ifr.src || 'about:blank'; } });
  $('vTorna').onclick = chiudiVisore;
  $('vStampa').onclick = stampaVisore;
  o._finta = finta;
  setTimeout(function () { try { $('vTorna').focus(); } catch (e) {} }, 0);
  return finta;
}
function stampaVisore() {
  var f = $('vFrame'); if (!f) return;
  try { var w = f.contentWindow; (w.__stampa || w.print).call(w); } catch (e) { toast('Da qui non riesco a stampare: usa «Condividi o salva».', true); }
}
function chiudiVisore() {
  var o = $('visore'); if (!o) return;
  if (o._finta) o._finta.closed = true;
  if (o._url) setTimeout(function () { URL.revokeObjectURL(o._url); }, 1000);
  o.remove(); document.documentElement.classList.remove('visore-aperto');
}
/* file scaricati (PDF, Word, PowerPoint, CSV, backup): nel visore con «Condividi o salva»; i PDF anche in anteprima */
function visoreFile(nome, blob) {
  apriVisore(nome);
  var o = $('visore'), ifr = $('vFrame'), url = URL.createObjectURL(blob), file = null;
  o._url = url;
  try { file = new File([blob], nome, { type: blob.type }); } catch (e) {}
  var puo = !!(file && navigator.canShare && navigator.canShare({ files: [file] }));
  var pdf = /pdf/i.test(blob.type) || /\.pdf$/i.test(nome);
  $('vStampa').hidden = !pdf;
  $('vCondividi').hidden = !puo;
  $('vCondividi').onclick = function () { navigator.share({ files: [file], title: nome }).catch(function () {}); };
  if (pdf) ifr.src = url;
  else {
    ifr.srcdoc = '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font:17px system-ui,sans-serif;padding:28px;color:#13222D;line-height:1.5">' +
      '<p style="font-size:20px;margin:0 0 8px"><b>' + esc(nome) + '</b></p><p style="margin:0 0 16px">Il file è pronto.</p>' +
      (puo ? '<p style="margin:0">Tocca <b>«Condividi o salva»</b> in alto per salvarlo in File, mandarlo per mail o aprirlo con un\'altra app.</p>' : '<p style="margin:0"><a href="' + url + '" download="' + esc(nome) + '">Scarica il file</a></p>') + '</body>';
  }
}
/* tutti i download dell'app passano da un link con l'attributo download: nell'app installata vanno nel visore */
(function () {
  var clic = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () {
    if (appInstallata() && this.hasAttribute('download') && /^blob:/.test(this.href)) {
      var nome = this.getAttribute('download') || 'file';
      fetch(this.href).then(function (r) { return r.blob(); }).then(function (b) { visoreFile(nome, b); }).catch(function () { clic.call(this); }.bind(this));
      return;
    }
    return clic.apply(this, arguments);
  };
})();
document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && $('visore')) chiudiVisore(); });
