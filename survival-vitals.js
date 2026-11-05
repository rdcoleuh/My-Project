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
  function update(container, kind, points) {
    if (!container || typeof container.replaceChildren !== 'function') return false;
    const document = container.ownerDocument;
    const safeKind = kind === 'hunger' ? 'hunger' : 'health';
    const value = clampPoints(points);
    const nodes = iconStates(value).map((state, index) => {
      const icon = document.createElement('span');
      icon.className = 'mw-vital-icon mw-vital-' + safeKind + ' mw-vital-' + state;
      icon.setAttribute('aria-hidden', 'true');
      icon.dataset.slot = String(index);
      return icon;
    });
    container.replaceChildren(...nodes);
    container.setAttribute('role', 'img');
    container.setAttribute('aria-label', (safeKind === 'health' ? 'Health' : 'Food') + ': ' + value + ' of 20');
    container.dataset.value = String(value);
    return true;
  }
  return { clampPoints, iconStates, update };
});
