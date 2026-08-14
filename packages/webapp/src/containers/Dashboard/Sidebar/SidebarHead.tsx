// @ts-nocheck
import {
  Button,
  Popover,
  Menu,
  MenuItem,
  MenuDivider,
  Position,
} from '@blueprintjs/core';
import styled, { x } from '@xstyled/emotion';

import { Icon, FormattedMessage as T } from '@/components';
import { AstransLogo } from '@/components/Icons/AstransLogo';
import { useIsDarkMode } from '@/hooks/useDarkMode';

import {
  useAuthenticatedAccount,
  useCurrentOrganizationMetadata,
} from '@/hooks/query';
import { useWorkspaces } from '@/ee/workspaces/hooks/query/workspaces';
import { useAuthOrganizationId, useAuthActions } from '@/hooks/state';
import { useSwitchOrganization } from '@/ee/workspaces/hooks/useSwitchOrganization';
import { DRAWERS } from '@/constants/drawers';
import { withDrawerActions } from '@/containers/Drawer/withDrawerActions';
import { compose, firstLettersArgs } from '@/utils';

// Popover modifiers.
const POPOVER_MODIFIERS = {
  offset: { offset: '28, 8' },
};

/**
 * Our own Astrans brand mark (uploaded as the org/workspace logo) needs to
 * flip between the black/white PNG variant with the theme. Any other
 * genuinely custom-uploaded logo is returned untouched.
 */
const resolveThemedLogoUri = (uri, isDarkMode) => {
  if (typeof uri !== 'string') return uri;
  if (uri.includes('/brand/logo-black.png')) {
    return isDarkMode ? uri.replace('logo-black.png', 'logo-white.png') : uri;
  }
  if (uri.includes('/brand/logo-white.png')) {
    return isDarkMode ? uri : uri.replace('logo-white.png', 'logo-black.png');
  }
  return uri;
};

const DashboardOrganizationMenu = styled(Menu)`
  padding: 10px;
  min-width: 280px;
  max-height: 500px;
  overflow-y: auto;

  .org-workspace-item {
    padding: 8px 10px;

    &.is-active {
      background: rgba(0, 0, 0, 0.06);
    }

    &:hover:not(.is-active):not(.bp4-disabled) {
      background: rgba(0, 0, 0, 0.04);
    }

    &.bp4-disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  .bp4-menu-divider {
    margin: 8px 0;
    border-top-color: rgba(0, 0, 0, 0.1);
  }

  .bp4-menu-item {
    color: #1c2127;
    border-radius: 4px;
    line-height: 20px;

    &:hover:not(.bp4-disabled) {
      background: rgba(0, 0, 0, 0.05);
      color: #1c2127;
    }

    .bp4-icon {
      color: rgba(0, 0, 0, 0.6);
    }
  }

  .bp4-dark & {
    .org-workspace-item {
      &.is-active {
        background: rgba(255, 255, 255, 0.08);
      }

      &:hover:not(.is-active):not(.bp4-disabled) {
        background: rgba(255, 255, 255, 0.05);
      }
    }

    .bp4-menu-divider {
      border-top-color: rgba(255, 255, 255, 0.1);
    }

    .bp4-menu-item {
      color: rgba(255, 255, 255, 0.9);

      &:hover:not(.bp4-disabled) {
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
      }

      .bp4-icon {
        color: rgba(255, 255, 255, 0.6);
      }
    }
  }
`;

/**
 * Sidebar head.
 */
function SidebarHeadJSX({
  // #withDrawerActions
  openDrawer,
}) {
  const metadata = useCurrentOrganizationMetadata();
  const isDarkMode = useIsDarkMode();
  const { data: user } = useAuthenticatedAccount();
  const { data: workspaces } = useWorkspaces();
  const currentOrganizationId = useAuthOrganizationId();
  const switchOrganization = useSwitchOrganization();
  const { setLogout } = useAuthActions();

  const handleSwitchWorkspace = (organizationId) => {
    if (organizationId === currentOrganizationId) {
      return;
    }
    switchOrganization(organizationId);
  };

  const handleLogout = () => {
    setLogout();
  };

  return (
    <div className="sidebar__head">
      <div className="sidebar__head-organization">
        <Popover
          modifiers={POPOVER_MODIFIERS}
          boundary={'window'}
          content={
            <DashboardOrganizationMenu>
              <x.div
                display="flex"
                alignItems="center"
                gap={3}
                py={'8px'}
                px={'10px'}
                backgroundColor={
                  isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)'
                }
                borderRadius={4}
              >
                {metadata?.logoUri ? (
                  <x.img
                    src={resolveThemedLogoUri(metadata?.logoUri, isDarkMode)}
                    alt={metadata?.name}
                    h={'28px'}
                    w={'28px'}
                    borderRadius={6}
                    objectFit="contain"
                    flexShrink={0}
                  />
                ) : (
                  <x.div
                    h={'28px'}
                    w={'28px'}
                    lineHeight="28px"
                    borderRadius={6}
                    backgroundColor="#CB22E5"
                    textAlign="center"
                    fontWeight={400}
                    fontSize={11}
                    color="#fff"
                    flexShrink={0}
                  >
                    {firstLettersArgs(...(metadata?.name || '').split(' '))}
                  </x.div>
                )}
                <x.div fontWeight={600} color={isDarkMode ? '#fff' : '#1c2127'}>
                  {metadata?.name}
                </x.div>
              </x.div>
              <MenuDivider />

              <MenuItem
                icon={<Icon icon={'list'} size={16} />}
                text={<T id={'workspaces.view_all_workspaces'} />}
                onClick={() => openDrawer(DRAWERS.ORGANIZATIONS_LIST)}
              />
              <MenuDivider />

              <x.div maxHeight="240px" overflowY="auto">
                {workspaces?.map((workspace) => {
                  const name =
                    workspace.metadata?.name || workspace.organizationId;
                  const initials = firstLettersArgs(...(name || '').split(' '));
                  const isActive =
                    workspace.organizationId === currentOrganizationId;
                  const isDisabled =
                    !workspace.isReady || workspace.isBuildRunning;

                  return (
                    <MenuItem
                      key={workspace.organizationId}
                      className={`org-workspace-item ${isActive ? 'is-active' : ''}`}
                      disabled={isDisabled}
                      onClick={() =>
                        handleSwitchWorkspace(workspace.organizationId)
                      }
                      text={
                        <x.div
                          display="flex"
                          alignItems="center"
                          gap={3}
                          w="100%"
                        >
                          {workspace.metadata?.logoUri ? (
                            <x.img
                              src={resolveThemedLogoUri(
                                workspace.metadata.logoUri,
                                isDarkMode,
                              )}
                              alt={name}
                              w={'28px'}
                              h={'28px'}
                              borderRadius={6}
                              objectFit="contain"
                              flexShrink={0}
                            />
                          ) : (
                            <x.div
                              w={'28px'}
                              h={'28px'}
                              borderRadius={'10px'}
                              backgroundColor="#5c7c99"
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                              fontSize={12}
                              color="#fff"
                              flexShrink={0}
                            >
                              {initials}
                            </x.div>
                          )}
                          <x.span
                            flex={1}
                            overflow="hidden"
                            textOverflow="ellipsis"
                            whiteSpace="nowrap"
                            fontWeight={isActive ? 500 : undefined}
                          >
                            {name}
                          </x.span>
                          {isActive && (
                            <Icon
                              icon={'tick'}
                              iconSize={14}
                              color="#48aff0"
                              style={{ flexShrink: 0 }}
                            />
                          )}
                        </x.div>
                      }
                    />
                  );
                })}
              </x.div>

              <MenuDivider />
              <MenuItem
                icon={<Icon icon={'plus'} size={16} />}
                text={<T id={'workspaces.create_workspace'} />}
                onClick={() => openDrawer(DRAWERS.CREATE_WORKSPACE)}
              />
              <MenuDivider />
              <MenuItem
                icon={<Icon icon={'log-out'} size={16} />}
                text={<T id={'logout'} />}
                onClick={handleLogout}
              />
            </DashboardOrganizationMenu>
          }
          position={Position.BOTTOM}
          minimal={true}
        >
          <Button
            className="title"
            rightIcon={<Icon icon={'caret-down-16'} size={16} />}
          >
            {metadata?.name}
          </Button>
        </Popover>
        <span class="subtitle">{user.full_name}</span>
      </div>

      <div className="sidebar__head-logo">
        <AstransLogo
          variant="white"
          height={28}
          style={{ maxWidth: 28, maxHeight: 28 }}
        />
      </div>
    </div>
  );
}

export const SidebarHead = compose(withDrawerActions)(SidebarHeadJSX);
