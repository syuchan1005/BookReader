import React from 'react';
import { ListItem } from '@mui/material';
import * as colors from '@mui/material/colors';
import { ComponentMeta } from '@storybook/react';

import ColorTile from '../ColorTile';

export default {
  title: 'Components/ColorTile',
  decorators: [(Story) => (<ListItem><Story /></ListItem>)],
  argTypes: {
    color: {
      type: { name: 'string', required: true },
      options: Object.keys(colors).filter((color) => color !== 'common'),
      control: { type: 'select' },
    },
    num: {
      type: { name: 'string', required: true },
      options: Object.keys(colors.red).map((color) => color.toString()),
      control: { type: 'select' },
    },
    marginLeft: {
      type: { name: 'boolean', required: false },
    },
  },
} as ComponentMeta<typeof ColorTile>;

const Template = (args) => (<ColorTile {...args} />);

export const Default = Template.bind({});
Default.args = {
  color: 'red',
  num: '500',
};
