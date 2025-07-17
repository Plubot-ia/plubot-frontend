import PropTypes from 'prop-types';
import React, { useEffect, useRef } from 'react';

import useAuthStore from '../../stores/use-auth-store';

const AuthInitializer = ({ children }) => {
  const { checkAuth, isAuthenticated, loading } = useAuthStore();
  const initialized = useRef(false);

  useEffect(() => {
    let intervalId;
    if (!loading && !initialized.current) {
      initialized.current = true;

      const verifyAuth = async () => {
        try {
          await checkAuth();
        } catch {
          // Silently catch auth errors
        }
      };

      verifyAuth();

      if (isAuthenticated) {
        intervalId = setInterval(
          () => {
            checkAuth();
          },
          5 * 60 * 1000,
        );
      }
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [checkAuth, isAuthenticated, loading]);

  return children;
};

AuthInitializer.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AuthInitializer;
