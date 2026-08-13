// @ts-nocheck
import React from 'react';
import classNames from 'classnames';
import { AstransLogo } from '@/components/Icons/AstransLogo';

import '@/style/components/BigcapitalLoading.scss';
import { useIsDarkMode } from '@/hooks/useDarkMode';

/**
 * Astrans logo loading.
 */
export default function BigcapitalLoading({ className }) {
  const isDarkmode = useIsDarkMode();

  return (
    <div className={classNames('bigcapital-loading', className)}>
      <div class="center">
        <AstransLogo
          variant={isDarkmode ? 'white' : 'black'}
          height={48}
          className="bigcapital-logo"
        />
      </div>
    </div>
  );
}
