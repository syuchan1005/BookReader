import { MockedProvider } from '@apollo/client/testing';
import { ListItem } from '@mui/material';
import { ComponentMeta } from '@storybook/react';

import { GenresDocument } from '@syuchan1005/book-reader-graphql';
import GenresSelect from '../GenresSelect';

export default ({
  title: 'Components/GenresSelect',
  argTypes: {
    value: {
      control: {
        type: 'array',
        required: true,
      },
    },
    showAdd: {
      type: { name: 'boolean' },
    },
    onChange: { action: 'onChange' },
  },
  args: {
    genres: [
      {
        name: 'Completed',
        invisible: false,
      },
      {
        name: 'Invisible',
        invisible: true,
      },
    ],
  },
  decorators: [
    (Story) => (
      <ListItem sx={{ width: '300px' }}>
        <Story />
      </ListItem>
    ),
  ],
} as ComponentMeta<typeof GenresSelect>);

const Template = (args) => (
  <MockedProvider
    addTypename={false}
    mocks={[
      {
        request: {
          query: GenresDocument,
        },
        result: {
          data: {
            genres: args.genres,
          },
        },
      },
    ]}
  >
    <GenresSelect {...args} />
  </MockedProvider>
);

export const NotSelected = Template.bind({});
NotSelected.args = {
  value: [],
  showAdd: true,
};

export const Selected = Template.bind({});
Selected.args = {
  value: [...new Array(27).keys()],
  showAdd: true,
};
