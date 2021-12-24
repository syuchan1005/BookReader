import React from 'react';
import { ComponentMeta } from '@storybook/react';

import LoadingFullscreen from '../LoadingFullscreen';

export default {
  title: 'Components/LoadingFullscreen',
  argTypes: {
    open: {
      control: { type: 'boolean' },
    },
    progresses: {
      control: { type: 'array' },
    },
    label: {
      control: { type: 'text' },
    },
  },
} as ComponentMeta<typeof LoadingFullscreen>;

const Template = (args) => (<LoadingFullscreen {...args} />);

export const Default = Template.bind({});
Default.args = {
  open: true,
  progresses: [100, 50, 25, 0],
  label: 'Label',
};
