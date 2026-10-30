const loaded = {};

/** Load an external script once and resolve when it is ready. */
export function loadScript(src) {
  loaded[src] ||= new Promise((resolve, reject) => {
    const el = document.createElement('script');
    el.src = src;
    el.onload = resolve;
    el.onerror = () => {
      delete loaded[src];
      reject(
        new Error(
          'Could not load the payment window. Check your connection and try again.'
        )
      );
    };
    document.body.appendChild(el);
  });
  return loaded[src];
}
