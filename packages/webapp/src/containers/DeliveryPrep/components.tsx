// @ts-nocheck
import React from 'react';
import styled from 'styled-components';
import { Button, Menu, MenuItem, Popover, Position } from '@blueprintjs/core';

/**
 * A tick-box dropdown filter -- click to open, tick any number of options,
 * the popover stays open across ticks (`shouldDismissPopover={false}`) so
 * you can select several before closing it. Used for the Delivery Prep
 * screen's Route City / Status filters, see docs/ops/PHASE1.md
 * ("Delivery Prep").
 */
export function CheckboxMultiSelectFilter({
  options,
  selectedValues,
  onChange,
  allLabel,
  emptyLabel,
}) {
  const isSelected = (value) =>
    selectedValues.some((v) => String(v) === String(value));

  const toggle = (value) => {
    if (isSelected(value)) {
      onChange(selectedValues.filter((v) => String(v) !== String(value)));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  const selectedLabels = options
    .filter((option) => isSelected(option.value))
    .map((option) => option.label);

  const buttonText = selectedLabels.length ? selectedLabels.join(', ') : allLabel;

  return (
    <Popover
      minimal
      position={Position.BOTTOM_LEFT}
      content={
        <Menu>
          {options.length === 0 ? (
            <MenuItem disabled text={emptyLabel || 'No options'} />
          ) : (
            options.map((option) => (
              <MenuItem
                key={option.value}
                shouldDismissPopover={false}
                icon={isSelected(option.value) ? 'tick' : 'blank'}
                text={option.label}
                onClick={() => toggle(option.value)}
              />
            ))
          )}
        </Menu>
      }
    >
      <MultiSelectFilterButton
        minimal
        small
        rightIcon={'caret-down'}
        text={buttonText}
      />
    </Popover>
  );
}

const MultiSelectFilterButton = styled(Button)`
  max-width: 220px;

  .bp4-button-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;
