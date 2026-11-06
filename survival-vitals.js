/* Original MineWorld survival HUD model. No proprietary texture assets. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MineWorldSurvivalHUD = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  function clampPoints(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return 0;
    return Math.max(0, Math.min(20, Math.floor(number)));
  }
  function iconStates(points) {
    const amount = clampPoints(points);
    return Array.from({ length: 10 }, (_, index) => {
      const remaining = amount - index * 2;
      return remaining >= 2 ? 'full' : remaining === 1 ? 'half' : 'empty';
    });
  }
  // Only accept local object URLs or PNG data supplied by the player's pack loader.
  // Never fetch remote artwork or embed third-party assets in the repository.
  function safeSprite(value) {
    if (typeof value !== 'string') return null;
    if (/^blob:https?:\/\/[^\s"'()]+$/.test(value) ||
        /^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(value)) return value;
    return null;
  }
  function update(container, kind, points, sprites) {
    if (!container || typeof container.replaceChildren !== 'function') return false;
    const document = container.ownerDocument;
    const safeKind = kind === 'hunger' ? 'hunger' : 'health';
    const value = clampPoints(points);
    const states = iconStates(value);
    const urls = states.map(state => safeSprite(sprites && sprites[state]));
    const signature = JSON.stringify(urls);
    // Skip DOM churn only if the displayed sprites and values are unchanged.
    const label = (safeKind === 'health' ? 'Health' : 'Food') + ': ' + value + ' of 20';
    // A UI framework or accessibility extension may alter the container's
    // attributes without changing its children. Repair the label even on a
    // no-repaint update so assistive technology never reads stale values.
    if (container.dataset && container.dataset.value === String(value) &&
        container.dataset.kind === safeKind && container.dataset.sprites === signature &&
        container.children && container.children.length === 10 &&
        states.every((state, index) => {
          const icon = container.children[index];
          return icon &&
            icon.className === 'mw-vital-icon mw-vital-' + safeKind + ' mw-vital-' + state &&
            icon.dataset && icon.dataset.slot === String(index) &&
            (icon.dataset.importedSprite === 'true') === Boolean(urls[index]) &&
            (!urls[index] || (icon.style && icon.style.getPropertyValue &&
              icon.style.getPropertyValue('--mw-vital-sprite') === 'url("' + urls[index] + '")'));
        })) {
      container.setAttribute('role', 'img');
      container.setAttribute('aria-label', label);
      return true;
    }
    const nodes = states.map((state, index) => {
      const icon = document.createElement('span');
      icon.className = 'mw-vital-icon mw-vital-' + safeKind + ' mw-vital-' + state;
      icon.setAttribute('aria-hidden', 'true');
      icon.dataset.slot = String(index);
      if (urls[index]) {
        icon.dataset.importedSprite = 'true';
        icon.style.setProperty('--mw-vital-sprite', 'url("' + urls[index] + '")');
      }
      return icon;
    });
    container.replaceChildren(...nodes);
    container.setAttribute('role', 'img');
    container.setAttribute('aria-label', label);
    container.dataset.value = String(value);
    container.dataset.kind = safeKind;
    container.dataset.sprites = signature;
    return true;
  }
  return { clampPoints, iconStates, safeSprite, update };
});
