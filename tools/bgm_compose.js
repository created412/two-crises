/* 두 번의 위기 · 게임 배경음 (브라우저 합성, 외부 음원 없음)
   1997: A단조 · 70BPM · 낮은 심장박동 + 패드 + 오르골
   2008: D단조 · 84BPM · 전자 패드 + 아르페지오 + 약한 비트
   라운드가 열려 있는 동안만 아주 작은 시계 소리 층이 더해진다. */
(function(){
const SR=44100;
const mf=m=>440*Math.pow(2,(m-69)/12);
const N={C:0,'C#':1,Db:1,D:2,'D#':3,Eb:3,E:4,F:5,'F#':6,Gb:6,G:7,'G#':8,Ab:8,A:9,'A#':10,Bb:10,B:11};
const n=s=>{const m=s.match(/^([A-G][#b]?)(-?\d)$/);return 12*(+m[2]+1)+N[m[1]]};

function impulse(ctx,sec){const len=Math.floor(SR*sec),b=ctx.createBuffer(2,len,SR);for(let c=0;c<2;c++){const d=b.getChannelData(c);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,3)}return b}
function noiseBuf(ctx){const b=ctx.createBuffer(1,SR,SR),d=b.getChannelData(0);for(let i=0;i<SR;i++)d[i]=Math.random()*2-1;return b}
function chain(ctx,wet){const bus=ctx.createGain();const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=5200;const comp=ctx.createDynamicsCompressor();comp.threshold.value=-18;comp.ratio.value=3;
 const rv=ctx.createConvolver();rv.buffer=impulse(ctx,3.2);const rg=ctx.createGain();rg.gain.value=wet;bus.connect(lp);lp.connect(comp);bus.connect(rv);rv.connect(rg);rg.connect(comp);comp.connect(ctx.destination);return bus}
function env(g,t,a,h,r,peak){g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+a);g.gain.setValueAtTime(peak,t+a+h);g.gain.linearRampToValueAtTime(0,t+a+h+r)}
function pad(ctx,out,notes,t,dur,o){for(const m of notes)for(const det of [-6,6]){const osc=ctx.createOscillator();osc.type=o.type||'triangle';osc.frequency.value=mf(m);osc.detune.value=det;
 const f=ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=o.cut||900;const g=ctx.createGain();env(g,t,o.a||1.2,Math.max(0,dur-(o.a||1.2)),o.r||1.6,(o.g||.05)/notes.length);osc.connect(f);f.connect(g);g.connect(out);osc.start(t);osc.stop(t+dur+(o.r||1.6)+.1)}}
function bass(ctx,out,m,t,dur,gain){const o=ctx.createOscillator();o.type='sine';o.frequency.value=mf(m);const g=ctx.createGain();env(g,t,.04,dur*.5,dur*.5,gain);o.connect(g);g.connect(out);o.start(t);o.stop(t+dur+.1)}
function thump(ctx,out,t,gain,f0=70){const o=ctx.createOscillator();o.type='sine';o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(38,t+.25);const g=ctx.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(gain,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+.35);o.connect(g);g.connect(out);o.start(t);o.stop(t+.4)}
function pluck(ctx,out,m,t,gain,type='triangle',dec=1.1){const o=ctx.createOscillator();o.type=type;o.frequency.value=mf(m);const o2=ctx.createOscillator();o2.type='sine';o2.frequency.value=mf(m)*2;const g2=ctx.createGain();g2.gain.value=.25;
 const g=ctx.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(gain,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+dec);o.connect(g);o2.connect(g2);g2.connect(g);g.connect(out);o.start(t);o2.start(t);o.stop(t+dec+.05);o2.stop(t+dec+.05)}
function hat(ctx,out,nb,t,gain){const s=ctx.createBufferSource();s.buffer=nb;const f=ctx.createBiquadFilter();f.type='highpass';f.frequency.value=7500;const g=ctx.createGain();g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(.0001,t+.06);s.connect(f);f.connect(g);g.connect(out);s.start(t,Math.random()*.5);s.stop(t+.08)}
function tick(ctx,out,nb,t,gain,hi){const s=ctx.createBufferSource();s.buffer=nb;const f=ctx.createBiquadFilter();f.type='bandpass';f.frequency.value=hi?3200:2300;f.Q.value=8;const g=ctx.createGain();g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(.0001,t+.04);s.connect(f);f.connect(g);g.connect(out);s.start(t,Math.random()*.5);s.stop(t+.05)}

const THEMES={
 '97':{bpm:70,bars:16,wet:.38,
  prog:[['A2',['A3','C4','E4']],['F2',['F3','A3','C4','E4']],['D2',['D3','F3','A3','C4']],['E2',['E3','G#3','B3','D4']],
        ['A2',['A3','C4','E4']],['G2',['G3','B3','D4']],['F2',['F3','A3','C4']],['E2',['E3','G#3','B3']]],
  mel:[[],[],[],[],[[0,'E5'],[1.5,'C5'],[3,'B4']],[[0,'D5'],[2,'B4']],[[0,'C5'],[1.5,'A4'],[3,'F4']],[[0,'G#4'],[2,'B4']],
       [[0,'A4'],[2,'E5']],[[0,'F5'],[1.5,'E5'],[3,'C5']],[[0,'D5'],[2,'F5']],[[0,'E5'],[1,'D5'],[2,'B4']],
       [[0,'C5'],[1.5,'B4'],[3,'A4']],[[0,'B4'],[2,'D5']],[[0,'C5'],[2,'A4']],[[0,'G#4'],[2,'E4']]],
  draw(ctx,out,nb,B){const bar=4*B;for(let b=0;b<this.bars;b++){const [bn,ch]=this.prog[b%8],t=b*bar;
   pad(ctx,out,ch.map(n),t,bar,{type:'triangle',cut:850,g:.16,a:1.4,r:2});
   bass(ctx,out,n(bn),t,bar*.9,.06);
   for(const k of [0,2]){thump(ctx,out,t+k*B,.20,62);thump(ctx,out,t+k*B+.24*B,.11,58)}  // 낮은 심장박동
   for(const [at,m] of this.mel[b])pluck(ctx,out,n(m),t+at*B,.045,'triangle',1.6)}}},
 '08':{bpm:84,bars:16,wet:.3,
  prog:[['D2',['F3','A3','C4','E4']],['A#1',['D3','F3','A3']],['G1',['A#2','D3','F3','A3']],['A1',['D3','E3','G3']],
        ['D2',['F3','A3','C4','E4']],['A#1',['D3','F3','A3','C4']],['G1',['A#2','D3','F3']],['A1',['C#3','E3','G3']]],
  draw(ctx,out,nb,B){const bar=4*B;for(let b=0;b<this.bars;b++){const [bn,ch]=this.prog[b%8],t=b*bar;
   pad(ctx,out,ch.map(n),t,bar,{type:'sawtooth',cut:700+300*Math.sin(b/16*Math.PI),g:.07,a:1,r:1.5});
   bass(ctx,out,n(bn),t,B*1.8,.07);bass(ctx,out,n(bn),t+2.5*B,B*1.4,.05);
   const arp=[...ch,...ch.slice(1,-1).reverse()].map(n);for(let i=0;i<8;i++)pluck(ctx,out,arp[i%arp.length]+12,t+i*B/2,.026,'sine',.55);
   if(b>=4){thump(ctx,out,t,.16,80);thump(ctx,out,t+2*B,.13,80)}
   if(b>=8)for(let i=0;i<4;i++)hat(ctx,out,nb,t+(i+.5)*B,.012)}}}
};

async function render(key){const th=THEMES[key],B=60/th.bpm,L=th.bars*4*B,TAIL=4;
 const mk=async(fn,wet)=>{const ctx=new OfflineAudioContext(2,Math.ceil(SR*(L+TAIL)),SR);const nb=noiseBuf(ctx);const out=chain(ctx,wet);fn(ctx,out,nb);const buf=await ctx.startRendering();
  const len=Math.ceil(SR*L),res=new AudioBuffer({length:len,numberOfChannels:2,sampleRate:SR});let pk=0;
  for(let c=0;c<2;c++){const s=buf.getChannelData(c),d=res.getChannelData(c);for(let i=0;i<len;i++)d[i]=s[i];for(let i=len;i<s.length;i++)d[i-len]+=s[i];for(let i=0;i<len;i++)pk=Math.max(pk,Math.abs(d[i]))}
  return {res,pk}};
 const main=await mk((c,o,nb)=>th.draw(c,o,nb,B),th.wet);
 const tk=await mk((c,o,nb)=>{for(let i=0;i<th.bars*4;i++)tick(c,o,nb,i*B,.5,i%2===0)},.1);
 const norm=(x,t)=>{const k=t/(x.pk||1);for(let c=0;c<2;c++){const d=x.res.getChannelData(c);for(let i=0;i<d.length;i++)d[i]*=k}return x.res};
 return {main:norm(main,.9),tick:norm(tk,.5)}}

/* ---------- 재생 ---------- */
let ac=null,cur=null,want=null,openPhase=false,busy=false;const cache={};
let vol=+(localStorage.getItem('bgmVol')??.14),on=localStorage.getItem('bgmOn')!=='0';
function ensureCtx(){if(!ac){ac=new (window.AudioContext||window.webkitAudioContext)();}if(ac.state==='suspended')ac.resume();return ac}
['pointerdown','keydown'].forEach(e=>addEventListener(e,()=>{if(ac&&ac.state==='suspended')ac.resume();if(want&&on&&!cur)sync()},{passive:true}));
async function sync(){if(busy)return;busy=true;try{
 const target=on?want:null;
 if(cur&&cur.key!==target){const c=cur;cur=null;const t=c.ctx.currentTime;c.g.gain.cancelScheduledValues(t);c.g.gain.setValueAtTime(c.g.gain.value,t);c.g.gain.linearRampToValueAtTime(0,t+2.5);setTimeout(()=>{try{c.s1.stop();c.s2.stop()}catch(e){}},2700)}
 if(target&&!cur){const ctx=ensureCtx();if(ctx.state!=='running'){busy=false;return}
  cache[target]=cache[target]||await render(target);const b=cache[target];
  const g=ctx.createGain();g.gain.value=0;g.connect(ctx.destination);const tg=ctx.createGain();tg.gain.value=0;tg.connect(g);
  const s1=ctx.createBufferSource();s1.buffer=b.main;s1.loop=true;s1.connect(g);const s2=ctx.createBufferSource();s2.buffer=b.tick;s2.loop=true;s2.connect(tg);
  const t=ctx.currentTime+.05;s1.start(t);s2.start(t);g.gain.linearRampToValueAtTime(vol,t+3);cur={key:target,ctx,g,tg,s1,s2}}
 if(cur){const t=cur.ctx.currentTime;cur.tg.gain.cancelScheduledValues(t);cur.tg.gain.setValueAtTime(cur.tg.gain.value,t);cur.tg.gain.linearRampToValueAtTime(openPhase?.35:0,t+1.5)}
}finally{busy=false}ui()}
function setVol(v){vol=v;localStorage.setItem('bgmVol',v);if(cur){const t=cur.ctx.currentTime;cur.g.gain.cancelScheduledValues(t);cur.g.gain.setValueAtTime(cur.g.gain.value,t);cur.g.gain.linearRampToValueAtTime(vol,t+.2)}}
function toggle(){on=!on;localStorage.setItem('bgmOn',on?'1':'0');if(on)ensureCtx();sync()}

/* ---------- 작은 조절 버튼 ---------- */
let box=null;
function ui(){if(!box){box=document.createElement('div');box.className='bgmbox noprint';box.innerHTML='<button type="button" class="bgmt"></button><input type="range" min="0" max="0.4" step="0.01" aria-label="배경음 크기">';
  const st=document.createElement('style');st.textContent=`.bgmbox{position:fixed;left:14px;bottom:14px;z-index:50;display:flex;align-items:center;gap:8px;background:#14110d;color:#f5efe2;padding:6px 10px;border-radius:999px;font:600 13px/1 'IBM Plex Sans KR',sans-serif;box-shadow:0 2px 10px rgba(0,0,0,.25);opacity:.85}
.bgmbox:hover{opacity:1}.bgmbox button{all:unset;cursor:pointer;padding:4px 4px;color:#ffb627}.bgmbox input{width:80px;accent-color:#ffb627}.bgmbox.off button{color:#999}.bgmbox[hidden]{display:none}@media print{.bgmbox{display:none}}`;
  document.head.appendChild(st);document.body.appendChild(box);
  box.querySelector('button').onclick=toggle;const r=box.querySelector('input');r.value=vol;r.oninput=()=>setVol(+r.value)}
 box.hidden=!want;box.classList.toggle('off',!on);
 box.querySelector('button').textContent=on?`♪ 배경음 ${want==='97'?'1997':'2008'}`:'♪ 배경음 꺼짐';}

/* game.html에서 2.5초마다 호출: stage 2=1997 게임, 3=2008 게임. 게임이 끝나면(실제와 비교) 서서히 꺼진다 */
window.BGM={update(stage,st){let w=null;if(st){if(stage===2&&!st.done['97'])w='97';if(stage===3&&!st.done['08'])w='08'}
  const op=!!(st&&w&&st.game===w&&st.phase==='open');if(w!==want||op!==openPhase){want=w;openPhase=op;sync()}else ui()},
 _render:render,preview(key){want=key;on=true;ensureCtx();sync()},stop(){want=null;sync()}};
})();
