const listeners = {};

export const emitEvent = (eventName, data) => {
  if (listeners[eventName]) {
    listeners[eventName].forEach((callback) => callback(data));
  }
};

export const onEvent = (eventName, callback) => {
  if (!listeners[eventName]) {
    listeners[eventName] = [];
  }
  listeners[eventName].push(callback);

  return () => {
    listeners[eventName] = listeners[eventName].filter((cb) => cb !== callback);
  };
};