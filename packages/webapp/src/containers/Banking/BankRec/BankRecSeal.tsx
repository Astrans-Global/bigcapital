// @ts-nocheck
import React from 'react';
import styled from 'styled-components';

export function BankRecSeal({
  label,
  visible,
}: {
  label: string;
  visible?: boolean;
}) {
  if (!visible) {
    return null;
  }
  return <Stamp>{label}</Stamp>;
}

const Stamp = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 118px;
  padding: 4px 10px;
  border: 3px solid #c23030;
  color: #c23030;
  font-weight: 800;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  transform: rotate(-8deg);
  background: rgba(194, 48, 48, 0.06);
  pointer-events: none;
`;
