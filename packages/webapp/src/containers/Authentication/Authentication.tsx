// @ts-nocheck
import { Route, Switch, useLocation } from 'react-router-dom';
import BodyClassName from 'react-body-classname';
import styled from 'styled-components';
import { Suspense } from 'react';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import { Spinner } from '@blueprintjs/core';

import authenticationRoutes from '@/routes/authentication';
import { Box } from '@/components';
import { AuthMetaBootProvider } from './AuthMetaBoot';

import '@/style/pages/Authentication/Auth.scss';
import { ColorThemeToggle } from '@/components/ColorThemeToggle';

export function Authentication() {
  return (
    <BodyClassName className={'authentication'}>
      <AuthPage>
        <AuthTitle>Astrans Global DMS</AuthTitle>

        <AuthInsider>
          <AuthMetaBootProvider>
            <Suspense
              fallback={
                <Box style={{ marginTop: '5rem' }}>
                  <Spinner size={30} />
                </Box>
              }
            >
              <AuthenticationRoutes />
            </Suspense>
          </AuthMetaBootProvider>
        </AuthInsider>

        <ColorThemeToggle />
      </AuthPage>
    </BodyClassName>
  );
}

function AuthenticationRoutes() {
  const location = useLocation();
  const locationKey = location.pathname;

  return (
    <TransitionGroup>
      <CSSTransition
        timeout={500}
        key={locationKey}
        classNames="authTransition"
      >
        <Switch>
          {authenticationRoutes.map((route, index) => (
            <Route
              key={index}
              path={route.path}
              exact={route.exact}
              component={route.component}
            />
          ))}
        </Switch>
      </CSSTransition>
    </TransitionGroup>
  );
}

const AuthPage = styled.div``;
const AuthInsider = styled.div`
  width: 384px;
  margin: 0 auto;
  margin-bottom: 40px;
  padding-top: 32px;
`;

const AuthTitle = styled.h1`
  margin: 0;
  padding: 36px 16px 0;
  font-family: 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 34px;
  font-weight: 700;
  letter-spacing: 0.03em;
  line-height: 1.2;
  text-align: center;
  white-space: nowrap;
  color: #1c2127;

  .bp4-dark & {
    color: rgba(255, 255, 255, 0.92);
  }

  @media (max-height: 700px) {
    padding-top: 14px;
    font-size: 26px;
  }
  @media (max-width: 520px) {
    font-size: 24px;
    white-space: normal;
    max-width: 92vw;
    margin: 0 auto;
  }
`;
