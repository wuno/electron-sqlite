const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('');
const { ipcRenderer } = require('electron');

function log(value) {
  ipcRenderer.send('to-main', 'logging - ' + value);
}

function ready() {
  ipcRenderer.send('ready');
}

async function work() {
  try {
    await db.serialize(function() {
      db.run('CREATE TABLE IF NOT EXISTS lorem (info TEXT)');
      var stmt = db.prepare('INSERT INTO lorem VALUES (?)');
      for (var i = 0; i < 10; i++) {
        stmt.run('From Work Horse ' + i);
      }
      stmt.finalize();
      db.each('SELECT rowid AS id, info FROM lorem', function(err, row) {
        const json = JSON.stringify(row.info);
        ipcRenderer.send('show-sql', json);
        log('SQL ----- ' + json);
      });
    });
  } catch (err) {
    console.log(err);
    alert(err);
  }
}

ipcRenderer.on('run-sql', (event, arg) => {
  log(
    'starting ' + JSON.stringify('Starting to run SQL on a background thread.'),
  );
  work();
  log(
    'finished ' +
      JSON.stringify('Finished running SQL on a background thread.'),
  );
  ready();
});

ready();