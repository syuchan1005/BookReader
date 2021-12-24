import React from 'react';
import { ComponentMeta } from '@storybook/react';

import DropZone from '../DropZone';

export default {
  title: 'Components/DropZone',
  argTypes: {
    onChange: { action: 'onChange' },
  },
} as ComponentMeta<typeof DropZone>;

const Template = (args) => (<DropZone {...args} />);

export const Default = Template.bind({});
