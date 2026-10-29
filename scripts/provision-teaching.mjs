import { randomUUID } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  writeFileSync,
  mkdtempSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { newCode, codeHash } from '../lib/teaching-server.ts';
// Local provisioning only. Production account setup belongs to a separate approved release.
const name = process.argv[2],
  output = process.argv[3];
if (!name?.trim() || name.length > 80 || /\p{Cc}/u.test(name) || !output)
  throw new Error(
    'Gebruik: node scripts/provision-teaching.mjs Naam lokaal-codebestand.json',
  );
if (existsSync(output))
  throw new Error('Het codebestand bestaat al. Kies een nieuw bestand.');
const id = randomUUID(),
  code = newCode('teacher'),
  dir = mkdtempSync(join(tmpdir(), 'klink-teacher-'));
try {
  const quote = (value) => "'" + value.replaceAll("'", "''") + "'";
  const file = join(dir, 'teacher.sql');
  writeFileSync(
    file,
    `INSERT INTO teaching_teachers (id,name,code_hash) VALUES (${quote(id)},${quote(name.trim())},${quote(await codeHash(code))});\n`,
    { mode: 0o600 },
  );
  execFileSync(
    'npx',
    [
      'wrangler',
      'd1',
      'execute',
      'DB',
      '--local',
      '--persist-to',
      resolve('.wrangler/state'),
      '--config',
      'dist/server/wrangler.json',
      '--file',
      file,
    ],
    { stdio: 'pipe' },
  );
  mkdirSync(resolve(output, '..'), { recursive: true });
  writeFileSync(
    output,
    JSON.stringify({ id, name: name.trim(), code }, null, 2) + '\n',
    { mode: 0o600, flag: 'wx' },
  );
  console.log(
    'Lokale docent aangemaakt. De persoonlijke code staat in het opgegeven bestand.',
  );
} finally {
  rmSync(dir, { recursive: true, force: true });
}
