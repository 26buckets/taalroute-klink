import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { klinkContexts } from '../lib/klink-context.ts';
import { groupInstructionNeeds } from '../lib/group-practice.ts';
import { extendedInstructionNeeds } from '../lib/extended-practice.ts';
import { resolveRegisteredAudio } from '../lib/audio-register.ts';
import { instructionAudioEnabled } from '../lib/audio-policy.ts';
import { importedDomains, importedItemIssues } from '../lib/imported-practice-contract.ts';
const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url)));
const readiness = read('../data/klink-release-readiness.json');
const media = read('../data/klink-media.json');
const release = read('../data/klink-curriculum.json');
const instructions = read('../data/klink-instructions.json');
const comprehensionAudio = read('../data/klink-comprehension-audio.json');
const connectedContent = read('../data/klink-connected-content.json');
const issues = [];
let ownerAuthorized = false;
const authorizationPath = 'docs/klink-owner-release-consistent-layout-20261024.json';
const layoutPreviousPath = 'docs/klink-owner-release-beginners-20261024.json';
const layoutFiles = ["app/layout.tsx", "app/learner-layout.css", "components/product/learner-app.tsx", "components/product/package-experience.tsx", "scripts/check-curriculum-release.mjs", "scripts/test-beginner-route-browser.mjs", "scripts/test-consistent-layout-browser.mjs", "scripts/test-continuous-flow-browser.mjs", "scripts/test-existing-player-browser.mjs", "scripts/test-learner-ux-browser.mjs", "scripts/test-lesson-extension-browser.mjs", "scripts/test-level-routes-browser.mjs", "scripts/test-publication-proof.mjs", "scripts/test-sentence-comprehension-browser.mjs"];
const layoutRuntimeFiles = layoutFiles.filter(file => /^(app|components|hooks|data|lib|public)\//.test(file));
const beginnerPreviousPath = 'docs/klink-owner-release-exercise-menu-20261024.json';
const beginnerFiles = ["app/learner-ui.css", "components/product/learner-app.tsx", "components/product/package-exercise-browser.tsx", "components/product/package-experience.tsx", "data/klink-teacher-manual.json", "docs/KLINK-DOCENTHANDLEIDING.md", "lib/extended-practice.ts", "lib/learner-progress.ts", "lib/lesson-plan.ts", "lib/teacher-practice-plan.ts", "scripts/test-beginner-demos.mjs", "scripts/test-cumulative-routes-browser.mjs", "scripts/test-existing-player-browser.mjs", "scripts/test-extended-practice.mjs", "scripts/test-first-letter-guide.mjs", "scripts/test-group-practice.mjs", "scripts/test-home-start.mjs", "scripts/test-lesson-extension-browser.mjs", "scripts/test-lesson-extension.mjs", "scripts/test-level-routes-browser.mjs", "scripts/test-phase-navigation-browser.mjs", "scripts/test-route-panel-browser.mjs", "scripts/test-ui-lifecycle-browser.mjs", "scripts/check-curriculum-release.mjs", "scripts/test-publication-proof.mjs", "scripts/browser-route-helpers.mjs", "scripts/test-continuous-flow-browser.mjs", "scripts/test-beginner-route-browser.mjs", "scripts/test-sentence-comprehension-browser.mjs", "scripts/test-standard-integration-browser.mjs"];
const beginnerRuntimeFiles = beginnerFiles.filter(file => /^(app|components|hooks|data|lib|public)\//.test(file));
const menuPreviousPath = 'docs/klink-owner-release-compact-exercises-20261024.json';
const menuFiles = ["app/learner-ui.css", "components/product/exercise-menu.tsx", "components/product/package-exercise-browser.tsx", "components/product/package-group-practice.tsx", "components/product/practice-chapters.tsx", "lib/practice-chapters.ts", "scripts/test-exercise-menu.mjs", "scripts/test-exercise-menu-browser.mjs", "scripts/check-curriculum-release.mjs", "scripts/test-publication-proof.mjs"];
const menuRuntimeFiles = menuFiles.filter(file => !file.startsWith('scripts/'));
const compactPreviousPath = 'docs/klink-owner-release-appmenu-20261024.json';
const compactFiles = ['app/learner-ui.css', 'app/taalroute-header.css', 'components/product/practice-chapters.tsx', 'scripts/test-menu-navigation-browser.mjs', 'scripts/test-compact-exercise-scroll-browser.mjs', 'scripts/check-curriculum-release.mjs', 'scripts/test-publication-proof.mjs', 'scripts/test-route-panel-browser.mjs'];
const compactRuntimeFiles = compactFiles.filter(file => !file.startsWith('scripts/'));
const appMenuPreviousPath = 'docs/klink-owner-release-header-repair-20261024.json';
const appMenuFiles = ["components/product/taalroute-header.tsx", "public/taalroute-menu/menu-controls.css", "public/taalroute-menu/klink.svg", "public/taalroute-menu/klink-dark.svg", "public/taalroute-menu/klink-brand.svg", "scripts/test-shared-header-browser.mjs", "scripts/check-curriculum-release.mjs", "scripts/test-publication-proof.mjs"];
const headerRepairPreviousPath = 'docs/klink-owner-release-sharing-20261024.json';
const headerRepairFiles = ["app/taalroute-header.css", "components/product/taalroute-header.tsx", "public/taalroute-menu/app-chooser.css", "scripts/check-curriculum-release.mjs", "scripts/test-publication-proof.mjs", "scripts/test-shared-header-browser.mjs"];
const sharingPreviousPath = 'docs/klink-owner-release-landing-footer-20261024.json';
const sharingFiles = ["app/layout.tsx", "app/taalroute-header.css", "components/product/taalroute-header.tsx", "public/klink-wordmark-dark.svg", "scripts/check-curriculum-release.mjs", "scripts/test-publication-proof.mjs", "scripts/test-landing-browser.mjs", "public/taalroute-menu/actief.svg", "public/taalroute-menu/app-chooser.css", "public/taalroute-menu/appearance.js", "public/taalroute-menu/digibord.svg", "public/taalroute-menu/header-controls.css", "public/taalroute-menu/header-controls.js", "public/taalroute-menu/klankstudio.svg", "public/taalroute-menu/menu-controls.css", "public/taalroute-menu/menu-controls.js", "public/taalroute-menu/missies.svg", "public/taalroute-menu/muziek.svg", "public/taalroute-menu/oppad.svg", "public/taalroute-menu/share-card.png", "public/taalroute-menu/spreektijd.svg", "public/taalroute-menu/studio.svg", "public/taalroute-menu/theaterlezen.svg", "public/taalroute-menu/zinnen.svg"];
const landingPreviousPath = 'docs/klink-owner-release-maintenance-20261024.json';
const landingFiles = ['app/landing.css', 'components/product/entry-design.tsx', 'scripts/check-curriculum-release.mjs', 'scripts/test-landing-browser.mjs', 'scripts/test-publication-proof.mjs'];
const maintenancePreviousPath = 'docs/klink-owner-release-wordbuild-20261019.json';
const maintenanceFiles = ["app/docenten/[chapter]/not-found.tsx", "app/docenten/[chapter]/page.tsx", "app/docenten/page.tsx", "app/docenten/wiki.css", "app/landing.css", "components/product/compact-learner-app.tsx", "components/product/manual-navigation.tsx", "components/ui/breadcrumb.tsx", "components/ui/button-group.tsx", "components/ui/carousel.tsx", "components/ui/chart.tsx", "components/ui/field.tsx", "components/ui/input-group.tsx", "components/ui/input-otp.tsx", "components/ui/item.tsx", "components/ui/label.tsx", "components/ui/pagination.tsx", "components/ui/spinner.tsx", "hooks/use-mobile.ts", "scripts/audit-diglin-menus.mjs", "scripts/check-curriculum-release.mjs", "scripts/export-practice-gap-inventory.mjs", "scripts/test-demo-api-disabled.mjs", "scripts/test-group-practice-browser.mjs", "scripts/test-group-practice.mjs", "scripts/test-maintenance-browser.mjs", "scripts/test-maintenance-components.mjs", "scripts/test-publication-proof.mjs", "scripts/test-standard-players-browser.mjs"];
const wordbuildPreviousPath = 'docs/klink-owner-release-smaller-header-20261019.json';
const wordbuildEvidence = 'docs/klink-wordbuild-release-20261019';
const wordbuildFiles = ['app/globals.css', 'components/product/learner-app.tsx', 'components/product/package-experience.tsx', 'components/product/practice-chapters.tsx', 'components/product/lesson-coverage.tsx', 'components/product/staff-apps.tsx', 'lib/content-levels.ts', 'lib/package-content.ts', 'lib/group-practice.ts', 'lib/practice-chapters.ts', 'data/klink-lexicon-wordbuild-20.json', 'data/klink-lexicon-wordbuild-rest.json'];
const inheritedAuthorizationPath = 'docs/klink-owner-release-short-screen-20261018.json';
const previousAuthorizationPath = 'docs/klink-owner-release-cumulative-20261018.json';
const repairEvidence = 'docs/klink-short-screen-release-20261018';
const cumulativeEvidence = 'docs/klink-cumulative-release-20261018';
try {
  const approval = JSON.parse(readFileSync(authorizationPath));
  const previous = JSON.parse(readFileSync(previousAuthorizationPath));
  if (approval.previousAuthorization !== previousAuthorizationPath || Object.keys(previous.files).some(file => !approval.files?.[file])) throw Error('Previous approval scope must be retained');
  const required = ['lib/group-practice.ts', 'lib/extended-practice.ts', 'lib/mixed-practice.ts', 'data/klink-functional-writing.json', 'data/klink-audio-policy.json', 'lib/learning-paths.ts', 'lib/learning-review.ts', 'data/klink-learning-rules.json', 'components/product/learning-path-surface.tsx', 'data/klink-learning-paths-release.json'];
  required.push('lib/learner-route.ts', 'lib/content-levels.ts', 'components/product/route-settings.tsx', 'components/product/practice-line.tsx', 'components/product/package-experience.tsx', 'components/product/learner-app.tsx', 'data/klink-teacher-manual.json', 'docs/KLINK-DOCENTHANDLEIDING.md', 'docs/KLINK-GOEDGEKEURDE-NAVIGATIE-20261018.md');
  required.push('components/product/teacher-picture-guide.tsx', 'lib/teacher-picture-guide.ts');
  required.push('data/klink-imported-practice.json', 'lib/imported-practice.ts', 'lib/imported-practice-contract.ts', 'lib/standard-practice.ts', 'lib/standard-player-contract.ts', 'components/product/imported-practice-surface.tsx', 'components/product/imported-teacher-workflow.tsx', 'components/product/standard-practice-surface.tsx', 'scripts/adapt-release-item.mjs', 'scripts/import-release-candidates.mjs', 'scripts/review-cumulative-candidates.mjs');
  required.push(...['owner-instruction', 'admissions', 'candidate-index', 'review-summary', 'verification-final', 'source-drive-verification', 'media-drive-verification', 'source-backup-manifest', 'live-baseline-check', ...importedDomains.map(domain => `${domain}-item-review`)].map(name => `${cumulativeEvidence}/${name}.json`));
  required.push(previousAuthorizationPath, 'docs/klink-publication-cumulative-20261018.json', ...['live-baseline-check', 'review', 'routes-browser-checks', 'preservation'].map(name => `${repairEvidence}/${name}.json`));
  required.push(wordbuildPreviousPath, ...wordbuildFiles, ...['owner-request', 'live-baseline', 'review', 'integratie-manifest', 'selectiebeleid', 'datacontrole', 'lokale-eindcontrole', 'review-1', 'review-2', 'source-drive-verification', 'source-manifest'].map(name => `${wordbuildEvidence}/${name}.json`));
  if (approval.approvedBy !== 'Nico' || !approval.userRequest || required.some(file => !approval.files?.[file])) throw Error('Incomplete scoped approval');
  execFileSync('git', ['merge-base', '--is-ancestor', approval.contentSourceCommit, 'HEAD']);
  for (const [file, hash] of Object.entries(approval.files)) {
    if (createHash('sha256').update(readFileSync(file)).digest('hex') !== hash) throw Error(`Approval no longer covers ${file}`);
  }
  const requireProof = condition => { if (!condition) throw Error('Incomplete or mismatching cumulative release evidence'); };
  const layout = approval.consistentLayout;
  const layoutPrevious = JSON.parse(readFileSync(layoutPreviousPath));
  const layoutEvidence = 'docs/klink-consistent-layout-20261024';
  const layoutRequest = JSON.parse(readFileSync(`${layoutEvidence}/owner-request.json`));
  requireProof(layout?.approvedBy === 'Nico' && layout.publicationApproved === true);
  requireProof(layout.previousAuthorization === layoutPreviousPath && layout.baselineSourceCommit === '2a91ffb0f2329827019ec593cc70eb62c8cd457d');
  requireProof(layout.userRequest === layoutRequest.userRequest && layout.userRequest.includes('Je mag alles online zetten.'));
  requireProof(JSON.stringify(layout.changedFiles) === JSON.stringify(layoutFiles));
  execFileSync('git', ['merge-base', '--is-ancestor', layout.baselineSourceCommit, 'HEAD']);
  requireProof(createHash('sha256').update(execFileSync('git', ['show', `${layout.baselineSourceCommit}:${layoutPreviousPath}`])).digest('hex') === approval.files[layoutPreviousPath]);
  for (const [key, value] of Object.entries(layoutPrevious)) if (key !== 'files') requireProof(JSON.stringify(approval[key]) === JSON.stringify(value));
  for (const [file, sha] of Object.entries(layoutPrevious.files)) requireProof(approval.files[file] && (layoutFiles.includes(file) || approval.files[file] === sha));
  const layoutChanges = execFileSync('git', ['diff', '--name-only', layout.baselineSourceCommit, '--', 'app', 'components', 'hooks', 'data', 'lib', 'public'], { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
  requireProof(layoutChanges.every(file => layoutRuntimeFiles.includes(file)));
  const layoutReview = JSON.parse(readFileSync(`${layoutEvidence}/review.json`));
  const layoutSources = JSON.parse(readFileSync(`${layoutEvidence}/source-manifest.json`));
  const layoutBackup = JSON.parse(readFileSync(`${layoutEvidence}/source-drive-verification.json`));
  requireProof(layoutReview.status === 'passed-local' && layoutReview.baselineSourceCommit === layout.baselineSourceCommit && layoutReview.guidedExercises === 102 && layoutReview.preservationPassed === true && layoutReview.fullLocalRegressionPassed === true);
  requireProof(layoutFiles.every(file => approval.files[file] && layoutSources.some(row => row.path === file && row.sha256 === approval.files[file])));
  requireProof(layoutBackup.parentVerified === true && layoutBackup.downloadedByteIdentical === true && layoutBackup.zipCrcVerified === true && layoutBackup.manifestEntriesVerified === layoutFiles.length);
  for (const name of ['owner-request', 'review', 'source-manifest', 'preservation', 'source-drive-verification', 'live-baseline']) requireProof(approval.files[`${layoutEvidence}/${name}.json`]);
  const beginner = approval.beginnerRelease;
  const beginnerPrevious = JSON.parse(readFileSync(beginnerPreviousPath));
  const beginnerEvidence = 'docs/klink-beginners-publication-20261024';
  const beginnerRequest = JSON.parse(readFileSync(`${beginnerEvidence}/owner-request.json`));
  requireProof(beginner?.approvedBy === 'Nico' && beginner.publicationApproved === true);
  requireProof(beginner.previousAuthorization === beginnerPreviousPath && beginner.baselineSourceCommit === '6f7de9248c933e538a2fec928694db726158bbf4');
  requireProof(beginner.userRequest === beginnerRequest.userRequest && beginner.userRequest.includes('gewoon gelijk alles online zetten'));
  requireProof(beginner.guidedExercises === 102 && beginner.humanReviewClaimed === false && beginner.newMediaBindings === 0);
  requireProof(JSON.stringify(beginner.changedFiles) === JSON.stringify(beginnerFiles));
  execFileSync('git', ['merge-base', '--is-ancestor', beginner.baselineSourceCommit, 'HEAD']);
  requireProof(createHash('sha256').update(execFileSync('git', ['show', `${beginner.baselineSourceCommit}:${beginnerPreviousPath}`])).digest('hex') === approval.files[beginnerPreviousPath]);
  for (const [key, value] of Object.entries(beginnerPrevious)) if (key !== 'files') requireProof(JSON.stringify(approval[key]) === JSON.stringify(value));
  for (const [file, sha] of Object.entries(beginnerPrevious.files)) requireProof(approval.files[file] && (layoutFiles.includes(file) || beginnerFiles.includes(file) || approval.files[file] === sha));
  requireProof(beginnerFiles.every(file => approval.files[file]));
  const beginnerChanges = execFileSync('git', ['diff', '--name-only', beginner.baselineSourceCommit, '--', 'app', 'components', 'hooks', 'data', 'lib', 'public'], { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
  requireProof(beginnerChanges.every(file => layoutRuntimeFiles.includes(file) || beginnerRuntimeFiles.includes(file)));
  const beginnerReview = JSON.parse(readFileSync(`${beginnerEvidence}/review.json`));
  const beginnerSources = JSON.parse(readFileSync(`${beginnerEvidence}/source-manifest.json`));
  requireProof(beginnerReview.status === 'passed-local' && beginnerReview.baselineSourceCommit === beginner.baselineSourceCommit && beginnerReview.pakKatSteps === 14 && beginnerReview.preservationPassed === true && beginnerReview.fullLocalRegressionPassed === true);
  requireProof(beginnerFiles.every(file => beginnerSources.some(row => row.path === file && row.sha256 === layoutPrevious.files[file])));
  const beginnerBackup = JSON.parse(readFileSync(`${beginnerEvidence}/source-drive-verification.json`));
  requireProof(beginnerBackup.parentVerified === true && beginnerBackup.downloadedByteIdentical === true && beginnerBackup.zipCrcVerified === true && beginnerBackup.manifestEntriesVerified === beginnerFiles.length);
  for (const name of ['owner-request', 'review', 'source-manifest', 'preservation', 'source-drive-verification', 'live-baseline']) requireProof(approval.files[`${beginnerEvidence}/${name}.json`]);
  const menu = approval.exerciseMenu;
  const menuPrevious = JSON.parse(readFileSync(menuPreviousPath));
  requireProof(menu?.approvedBy === 'Nico' && menu.publicationApproved === true);
  requireProof(menu.userRequest === 'Oké, dan gaan we die... nu begrijp ik het. Dan doen we hem in die inklapbaar maken we. Bouw hem gelijk in en zet hem online.');
  requireProof(menu.previousAuthorization === menuPreviousPath && menu.baselineSourceCommit === '15c064bbbee48c5fc4bad499801e5f3b59b1d962');
  requireProof(JSON.stringify(menu.changedFiles) === JSON.stringify(menuFiles));
  execFileSync('git', ['merge-base', '--is-ancestor', menu.baselineSourceCommit, 'HEAD']);
  requireProof(createHash('sha256').update(execFileSync('git', ['show', `${menu.baselineSourceCommit}:${menuPreviousPath}`])).digest('hex') === approval.files[menuPreviousPath]);
  for (const [key, value] of Object.entries(menuPrevious)) if (key !== 'files') requireProof(JSON.stringify(approval[key]) === JSON.stringify(value));
  for (const [file, sha] of Object.entries(menuPrevious.files)) requireProof(approval.files[file] && (layoutFiles.includes(file) || beginnerFiles.includes(file) || menuFiles.includes(file) || approval.files[file] === sha));
  requireProof(menuFiles.every(file => approval.files[file]));
  const menuChanges = execFileSync('git', ['diff', '--name-only', menu.baselineSourceCommit, '--', 'app', 'components', 'hooks', 'data', 'lib', 'public'], { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
  requireProof(menuChanges.every(file => layoutRuntimeFiles.includes(file) || beginnerRuntimeFiles.includes(file) || menuRuntimeFiles.includes(file)));
  const menuEvidence = 'docs/klink-exercise-menu-20261024';
  for (const name of ['review', 'source-manifest', 'source-drive-verification']) requireProof(approval.files[`${menuEvidence}/${name}.json`]);
  const menuReview = JSON.parse(readFileSync(`${menuEvidence}/review.json`));
  const menuBackup = JSON.parse(readFileSync(`${menuEvidence}/source-drive-verification.json`));
  const menuSources = new Map(JSON.parse(readFileSync(`${menuEvidence}/source-manifest.json`)).map(item => [item.path, item.sha256]));
  requireProof(menuReview.status === 'passed-local' && menuReview.fullLocalRegressionPassed === true && menuReview.baselineSourceCommit === menu.baselineSourceCommit);
  requireProof(menuBackup.downloadedByteIdentical === true && menuBackup.zipCrcVerified === true && menuBackup.parentVerified === true);
  for (const file of menuFiles) requireProof(menuSources.get(file) === beginnerPrevious.files[file]);
  const compact = approval.compactExercises;
  const compactPrevious = JSON.parse(readFileSync(compactPreviousPath));
  requireProof(compact?.approvedBy === 'Nico' && compact.publicationApproved === true);
  requireProof(compact.userRequest === 'Ja, dit ziet er beter uit. Controleer nog of alles goed blijft werken en zet deze versie daarna online voor Klink.');
  requireProof(compact.previousAuthorization === compactPreviousPath && compact.baselineSourceCommit === '9162c82cc74515ddc9ebbbb71d62efc3b7c1244c');
  requireProof(JSON.stringify(compact.changedFiles) === JSON.stringify(compactFiles));
  execFileSync('git', ['merge-base', '--is-ancestor', compact.baselineSourceCommit, 'HEAD']);
  requireProof(createHash('sha256').update(execFileSync('git', ['show', `${compact.baselineSourceCommit}:${compactPreviousPath}`])).digest('hex') === approval.files[compactPreviousPath]);
  for (const [key, value] of Object.entries(compactPrevious)) if (key !== 'files') requireProof(JSON.stringify(approval[key]) === JSON.stringify(value));
  for (const [file, sha] of Object.entries(compactPrevious.files)) requireProof(approval.files[file] && (layoutFiles.includes(file) || beginnerFiles.includes(file) || menuFiles.includes(file) || compactFiles.includes(file) || approval.files[file] === sha));
  requireProof(compactFiles.every(file => approval.files[file]));
  const compactChanges = execFileSync('git', ['diff', '--name-only', compact.baselineSourceCommit, '--', 'app', 'components', 'hooks', 'data', 'lib', 'public'], { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
  requireProof(compactChanges.every(file => layoutRuntimeFiles.includes(file) || beginnerRuntimeFiles.includes(file) || menuRuntimeFiles.includes(file) || compactRuntimeFiles.includes(file)));
  const compactEvidence = 'docs/klink-compact-exercises-20261024';
  for (const name of ['review', 'source-manifest', 'source-drive-verification']) requireProof(approval.files[`${compactEvidence}/${name}.json`]);
  const compactReview = JSON.parse(readFileSync(`${compactEvidence}/review.json`));
  const compactBackup = JSON.parse(readFileSync(`${compactEvidence}/source-drive-verification.json`));
  const compactSources = new Map(JSON.parse(readFileSync(`${compactEvidence}/source-manifest.json`)).map(item => [item.path, item.sha256]));
  requireProof(compactReview.status === 'passed-local' && compactReview.fullLocalRegressionPassed === true && compactReview.baselineSourceCommit === compact.baselineSourceCommit);
  requireProof(compactBackup.downloadedByteIdentical === true && compactBackup.zipCrcVerified === true && compactBackup.parentVerified === true);
  for (const file of compactFiles) requireProof(compactSources.get(file) === menuPrevious.files[file]);
  const appMenu = approval.appMenu;
  const appMenuPrevious = JSON.parse(readFileSync(appMenuPreviousPath));
  requireProof(appMenu?.approvedBy === 'Nico' && appMenu.publicationApproved === true && appMenu.userRequest === 'Ook KLINK in alle appmenu’s toevoegen');
  requireProof(appMenu.previousAuthorization === appMenuPreviousPath && appMenu.baselineSourceCommit === '6d4d012738e9f4332bfd7ff80212192a1d805607');
  requireProof(JSON.stringify(appMenu.changedFiles) === JSON.stringify(appMenuFiles));
  execFileSync('git', ['merge-base', '--is-ancestor', appMenu.baselineSourceCommit, 'HEAD']);
  for (const [key, value] of Object.entries(appMenuPrevious)) if (key !== 'files') requireProof(JSON.stringify(approval[key]) === JSON.stringify(value));
  for (const [file, sha] of Object.entries(appMenuPrevious.files)) requireProof(approval.files[file] && (layoutFiles.includes(file) || beginnerFiles.includes(file) || menuFiles.includes(file) || appMenuFiles.includes(file) || compactFiles.includes(file) || appMenuFiles.includes(file) || approval.files[file] === sha));
  requireProof(appMenuFiles.every(file => approval.files[file]));
  const appMenuChanges = execFileSync('git', ['diff', '--name-only', appMenu.baselineSourceCommit, '--', 'app', 'components', 'hooks', 'data', 'lib', 'public'], {encoding:'utf8'}).trim().split('\n').filter(Boolean);
  requireProof(appMenuChanges.every(file => layoutRuntimeFiles.includes(file) || beginnerRuntimeFiles.includes(file) || menuRuntimeFiles.includes(file) || compactRuntimeFiles.includes(file) || appMenuFiles.includes(file) || appMenuFiles.includes(file)));
  const headerRepair = approval.headerRepair;
  const headerPrevious = JSON.parse(readFileSync(headerRepairPreviousPath));
  requireProof(headerRepair?.approvedBy === 'Nico' && headerRepair.publicationApproved === true);
  requireProof(headerRepair.userRequest === "Bij klink heb je inmiddels een andere top header. En ik denk dat dat even hersteld moet worden. En ik zie hier, dan zie ik op die... ja nee. Hier in het menu moet je even bij Clink ook de goede menuoptie doen alsjeblieft. Doe dat. Dan gaan we de header zoals overal.");
  requireProof(headerRepair.previousAuthorization === headerRepairPreviousPath && headerRepair.baselineSourceCommit === 'deb7a0cce5e12a5c1fbe067a07e8808c80ca7f61');
  requireProof(JSON.stringify(headerRepair.changedFiles) === JSON.stringify(headerRepairFiles));
  execFileSync('git', ['merge-base', '--is-ancestor', headerRepair.baselineSourceCommit, 'HEAD']);
  requireProof(createHash('sha256').update(execFileSync('git', ['show', `${headerRepair.baselineSourceCommit}:${headerRepairPreviousPath}`])).digest('hex') === approval.files[headerRepairPreviousPath]);
  for (const [key, value] of Object.entries(headerPrevious)) if (key !== 'files') requireProof(JSON.stringify(approval[key]) === JSON.stringify(value));
  for (const [file, sha] of Object.entries(headerPrevious.files)) requireProof(approval.files[file] && (layoutFiles.includes(file) || beginnerFiles.includes(file) || menuFiles.includes(file) || appMenuFiles.includes(file) || compactFiles.includes(file) || compactFiles.includes(file) || headerRepairFiles.includes(file) || approval.files[file] === sha));
  requireProof(headerRepairFiles.every(file => approval.files[file]));
  const headerChanges = execFileSync('git', ['diff', '--name-only', headerRepair.baselineSourceCommit, '--', 'app', 'components', 'hooks', 'data', 'lib', 'public'], {encoding:'utf8'}).trim().split('\n').filter(Boolean);
  requireProof(headerChanges.every(file => layoutRuntimeFiles.includes(file) || beginnerRuntimeFiles.includes(file) || menuRuntimeFiles.includes(file) || compactRuntimeFiles.includes(file) || appMenuFiles.includes(file) || compactRuntimeFiles.includes(file) || headerRepairFiles.includes(file)));
  const sharing = approval.sharingRelease;
  const sharingPrevious = JSON.parse(readFileSync(sharingPreviousPath));
  requireProof(sharing?.approvedBy === 'Nico' && sharing.publicationApproved === true);
  requireProof(sharing.userRequest === "Ja, voer dit overal zo door, met Kopieer link bovenaan en de eigen afbeelding en appkleur. Behoud de bestaande deelopties voor lessen en de headerindeling. Controleer mobiel, desktop, licht en donker voordat je het online zet." && sharing.headerRequest === 'KLINK en Scenario ook laten aansluiten');
  requireProof(sharing.previousAuthorization === sharingPreviousPath && sharing.baselineSourceCommit === 'e4d58e12752f8f181d277cb999660ae891df4f0d');
  requireProof(JSON.stringify(sharing.changedFiles) === JSON.stringify(sharingFiles));
  execFileSync('git', ['merge-base', '--is-ancestor', sharing.baselineSourceCommit, 'HEAD']);
  requireProof(createHash('sha256').update(execFileSync('git', ['show', `${sharing.baselineSourceCommit}:${sharingPreviousPath}`])).digest('hex') === approval.files[sharingPreviousPath]);
  for (const [key, value] of Object.entries(sharingPrevious)) if (key !== 'files') requireProof(JSON.stringify(approval[key]) === JSON.stringify(value));
  for (const [file, sha] of Object.entries(sharingPrevious.files)) requireProof(approval.files[file] && (layoutFiles.includes(file) || beginnerFiles.includes(file) || menuFiles.includes(file) || appMenuFiles.includes(file) || compactFiles.includes(file) || compactFiles.includes(file) || sharingFiles.includes(file) || approval.files[file] === sha));
  requireProof(sharingFiles.every(file => approval.files[file]));
  const sharingChanges = execFileSync('git', ['diff', '--name-only', sharing.baselineSourceCommit, '--', 'app', 'components', 'hooks', 'data', 'lib', 'public'], {encoding:'utf8'}).trim().split('\n').filter(Boolean);
  requireProof(sharingChanges.every(file => layoutRuntimeFiles.includes(file) || beginnerRuntimeFiles.includes(file) || menuRuntimeFiles.includes(file) || compactRuntimeFiles.includes(file) || appMenuFiles.includes(file) || compactRuntimeFiles.includes(file) || headerRepairFiles.includes(file) || sharingFiles.includes(file)));
  const landing = approval.landingRelease;
  const landingPrevious = JSON.parse(readFileSync(landingPreviousPath));
  requireProof(landing?.approvedBy === 'Nico' && landing.publicationApproved === true);
  requireProof(landing.userRequest === 'Ja, voer dat nu uit: Taalroute-vermelding onderaan, de losse link ‘Voor begeleiders’ weg en het hoofdvlak hoger en centraal. Behoud de rest, controleer het en publiceer het daarna.');
  requireProof(landing.previousAuthorization === landingPreviousPath && landing.baselineSourceCommit === 'ae860b9c36271539a97d3205b9663e31dda187d7');
  requireProof(JSON.stringify(landing.changedFiles) === JSON.stringify(landingFiles));
  requireProof(landingFiles.every(file => approval.files[file]) && approval.files[landingPreviousPath]);
  execFileSync('git', ['merge-base', '--is-ancestor', landing.baselineSourceCommit, 'HEAD']);
  requireProof(createHash('sha256').update(execFileSync('git', ['show', `${landing.baselineSourceCommit}:${landingPreviousPath}`])).digest('hex') === approval.files[landingPreviousPath]);
  for (const [key, value] of Object.entries(landingPrevious)) if (key !== 'files') requireProof(JSON.stringify(approval[key]) === JSON.stringify(value));
  for (const [file, sha] of Object.entries(landingPrevious.files)) requireProof(approval.files[file] && (layoutFiles.includes(file) || beginnerFiles.includes(file) || menuFiles.includes(file) || appMenuFiles.includes(file) || compactFiles.includes(file) || compactFiles.includes(file) || landingFiles.includes(file) || sharingFiles.includes(file) || approval.files[file] === sha));
  const landingRuntimeChanges = execFileSync('git', ['diff', '--name-only', landing.baselineSourceCommit, '--', 'app', 'components', 'hooks', 'data', 'lib', 'public'], { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
  requireProof(landingRuntimeChanges.every(file => layoutRuntimeFiles.includes(file) || beginnerRuntimeFiles.includes(file) || menuRuntimeFiles.includes(file) || compactRuntimeFiles.includes(file) || appMenuFiles.includes(file) || compactRuntimeFiles.includes(file) || headerRepairFiles.includes(file) || landingFiles.includes(file) || sharingFiles.includes(file)));
  const maintenance = approval.maintenanceRelease;
  const maintenancePrevious = JSON.parse(readFileSync(maintenancePreviousPath));
  requireProof(maintenance?.approvedBy === 'Nico' && maintenance.publicationApproved === true);
  requireProof(maintenance.userRequest === 'Los dat contrastpunt en die 45 lintmeldingen ook op, zonder de indeling of functies te veranderen. Controleer alles en publiceer het daarna.');
  requireProof(maintenance.previousAuthorization === maintenancePreviousPath && maintenance.baselineSourceCommit === '2956a13ddfeb8109ffa30caa2ff7330a34729d60');
  requireProof(JSON.stringify(maintenance.changedFiles) === JSON.stringify(maintenanceFiles));
  requireProof(maintenanceFiles.every(file => approval.files[file]) && approval.files[maintenancePreviousPath]);
  execFileSync('git', ['merge-base', '--is-ancestor', maintenance.baselineSourceCommit, 'HEAD']);
  requireProof(createHash('sha256').update(execFileSync('git', ['show', `${maintenance.baselineSourceCommit}:${maintenancePreviousPath}`])).digest('hex') === approval.files[maintenancePreviousPath]);
  for (const [key, value] of Object.entries(maintenancePrevious)) if (key !== 'files') requireProof(JSON.stringify(approval[key]) === JSON.stringify(value));
  for (const [file, sha] of Object.entries(maintenancePrevious.files)) requireProof(approval.files[file] && (layoutFiles.includes(file) || beginnerFiles.includes(file) || menuFiles.includes(file) || appMenuFiles.includes(file) || compactFiles.includes(file) || compactFiles.includes(file) || maintenanceFiles.includes(file) || landingFiles.includes(file) || sharingFiles.includes(file) || approval.files[file] === sha));
  const runtimeChanges = execFileSync('git', ['diff', '--name-only', maintenance.baselineSourceCommit, '--', 'app', 'components', 'hooks', 'data', 'lib', 'public'], { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
  requireProof(runtimeChanges.every(file => layoutRuntimeFiles.includes(file) || beginnerRuntimeFiles.includes(file) || menuRuntimeFiles.includes(file) || compactRuntimeFiles.includes(file) || appMenuFiles.includes(file) || compactRuntimeFiles.includes(file) || headerRepairFiles.includes(file) || maintenanceFiles.includes(file) || landingFiles.includes(file) || sharingFiles.includes(file)));
  const proof = name => JSON.parse(readFileSync(`${cumulativeEvidence}/${name}.json`));
  const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
  // This exact derivative release leaves the original Lexicon source status intact.
  const wordbuild = approval.wordbuildRelease;
  const wordbuildPrevious = JSON.parse(readFileSync(wordbuildPreviousPath));
  const wordbuildProof = name => JSON.parse(readFileSync(`${wordbuildEvidence}/${name}.json`));
  requireProof(wordbuild?.previousAuthorization === wordbuildPreviousPath && wordbuild.publicationApproved === true && wordbuild.approvedBy === 'Nico');
  requireProof(wordbuild.userRequest === wordbuildProof('owner-request').userRequest && wordbuild.userRequest === 'Zorg dat je alles online zet wat nu offline gebouwd is. Alles meenemen. Alles. Alles push, alles online.');
  requireProof(wordbuild.baselineSourceCommit === '2aa047b23c9564d4f7c89e0824e9fdc8fb7d5f3d' && wordbuild.additionalModelTasks === 4789 && wordbuild.audioPaused === true && wordbuild.newMediaBindings === 0 && wordbuild.humanReviewClaimed === false);
  requireProof(JSON.stringify(wordbuild.runtimeChangedFiles) === JSON.stringify(wordbuildFiles));
  const allowedChanges = [...layoutFiles, ...beginnerFiles, ...menuFiles, ...appMenuFiles, ...compactFiles, ...sharingFiles, ...landingFiles, ...maintenanceFiles, ...wordbuildFiles, 'scripts/check-curriculum-release.mjs', 'scripts/test-publication-proof.mjs', 'scripts/test-existing-player-browser.mjs', 'scripts/test-level-routes.mjs', 'scripts/test-practice-chapters.mjs'];
  for (const [file, sha] of Object.entries(wordbuildPrevious.files)) requireProof(approval.files[file] && (layoutFiles.includes(file) || beginnerFiles.includes(file) || menuFiles.includes(file) || appMenuFiles.includes(file) || compactFiles.includes(file) || allowedChanges.includes(file) || approval.files[file] === sha));
  for (const [key, value] of Object.entries(wordbuildPrevious)) if (key !== 'files') requireProof(JSON.stringify(approval[key]) === JSON.stringify(value));
  const wordbuildLive = wordbuildProof('live-baseline'), wordbuildReview = wordbuildProof('review'), wordbuildBackup = wordbuildProof('source-drive-verification');
  requireProof(wordbuildLive.liveRelease.sourceCommit === wordbuild.baselineSourceCommit && wordbuildLive.liveRelease.sourceClean === true && wordbuildLive.liveRelease.branch === 'main' && wordbuildLive.liveSourceIsAncestor === true);
  execFileSync('git', ['merge-base', '--is-ancestor', wordbuild.baselineSourceCommit, 'HEAD']);
  requireProof(wordbuildReview.status === 'passed-local' && wordbuildReview.fullLocalRegression.passed === true && wordbuildReview.sourceFilesMatchCompletedFullRegression === true && wordbuildReview.additionalModelTasks === 4789);
  requireProof(wordbuildBackup.downloadedByteIdentical === true && wordbuildBackup.zipCrcVerified === true && wordbuildBackup.parentVerified === true && wordbuildBackup.manifestEntriesVerified === wordbuildProof('source-manifest').length);
  const backedUp = new Map(wordbuildProof('source-manifest').map(row => [row.path, row.sha256]));
  for (const file of wordbuildFiles) requireProof(backedUp.get(file) === (compactFiles.includes(file) ? compactPrevious.files[file] : menuFiles.includes(file) ? menuPrevious.files[file] : beginnerPrevious.files[file]));
  const trial = read('../data/klink-lexicon-wordbuild-20.json'), rest = read('../data/klink-lexicon-wordbuild-rest.json');
  for (const file of ['data/klink-lexicon-wordbuild-20.json', 'data/klink-lexicon-wordbuild-rest.json']) requireProof(createHash('sha256').update(readFileSync(new URL('../' + file, import.meta.url))).digest('hex') === approval.files[file]);
  requireProof(rest.selectionPolicy.id === 'klink-basisselectie-nico-20261019' && digest(rest.selectionPolicy) === digest(wordbuildProof('selectiebeleid')));
  const words = [trial, ...rest.packs].flatMap(pack => pack.words), tasks = [trial, ...rest.packs].flatMap(pack => pack.exercises);
  requireProof(words.length === 4789 && tasks.length === 4789 && new Set(words.map(word => word.id)).size === 4789 && new Set(tasks.map(task => task.exerciseId)).size === 4789);
  const excludedWordIds = new Set(rest.selectionPolicy.excludedLexemeIds);
  requireProof(words.every(word => !excludedWordIds.has(word.id) && !word.audio && word.audioStatus === 'missing') && tasks.every(task => task.requiresAudio === false && !task.prompt.audio));
  // Preserve the historical content approval; this successor permits only the reviewed logo sizing.
  const inherited = JSON.parse(readFileSync(inheritedAuthorizationPath));
  requireProof(approval.supersedesAuthorization === inheritedAuthorizationPath && approval.files[inheritedAuthorizationPath]);
  for (const [key, value] of Object.entries(inherited)) if (key !== 'files') requireProof(JSON.stringify(approval[key]) === JSON.stringify(value));
  const sizing = approval.logoSizing;
  requireProof(sizing?.approvedBy === 'Nico' && sizing.userRequest === 'Ja, ik vind de klink nog steeds groot. mag voor mij wat minder groot weer.' && sizing.baselineSourceCommit === '6b2e8061543b94bd59297dc1ae1859ff2050f80a');
  requireProof(sizing.desktopWidth === 66 && sizing.mobileWidth === 55 && sizing.breakpoint === 440);
  requireProof(JSON.stringify(sizing.runtimeChangedFiles) === JSON.stringify(['app/taalroute-header.css']));
  execFileSync('git', ['merge-base', '--is-ancestor', sizing.baselineSourceCommit, 'HEAD']);
  const resizedFiles = ['app/taalroute-header.css', 'scripts/check-curriculum-release.mjs', 'scripts/test-picture-guide-browser.mjs', 'scripts/test-publication-proof.mjs'];
  for (const [file, sha] of Object.entries(inherited.files)) requireProof(approval.files[file] && (layoutFiles.includes(file) || beginnerFiles.includes(file) || menuFiles.includes(file) || appMenuFiles.includes(file) || compactFiles.includes(file) || resizedFiles.includes(file) || allowedChanges.includes(file) || approval.files[file] === sha));
  const baselineCss = execFileSync('git', ['show', `${sizing.baselineSourceCommit}:app/taalroute-header.css`], { encoding: 'utf8' });
  requireProof(createHash('sha256').update(baselineCss).digest('hex') === inherited.files['app/taalroute-header.css']);
  const resizedCss = baselineCss.replace('.header-klink-logo { width: 78px; }', '.header-klink-logo { width: 66px; }').replace('.header-klink-logo { width: 65px; }', '.header-klink-logo { width: 55px; }');
  const currentHeaderCss = readFileSync('app/taalroute-header.css', 'utf8');
  // Historical sizing evidence stays bound to its published source; the successor binds the new scroll rule.
  const compactBaselineHeaderCss = execFileSync('git', ['show', `${compact.baselineSourceCommit}:app/taalroute-header.css`], { encoding: 'utf8' });
  requireProof(compactBaselineHeaderCss.startsWith(resizedCss) && createHash('sha256').update(currentHeaderCss).digest('hex') === approval.files['app/taalroute-header.css']);
  const scope = approval.cumulativeRelease;
  requireProof(approval.userRequest === proof('owner-instruction').userRequest);
  requireProof(scope?.included === 1393 && scope.excluded === 478 && scope.pendingClassification === 4 && scope.teacherSupported === true && scope.independentReading === false && scope.reviewEligible === false && scope.humanReviewClaimed === false && scope.audioPaused === true && scope.newAudioConnections === 0);
  requireProof(JSON.stringify(scope.sixPlayers) === JSON.stringify(['word-sort', 'text-evidence', 'verb-choice', 'context-order', 'situation-point', 'practice-branch']));
  const originalLive = proof('live-baseline-check');
  for (const [file, sha] of Object.entries(previous.files)) if (file.startsWith(`${cumulativeEvidence}/`)) requireProof(approval.files[file] === sha);
  requireProof(previous.contentSourceCommit === originalLive.localHead && originalLive.liveSourceIsAncestor === true);
  const live = JSON.parse(readFileSync(`${repairEvidence}/live-baseline-check.json`));
  const repair = JSON.parse(readFileSync(`${repairEvidence}/review.json`));
  requireProof(approval.layoutRepair?.id === 'short-screen-workflow-footer-overlap-001' && approval.layoutRepair.baselineSourceCommit === readiness.baseline.sourceCommit && approval.layoutRepair.reviewEvidence === `${repairEvidence}/review.json`);
  requireProof(repair.status === 'passed-local' && repair.liveReproductionFailedAsExpected === true && repair.fullLocalRegression === true && repair.cssSha256 === compactPrevious.files['app/learner-ui.css'] && repair.routeTestSha256 === beginnerPrevious.files['scripts/test-cumulative-routes-browser.mjs']);
  requireProof(JSON.stringify(approval.layoutRepair.runtimeChangedFiles) === JSON.stringify(['app/learner-ui.css']));
  for (const [file, sha] of Object.entries(previous.files)) if (/^(app|components|lib|data)\//.test(file) && ![...layoutFiles, ...beginnerFiles, 'app/learner-ui.css', 'app/taalroute-header.css', 'data/klink-release-readiness.json', ...menuFiles, ...sharingFiles, ...wordbuildFiles].includes(file)) requireProof(approval.files[file] === sha);
  requireProof(live.liveRelease?.sourceCommit === readiness.baseline.sourceCommit && live.liveRelease?.sourceClean === true && live.liveRelease?.branch === readiness.canonicalBranch && live.liveWorkerVersion === readiness.baseline.liveWorkerVersion && live.liveSourceIsAncestor === true && approval.contentSourceCommit === live.localHead);
  const backup = proof('source-drive-verification');
  requireProof(backup.sourceArchive?.id === scope.sourceArchiveId && backup.sourceArchive?.sha256 === scope.sourceArchiveSha256 && backup.sourceArchive?.parentVerified === true && backup.sourceArchive?.downloadedByteIdentical === true && backup.sourceArchive?.zipCrcVerified === true);
  requireProof(proof('media-drive-verification').allDownloadedByteIdentical === true && proof('verification-final').fullLocalRegression?.completed === true);
  const manifest = proof('source-backup-manifest');
  requireProof(manifest.length === backup.sourceArchive.manifestEntriesVerified);
  const archived = new Map(manifest.map(row => [row.path, row]));
  requireProof(archived.size === manifest.length && archived.get('source/data/klink-imported-practice.json')?.sha256 === approval.files['data/klink-imported-practice.json']);
  const admissions = proof('admissions'), candidates = proof('candidate-index');
  requireProof(candidates.length === importedDomains.length && new Set(candidates.map(row => row.domain)).size === importedDomains.length && importedDomains.every(domain => candidates.some(row => row.domain === domain)));
  const admitted = new Map(), excluded = new Set(); let pending = 0;
  for (const candidate of candidates) {
    const review = proof(`${candidate.domain}-item-review`), admission = admissions[candidate.domain];
    requireProof(admission?.candidateSha256 === candidate.candidateSha256 && review.candidateSha256 === candidate.candidateSha256 && archived.get(candidate.archiveCandidatePath)?.sha256 === candidate.candidateSha256);
    pending += review.pendingClassificationItems.length;
    const decisions = new Map(review.records.map(row => [row.id, row]));
    requireProof(decisions.size === review.records.length);
    for (const item of admission.items) {
      const reviewed = decisions.get(item.id);
      requireProof(!admitted.has(item.id) && item.responseReviewed === true && item.preparationReviewed === true && item.levelReviewed === true && reviewed?.decision === 'admitted' && reviewed.itemSha256 === item.itemSha256 && reviewed.renderedItemSha256 === item.renderedItemSha256 && reviewed.evidence.length > 0);
      for (const evidence of reviewed.evidence) requireProof(archived.get(candidate.archiveEvidencePrefix + evidence.path)?.sha256 === evidence.sha256 && evidence.bytes > 0);
      admitted.set(item.id, { ...item, domain: candidate.domain });
    }
    for (const item of review.records.filter(row => row.decision === 'excluded')) { requireProof(!excluded.has(item.id) && item.reasons.length > 0); excluded.add(item.id); }
    requireProof(review.records.length === admission.items.length + review.records.filter(row => row.decision === 'excluded').length);
  }
  const imported = read('../data/klink-imported-practice.json').items;
  requireProof(admitted.size === scope.included && imported.length === scope.included && excluded.size === scope.excluded && pending === scope.pendingClassification && new Set(imported.map(item => item.id)).size === imported.length);
  for (const item of imported) requireProof(!excluded.has(item.id) && admitted.get(item.id)?.domain === item.domain && admitted.get(item.id)?.renderedItemSha256 === digest(item) && importedItemIssues(item).length === 0);
  ownerAuthorized = true;
} catch { issues.push('Het inhoudsgebonden publicatieakkoord van de eigenaar ontbreekt of past niet meer.'); }
const ownerRelease = record => ownerAuthorized && [authorizationPath, inheritedAuthorizationPath, previousAuthorizationPath, 'docs/klink-owner-release-picture-guide-20261018.json', 'docs/klink-owner-release-compact-route-20261018.json', 'docs/klink-owner-release-route-panel-20261018.json', 'docs/klink-owner-release-round3-20261018.json'].includes(record.ownerAuthorization);
try {
  const learning = read('../data/klink-learning-paths-release.json');
  if (!learning.publicationApproved || !ownerRelease(learning)) issues.push('De nieuwe leerreeksen wachten op actuele inhoudsgebonden vrijgave; het oude akkoord geldt niet voor nieuwe uitleg en samenstellingen.');
} catch { issues.push('Het vrijgaverecord van de nieuwe leerreeksen ontbreekt.'); }
if (!instructionAudioEnabled) {
  const policy = read('../data/klink-audio-policy.json');
  const exclusions = readFileSync('public/.assetsignore', 'utf8');
  if (policy.approvedBy !== 'Nico' || !policy.userRequest || !exclusions.includes('/package-audio/instructions/**') || !exclusions.includes('/audio/pb/instructie*') || policy.withdrawnFiles.some(path => !exclusions.includes(path))) issues.push('De ingetrokken instructieaudio is niet volledig uitgesloten van publicatie.');
}
try {
  const mixed = read('../data/klink-mixed-practice-release.json');
  if (!mixed.publicationApproved || (mixed.combinationReview !== 'approved' && !ownerRelease(mixed))) issues.push('De nieuwe gemengde oefenrondes wachten op inhoudelijke beoordeling.');
} catch { issues.push('Het vrijgaverecord voor de gemengde oefenrondes ontbreekt.'); }
try {
  const group = read('../data/klink-group-practice-release.json');
  if (!group.publicationApproved || (group.combinationReview !== 'approved' && !ownerRelease(group)) || (instructionAudioEnabled && group.instructionAudioReview !== 'approved')) issues.push('De nieuwe groepsoefeningen wachten op combinatiebeoordeling en passende instructie-audio.');
} catch { issues.push('Het vrijgaverecord voor de groepsoefeningen ontbreekt.'); }
try {
  const extended = read('../data/klink-extended-practice-release.json');
  if (!extended.publicationApproved || (extended.contentReview !== 'approved' && !ownerRelease(extended)) || (instructionAudioEnabled && extended.instructionAudioReview !== 'approved')) issues.push('De uitbreiding met begrip, klanken en taalgebruik wacht op inhoudelijke en instructie-audiovrijgave.');
} catch { issues.push('Het vrijgaverecord van de inhoudelijke uitbreiding ontbreekt.'); }
for (const need of instructionAudioEnabled ? [...groupInstructionNeeds, ...extendedInstructionNeeds] : []) {
  const src = resolveRegisteredAudio(need.id, need.text, 'instruction');
  if (!src || !existsSync(`public${src}`)) issues.push(`De gecontroleerde groepsinstructie ontbreekt: ${need.id}.`);
}
const sections = read('../data/klink-sections.json');
if (sections.release.id !== readiness.sectionEdition || createHash('sha256').update(readFileSync('data/klink-sections.json')).digest('hex') !== readiness.sectionExportSha256) issues.push('De onderdelenindeling wijkt af van de vastgezette Lexicon-export.');
execFileSync(process.execPath, ['--test', 'scripts/test-sections.mjs'], { stdio: 'inherit' });
if (!readiness.publicationApproved) issues.push('De nieuwe inhoud is nog niet vrijgegeven.');
try {
  const approval = JSON.parse(readFileSync(readiness.approvalRecord));
  if (approval.approvedBy !== 'Nico' || !approval.userAnswer || !approval.contentSourceCommit) issues.push('Het vastgelegde publicatieakkoord is onvolledig.');
  else execFileSync('git', ['merge-base', '--is-ancestor', approval.contentSourceCommit, 'HEAD']);
} catch { issues.push('Het vastgelegde publicatieakkoord ontbreekt of past niet bij deze bron.'); }
if (execFileSync('git', ['status', '--porcelain', '--untracked-files=no'], { encoding: 'utf8' }).trim()) issues.push('Leg de gecontroleerde bronwijzigingen eerst vast in een commit.');
if (!readiness.baseline.commitToLiveVersionProven) issues.push('De broncommit van de liveversie moet nog aantoonbaar worden bevestigd.');
try {
  const proof = JSON.parse(readFileSync(readiness.baseline.proofFile));
  const hash = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
  const validArchive = readiness.baseline.proofType === 'published-release-marker-and-byte-comparison'
    ? proof.proofType === readiness.baseline.proofType && hash(proof.sourceArchiveSha256)
      && proof.liveRelease?.sourceCommit === proof.sourceCommit && proof.liveRelease?.sourceClean === true
      && proof.liveRelease?.branch === readiness.canonicalBranch
      && proof.mediaChecked > 0 && proof.mediaChecked === proof.expectedMedia
      && Array.isArray(proof.errors) && proof.errors.length === 0
    : readiness.baseline.proofType === 'original-publication-record-and-fresh-application-module-check'
      && hash(proof.originalArchiveSha256);
  if (proof.sourceCommit !== readiness.baseline.sourceCommit || proof.liveWorkerVersion !== readiness.baseline.liveWorkerVersion || proof.sourceCommitDocumented !== true || !validArchive || !hash(proof.freshClientSha256)) {
    issues.push('Het herkomstbewijs past niet bij de vastgezette publicatiebasis.');
  }
} catch { issues.push('Het onderliggende herkomstbewijs ontbreekt of is onleesbaar.'); }
if (execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).trim() !== readiness.canonicalBranch) issues.push('Publiceer uitsluitend vanuit de canonieke branch.');
execFileSync('git', ['merge-base', '--is-ancestor', readiness.baseline.sourceCommit, 'HEAD']);
if (readiness.wordPronunciationReview !== 'approved') issues.push('De uitspraakcontrole staat open.');
if (readiness.imageMeaningReview !== 'approved') issues.push('De woord-beeldcontrole staat open.');
if (instructionAudioEnabled && readiness.instructionAudioCoverage !== 'complete') issues.push('Niet elke oefenvorm heeft gecontroleerde instructie-audio.');
const missingInstructions = instructions.items.filter(item => !item.src);
if (instructionAudioEnabled && missingInstructions.length) issues.push(`${missingInstructions.length} instructieopnamen moeten nog worden geproduceerd.`);
if (instructions.voiceId === instructions.targetVoiceId) issues.push('De instructiestem moet verschillen van de doeltaalstem.');
if (instructionAudioEnabled && instructions.humanReview !== 'approved') issues.push('De instructie-audio is nog niet inhoudelijk vrijgegeven.');
if (readiness.sentenceComprehensionReview !== 'approved' || comprehensionAudio.humanReview !== 'approved') issues.push('De begripsvragen en bijbehorende vraag-, hulp- en antwoordaudio wachten op menselijke vrijgave.');
if (comprehensionAudio.instructionVoiceId === comprehensionAudio.targetVoiceId) issues.push('Vraag- en steunstem moeten verschillen van de doeltaalstem.');
if (klinkContexts.some(item => item.humanReview !== 'approved')) issues.push('De zinnen en situaties wachten op inhoudelijke en luistervrijgave.');
if (readiness.connectedContentReview !== 'approved' || connectedContent.humanReview !== 'approved') issues.push('De aangesloten bestaande zinnen, teksten en gesprekken wachten op inhoudelijke en luistervrijgave.');
const missing = release.words.filter(word => !media[word.id]?.audio);
if (missing.length) issues.push(`${missing.length} betekenissen hebben nog geen gekoppelde woordopname.`);
const missingImages = release.words.filter(word => !media[word.id]?.image);
if (missingImages.length) issues.push(`${missingImages.length} betekenissen hebben nog geen gekoppeld betekenisbeeld.`);
if (issues.length) { console.error(issues.join('\n')); process.exitCode = 1; }
else {
  execFileSync(process.execPath, ['scripts/check-klink-media-files.mjs'], { stdio: 'inherit' });
  execFileSync(process.execPath, ['scripts/check-connected-audio.mjs'], { stdio: 'inherit' });
  console.log('Publicatiebasis en inhoudelijke vrijgave gecontroleerd.');
}
