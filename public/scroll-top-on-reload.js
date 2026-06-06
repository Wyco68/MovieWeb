(function () {
  try {
    var navEntry =
      (performance.getEntriesByType && performance.getEntriesByType("navigation")[0]) || null;
    var isReload = navEntry
      ? navEntry.type === "reload"
      : performance.navigation && performance.navigation.type === 1;

    if (!isReload) return;

    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    window.scrollTo(0, 0);
    window.addEventListener(
      "pageshow",
      function () {
        window.scrollTo(0, 0);
      },
      { once: true },
    );
  } catch (e) {
    // ignore
  }
})();
