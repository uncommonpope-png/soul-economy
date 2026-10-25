// Family Treasury module script — live on the Soul Economy index.
// Behavior: the SOL copy button, mirroring the live treasury band, plus the
// mobile treasury accordion (Gemini Rank 2). No network calls of any kind —
// custody rule holds by construction (the script only touches the clipboard,
// a note, and card visibility).
(function () {
  var btn = document.getElementById('treasurySol');
  var note = document.getElementById('treasuryCopyNote');
  if (!btn || !note) return;
  btn.addEventListener('click', function () {
    var address = btn.getAttribute('data-address') || '';
    var done = function () {
      note.textContent = '◆ Solana address copied — thank you for the family.';
      setTimeout(function () { note.textContent = ''; }, 4000);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(address).then(done, done);
    } else {
      done();
    }
  });
})();

// Mobile treasury accordion (Gemini Rank 2). Desktop grid untouched:
// the accordion class is only added on small screens, and only headers
// stay visible until a card is tapped open. First card opens by default
// so a call-to-action stays visible; deep links (#treasury-tips) open
// their card.
(function () {
  var treasury = document.querySelector('.family-treasury');
  if (!treasury) return;
  var mq = window.matchMedia('(max-width: 640px)');
  var groups = treasury.querySelectorAll('.treasury-group');
  var applyMode = function () {
    if (mq.matches) {
      treasury.classList.add('accordion');
      if (!treasury.querySelector('.treasury-group.open') && groups.length) {
        groups[0].classList.add('open');
      }
    } else {
      treasury.classList.remove('accordion');
    }
  };
  groups.forEach(function (g) {
    var h = g.querySelector('h3');
    if (!h) return;
    h.addEventListener('click', function () {
      if (!mq.matches) return;
      g.classList.toggle('open');
    });
  });
  var openHash = function () {
    var id = (location.hash || '').slice(1);
    if (!id) return;
    var t = document.getElementById(id);
    if (t && t.classList.contains('treasury-group') && mq.matches) {
      t.classList.add('open');
    }
  };
  window.addEventListener('hashchange', openHash);
  if (mq.addEventListener) mq.addEventListener('change', applyMode);
  else if (mq.addListener) mq.addListener(applyMode);
  applyMode();
  openHash();
})();
