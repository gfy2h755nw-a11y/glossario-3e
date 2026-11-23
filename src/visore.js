/* ---------- app installata sulla schermata Home (iPhone, iPad, Android) ----------
 * In questa modalità le finestre nuove (report, schede, cartelloni da stampare) e i file scaricati si aprono
 * senza un pulsante per tornare indietro: bisognava chiudere l'app. Qui si aprono in un visore dentro l'app,
 * con «← Torna all'app», «Stampa o salva PDF» e, per i file, «Condividi o salva» (Salva in File, Mail, AirDrop…).
 * Nel browser normale non cambia nulla. */
function appInstallata() {
  try { return window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches || window.matchMedia('(display-mode: fullscreen)').matches; } catch (e) { return false; }
}
/* telefoni e tablet: anche nel browser le finestre nuove si perdono tra le schede e non si stampano bene */
function schermoTouch() { try { return window.matchMedia('(pointer: coarse)').matches && !window.matchMedia('(pointer: fine)').matches; } catch (e) { return false; } }
function conVisore() { return appInstallata() || schermoTouch(); }
var _apriFinestra = window.open;
window.open = function (u) {
  if (!conVisore() || (u && u !== 'about:blank')) return _apriFinestra.apply(window, arguments);
  return apriVisore();
};
/* documento largo come sul PC, rimpicciolito per stare nello schermo del telefono */
var LARGO_VISORE = 840;
function scalaVisore(on) {
  var box = $('vScala'), f = $('vFrame'); if (!box || !f) return;
  var z = Math.min(1, (box.clientWidth || window.innerWidth) / LARGO_VISORE);
  if (!on || z >= 1) { box.classList.remove('scala'); f.style.width = ''; f.style.height = ''; f.style.transform = ''; return; }
  box.classList.add('scala');
  f.style.width = LARGO_VISORE + 'px'; f.style.height = Math.ceil(box.clientHeight / z) + 'px'; f.style.transform = 'scale(' + z.toFixed(4) + ')';
}
window.addEventListener('resize', function () { var b = $('vScala'); if (b && b.classList.contains('scala')) scalaVisore(true); });
/* finestra finta: accetta document.write / document.close / location.href come una finestra vera */
function apriVisore(titolo) {
  chiudiVisore();
  var o = document.createElement('div'); o.id = 'visore'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true');
  o.innerHTML = '<div class="vbar"><button type="button" class="vtorna" id="vTorna">← Torna all\'app</button><b id="vTit">' + (titolo ? esc(titolo) : 'Documento') + '</b>' +
    '<span class="vazioni"><button type="button" class="vbtn" id="vStampa">Stampa o salva PDF</button><button type="button" class="vbtn" id="vCondividi" hidden>Condividi o salva</button></span></div>' +
    '<div class="vscala" id="vScala"><iframe id="vFrame" title="Documento"></iframe></div>';
  document.body.appendChild(o); document.documentElement.classList.add('visore-aperto');
  var ifr = o.querySelector('iframe'), buf = '', t = null;
  var mostra = function () {
    clearTimeout(t);
    t = setTimeout(function () {
      // la stampa automatica del documento si ferma: si stampa con il pulsante in alto
      // sul telefono il documento si impagina come sul PC (larghezza fissa) e poi si rimpicciolisce tutto insieme:
      // niente colonne schiacciate né testi ingranditi dal telefono (solo a video: la stampa resta A4)
      var zoom = '<style>html{-webkit-text-size-adjust:100%;text-size-adjust:100%}</style>';
      scalaVisore(true);
      var html = buf.replace(/<head([^>]*)>/i, '<head$1>' + zoom + '<script>window.__stampa=window.print;window.print=function(){};<\/script>');
      if (html === buf) html = zoom + '<script>window.__stampa=window.print;window.print=function(){};<\/script>' + buf;
      ifr.removeAttribute('src'); ifr.srcdoc = html;
      var m = /<title>([^<]*)<\/title>/i.exec(buf); if (m) $('vTit').textContent = m[1].replace(/&amp;/g, '&');
    }, 30);
  };
  var finta = {
    closed: false,
    document: { write: function (s) { buf += String(s); mostra(); }, writeln: function (s) { buf += String(s) + '\n'; mostra(); }, close: function () { mostra(); }, open: function () { buf = ''; } },
    location: {},
    focus: function () {}, blur: function () {},
    print: function () { if (!suIos()) stampaVisore(); }, // su iPhone il PDF si prepara solo quando lo si chiede
    close: function () { chiudiVisore(); }
  };
  Object.defineProperty(finta.location, 'href', { set: function (u) { clearTimeout(t); scalaVisore(false); ifr.removeAttribute('srcdoc'); ifr.src = u; }, get: function () { return ifr.src || 'about:blank'; } });
  $('vTorna').onclick = chiudiVisore;
  $('vStampa').onclick = stampaVisore;
  o._finta = finta;
  setTimeout(function () { try { $('vTorna').focus(); } catch (e) {} }, 0);
  return finta;
}
/* iPhone e iPad: la stampa dal browser non è affidabile (nell'app installata non parte proprio).
   Si prepara un vero PDF sul telefono e lo si apre con «Condividi o salva»: da lì Stampa, Salva su File, Mail, WhatsApp. */
function suIos() { return /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); }
function caricaScript(src) { return new Promise(function (ok, ko) { if (document.querySelector('script[src="' + src + '"]')) return ok(); var s = document.createElement('script'); s.src = src; s.onload = function () { ok(); }; s.onerror = function () { ko(new Error('Non riesco a caricare ' + src)); }; document.head.appendChild(s); }); }
function pdfDaVisore(doc, nome) {
  var b = $('vStampa'), t0 = b ? b.textContent : '';
  var stato = function (t) { if (b) { b.textContent = t; b.disabled = true; } };
  stato('Preparo il PDF…');
  return caricaScript('/vendor/html2canvas-1.4.1.min.js').then(function () { return caricaScript('/vendor/jspdf-2.5.1.umd.min.js'); }).then(function () {
    var pdf = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4', compress: true }), W = 210, H = 297, primo = true;
    var pagine = [].slice.call(doc.querySelectorAll('section.pg, .pagina'));
    if (!pagine.length) pagine = [doc.body];
    var aggiungi = function (canvas, margine) {
      // la pagina (o il documento intero) va su uno o più fogli A4, in larghezza
      var mm = margine || 0, larg = W - 2 * mm, pxPerMm = canvas.width / larg, altPag = Math.floor((H - 2 * mm) * pxPerMm);
      for (var y = 0; y < canvas.height; y += altPag) {
        var h = Math.min(altPag, canvas.height - y); if (h < 8 && y > 0) break;
        var c = document.createElement('canvas'); c.width = canvas.width; c.height = h; var g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, h); g.drawImage(canvas, 0, y, canvas.width, h, 0, 0, canvas.width, h);
        if (!primo) pdf.addPage(); primo = false;
        pdf.addImage(c.toDataURL('image/jpeg', 0.86), 'JPEG', mm, mm, larg, h / pxPerMm);
      }
    };
    var i = 0;
    var prossima = function () {
      if (i >= pagine.length) return Promise.resolve();
      stato('PDF: pagina ' + (i + 1) + ' di ' + pagine.length + '…');
      var el = pagine[i++];
      return window.html2canvas(el, { scale: 1.6, backgroundColor: '#ffffff', useCORS: true, logging: false, windowWidth: doc.documentElement.scrollWidth })
        .then(function (cv) { aggiungi(cv, el === doc.body ? 10 : 0); cv.width = cv.height = 0; return prossima(); });
    };
    return prossima().then(function () {
      var blob = pdf.output('blob');
      if (b) { b.disabled = false; b.textContent = t0; }
      visoreFile((nome || 'documento').replace(/[\\/:*?"<>|]+/g, ' ').trim() + '.pdf', blob);
      toast('PDF pronto: tocca «Condividi o salva» per stamparlo, salvarlo o inviarlo');
    });
  }).catch(function (e) { if (b) { b.disabled = false; b.textContent = t0; } toast('Non sono riuscito a preparare il PDF: ' + errMsg(e), true); });
}
function stampaVisore() {
  var f = $('vFrame'); if (!f) return;
  var doc = null; try { doc = f.getAttribute('srcdoc') != null ? f.contentDocument : null; } catch (e) { doc = null; }
  if (doc && doc.body && suIos()) return pdfDaVisore(doc, ($('vTit') && $('vTit').textContent) || doc.title);
  // documento dell'app (schede, report, cartelloni): si stampa dalla pagina principale, che telefoni e tablet stampano sempre
  if (doc && doc.body) {
    var vecchio = $('stampaVisore'); if (vecchio) vecchio.remove();
    var css = [].map.call(doc.querySelectorAll('style'), function (x) { return x.textContent; }).join('\n');
    var box = document.createElement('div'); box.id = 'stampaVisore';
    box.innerHTML = '<style>@media screen{#stampaVisore{display:none!important}}@media print{html,body{background:#fff!important;overflow:visible!important;height:auto!important}body>*:not(#stampaVisore){display:none!important}' + css + '}</style>' + doc.body.innerHTML;
    box.querySelectorAll('script').forEach(function (x) { x.remove(); });
    document.body.appendChild(box);
    var via = function () { window.removeEventListener('afterprint', via); setTimeout(function () { if (box.isConnected) box.remove(); }, 500); };
    window.addEventListener('afterprint', via);
    setTimeout(function () { try { window.print(); } catch (e) { toast('Da qui non riesco a stampare.', true); } }, 60);
    return;
  }
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
  $('vStampa').hidden = !pdf || suIos();
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
    if (conVisore() && this.hasAttribute('download') && /^blob:/.test(this.href)) {
      var nome = this.getAttribute('download') || 'file';
      fetch(this.href).then(function (r) { return r.blob(); }).then(function (b) { visoreFile(nome, b); }).catch(function () { clic.call(this); }.bind(this));
      return;
    }
    return clic.apply(this, arguments);
  };
})();
document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && $('visore')) chiudiVisore(); });
