// @ts-nocheck
import React from 'react';
import { useApplicationBoot } from '@/components';
import { useAuthMetadata } from '@/hooks/query/authentication';

/**
 * Private pages provider.
 */
export function PrivatePagesProvider({
  // #ownProps
  children,
}) {
  const { isLoading: isAppBootLoading } = useApplicationBoot();
  const { isLoading: isAuthMetaLoading } = useAuthMetadata();
  const [bootTimedOut, setBootTimedOut] = React.useState(false);

  const isLoading = isAppBootLoading || isAuthMetaLoading;

  React.useEffect(() => {
    if (!isLoading) {
      setBootTimedOut(false);
      return undefined;
    }
    const timer = setTimeout(() => setBootTimedOut(true), 12000);
    return () => clearTimeout(timer);
  }, [isLoading]);

  return (
    <React.Fragment>
      {!isLoading || bootTimedOut ? children : null}
    </React.Fragment>
  );
}
