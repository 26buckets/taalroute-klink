import http from 'node:http';
let failures=0,documents=0,failed=0,teacherRequests=0;
http.createServer((req,res)=>{
 const url=new URL(req.url,'http://127.0.0.1:19007');
 if(url.pathname==='/__test__/arm') {failures=Number(url.searchParams.get('failures'));documents=failed=teacherRequests=0;res.end('armed');return;}
 if(url.pathname==='/__test__/status') {res.setHeader('Content-Type','application/json');res.end(JSON.stringify({failures,documents,failed,teacherRequests}));return;}
 if(req.headers['sec-fetch-dest']==='document')documents++;
 if(url.pathname==='/components/product/teacher-classroom.tsx') {teacherRequests++;if(failures>0){failures--;failed++;res.writeHead(404,{'Content-Type':'text/plain','Cache-Control':'no-store'});res.end('Not found');return;}}
 const upstream=http.request({hostname:'127.0.0.1',port:19006,path:req.url,method:req.method,headers:{...req.headers,host:'127.0.0.1:19006'}},r=>{res.writeHead(r.statusCode,r.headers);r.pipe(res);});
 upstream.on('error',()=>{res.writeHead(502);res.end('upstream unavailable');});req.pipe(upstream);
}).listen(19007,'127.0.0.1',()=>console.log('Local fault fixture ready'));
