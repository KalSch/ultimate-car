Ultimate Car Tycoon — Phase I v0.1.2

Repair build. This version deliberately removes the service worker so a stale cached JavaScript file cannot mask changes while the foundation is being validated.

Tested foundation:
- Vehicle sketch renders immediately.
- Sliders and exact numeric inputs stay synchronized.
- SVG drag handles update the same underlying measurements.
- Commit Revision 001/002 works.
- Undo/redo works.
- Workshop / Research / Project Log tabs work.
- Research writes records to Project Log.
- Revisions persist in localStorage.
- Prototype testing unlocks after two committed revisions.

For GitHub Pages, replace the previous files with this build. Because app.js and style.css are requested with ?v=012 and there is no service worker, browsers should request this repair build rather than the cached v0.1/v0.1.1 scripts.
