const { printSchemaWithDirectives } = require('@graphql-tools/utils');
const { stripIgnoredCharacters } = require('graphql');

// https://github.com/dotansimha/graphql-code-generator/issues/3899
const print = (schema) => `export const schemaString = \`${schema}\`;`;

module.exports = {
  plugin: (schema) => print(
    stripIgnoredCharacters(printSchemaWithDirectives(schema)),
  ),
};
