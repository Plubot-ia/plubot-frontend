import { useEffect } from 'react';

/**
 * @description Custom hook to scroll to the bottom of a message container automatically.
 * @param {React.RefObject} messagesEndReference - A ref pointing to the element at the end of the messages list.
 * @param {Array} messages - The list of messages. The effect runs when this list changes.
 * @param {boolean} isUltraMode - A flag to determine the scroll behavior.
 */
export const useMessageScroll = (messagesEndReference, messages, isUltraMode) => {
  useEffect(() => {
    if (messagesEndReference.current) {
      const container = messagesEndReference.current.parentElement;
      setTimeout(
        () => {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: isUltraMode ? 'auto' : 'smooth',
          });
        },
        isUltraMode ? 10 : 100,
      );
    }
  }, [messages, isUltraMode, messagesEndReference]);
};
