import { ComponentMeta } from '@storybook/react';
import React from 'react';

import { HeaderWithBookListSkeleton } from '../HeaderWithBookListSkeleton';

export default ({
  title: 'Components/HeaderWithBookListSkeleton',
} as ComponentMeta<typeof HeaderWithBookListSkeleton>);

const Template = () => <HeaderWithBookListSkeleton />;

export const Default = Template.bind({});
