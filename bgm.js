/* 두 번의 위기 · 게임 배경음
   음원: audio/bgm97.wav (1997, A단조 70BPM), audio/bgm08.wav (2008, D단조 84BPM)
   - 직접 작곡·합성한 음원 (작곡 코드: tools/bgm_compose.js), 외부 음원 없음
   - 라운드가 열려 있는 동안만 아주 작은 시계 소리가 더해진다 */
(function(){
const META={'97':{src:'audio/bgm97.wav',bpm:70,label:'1997'},'08':{src:'audio/bgm08.wav',bpm:84,label:'2008'}};
let ac=null,cur=null,want=null,openPhase=false,busy=false;const cache={};
let vol=+(localStorage.getItem('bgmVol')??.14),on=localStorage.getItem('bgmOn')!=='0';

function ctx(){if(!ac)ac=new (window.AudioContext||window.webkitAudioContext)();if(ac.state==='suspended')ac.resume();return ac}
['pointerdown','keydown','touchstart'].forEach(e=>addEventListener(e,()=>{if(ac&&ac.state==='suspended')ac.resume().then(sync);else if(want&&on&&!cur)sync()},{passive:true}));

/* 한 마디(4박) 길이의 작은 시계 소리: 박마다 짧은 나무 소리 */
function tickBuf(c,bpm){const B=60/bpm,len=Math.round(c.sampleRate*4*B),b=c.createBuffer(1,len,c.sampleRate),d=b.getChannelData(0);
 for(let k=0;k<4;k++){const st=Math.round(k*B*c.sampleRate),f=k%2?2300:3100,n=Math.round(.05*c.sampleRate);for(let i=0;i<n&&st+i<len;i++){const t=i/c.sampleRate;d[st+i]+=Math.sin(2*Math.PI*f*t)*Math.exp(-t*90)*.5}}return b}

async function load(key){if(cache[key])return cache[key];const c=ctx();const ab=await (await fetch(META[key].src)).arrayBuffer();
 const buf=await new Promise((ok,no)=>{const p=c.decodeAudioData(ab,ok,no);if(p&&p.then)p.then(ok,no)});cache[key]={main:buf,tick:tickBuf(c,META[key].bpm)};return cache[key]}

function ramp(param,to,sec){const t=ac.currentTime;param.cancelScheduledValues(t);param.setValueAtTime(param.value,t);param.linearRampToValueAtTime(to,t+sec)}
async function sync(){if(busy)return;busy=true;try{
 const target=on?want:null;
 if(cur&&cur.key!==target){const c=cur;cur=null;ramp(c.g.gain,0,2.5);setTimeout(()=>{try{c.s1.stop();c.s2.stop()}catch(e){}},2700)}
 if(target&&!cur){const c=ctx();if(c.state!=='running')return;const b=await load(target);if((on?want:null)!==target)return;
  const g=c.createGain();g.gain.value=0;g.connect(c.destination);const tg=c.createGain();tg.gain.value=0;tg.connect(g);
  const s1=c.createBufferSource();s1.buffer=b.main;s1.loop=true;s1.connect(g);
  const s2=c.createBufferSource();s2.buffer=b.tick;s2.loop=true;s2.connect(tg);
  const t=c.currentTime+.05;s1.start(t);s2.start(t);cur={key:target,g,tg,s1,s2};ramp(g.gain,vol,3)}
 if(cur)ramp(cur.tg.gain,openPhase?.22:0,1.5);
}catch(e){console.warn('BGM',e)}finally{busy=false;ui()}}
function setVol(v){vol=v;localStorage.setItem('bgmVol',v);if(cur)ramp(cur.g.gain,vol,.2)}
function toggle(){on=!on;localStorage.setItem('bgmOn',on?'1':'0');if(on)ctx();sync()}

/* 왼쪽 아래 작은 조절기: 게임 단계에서만 보임 */
let box=null;
function ui(){if(!box){box=document.createElement('div');box.className='bgmbox';
  box.innerHTML='<button type="button"></button><input type="range" min="0" max="0.4" step="0.01" aria-label="배경음 크기">';
  const st=document.createElement('style');st.textContent=`.bgmbox{position:fixed;left:14px;bottom:14px;z-index:50;display:flex;align-items:center;gap:8px;background:#14110d;color:#f5efe2;padding:6px 12px;border-radius:999px;font:600 13px/1 'IBM Plex Sans KR',sans-serif;box-shadow:0 2px 10px rgba(0,0,0,.25);opacity:.85}
.bgmbox:hover{opacity:1}.bgmbox button{all:unset;cursor:pointer;padding:4px 2px;color:#ffb627}.bgmbox input{width:80px;accent-color:#ffb627}.bgmbox.off button{color:#aaa}.bgmbox.off input{display:none}.bgmbox[hidden]{display:none}@media print{.bgmbox{display:none}}`;
  document.head.appendChild(st);document.body.appendChild(box);box.querySelector('button').onclick=toggle;
  const r=box.querySelector('input');r.value=vol;r.oninput=()=>setVol(+r.value)}
 box.hidden=!want;box.classList.toggle('off',!on);
 box.querySelector('button').textContent=!on?'♪ 배경음 꺼짐 (켜기)':(ac&&ac.state!=='running')?'♪ 배경음: 화면을 한 번 누르세요':`♪ 배경음 ${META[want]?.label||''}`}

/* game.html에서 호출: stage 2=1997 게임, 3=2008 게임. 그 게임이 끝나면(실제와 비교·해석 수정) 서서히 꺼진다 */
window.BGM={update(stage,st){let w=null;if(st){if(stage===2&&!st.done?.['97'])w='97';if(stage===3&&!st.done?.['08'])w='08'}
  const op=!!(w&&st.game===w&&st.phase==='open');if(w!==want||op!==openPhase){want=w;openPhase=op;sync()}else if(w&&on&&!cur)sync();else ui()},
 preview(key){want=key;on=true;ctx();sync()},stop(){want=null;sync()},get state(){return {want,on,playing:cur?.key||null,tick:openPhase,ctx:ac?.state||null,vol}}};
})();
