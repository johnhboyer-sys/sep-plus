// The extension's manifest injects these two style sheets before any script
// runs. A userscript has no manifest, so add them first, in the same order.
import bootCss from '../host/boot.css?inline';
import hostCss from '../host/styles.css?inline';

const style = document.createElement('style');
style.setAttribute('data-sep-plus-userscript', '');
style.textContent = bootCss + '\n' + hostCss;
(document.head ?? document.documentElement).appendChild(style);

// Dynamic so it runs after the styles above (static imports would run first).
void import('../content/main');
