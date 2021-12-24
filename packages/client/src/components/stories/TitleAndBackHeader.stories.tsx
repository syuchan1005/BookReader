import React from 'react';
import { ComponentMeta } from '@storybook/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import TitleAndBackHeader from '../TitleAndBackHeader';

export default {
  title: 'Components/TitleAndBackHeader',
  argTypes: {
    // backRoute
    // title
    // subTitle
    // children
  },
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="*">
            <Story />
          </Route>
        </Routes>
      </MemoryRouter>
    ),
  ],
} as ComponentMeta<typeof TitleAndBackHeader>;

const Template = (args) => (<TitleAndBackHeader {...args} />);

export const Default = Template.bind({});
