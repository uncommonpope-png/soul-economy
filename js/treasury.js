// Family Treasury module script — DRAFT, not deployed.
// Only behavior: the SOL copy button, mirroring the live index.html
// treasury band. No network calls of any kind — custody rule holds
// by construction (the script only touches the clipboard and a note).
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
