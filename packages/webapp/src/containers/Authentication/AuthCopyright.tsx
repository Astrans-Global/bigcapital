// @ts-nocheck
import React from 'react';
import styled from 'styled-components';
import { AstransLogo } from '@/components/Icons/AstransLogo';
import { useIsDarkMode } from '@/hooks/useDarkMode';

export function AuthCopyright() {
  const isDarkMode = useIsDarkMode();

  return (
    <AuthCopyrightRoot>
      <AstransLogo variant={isDarkMode ? 'white' : 'black'} height={40} />
      <AuthCopyrightWordmark>Astrans</AuthCopyrightWordmark>
    </AuthCopyrightRoot>
  );
}

const AuthCopyrightRoot = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 12px;
`;

const AuthCopyrightWordmark = styled.span`
  font-family: 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 26px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: #3d4450;

  .bp4-dark & {
    color: rgba(255, 255, 255, 0.85);
  }
`;
