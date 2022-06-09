import React from 'react';
import { ComponentMeta } from '@storybook/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { MockedProvider } from '@apollo/client/testing';
import { Icon, IconButton } from '@mui/material';

import TitleAndBackHeader from '../TitleAndBackHeader';

export default {
  title: 'Components/TitleAndBackHeader',
  argTypes: {
    backRoute: {
      type: { name: 'string', required: false },
    },
    title: {
      type: { name: 'string', required: false },
    },
    subTitle: {
      type: { name: 'string', required: false },
    },
  },
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/path']}>
        <Routes>
          <Route path="*" element={<Story />} />
        </Routes>
      </MemoryRouter>
    ),
    (Story) => (
      <MockedProvider>
        <Story />
      </MockedProvider>
    ),
  ],
} as ComponentMeta<typeof TitleAndBackHeader>;

const Template = (args) => (<TitleAndBackHeader {...args} />);

export const Default = Template.bind({});
Default.args = {
  backRoute: '/',
  title: 'Title',
  subTitle: 'Subtitle',
};

export const WithChildren = Template.bind({});
WithChildren.args = {
  backRoute: '/',
  title: 'Title',
  subTitle: 'Subtitle',
  children: (<IconButton sx={{ color: 'white' }}><Icon>sort</Icon></IconButton>),
};
WithChildren.decorators = [
  (Story) => (<Story />),
];
