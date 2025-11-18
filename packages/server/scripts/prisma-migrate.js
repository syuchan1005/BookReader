const { exec } = require('child_process');

const execp = (cmd, opt) =>
  new Promise((resolve, reject) => {
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
const env =
  (process.argv[2] || process.env.NODE_ENV) === 'production'
    ? 'production'
    : 'development';

let PM = 'npx';
if (process.env.PM === 'bun') {
  PM = 'bun';
} else {
  PM = 'npx';
}

(async () => {
  console.log(`[MIGRATION] start env: ${env}`);

  await execp(`${PM} prisma -- generate`);

  await execp(`${PM} prisma -- migrate resolve --applied 20210807095937_init`, {
    env: { ...process.env, DB_FILE: `file:../${env}.sqlite` },
  }).catch(() => {
    /* ignored */
  });

  await execp(`${PM} prisma -- migrate deploy`, {
    env: { ...process.env, DB_FILE: `file:../${env}.sqlite` },
  });
})();
