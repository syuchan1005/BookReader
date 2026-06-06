import type { Meta } from '@storybook/react';

import { EmptyScreen } from '../EmptyScreen';

export default {
  title: 'Components/EmptyScreen',
  argTypes: {},
} as Meta<typeof EmptyScreen>;

const Template = (args) => <EmptyScreen {...args} />;

export const Default = Template.bind({});
