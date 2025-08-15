// Using a Map is safer than a plain object for listeners, as it prevents prototype pollution.
const listeners = new Map();

export const emitEvent = (eventName, data) => {
  if (listeners.has(eventName)) {
    // Get the array of callbacks and execute each one.
    for (const callback of listeners.get(eventName)) callback(data);
  }
};

export const onEvent = (eventName, callback) => {
  // If no listeners for this event exist, create a new array.
  if (!listeners.has(eventName)) {
    listeners.set(eventName, []);
  }

  // Add the new callback to the array of listeners for this event.
  listeners.get(eventName).push(callback);

  // Return a function to unsubscribe the listener.
  return () => {
    if (listeners.has(eventName)) {
      const currentListeners = listeners.get(eventName);
      const filteredListeners = currentListeners.filter((callback_) => callback_ !== callback);

      // If there are still listeners, update the array. Otherwise, remove the event entry.
      if (filteredListeners.length > 0) {
        listeners.set(eventName, filteredListeners);
      } else {
        listeners.delete(eventName);
      }
    }
  };
};
