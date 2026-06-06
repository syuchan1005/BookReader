import type { Meta } from '@storybook/react';

import { HeaderWithBookListSkeleton } from '../HeaderWithBookListSkeleton';

export default {
  title: 'Components/HeaderWithBookListSkeleton',
} as Meta<typeof HeaderWithBookListSkeleton>;

const Template = () => <HeaderWithBookListSkeleton />;

export const Default = Template.bind({});
