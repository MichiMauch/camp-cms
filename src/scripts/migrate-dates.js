import { createClient } from '@libsql/client';

const db = createClient({
  url: 'libsql://camp-cms-netnode-ag.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3MzU2NDMwNjMsImlkIjoiMjJjZTM3M2MtZmM3OC00MTY3LTg3YjEtNmMyN2QyYmYzZTdiIn0.nGIP_mx_7lf9iU2_03uOBAelg1NJrB2ONLQK3BRudJJuOSIG831Y1iOVmosQghKQCkGjSUGYAzx-U_YFgVOfAg'
});

async function migrateDates() {
  try {
    // 1. Zuerst alle vorhandenen Besuche abrufen
    console.log('Rufe alle Besuche ab...');
    const visits = await db.execute('SELECT id, date_from, date_to FROM visits');
    console.log(`${visits.rows.length} Besuche gefunden.`);

    // 2. Temporäre Spalten erstellen
    console.log('Erstelle temporäre Datumsspalten...');
    await db.execute(`
      ALTER TABLE visits 
      ADD COLUMN date_from_new DATE;
    `);
    await db.execute(`
      ALTER TABLE visits 
      ADD COLUMN date_to_new DATE;
    `);

    // 3. Jeden Datensatz migrieren
    console.log('Starte Datenmigration...');
    for (const visit of visits.rows) {
      // Konvertiere DD.MM.YYYY zu YYYY-MM-DD
      const convertDate = (dateStr) => {
        try {
          const [day, month, year] = dateStr.split('.');
          if (!day || !month || !year) throw new Error('Ungültiges Datumsformat');
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        } catch (error) {
          console.error(`Fehler beim Konvertieren des Datums: ${dateStr}`, error);
          return null;
        }
      };

      const dateFrom = convertDate(visit.date_from);
      const dateTo = convertDate(visit.date_to);

      if (dateFrom && dateTo) {
        await db.execute({
          sql: `
            UPDATE visits 
            SET date_from_new = ?, date_to_new = ?
            WHERE id = ?
          `,
          args: [dateFrom, dateTo, visit.id]
        });
        console.log(`Besuch ${visit.id} migriert: ${visit.date_from} -> ${dateFrom}, ${visit.date_to} -> ${dateTo}`);
      } else {
        console.error(`Überspringe Besuch ${visit.id} wegen ungültiger Daten`);
      }
    }

    // 4. Migration überprüfen
    console.log('Überprüfe Migration...');
    const verification = await db.execute('SELECT id, date_from, date_from_new, date_to, date_to_new FROM visits');
    console.log('Beispiel der migrierten Daten:');
    console.log(verification.rows.slice(0, 5));

    // 5. Wenn alles gut aussieht, Spalten umbenennen
    console.log('Schließe Migration ab...');
    try {
      // Schritt 1: Neue Tabelle erstellen
      await db.execute(`
        CREATE TABLE visits_new (
          id TEXT PRIMARY KEY,
          date_from DATE NOT NULL,
          date_to DATE NOT NULL,
          visit_image TEXT,
          campsite_id INTEGER,
          FOREIGN KEY(campsite_id) REFERENCES campsites(id)
        )
      `);
      console.log('Neue Tabelle erstellt');

      // Schritt 2: Daten in neue Tabelle kopieren
      await db.execute(`
        INSERT INTO visits_new 
        SELECT id, date_from_new, date_to_new, visit_image, campsite_id
        FROM visits
      `);
      console.log('Daten in neue Tabelle kopiert');

      // Schritt 3: Alte Tabelle löschen
      await db.execute('DROP TABLE visits');
      console.log('Alte Tabelle gelöscht');

      // Schritt 4: Neue Tabelle umbenennen
      await db.execute('ALTER TABLE visits_new RENAME TO visits');
      console.log('Neue Tabelle umbenannt');

      console.log('Migration erfolgreich abgeschlossen!');

    } catch (error) {
      console.error('Fehler während der finalen Migration:', error);
      // Versuche Aufräumen im Fehlerfall
      try {
        await db.execute('DROP TABLE IF EXISTS visits_new');
        console.log('Aufräumen: Temporäre Tabelle gelöscht');
      } catch (cleanupError) {
        console.error('Fehler beim Aufräumen:', cleanupError);
      }
      throw error; // Fehler weiterwerfen für das übergeordnete Error-Handling
    }

  } catch (error) {
    console.error('Migration fehlgeschlagen:', error);
    // Bei Fehler aufräumen
    try {
      await db.execute('ALTER TABLE visits DROP COLUMN date_from_new');
      await db.execute('ALTER TABLE visits DROP COLUMN date_to_new');
    } catch (cleanupError) {
      console.error('Aufräumen fehlgeschlagen:', cleanupError);
    }
  }
}

// Migration ausführen
migrateDates();