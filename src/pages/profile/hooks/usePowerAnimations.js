import { useState, useEffect, useCallback } from 'react';

const usePowerAnimations = (userPowers) => {
  const [powerAnimations, setPowerAnimations] = useState(new Map());

  const activateAnimation = useCallback((key) => {
    if (key === '__proto__') return;

    setPowerAnimations((previousMap) => {
      if (!previousMap.has(key)) {
        return previousMap;
      }
      const newMap = new Map(previousMap);
      const currentAnimation = newMap.get(key);
      newMap.set(key, { ...currentAnimation, active: true });
      return newMap;
    });
  }, []);

  useEffect(() => {
    if (userPowers && Array.isArray(userPowers)) {
      const initialMap = new Map();
      for (const [index, power] of userPowers.entries()) {
        if (power && power !== '__proto__') {
          initialMap.set(power, { delay: index * 300, active: false });
        }
      }
      setPowerAnimations(initialMap);

      const timeouts = [...initialMap.keys()].map((key) => {
        const animation = initialMap.get(key);
        return setTimeout(() => {
          if (animation) {
            activateAnimation(key);
          }
        }, animation.delay + 500);
      });

      return () => {
        for (const timeout of timeouts) {
          clearTimeout(timeout);
        }
      };
    }
  }, [userPowers, activateAnimation]);

  return [powerAnimations, setPowerAnimations];
};

export default usePowerAnimations;
