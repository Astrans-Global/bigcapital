import { Box } from '@/components';
import styled from 'styled-components';

export const EntriesActionsBar = styled(Box)`
  padding-bottom: 12px;
  display: flex;
  align-items: center;

  .bp4-form-group {
    margin-bottom: 0;
    align-items: center;

    label.bp4-label {
      opacity: 0.6;
      margin-right: 8px;
      margin-bottom: 0;
      line-height: 30px;
    }

    .bp4-form-content {
      display: flex;
      align-items: center;
      min-height: 30px;
      line-height: 30px;
    }
  }
`;
