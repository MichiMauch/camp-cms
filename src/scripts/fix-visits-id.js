import { createClient } from '@libsql/client';

const db = createClient({
  url: 'libsql://camp-cms-netnode-ag.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3MzU2NDMwNjMsImlkIjoiMjJjZTM3M2MtZmM3OC00MTY3LTg3YjEtNmMyN2QyYmYzZTdiIn0.nGIP_mx_7lf9iU2_03uOBAelg1NJrB2ONLQK3BRudJJuOSIG831Y1iOVmosQghKQCkGjSUGYAzx-U_YFgVOfAg'
});

async function fixVisitsTable() {
  try {
    console.log('Starte Tabellen-Korrektur...');

    // 1. Erstelle temporäre Tabelle mit korrekter Struktur
    console.log('Erstelle temporäre Tabelle...');
    await db.execute(`
      CREATE TABLE visits_temp (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date_from DATE NOT NULL,
        date_to DATE NOT NULL,
        visit_image TEXT,
        campsite_id INTEGER,
        FOREIGN KEY(campsite_id) REFERENCES campsites(id)
      )
    `);

    // 2. Kopiere bestehende Daten
    console.log('Kopiere bestehende Daten...');
    await db.execute(`
      INSERT INTO visits_temp (date_from, date_to, visit_image, campsite_id)
      SELECT date_from, date_to, visit_image, campsite_id
      FROM visits
    `);

    // 3. Lösche alte Tabelle
    console.log('Lösche alte Tabelle...');
    await db.execute('DROP TABLE visits');

    // 4. Benenne temporäre Tabelle um
    console.log('Benenne temporäre Tabelle um...');
    await db.execute('ALTER TABLE visits_temp RENAME TO visits');

    // 5. Überprüfe die Migration
    const verification = await db.execute('SELECT * FROM visits LIMIT 5');
    console.log('Beispiel der migrierten Daten:');
    console.log(verification.rows);

    console.log('Migration erfolgreich abgeschlossen!');

  } catch (error) {
    console.error('Fehler während der Migration:', error);
    // Aufräumen im Fehlerfall
    try {
      await db.execute('DROP TABLE IF EXISTS visits_temp');
    } catch (cleanupError) {
      console.error('Fehler beim Aufräumen:', cleanupError);
    }
  }
}

// Führe die Migration aus
fixVisitsTable();