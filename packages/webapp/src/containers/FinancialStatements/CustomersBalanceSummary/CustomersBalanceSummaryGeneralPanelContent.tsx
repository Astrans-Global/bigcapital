import { Position, Checkbox } from '@blueprintjs/core';
import intl from 'react-intl-universal';
import { useFormikContext } from 'formik';
import {
  Row,
  Col,
  FieldHint,
  CustomersMultiSelect,
  FFormGroup,
  FDateInput,
  FCheckbox,
} from '@/components';
import { momentFormatter } from '@/utils';
import { filterCustomersOptions } from '../constants';
import { useCustomersBalanceSummaryGeneralContext } from './CustomersBalanceSummaryGeneralProvider';
import { FinancialStatementsFilter } from '../FinancialStatementsFilter';

/**
 * Customers balance header - General panel - Content
 */
export function CustomersBalanceSummaryGeneralPanelContent() {
  const { customers, areas } = useCustomersBalanceSummaryGeneralContext();
  const { values, setFieldValue } = useFormikContext();
  const selectedAreas = values.areaIds || [];

  return (
    <div>
      <Row>
        <Col xs={5}>
          <FFormGroup
            name={'asDate'}
            label={intl.get('as_date')}
            labelInfo={<FieldHint />}
            fastField
          >
            <FDateInput
              name={'asDate'}
              {...momentFormatter('YYYY/MM/DD')}
              popoverProps={{ position: Position.BOTTOM, minimal: true }}
              fill={true}
              fastField
            />
          </FFormGroup>
        </Col>
      </Row>

      <Row>
        <Col xs={5}>
          <FFormGroup
            name={'percentage_column'}
            labelInfo={<FieldHint />}
            fastField
          >
            <FCheckbox
              name={'percentage_column'}
              inline={true}
              label={intl.get('percentage_of_column')}
              fastField
            />
          </FFormGroup>
        </Col>
      </Row>

      <Row>
        <Col xs={5}>
          <FinancialStatementsFilter
            items={filterCustomersOptions}
            label={intl.get('customers.label_filter_customers')}
            initialSelectedItem={'with-transactions'}
          />
        </Col>
      </Row>

      <Row>
        <Col xs={5}>
          <FFormGroup
            name={'areaIds'}
            label={intl.get('area')}
          >
            <div>
              {(areas || []).map((area) => (
                <Checkbox
                  key={area.id}
                  checked={selectedAreas.map(Number).includes(Number(area.id))}
                  label={area.name}
                  onChange={() => {
                    const id = Number(area.id);
                    const next = selectedAreas.map(Number).includes(id)
                      ? selectedAreas.filter((item) => Number(item) !== id)
                      : [...selectedAreas, id];
                    setFieldValue('areaIds', next);
                  }}
                />
              ))}
            </div>
          </FFormGroup>
        </Col>
      </Row>

      <Row>
        <Col xs={5}>
          <FFormGroup
            name={'customersIds'}
            label={intl.get('specific_customers')}
          >
            <CustomersMultiSelect name={'customersIds'} items={customers} />
          </FFormGroup>
        </Col>
      </Row>
    </div>
  );
}
