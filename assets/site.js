/* ===========================================================================
   LINK GREEN INTERNATIONAL · comportements de la maquette
   =========================================================================== */
(function () {
  'use strict';

  var store = {
    get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* sans effet */ } }
  };

  /* --- année dynamique ---------------------------------------------------- */
  Array.prototype.forEach.call(document.querySelectorAll('[data-year]'), function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* --- avertisseur -------------------------------------------------------- */
  var toast = document.getElementById('toast');
  var t = null;
  function say(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.setAttribute('data-show', '1');
    window.clearTimeout(t);
    t = window.setTimeout(function () { toast.removeAttribute('data-show'); }, 5200);
  }

  /* --- consentement ------------------------------------------------------
     Intégré au design, limité au tiers bas de l'écran, et il n'apparaît plus
     une fois le choix fait. Le refus est aussi accessible que l'acceptation. */
  var consent = document.getElementById('consent');
  if (consent) {
    if (store.get('lgi-consent')) {
      consent.hidden = true;
    } else {
      consent.hidden = false;
    }
    consent.addEventListener('click', function (ev) {
      var b = ev.target.closest('button');
      if (!b) return;
      store.set('lgi-consent', b.dataset.accept ? 'all' : (b.dataset.refuse ? 'none' : 'custom'));
      consent.hidden = true;
      if (b.dataset.custom) say('En production : ouverture du panneau de réglages par finalité (mesure d’audience, contenus tiers).');
    });
  }

  /* --- langues : FR / EN / 中文 ------------------------------------------- */
  Array.prototype.forEach.call(document.querySelectorAll('.lang button'), function (btn) {
    btn.addEventListener('click', function () {
      if (btn.getAttribute('aria-current') === 'true') return;
      var l = btn.dataset.lang;
      var label = l === 'zh' ? '中文' : l.toUpperCase();
      say('Version ' + label + ' : arborescence /' + l + '/, balises hreflang et police couvrant le chinois simplifié ' +
          'déjà en place. Reste la traduction, qui est un livrable de rédaction.');
    });
  });

  /* --- bandeau de maquette ------------------------------------------------ */
  var mockbar = document.getElementById('mockbar');
  if (mockbar) {
    var c = mockbar.querySelector('button');
    if (c) c.addEventListener('click', function () { mockbar.hidden = true; });
  }

  /* --- fiches filière non encore rédigées --------------------------------- */
  Array.prototype.forEach.call(document.querySelectorAll('[data-todo-sheet]'), function (el) {
    el.addEventListener('click', function (ev) {
      ev.preventDefault();
      say('Gabarit unique, seize fiches : « ' + el.dataset.todoSheet + ' » reprend la structure de la fiche Emballages, ' +
          'déjà rédigée dans cette maquette.');
    });
  });

  /* --- formulaires (stub honnête) ---------------------------------------- */
  Array.prototype.forEach.call(document.querySelectorAll('form[data-stub]'), function (form) {
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var msg = form.querySelector('.form-msg');
      if (!msg) return;
      msg.hidden = false;
      msg.textContent = form.dataset.stub === 'rdv'
        ? 'Maquette : en production, ce bouton ouvre votre agenda et votre paiement en ligne&nbsp;: le tunnel de réservation actuel est conservé tel quel.'
        : 'Maquette : le formulaire n’est pas relié. En production, il arrive sur une adresse de votre domaine, pas sur une boîte gmail.';
      msg.setAttribute('role', 'status');
    });
  });

  /* =======================================================================
     « Suis-je producteur au sens de la REP ? » · 3 questions
     ======================================================================= */

  var CAT = {
    eee:  { code: 'EEE', nom: 'Équipements électriques et électroniques' },
    emb:  { code: 'EMB', nom: 'Emballages' },
    tlc:  { code: 'TLC', nom: 'Textiles, linge, chaussures' },
    dea:  { code: 'DEA', nom: 'Meubles et ameublement' },
    jou:  { code: 'JOU', nom: 'Jouets' },
    brico:{ code: 'ABJ', nom: 'Bricolage et jardin' }
  };

  var form = document.getElementById('q');
  if (!form) return;

  var steps = Array.prototype.slice.call(form.querySelectorAll('.qstep'));
  var prev = document.getElementById('q-prev');
  var next = document.getElementById('q-next');
  var count = document.getElementById('q-count');
  var err = document.getElementById('q-err');
  var res = document.getElementById('q-res');
  var at = 0;

  function paint() {
    steps.forEach(function (s, i) { s.hidden = i !== at; });
    prev.disabled = at === 0;
    next.textContent = at === steps.length - 1 ? 'Voir le résultat' : 'Suivant';
    count.textContent = (at + 1) + ' / ' + steps.length;
    err.removeAttribute('data-show');
  }
  function ok() {
    var ins = steps[at].querySelectorAll('input');
    for (var i = 0; i < ins.length; i++) if (ins[i].checked) return true;
    return false;
  }
  function pick(name) {
    return Array.prototype.map.call(form.querySelectorAll('input[name="' + name + '"]:checked'), function (i) { return i.value; });
  }

  next.addEventListener('click', function () {
    if (!ok()) {
      err.setAttribute('data-show', '1');
      err.textContent = 'Choisissez une réponse pour continuer.';
      var f = steps[at].querySelector('input'); if (f) f.focus();
      return;
    }
    if (at < steps.length - 1) {
      at += 1; paint();
      var h = steps[at].querySelector('.q');
      if (h) { h.setAttribute('tabindex', '-1'); h.focus(); }
    } else { render(); }
  });
  prev.addEventListener('click', function () {
    if (at === 0) return;
    at -= 1; if (res) res.hidden = true; paint();
  });
  form.addEventListener('submit', function (e) { e.preventDefault(); next.click(); });

  function item(titre, txt) {
    return '<li><svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true">' +
      '<path d="M2 8.5 6 12.3 14 3.7" fill="none" stroke="currentColor" stroke-width="2.2"/></svg>' +
      '<div><b>' + titre + '</b><p>' + txt + '</p></div></li>';
  }

  function render() {
    var prods = pick('cat');
    var pays = pick('pays')[0];
    var canal = pick('canal')[0];
    var out = [];

    out.push(item(
      'Un identifiant unique (UIN) par filière',
      'Vous relevez de ' + prods.length + ' filière' + (prods.length > 1 ? 's' : '') + ' : ' +
      prods.map(function (p) { return CAT[p].nom; }).join(' · ') +
      '. Chaque filière donne lieu à son propre numéro, délivré par l’ADEME.'
    ));
    out.push(item(
      'Adhésion à l’éco-organisme de chaque filière',
      'Contrat, barème, déclaration : les modalités changent d’un éco-organisme à l’autre. Nous travaillons avec les principaux depuis quatre ans.'
    ));
    out.push(item(
      'Déclaration des ventes et éco-contribution',
      'Les quantités mises sur le marché français sont déclarées par période. C’est là que se logent la plupart des erreurs, et les régularisations qui coûtent cher.'
    ));

    if (pays === 'hors-ue') {
      out.push(item(
        'Un mandataire établi en France, obligatoire',
        'Sans établissement dans l’Union, vous ne pouvez pas vous enregistrer directement. C’est exactement le rôle que nous tenons : le mandat REP France.'
      ));
    } else if (pays === 'ue') {
      out.push(item(
        'Enregistrement direct ou mandat',
        'Vous pouvez vous enregistrer vous-même. En pratique, tout se passe en français, avec des interlocuteurs français : le mandat évite d’y consacrer un poste.'
      ));
    } else {
      out.push(item(
        'Vérifiez le périmètre exact, pas seulement le principe',
        'Établi en France, vous vous enregistrez directement. L’erreur classique porte sur les marchandises importées puis revendues sous votre marque : vous en devenez le producteur.'
      ));
    }

    if (canal === 'marketplace') {
      out.push(item(
        'Votre place de marché contrôlera votre UIN',
        'Amazon, Cdiscount et ManoMano vérifient l’enregistrement de leurs vendeurs. Sans numéro valide, les annonces sont suspendues. C’est la première raison pour laquelle on nous appelle en urgence.'
      ));
    }
    if (canal === 'propre') {
      out.push(item(
        'Signalétique de tri et information de l’acheteur',
        'Vente au consommateur français : logo Triman et consignes de tri sur le produit, l’emballage ou la fiche produit.'
      ));
    }

    res.innerHTML =
      '<div class="qres__hd">' +
      '<h3>' + (pays === 'hors-ue'
        ? 'Oui, et il vous faut un mandataire en France'
        : 'Oui, vous êtes producteur au sens de la REP') + '</h3>' +
      '<p>Résultat établi sur trois réponses. Les quinze minutes de consultation servent à le confirmer sur votre catalogue réel.</p></div>' +
      '<div class="qres__body">' +
      '<h4>Filières identifiées</h4><p class="nums" style="margin-bottom:1.2rem">' +
      prods.map(function (p) { return CAT[p].code; }).join(' · ') + '</p>' +
      '<h4>Ce que cela implique</h4><ul class="qlist">' + out.join('') + '</ul></div>' +
      '<div class="qres__cta">' +
      '<a class="btn" href="#rdv">Réserver les 15 minutes gratuites</a>' +
      '<a class="btn btn--line" href="https://wa.me/33607720546">WhatsApp</a>' +
      '<p>Réponse en français, anglais ou chinois.</p></div>';

    res.hidden = false;
    res.setAttribute('tabindex', '-1');
    res.focus();
  }

  paint();
})();
