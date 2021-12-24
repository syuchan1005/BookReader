import React from 'react';
import { ComponentMeta } from '@storybook/react';

import IntRangeInputField from '../IntRangeInputField';

export default {
  title: 'Components/IntRangeInputField',
  argTypes: {
    maxPage: {
      control: { type: 'number', required: true },
    },
    // initValue
    onChange: { action: 'onChange' },
    fullWidth: {
      control: { type: 'boolean' },
    },
  },
} as ComponentMeta<typeof IntRangeInputField>;

const Template = (args) => (<IntRangeInputField {...args} />);

export const Default = Template.bind({});
Default.args = {
  maxPage: 100,
};
