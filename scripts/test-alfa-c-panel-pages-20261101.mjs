import test from 'node:test';
import assert from 'node:assert/strict';
import {panelPageStarts} from '../components/product/panel-pages.ts';
void test('short panels retain one complete page',()=>{assert.deepEqual(panelPageStarts(300,290,[]),[0]);assert.deepEqual(panelPageStarts(0,290,[]),[0]);});
void test('page breaks keep full text lines and controls, including nested labels',()=>{
 const boxes=[{top:10,bottom:40},{top:50,bottom:130},{top:75,bottom:123},{top:140,bottom:220},{top:230,bottom:310}];
 const starts=panelPageStarts(140,320,boxes);assert.deepEqual(starts,[0,140,230]);
 for(const cut of starts.slice(1))assert(boxes.every(r=>cut<=r.top||cut>=r.bottom));
});
void test('long paragraphs break between complete readable lines',()=>{assert.deepEqual(panelPageStarts(70,145,[{top:0,bottom:145},...Array.from({length:5},(_,i)=>({top:i*29,bottom:i*29+28}))]),[0,58,116]);});
void test('insufficient space fails visibly instead of hiding a line',()=>assert.throws(()=>panelPageStarts(10,100,[])));
