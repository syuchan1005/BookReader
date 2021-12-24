import React from 'react';
import { ComponentMeta } from '@storybook/react';

import { EmptyScreen } from '../EmptyScreen';

export default {
  title: 'Components/EmptyScreen',
  argTypes: {},
} as ComponentMeta<typeof EmptyScreen>;

const Template = (args) => (<EmptyScreen {...args} />);

export const Default = Template.bind({});
