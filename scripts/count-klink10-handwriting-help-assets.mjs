import{readFileSync,readdirSync,statSync,writeFileSync}from'node:fs';
import{createRequire}from'node:module';
const require=createRequire(import.meta.url),ignore=require('ignore'),root='dist/client',patterns=['/.assetsignore','/_redirects','/_headers',...readFileSync(root+'/.assetsignore','utf8').split('\n')],ig=ignore().add(patterns),paths=[];
// Match the installed Wrangler buildAssetManifest file selection, without uploading.
for(const p of readdirSync(root,{recursive:true})){if(ig.test(p).ignored)continue;const s=statSync(root+'/'+p);if(s.isSymbolicLink()||s.isDirectory())continue;paths.push({path:'/'+p,bytes:s.size});}
paths.sort((a,b)=>a.path.localeCompare(b.path));
writeFileSync('docs/klink10-handwriting-help-ac-20261103/offered-build-assets.json',JSON.stringify({method:'Installed Wrangler 4.92.0 buildAssetManifest algorithm: recursive readdir, same ignore library and default + actual .assetsignore patterns, stat excludes directories/symlinks.',count:paths.length,patterns,paths},null,2)+'\n');
console.log('Offered assets',paths.length,'largest',Math.max(...paths.map(x=>x.bytes)));
