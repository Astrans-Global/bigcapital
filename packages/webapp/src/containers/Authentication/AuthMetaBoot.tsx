// @ts-nocheck
import React, { createContext } from 'react';
import { useAuthMetadata } from '@/hooks/query';
import { Spinner } from '@blueprintjs/core';
import styled from 'styled-components';

const AuthMetaBootContext = createContext();

/**
 * Boots the authentication page metadata.
 */
function AuthMetaBootProvider({ ...props }) {
  const { isLoading: isAuthMetaLoading, data: authMeta } = useAuthMetadata();

  // useAuthApiFetcher() doesn't enable the camelCase response transform, so
  // the wire response stays snake_case (`{ signup_disabled }`) — verified
  // against the live /api/auth/meta response.
  const state = {
    isAuthMetaLoading,
    signupDisabled: authMeta?.signup_disabled ?? authMeta?.signupDisabled,
  };

  if (isAuthMetaLoading) {
    return (
      <SpinnerRoot>
        <Spinner size={30} value={null} />
      </SpinnerRoot>
    );
  }
  return <AuthMetaBootContext.Provider value={state} {...props} />;
}

const useAuthMetaBoot = () => React.useContext(AuthMetaBootContext);

export { AuthMetaBootContext, AuthMetaBootProvider, useAuthMetaBoot };

const SpinnerRoot = styled.div`
  margin-top: 5rem;
`;
