import { DocumentNode } from 'graphql';
import { useMemo } from 'react';
import { MutationHookOptions, useMutation } from '@apollo/client';
import {
  Result,
  Scalars,
} from './generated/GQLQueries';

const DocumentNodeHelper = {
  makeNonNullIDVariable: (argName: string) => ({
    kind: 'VariableDefinition',
    variable: {
      kind: 'Variable',
      name: {
        kind: 'Name',
        value: argName,
      },
    },
    type: {
      kind: 'NonNullType',
      type: {
        kind: 'NamedType',
        name: {
          kind: 'Name',
          value: 'ID',
        },
      },
    },
  }),
  makeNonNullStringVariable: (argName: string) => ({
    kind: 'VariableDefinition',
    variable: {
      kind: 'Variable',
      name: {
        kind: 'Name',
        value: argName,
      },
    },
    type: {
      kind: 'NonNullType',
      type: {
        kind: 'NamedType',
        name: {
          kind: 'Name',
          value: 'String',
        },
      },
    },
  }),
  makeSelectionSet: (addMutationName: string, argNames: string[]) => ({
    kind: 'SelectionSet',
    selections: [{
      kind: 'Field',
      alias: {
        kind: 'Name',
        value: 'plugin',
      },
      name: {
        kind: 'Name',
        value: addMutationName,
      },
      arguments: argNames.map((argName) => ({
        kind: 'Argument',
        name: {
          kind: 'Name',
          value: argName,
        },
        value: {
          kind: 'Variable',
          name: {
            kind: 'Name',
            value: argName,
          },
        },
      })),
      selectionSet: {
        kind: 'SelectionSet',
        selections: [{
          kind: 'Field',
          name: {
            kind: 'Name',
            value: 'success',
          },
        }, {
          kind: 'Field',
          name: {
            kind: 'Name',
            value: 'code',
          },
        }],
      },
    }],
  }),
};

const makePluginAddDocument = (addMutationName: string, argNames: string[]): DocumentNode => ({
  kind: 'Document',
  definitions: [{
    kind: 'OperationDefinition',
    operation: 'mutation',
    variableDefinitions: argNames.map((argName) => {
      if (argName === 'id') {
        return DocumentNodeHelper.makeNonNullIDVariable(argName);
      }
      return DocumentNodeHelper.makeNonNullStringVariable(argName);
    }),
    selectionSet: DocumentNodeHelper.makeSelectionSet(addMutationName, argNames),
  }],
} as unknown as DocumentNode);

type PluginAddMutation = { plugin: Pick<Result, 'success' | 'code'> };

type PluginAddVariables<A extends string[]> = {
  [K in A[number]]: Scalars['String'];
};

// eslint-disable-next-line import/prefer-default-export
export const usePluginAddMutation = <A extends string[]>(
  addMutationName: string,
  argNames: A,
  options?: MutationHookOptions<PluginAddMutation, PluginAddVariables<A>>,
) => {
  const document = useMemo(
    () => makePluginAddDocument(addMutationName, argNames),
    [addMutationName, argNames],
  );
  return useMutation<PluginAddMutation, PluginAddVariables<A>>(document, options);
};
