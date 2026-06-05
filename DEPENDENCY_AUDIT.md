# Dependency Audit Notes

`scripts/dependency-audit.js` performs a lightweight static import scan. It fails only when source files import packages that are not declared in `package.json`.

It also reports dependencies that are declared but not currently imported by app source. Those are cleanup candidates, not automatic removals. Because this project uses a checked-in `yarn.lock`, package removals should be done with Yarn available so the lockfile remains consistent.

Current cleanup candidates include legacy experiment packages such as:

- Google Cloud Storage and old S3 React helpers
- MongoDB/Express/Multer/Netlify packages
- duplicate Popper packages
- `next.js`
- assorted table/player/form packages that are not imported by source

Do not remove these in source only. Remove them with package tooling, run CI, and verify the app still builds.
