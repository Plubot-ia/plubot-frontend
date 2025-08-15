import { useMemo } from 'react';

export const useNodeReturn = (props) => {
  const { nodeReference, ...otherProps } = props;

  return useMemo(
    () => ({
      ...otherProps,
      nodeRef: nodeReference,
    }),
    [nodeReference, otherProps],
  );
};
