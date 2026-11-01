import { DatabaseSync } from 'node:sqlite';

// Test adapter executes real SQLite statements and atomic batches; HTTP tests also run against local D1.
export function sqlite(path = ':memory:') {
  const connection = new DatabaseSync(path);
  connection.exec('PRAGMA foreign_keys=ON');
  function prepare(sql, values = []) {
    const execute = () => connection.prepare(sql);
    return {
      bind: (...args) => prepare(sql, args),
      first: async () => execute().get(...values) ?? null,
      all: async () => ({ results: execute().all(...values), success: true }),
      run: async () => {
        const r = execute().run(...values);
        return {
          success: true,
          results: [],
          meta: { changes: Number(r.changes) },
        };
      },
    };
  }
  return {
    connection,
    prepare,
    batch: async (statements) => {
      connection.exec('BEGIN');
      try {
        const results = [];
        for (const statement of statements) results.push(await statement.run());
        connection.exec('COMMIT');
        return results;
      } catch (error) {
        connection.exec('ROLLBACK');
        throw error;
      }
    },
    exec: (sql) => connection.exec(sql),
  };
}
