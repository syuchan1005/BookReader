/* eslint-disable no-console */
const { exec } = require('child_process');
const { readdir, rmdir } = require('fs').promises;

const sequelizeResource = require('../.sequelizerc');

const env = process.argv[2] || 'development';

console.log(`Migration for env: ${env}`);

(async () => {
  console.log('Compiling migration scripts.');
  const tsFiles = (await readdir(sequelizeResource['ts-migrations-path']))
    .filter((s) => s.endsWith('.ts'));

  await tsFiles.reduce((p, filename) => p.then(() => new Promise((resolve, reject) => {
    console.log(`  - ${filename}`);
    const tsc = exec(
      `tsc --target es2017 --module CommonJS --skipLibCheck --outDir "${sequelizeResource['migrations-path']}" "${sequelizeResource['ts-migrations-path']}/${filename}"`,
      (err) => { if (err) reject(err); else resolve(); },
    );
    tsc.stdout.pipe(process.stdout);
    tsc.stderr.pipe(process.stderr);
  })), Promise.resolve());

  await new Promise((resolve, reject) => {
    const npm = exec(
      `npm run script:sequelize -- db:migrate --env ${env}`,
      (err) => { if (err) reject(err); else resolve(); },
    );
    npm.stdout.pipe(process.stdout);
    npm.stderr.pipe(process.stderr);
  });

  await rmdir(sequelizeResource['migrations-path'], { recursive: true });
})();
