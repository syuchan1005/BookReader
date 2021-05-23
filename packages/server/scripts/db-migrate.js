/* eslint-disable no-console */
const { exec } = require('child_process');
const { readdir, rm } = require('fs').promises;

const sequelizeResource = require('../.sequelizerc');

const env = process.argv[2] || 'development';
const steps = (process.argv[3] || 'compile,migrate,clean').split(',');
console.log(`Migration for env: ${env}`);

(async () => {
  if (steps.includes('compile')) {
    console.log('Compiling migration scripts.');
    const tsFiles = (await readdir(sequelizeResource['ts-migrations-path']))
      .filter((s) => s.endsWith('.ts'));

    await tsFiles.reduce((p, filename) => p.then(() => new Promise((resolve, reject) => {
      console.log(`  - ${filename}`);
      const tsc = exec(
        `esbuild "${sequelizeResource['ts-migrations-path']}/${filename}" --outdir="${sequelizeResource['migrations-path']}" --platform=node`,
        (err) => { if (err) reject(err); else resolve(); },
      );
      tsc.stdout.pipe(process.stdout);
      tsc.stderr.pipe(process.stderr);
    })), Promise.resolve());
  }

  if (steps.includes('migrate')) {
    await new Promise((resolve, reject) => {
      const npm = exec(
        `npm run sequelize-cli -- db:migrate --env ${env} --debug`,
        (err) => { if (err) reject(err); else resolve(); },
      );
      npm.stdout.pipe(process.stdout);
      npm.stderr.pipe(process.stderr);
    });
  }

  if (steps.includes('clean')) {
    await rm(sequelizeResource['migrations-path'], { recursive: true });
  }
})();
