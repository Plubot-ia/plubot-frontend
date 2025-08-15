const resizeObserver = new ResizeObserver((entries) => {
  for (const entry of entries) {
    const nodeId = entry.target.dataset.id;
    if (!nodeId) continue;

    const { width, height } = entry.target.getBoundingClientRect();
    const callback = entry.target.__resizeCallback;

    if (
      callback &&
      (Math.abs(width - (entry.target.__lastWidth ?? 0)) > 5 ||
        Math.abs(height - (entry.target.__lastHeight ?? 0)) > 5)
    ) {
      callback(nodeId, width, height);
      entry.target.__lastWidth = width;
      entry.target.__lastHeight = height;
    }
  }
});

export const observeNodeResize = (nodeElement, nodeId, callback) => {
  if (!nodeElement || !nodeId || !callback) return;

  nodeElement.dataset.id = nodeId;
  nodeElement.__resizeCallback = callback;
  resizeObserver.observe(nodeElement);
};

export const unobserveNodeResize = (nodeElement) => {
  if (nodeElement) {
    resizeObserver.unobserve(nodeElement);
    delete nodeElement.__resizeCallback;
    delete nodeElement.__lastWidth;
    delete nodeElement.__lastHeight;
  }
};
