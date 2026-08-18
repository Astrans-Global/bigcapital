// @ts-nocheck
import { css } from '@emotion/css';
import { x } from '@xstyled/emotion';
import {
  FFormGroup,
  FInputGroup,
  TotalLinePrimitive,
} from '@/components';
import { useIsDarkMode } from '@/hooks/useDarkMode';

const inputGroupCss = css`
  & .bp4-input {
    max-width: 110px;
    padding-left: 8px;
  }
`;
const formGroupCss = css`
  margin-bottom: 0;
`;

interface DiscountTotalLineProps {
  currencyCode: string;
  discountAmount: number;
}

export function DiscountTotalLine({
  discountAmount,
}: DiscountTotalLineProps) {
  const isDarkMode = useIsDarkMode();

  return (
    <TotalLinePrimitive>
      <TotalLinePrimitive.Title
        borderBottom={'1px solid var(--x-border-bottom-color)'}
        style={{
          '--x-border-bottom-color': isDarkMode
            ? 'rgba(255, 255, 255, 0.1)'
            : 'rgb(210, 221, 226)',
        }}
      >
        <x.div
          display={'flex'}
          alignItems={'center'}
          justifyContent={'space-between'}
        >
          <x.span pr={2}>Discount %</x.span>
          <FFormGroup
            name={'discount'}
            className={formGroupCss}
            inline
            fastField
          >
            <FInputGroup
              name={'discount'}
              rightElement={
                <x.span
                  fontSize={12}
                  px={8}
                  display={'flex'}
                  alignItems={'center'}
                >
                  %
                </x.span>
              }
              fastField
              className={inputGroupCss}
            />
          </FFormGroup>
        </x.div>
      </TotalLinePrimitive.Title>

      <TotalLinePrimitive.Amount
        textAlign={'right'}
        borderBottom={'1px solid var(--x-border-bottom-color)'}
        style={{
          '--x-border-bottom-color': isDarkMode
            ? 'rgba(255, 255, 255, 0.1)'
            : 'rgb(210, 221, 226)',
        }}
      >
        {discountAmount}
      </TotalLinePrimitive.Amount>
    </TotalLinePrimitive>
  );
}
