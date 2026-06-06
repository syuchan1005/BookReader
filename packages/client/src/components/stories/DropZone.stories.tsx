import type { Meta } from '@storybook/react';

import DropZone from '../DropZone';

export default {
  title: 'Components/DropZone',
  argTypes: {
    onChange: { action: 'onChange' },
  },
} as Meta<typeof DropZone>;

const Template = (args) => <DropZone {...args} />;

export const Default = Template.bind({});
