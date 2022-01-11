import React, { useEffect } from 'react';
import { ComponentMeta } from '@storybook/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { MockedProvider } from '@apollo/client/testing';
import { Icon, IconButton } from '@mui/material';
import { Auth0ContextInterface } from '@auth0/auth0-react/src/auth0-context';
import { Auth0Context } from '@auth0/auth0-react';

import TitleAndBackHeader from '../TitleAndBackHeader';
import { RecoilState, useSetRecoilState } from 'recoil';
import { auth0State } from '@client/store/atoms';
import { MockedAuth0Provider, RecoilValue } from '@client/components/stories/Util';

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
    (Story) => (
      <MockedAuth0Provider auth0={{ isAuthenticated: false, isLoading: false }}>
        <Story />
      </MockedAuth0Provider>
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

export const AuthEnabled = Template.bind({});
AuthEnabled.args = {
  backRoute: '/',
  title: 'Title',
  subTitle: 'Subtitle',
};
AuthEnabled.decorators = [
  (Story) => (
    <RecoilValue atom={auth0State} value={{ domain: 'domain', clientId: 'clientId' }}>
      <Story />
    </RecoilValue>
  ),
];

export const WithChildren = Template.bind({});
WithChildren.args = {
  backRoute: '/',
  title: 'Title',
  subTitle: 'Subtitle',
  children: (<IconButton sx={{ color: 'white' }}><Icon>sort</Icon></IconButton>),
};
WithChildren.decorators = [
  (Story) => (
    <RecoilValue atom={auth0State} value={{ domain: 'domain', clientId: 'clientId' }}>
      <Story />
    </RecoilValue>
  ),
];
