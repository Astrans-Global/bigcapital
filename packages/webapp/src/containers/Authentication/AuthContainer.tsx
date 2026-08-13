// @ts-nocheck
import styled from 'styled-components';
import { FormattedMessage as T } from '@/components';
import { AstransLogo } from '@/components/Icons/AstransLogo';

interface AuthContainerProps {
  children: React.ReactNode;
}

export function AuthContainer({ children }: AuthContainerProps) {
  return (
    <AuthPage>
      <AuthInsider>
        <AuthLogo>
          <AstransLogo variant="black" height={44} />
        </AuthLogo>

        {children}
      </AuthInsider>
    </AuthPage>
  );
}

const AuthPage = styled.div``;
const AuthInsider = styled.div`
  width: 384px;
  margin: 0 auto;
  margin-bottom: 40px;
  padding-top: 80px;
`;

const AuthLogo = styled.div`
  text-align: center;
  margin-bottom: 40px;
`;
