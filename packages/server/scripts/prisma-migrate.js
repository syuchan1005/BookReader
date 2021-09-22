const { exec } = require('child_process');
const { FeatureFlag } = require('../src/FeatureFlag');

const execp = (cmd, opt) => new Promise((resolve, reject) => {
  try {
    const execProcess = exec(cmd, opt, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
    execProcess.stdout.pipe(process.stdout);
    execProcess.stderr.pipe(process.stderr);
  } catch (e) {
    reject(e);
  }
});

// Same as src/database/prisma/index.js
const env = (process.argv[2] || process.env.NODE_ENV) === 'production'
  ? 'production'
  : 'development';

(async () => {
  console.log(`[MIGRATION] start env: ${env}`);

  await execp('npm run prisma -- migrate resolve --applied 20210807095937_init', {
    env: { ...process.env, DB_FILE: `file:../${env}${FeatureFlag.prisma.dbFileSuffix}.sqlite` },
  }).catch(() => { /* ignored */ });

  await execp('npm run prisma -- migrate deploy', {
    env: { ...process.env, DB_FILE: `file:../${env}${FeatureFlag.prisma.dbFileSuffix}.sqlite` },
  });
})();
