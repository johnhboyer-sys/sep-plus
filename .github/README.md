# SEP+ for Safari

[SEP+](https://github.com/andrewshen/sep-plus) by Andrew Shen gives the
[Stanford Encyclopedia of Philosophy](https://plato.stanford.edu) a cleaner
reading layout, highlights and notes, an outline, footnote previews and
search. It ships for Chrome and Firefox. This copy turns it into a
*userscript*, a single file that runs in Safari through a free app, so you
don't need the Chrome Web Store or a paid Apple developer account.

It rebuilds itself once a day from Andrew's latest version.

## Install it on a Mac

1. Install **[Userscripts](https://apps.apple.com/app/userscripts/id1463298887)**
   from the Mac App Store. It's free.
2. Open Safari → **Settings → Extensions**, turn on **Userscripts**, and
   allow it on `plato.stanford.edu`.
3. In Safari, open this link:
   **<https://raw.githubusercontent.com/johnhboyer-sys/sep-plus/userscript-dist/sep-plus.user.js>**
4. The Userscripts menu opens with the script in it. Click **Install**.
   (If the menu doesn't open, click the Userscripts icon `</>` in Safari's
   toolbar.)
5. Open any SEP entry, for example
   [John Rawls](https://plato.stanford.edu/entries/rawls/).

## Get updates

Click the Userscripts icon `</>` in Safari's toolbar and look for
updates. If one is waiting, update it, then reload the SEP page. The app
doesn't update scripts by itself.

## Good to know

- **A brief flash.** For a moment when a page opens you may see the plain
  SEP page before SEP+ takes over. The Userscripts app starts scripts a
  little late; the Chrome extension doesn't have this.
- **Text width.** This copy adds one setting the original lacks:
  **⋯ → Text width** (Narrow, Standard, Wide, Wider).
- **Your notes stay in Safari.** Highlights and notes are saved by the
  Userscripts app, apart from any you made in Chrome. To move them, use
  **⋯ → Export annotations** in one browser and **Import annotations** in
  the other.
- **Other browsers.** Tampermonkey or Violentmonkey (Chrome, Firefox, Edge)
  and Userscripts on iPhone and iPad should run the same file, but only
  Userscripts on the Mac has been tested. On Chrome and Firefox the
  [real extension](https://github.com/andrewshen/sep-plus) is the better
  choice.

## How this copy works

- The `userscript-build` branch is Andrew's code plus a small layer that
  stands in for the Chrome extension APIs
  (`src/userscript/`, `vite.userscript.config.ts`) and the Text width
  setting.
- `.github/workflows/userscript.yml` runs every day: it merges Andrew's
  `main`, runs the tests, builds `sep-plus.user.js` and, if anything
  changed, publishes it to the `userscript-dist` branch. If his changes
  clash with this copy or a test fails, the run stops and the last good
  build stays up.
- To build it yourself: `npm ci`, then `npm run build:userscript`. The file
  lands in `dist/userscript/`.

Bugs in the Safari copy belong here, not with Andrew. For everything else
about SEP+, see [his README](../README.md).

## License

MIT, © 2026 Andrew Shen. See [LICENSE](../LICENSE).
