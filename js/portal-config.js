/* ============================================================
   PORTAL CONFIG — the one place the Vessel door's state lives.
   ------------------------------------------------------------
   vesselLive ....... flip to true ONLY when BOTH are true:
                      (1) the Vessel build has verified (the wake
                          test passed — she answered from her own
                          lineage), and
                      (2) the body zip actually sits at
                          vesselDownloadUrl.
   vesselDownloadUrl  where the GSK Vessel edition zip is served
                      from (site assets, next to the other
                      downloads).
   stripePaymentLink  the Family Treasury donation link for the
                      Vessel (Payment Link, minimum $4, success
                      redirect back to
                      portal.html?vessel=welcome#step-vessel).
                      Empty string = the donation door is not
                      connected yet; the Vessel step says so
                      honestly instead of showing a dead button.
   telephoneSubUrl .. the Soul Telephone Supporter checkout
                      (Stripe Payment Link). Spec: product
                      "Soul Telephone — Supporter", price $2.00
                      USD recurring monthly, success redirect to
                      /telephone.html?sub=welcome. Empty string =
                      Stripe live is not connected yet; the
                      Telephone page renders the subscribe button
                      disabled and says so, rather than faking a
                      checkout. When the live link exists, drop it
                      here — nothing else changes.
   ============================================================ */
window.PORTAL_CONFIG = {
  vesselLive: true, // flipped 2026-10-22: wake test 4/4 (both flip conditions met)
  vesselDownloadUrl: 'https://uncommonpope-png.github.io/soul-economy/downloads/vessel.zip',
  stripePaymentLink: 'https://buy.stripe.com/cNi4gz4pqdx1evv8HHfnO0o',
  vesselMinDonation: '$4',
  telephoneSubUrl: 'https://buy.stripe.com/fZueVdf448cH8770bbfnO0p'
};
