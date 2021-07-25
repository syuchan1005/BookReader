const commonConfig = require('./.eslintrc.js');
const clientConfig = require('./packages/client/.eslintrc.js');
const serverConfig = require('./packages/server/.eslintrc.js');

delete clientConfig.extends;
delete serverConfig.extends;

module.exports = require('deepmerge').all([commonConfig, clientConfig, serverConfig]);
