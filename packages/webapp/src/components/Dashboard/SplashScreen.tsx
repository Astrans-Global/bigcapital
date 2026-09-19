// @ts-nocheck
import { useEffect, useState } from 'react';
import * as R from 'ramda';
import BigcapitalLoading from './BigcapitalLoading';
import { withDashboard } from '@/containers/Dashboard/withDashboard';

const SPLASH_TIMEOUT_MS = 8000;

function SplashScreenComponent({ splashScreenLoading }) {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!splashScreenLoading) {
      setTimedOut(false);
      return undefined;
    }
    const timer = setTimeout(() => setTimedOut(true), SPLASH_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [splashScreenLoading]);

  return splashScreenLoading && !timedOut ? <BigcapitalLoading /> : null;
}

export const SplashScreen = R.compose(
  withDashboard(({ splashScreenLoading }) => ({
    splashScreenLoading,
  })),
)(SplashScreenComponent);
