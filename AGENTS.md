# This is NOT the Angular you know

Angular 21 has breaking changes — APIs, conventions, and file structure may all differ from your training data. Standalone components are the only mode (no NgModules), `input()/output()/model()` signal APIs replace `@Input/@Output`, control-flow `@if/@for/@switch` replaces `*ngIf/*ngFor/*ngSwitch`, the `application` builder is Vite + esbuild, and `outputMode: 'static'` produces a fully prerendered SPA-less site. PrimeNG 21 uses `@primeuix/themes` (the older `@primeng/themes` package is deprecated). Read the relevant guides under `node_modules/@angular/*/` and the PrimeNG component types under `node_modules/primeng/types/` before writing code. Heed deprecation notices.

The migration plan and phase log live at `docs/07-angular-primeng-migration-plan.md`. The pre-cutover Next.js code is recoverable from the `pre-angular` git tag.
