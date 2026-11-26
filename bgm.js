/* 두 번의 위기 · 게임 배경음
   음원: audio/bgm97.mp3 (1997 게임), audio/bgm08.mp3 (2008 게임). Suno로 만든 2분짜리 연주곡.
   곡의 끝 4초를 처음 4초에 겹쳐 끊김 없이 반복하고, 두 곡의 크기를 같은 수준으로 맞춘다. */
(function(){
const META={'97':{src:'audio/bgm97.mp3',label:'1997'},'08':{src:'audio/bgm08.mp3',label:'2008'}};
const REF=.16,XF=4;
let ac=null,cur=null,want=null,busy=false;const cache={};
let vol=+(localStorage.getItem('bgmVol2')??.15),on=localStorage.getItem('bgmOn')!=='0';

function ctx(){if(!ac)ac=new (window.AudioContext||window.webkitAudioContext)();if(ac.state==='suspended')ac.resume();return ac}
['pointerdown','keydown','touchstart'].forEach(e=>addEventListener(e,()=>{if(ac&&ac.state==='suspended')ac.resume().then(sync);else if(want&&on&&!cur)sync()},{passive:true}));

/* 앞뒤 무음을 자르고 끝과 처음을 겹친 반복용 버퍼 */
function loopBuf(c,src){const sr=src.sampleRate,nc=Math.min(2,src.numberOfChannels),d0=src.getChannelData(0);
 let a=0,b=src.length-1;while(a<b&&Math.abs(d0[a])<.003)a++;while(b>a&&Math.abs(d0[b])<.003)b--;
 const X=Math.round(XF*sr),L=b-a+1-X;if(L<X*3)return {buf:src,k:1};
 const out=c.createBuffer(nc,L,sr);let ss=0,n=0;
 for(let ch=0;ch<nc;ch++){const s=src.getChannelData(ch),o=out.getChannelData(ch);
  for(let i=0;i<L;i++)o[i]=s[a+i];
  for(let i=0;i<X;i++){const t=i/X*Math.PI/2;o[i]=s[a+i]*Math.sin(t)+s[a+L+i]*Math.cos(t)}
  for(let i=0;i<L;i+=8){ss+=o[i]*o[i];n++}}
 const rms=Math.sqrt(ss/n)||REF;return {buf:out,k:Math.min(2,Math.max(.4,REF/rms)),rms,sec:L/sr}}

async function load(key){if(cache[key])return cache[key];const c=ctx();const ab=await (await fetch(META[key].src)).arrayBuffer();
 const buf=await new Promise((ok,no)=>{const p=c.decodeAudioData(ab,ok,no);if(p&&p.then)p.then(ok,no)});cache[key]=loopBuf(c,buf);return cache[key]}

function ramp(param,to,sec){const t=ac.currentTime;param.cancelScheduledValues(t);param.setValueAtTime(param.value,t);param.linearRampToValueAtTime(to,t+sec)}
async function sync(){if(busy)return;busy=true;try{
 const target=on?want:null;
 if(cur&&cur.key!==target){const c=cur;cur=null;ramp(c.g.gain,0,2.5);setTimeout(()=>{try{c.s.stop()}catch(e){}},2700)}
 if(target&&!cur){const c=ctx();if(c.state!=='running')return;const b=await load(target);if((on?want:null)!==target)return;
  const g=c.createGain();g.gain.value=0;g.connect(c.destination);
  const s=c.createBufferSource();s.buffer=b.buf;s.loop=true;s.connect(g);s.start(c.currentTime+.05);
  cur={key:target,g,s,k:b.k};ramp(g.gain,vol*b.k,3)}
}catch(e){console.warn('BGM',e)}finally{busy=false;ui()}}
function setVol(v){vol=v;localStorage.setItem('bgmVol2',v);if(cur)ramp(cur.g.gain,vol*cur.k,.2)}
function toggle(){on=!on;localStorage.setItem('bgmOn',on?'1':'0');if(on)ctx();sync()}

/* 왼쪽 아래 작은 조절기: 게임 단계에서만 보임 */
let box=null;
function ui(){if(!box){box=document.createElement('div');box.className='bgmbox';
  box.innerHTML='<button type="button"></button><input type="range" min="0" max="0.5" step="0.01" aria-label="배경음 크기">';
  const st=document.createElement('style');st.textContent=`.bgmbox{position:fixed;left:14px;bottom:14px;z-index:50;display:flex;align-items:center;gap:8px;background:#14110d;color:#f5efe2;padding:6px 12px;border-radius:999px;font:600 13px/1 'IBM Plex Sans KR',sans-serif;box-shadow:0 2px 10px rgba(0,0,0,.25);opacity:.85}
.bgmbox:hover{opacity:1}.bgmbox button{all:unset;cursor:pointer;padding:4px 2px;color:#ffb627}.bgmbox input{width:80px;accent-color:#ffb627}.bgmbox.off button{color:#aaa}.bgmbox.off input{display:none}.bgmbox[hidden]{display:none}@media print{.bgmbox{display:none}}`;
  document.head.appendChild(st);document.body.appendChild(box);box.querySelector('button').onclick=toggle;
  const r=box.querySelector('input');r.value=vol;r.oninput=()=>setVol(+r.value)}
 box.hidden=!want;box.classList.toggle('off',!on);
 box.querySelector('button').textContent=!on?'♪ 배경음 꺼짐 (켜기)':(ac&&ac.state!=='running')?'♪ 배경음: 화면을 한 번 누르세요':`♪ 배경음 ${META[want]?.label||''}`}

/* game.html에서 호출: stage 2=1997 게임, 3=2008 게임. 그 게임이 끝나면(실제와 비교·해석 수정) 서서히 꺼진다 */
window.BGM={update(stage,st){let w=null;if(st){if(stage===2&&!st.done?.['97'])w='97';if(stage===3&&!st.done?.['08'])w='08'}
  if(w!==want){want=w;sync()}else if(w&&on&&!cur)sync();else ui()},
 stop(){want=null;sync()},get state(){return {want,on,playing:cur?.key||null,ctx:ac?.state||null,vol,k:cur?.k||null,info:Object.fromEntries(Object.entries(cache).map(([k,v])=>[k,{rms:v.rms,sec:v.sec,k:v.k}]))}}};
})();