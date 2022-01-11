import React from 'react';
import { ComponentMeta } from '@storybook/react';
import { MockedProvider } from '@apollo/client/testing';
import { MockedAuth0Provider, RecoilValue } from '@client/components/stories/Util';

import { auth0State } from '@client/store/atoms';
import { UserMenuButton } from '../UserMenuButton';

export default {
  title: 'Components/UserMenuButton',
  argTypes: {
    onLogin: { action: 'onLogin' },
    onLogout: { action: 'onLogout' },
  },
  decorators: [
    (Story) => (
      <MockedProvider>
        <Story />
      </MockedProvider>
    ),
    (Story) => (
      <RecoilValue atom={auth0State} value={{ domain: 'domain', clientId: 'clientId' }}>
        <Story />
      </RecoilValue>
    ),
    (Story) => (
      <div
        style={{
          width: 'fit-content',
          padding: 8,
          background: 'grey',
        }}
      >
        <Story />
      </div>
    ),
  ],
} as ComponentMeta<typeof UserMenuButton>;

const Template = (args) => (
  <MockedAuth0Provider {...args}>
    <UserMenuButton {...args} />
  </MockedAuth0Provider>
);

export const Loading = Template.bind({});
Loading.args = {
  auth0: {
    isLoading: true,
  },
};

export const NotLoggedIn = Template.bind({});
NotLoggedIn.args = {
  auth0: {
    isAuthenticated: false,
    isLoading: false,
  },
};

export const LoggedIn = Template.bind({});
LoggedIn.args = {
  auth0: {
    isAuthenticated: true,
  },
};
