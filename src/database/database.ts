import { SQLiteDatabase } from 'expo-sqlite';

export const DATABASE_NAME = 'gastos.db';

const DATABASE_VERSION = 1;

export async function initDatabase(db: SQLiteDatabase): Promise<void> {
    await db.execAsync(
        `PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS expenses (
            id TEXT PRIMARY KEY NOT NULL,
            amount REAL NOT NULL,
            category TEXT NOT NULL,
            date TEXT NOT NULL,
            description TEXT,
            receipt_uri TEXT
        );`
    );

    const versionRow = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    const currentVersion = versionRow?.user_version ?? 0;

    if (currentVersion < DATABASE_VERSION) {
        const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(expenses)');
        const hasReceiptColumn = columns.some((column) => column.name === 'receipt_uri');

        if (!hasReceiptColumn) {
            await db.execAsync('ALTER TABLE expenses ADD COLUMN receipt_uri TEXT');
        }

        await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
    }
}
