import React from 'react';
import { ListItem } from '@mui/material';
import { ComponentMeta } from '@storybook/react';

import FileField from '../FileField';

export default {
  title: 'Components/FileField',
  argTypes: {
    file: {
      control: { type: 'object' },
      description: '{ name: string }',
    },
    onChange: { action: 'onChange' },
    style: {},
  },
} as ComponentMeta<typeof FileField>;

const Template = (args) => (<FileField {...args} />);

export const NotSelected = Template.bind({});

export const Selected = Template.bind({});
Selected.args = {
  file: { name: 'Test.rar' },
};

export const SelectedLongName = Template.bind({});
SelectedLongName.decorators = [
  (Story) => (
    <ListItem style={{ width: '300px' }}>
      <Story />
    </ListItem>
  ),
];
SelectedLongName.args = {
  file: { name: 'LongLongLongLongLongLongLongLongLongLongLongLongLongLongLongName.rar' },
};
