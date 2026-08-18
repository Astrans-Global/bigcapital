import { Button, Classes, Position, Tooltip } from '@blueprintjs/core';
import styled from 'styled-components';
import { useIsDarkMode } from '@/hooks/useDarkMode';

export function toggleColorTheme() {
  const nextIsDark = !(
    document.documentElement.classList.contains('bp4-dark') ||
    document.body.classList.contains('bp4-dark')
  );
  document.documentElement.classList.toggle('bp4-dark', nextIsDark);
  document.body.classList.toggle('bp4-dark', nextIsDark);
  try {
    localStorage.setItem('theme', nextIsDark ? 'dark' : 'light');
  } catch (e) {
    // ignore storage errors (private browsing, etc.)
  }
}

/**
 * Dark/light mode toggle. `placement="topbar"` sits in the dashboard header
 * (between Quick New and the bell). `placement="floating"` is the login-page
 * bottom-right button -- authenticated pages no longer use floating, it was
 * covering report totals.
 */
export function ColorThemeToggle({ placement = 'floating' }) {
  const isDarkMode = useIsDarkMode();
  const label = isDarkMode ? 'Light mode' : 'Dark mode';

  if (placement === 'topbar') {
    return (
      <Tooltip content={label} position={Position.BOTTOM}>
        <Button
          className={Classes.MINIMAL}
          text={label}
          onClick={toggleColorTheme}
        />
      </Tooltip>
    );
  }

  return (
    <ColorThemeToggleButton type="button" onClick={toggleColorTheme}>
      {label}
    </ColorThemeToggleButton>
  );
}

const ColorThemeToggleButton = styled.button`
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 40;
  border: 1px solid rgba(0, 0, 0, 0.15);
  background: #fff;
  color: #1c2127;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 13px;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);

  .bp4-dark & {
    background: #252a31;
    color: rgba(255, 255, 255, 0.85);
    border-color: rgba(255, 255, 255, 0.12);
  }
`;
