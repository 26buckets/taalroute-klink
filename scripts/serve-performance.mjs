import {globSync, readFileSync} from 'node:fs';
import {Miniflare} from 'miniflare';
const root=process.env.KLINK_PERF_BUILD_ROOT || 'dist';
const port=Number(process.env.KLINK_PERF_PORT || 19120);
const m = new Miniflare({
  modules: ['index.js',...globSync('**/*.js',{cwd:root+'/server'}).filter(p=>p!=='index.js')].map(path=>({type:'ESModule',path,contents:readFileSync(root+'/server/'+path,'utf8')})), modulesRoot: '/',
  modulesRules: [{type:'ESModule', include:['**/*.js'], fallthrough:true}],
  compatibilityDate:'2026-05-15', compatibilityFlags:['nodejs_compat'],
  assets:{binding:'ASSETS', directory:root+'/client', routerConfig:{has_user_worker:true}}, d1Databases:['DB'], host:'127.0.0.1', port
});
console.log(String(await m.ready));
