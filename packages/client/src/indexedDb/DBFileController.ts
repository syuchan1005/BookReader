import { DB_NAME } from '@client/indexedDb/Database';

export const exportDbJson = async () => {
  const { Dexie } = await import('dexie');
  await import('dexie-export-import');
  const db = new Dexie(DB_NAME);
  const {
    verno,
    tables,
  } = await db.open();
  db.close();

  const readDB = new Dexie(DB_NAME);
  readDB.version(verno)
    .stores(tables.reduce((p, c) => {
      // eslint-disable-next-line no-param-reassign
      p[c.name] = c.schema.primKey.keyPath || '';
      return p;
    }, {}));
  const jsonBlob = await readDB.export();
  const { saveAs } = await import('file-saver');
  saveAs(jsonBlob, 'indexedDB.json');
};

export const importDbJson = async () => {
  const file: File = await new Promise((resolve) => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.hidden = true;
    fileInput.onchange = (e) => {
      // @ts-ignore
      resolve(e.target.files[0]);
    };
    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
  });
  if (!file) return;
  const jsonText: string = await new Promise((resolve) => {
    const fileReader = new FileReader();
    fileReader.onload = (e) => {
      // @ts-ignore
      resolve(e.target.result);
    };
    fileReader.readAsText(file);
  });
  if (!jsonText) return;
  const jsonBlob = new Blob([jsonText], { type: 'text/json' });
  const { Dexie } = await import('dexie');
  const db = new Dexie(DB_NAME);
  const { verno, tables } = await db.open();
  db.close();
  const readDB = new Dexie(DB_NAME);
  await import('dexie-export-import');
  readDB.version(verno)
    .stores(tables.reduce((p, c) => {
      // eslint-disable-next-line no-param-reassign
      p[c.name] = c.schema.primKey.keyPath || '';
      return p;
    }, {}));
  await readDB.import(jsonBlob, { overwriteValues: true });
};
