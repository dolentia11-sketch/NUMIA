/* Execute the actual transport functions and inspect their emitted JSON. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, "..", "public", "assets", "app.js"), "utf8");

const patient = {id:101,name:'Synthetic',weight:70,barthel:50,braden:14,broncoFlags:[false,false,false,false,false]};
const auxiliary = {id:'aux1',name:'Synthetic',weight:75};
const calls=[];
const context=vm.createContext({
  STATE:{patients:[patient],auxiliaries:[auxiliary],assignments:{}},
  AbortController,setTimeout,clearTimeout,
  fetch:async (url,options) => {
    calls.push({url,body:JSON.parse(options.body)});
    return {ok:true,json:async()=>({})};
  }
});
vm.runInContext(source.slice(0,source.indexOf('const STATE =')),context);
(async()=>{
  await vm.runInContext('fetchEvaluation("metrics")',context);
  assert.deepEqual(calls[0],{url:'/api/v1/turn/evaluate',body:{patients:[patient],auxiliaries:[auxiliary],assignments:{},action:'metrics'}});
  await vm.runInContext('previewTurn(null,{id:"preview",weight:65})',context);
  assert.deepEqual(calls[1],{url:'/api/v1/turn/preview',body:{patients:[],auxiliaries:[{id:'preview',weight:65}]}});
  console.log('Frontend/API transport behavior: PASS');
})().catch(error=>{console.error(error);process.exitCode=1;});
