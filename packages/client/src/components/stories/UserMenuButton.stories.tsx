import React from 'react';
import { ComponentMeta } from '@storybook/react';
import { Auth0Context } from '@auth0/auth0-react';
import { MockedProvider } from '@apollo/client/testing';

import { UserMenuButton } from '../UserMenuButton';

export default {
  title: 'Components/UserMenuButton',
  argTypes: {
    onLogin: { action: 'onLogin' },
    onLogout: { action: 'onLogout' },
  },
} as ComponentMeta<typeof UserMenuButton>;

const Template = (args) => (
  <MockedProvider>
    <Auth0Context.Provider
      // @ts-ignore
      value={{
        // eslint-disable-next-line react/destructuring-assignment
        loginWithRedirect: args.onLogin(),
        // eslint-disable-next-line react/destructuring-assignment
        logout: args.onLogout(),
        isAuthenticated: false,
        user: {
          name: 'TestName',
          picture: 'https://placehold.jp/36/ababab/ffffff/120x120.png?text=Test',
        },
        getAccessTokenSilently: (): Promise<string> => { throw new Error('Mocked'); },
        isLoading: true,
      }}
    >
      <UserMenuButton {...args} />
    </Auth0Context.Provider>
  </MockedProvider>
);

export const Default = Template.bind({});
