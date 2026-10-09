ULTIMATE CAR TYCOON — Phase I v0.1.1

This is the first playable vehicle-builder architecture prototype.

Run:
1. Unzip the folder.
2. Serve it from a local web server (recommended) or your existing PWA workflow.
   Example: python3 -m http.server 8080
3. Open http://localhost:8080

Implemented:
- 1886 Project 001 opening
- Forced Revision 001 / Revision 002 tutorial structure
- Parametric side-view vehicle drawing
- Drag wheelbase and wheel-size editing
- Precise numeric entry using the same underlying parameters
- Persistent revisions
- Revision comparison
- Separate known engineering observations from underlying simulation
- First primitive prototype road test
- Research experiments with research-failure vs useful knowledge
- Permanent project log
- Local autosave
- Installable/offline PWA shell

This is intentionally the foundation only. No dealership, manufacturing, sales, marketing, or modern design systems are included.

v0.1.1 FIXES
- Sliders and exact numerical fields now control the same underlying parameter and visibly stay synchronized.
- Commit Revision now persists revisions and advances the two-revision tutorial.
- Undo/redo rewritten around design snapshots.
- Research navigation and experiments are active.
- Project Log navigation is active and displays committed revisions, tests, and research.
- Service-worker cache version changed to prevent the original broken JavaScript from being reused.
