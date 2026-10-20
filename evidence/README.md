# Local validation evidence

Checkpoint: 2026-10-20, `codex/phase1-core-prototype`, Core `0.1-draft.1`.

- [Machine-readable result summary](validation-summary.json)
- [Full scope, commands and remaining limits](../docs/VALIDATION.md)
- [Single long-source parse measurement](long-book.json)

| Display | Chromium desktop | Chromium mobile emulation | WebKit desktop |
| --- | --- | --- | --- |
| Horizontal | [image](horizontal-chromium-desktop.png) | [image](horizontal-chromium-mobile.png) | [image](horizontal-webkit-desktop.png) |
| Japanese vertical + ruby | [image](vertical-chromium-desktop.png) | [image](vertical-chromium-mobile.png) | [image](vertical-webkit-desktop.png) |
| RTL + isolated LTR | [image](rtl-chromium-desktop.png) | [image](rtl-chromium-mobile.png) | [image](rtl-webkit-desktop.png) |

These are actual headless-browser captures, reviewed for visible layout; they are not pixel-perfect golden baselines. The viewport intentionally clips long prose at its scrolling boundary. The browser tests also assert geometry, computed styles, semantic DOM and navigation. Mobile is emulation, and WebKit is the Playwright build, not a manual test in a user's installed browser.

Raw generated logs (`check-output.txt`, `ui-output.txt`, `browser-results.json`) stay local and are ignored by Git. They include environment-specific paths and timings. Run the documented commands to regenerate them. No publication/deployment occurred.
