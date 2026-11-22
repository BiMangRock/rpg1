const $=i=>document.getElementById(i),cv=$('c'),g=cv.getContext('2d'),ov=$('ov');
const W=960,H=540,GY=470,WW=2600,R=Math.random,rr=(a,b)=>a+R()*(b-a),cl=(v,a,b)=>Math.max(a,Math.min(b,v));
g.imageSmoothingEnabled=false;
const ST=[{n:'평화로운 마을',a:'#2b1240',b:'#0d0616',e:'#5ad06b',q:12},{n:'왕국의 성하',a:'#43121f',b:'#12060a',e:'#e8685a',q:18},{n:'용사의 성전',a:'#122244',b:'#050818',e:'#6ab4ff',q:22,boss:1}];
const BF={atk:['공격력 UP','#ff5a5a'],spd:['신속','#5ac8ff'],haste:['광폭화','#ffd24a'],guard:['수호','#a58bff']};
const UP=[['공격력 +20%',()=>S.atk*=1.2],['공격 속도 +15%',()=>S.as*=1.15],['이동 속도 +12%',()=>S.spd*=1.12],['최대 HP +25 · 회복',()=>{S.maxhp+=25;p.hp=Math.min(S.maxhp,p.hp+40)}],['마법구체 +1발',()=>S.multi++],['폭발 범위 +25%',()=>S.area*=1.25],['마법 쿨타임 -15%',()=>S.cdr*=.85],['마법 위력 +30%',()=>S.mp*=1.3],['흡혈: 처치 시 HP +3',()=>S.ls+=3],['경험치 획득 +25%',()=>S.xpm*=1.25],['점프 +1단 (이단/삼단 점프)',()=>S.mj++,2],['아이템 자석 +50%',()=>S.mag*=1.5],['소환수 +1마리',()=>S.sn++,4],['소환 쿨타임 -20%',()=>S.scd*=.8,4],['소환수 강화 +30%',()=>S.sm*=1.3]];
let al=[],pt=[],rg=[],hz=[],mb={},lt=0,lf=0,S,p,en,pr,eb,dr,fx,tx,pl,cam,stg,kills,portal,boss,bdone,state='title',time=0,spt=0,ban,shake=0,lvl,xp,need,upc,opts;
const keys={};
function load(cb){let n=0,t=0;for(const k in FR)for(const f of FR[k]){t++;f.i=new Image();f.i.onload=()=>{if(++n==t)cb()};f.i.src=f.s}}
const show=h=>{ov.innerHTML=h;ov.style.display='flex'},hide=()=>ov.style.display='none';
const KD={atk:'KeyF',mag:'KeyE',sum:'KeyQ',jmp:'Space',por:'KeyW',L:'KeyA',R:'KeyD',dn:'KeyS'},SCD=12,MAXA=12,KN={atk:'공격',mag:'마법',sum:'소환',jmp:'점프',por:'포털',L:'왼쪽',R:'오른쪽',dn:'아래'};
let KB={...KD},wait=null,back='title';try{Object.assign(KB,JSON.parse(localStorage.getItem('maou_kb2')||'{}'))}catch(x){}
const kl=k=>({ArrowLeft:'←',ArrowRight:'→',ArrowUp:'↑',ArrowDown:'↓'}[k]||String(k).replace(/^(Key|Digit)/,''));
function title(){show(`<h1>마왕 연대기</h1><p>용사 일행을 처단하고 세상을 지배하라.<br>${kl(KB.L)} ${kl(KB.R)} 이동 · ${kl(KB.jmp)} 점프 (${kl(KB.dn)}+점프: 아래로) · ${kl(KB.por)} 포털 · ${kl(KB.sum)} 소환<br>좌클릭 검 (커서 쪽으로 베기) · 우클릭 마법 (커서 방향) · 꾹 누르면 연속 공격<br><small>키보드로도 가능: ${kl(KB.atk)} 검 · ${kl(KB.mag)} 마법 · Esc 일시정지</small></p><div class=row><button onclick="start()">모험 시작</button><button onclick="ks('title')">키 설정</button></div>`)}
function ks(f){if(f)back=f;show(`<h1>키 설정</h1><p>바꿀 항목을 누른 뒤 새 키를 누르세요 (Esc 취소)</p><div class=row>${Object.keys(KN).map(a=>`<button onclick="rb('${a}')">${KN[a]}: <b>${wait===a?'...':kl(KB[a])}</b></button>`).join('')}</div><div class=row><button onclick="kreset()">초기화</button><button onclick="bk()">${back==='pause'?'돌아가기':'뒤로'}</button></div>`)}
function rb(a){wait=a;ks()}
function kreset(){KB={...KD};try{localStorage.removeItem('maou_kb2')}catch(x){}ks()}
function bk(){back==='pause'?pauseM():title()}
function pauseM(){state='pause';show(`<h1>일시정지</h1><div class=row><button onclick="resume()">계속하기</button><button onclick="ks('pause')">키 설정</button></div>`)}
function resume(){hide();state='play'}
function start(){hide();reset();state='play'}
function reset(){S={atk:10,maxhp:100,spd:230,as:1,cdr:1,area:1,multi:0,ls:0,xpm:1,jump:640,mag:1,mp:1,mj:1,sn:3,scd:1,sm:1};lvl=1;xp=0;need=6;upc={};
p={x:120,y:GY,vx:0,vy:0,face:1,hp:100,g:1,st:'n',t:0,inv:0,cd:0,sc:0,jc:0,kind:'mag',am:null,b:{},hit:0,fired:0,dn:0};al=[];go(0)}
function go(i){stg=i;kills=0;portal=null;boss=null;bdone=0;en=[];pr=[];eb=[];dr=[];fx=[];tx=[];pt=[];rg=[];hz=[];p.x=120;p.y=GY;p.vx=p.vy=0;cam=0;for(const a of al){a.x=p.x+a.o*1.2;a.y=a.t==='bat'?p.y-80:GY;a.cd=0}
pl=[];for(let k=0;k<7;k++)pl.push({x:260+k*320+(k%2)*40,y:GY-105-(k%3)*50,w:170});ban={s:`STAGE ${i+1} · ${ST[i].n}`,t:2.5}}
const asm=()=>S.as*(p.b.haste?1.5:1),dm=()=>S.atk*(p.b.atk?1.6:1);
function txt(x,y,s,c){tx.push({x,y,s,c,t:.9})}
function spawn(tt,xx){const T=[['farmer','villager'],['farmer','villager','swordsman','archer'],['swordsman','archer','paladin','farmer']][stg],t=tt||T[R()*T.length|0],m=1+stg*.6+lvl*.08;
const D={farmer:[24,60,32,66,1,2],villager:[16,100,30,62,.8,1],swordsman:[60,75,36,76,1.6,4],archer:[28,55,32,68,.9,3],paladin:[130,40,46,84,1.8,7]}[t];
const e={t,ac:0,x:xx??cl(p.x+(R()<.5?-1:1)*(W/2+60),30,WW-30),y:GY,kx:0,fl:0,ph:R()*6,dir:1,w:D[2],h:D[3],sp:D[1]*rr(.85,1.15),dmg:(8+stg*4)*D[4],xp:D[5],hp:D[0]*m,sh:rr(1,2)};e.mh=e.hp;en.push(e)}
function mkBoss(){const hp=Math.round(2400+lvl*120),e={t:'boss',x:WW-300,y:GY,kx:0,fl:0,ph:0,dir:-1,w:120,h:150,sp:0,dmg:30,xp:8,hp,mh:hp,pz:1,at:1.5,act:null,vx:0,vy:0,inv:0,tel:0,ac:0};boss=e;en.push(e);ban={s:'BOSS · 각성한 용사',t:3};shake=.6}
function melee(){const x=p.x+p.face*50;fx.push({a:FR.slash,x:p.x+p.face*55,y:p.y-58,d:.06,sz:150,hh:120,f:-p.face,t:0});
for(const e of en)if(Math.abs(e.x-x)<75+e.w/2&&e.y>p.y-130&&e.y-e.h<p.y)hit(e,dm()*1,p.face*260)}
function shoot(){const n=1+S.multi,x=p.x+p.face*48,y=p.y-62,b=p.am?Math.atan2(p.am.y-y,p.am.x-x):(p.face>0?0:Math.PI);fx.push({a:[FR.flash[0]],x,y,d:.15,sz:80,f:p.face,t:0});
for(let i=0;i<n;i++){const a=b+(i-(n-1)/2)*.2;pr.push({x,y,vx:Math.cos(a)*520,vy:Math.sin(a)*520,life:1.3,a:0,dmg:dm()*5*S.mp})}p.cd=.7*S.cdr}
function boom(x,y,d){const r=90*S.area;fx.push({a:FR.exp,x,y,d:.07,sz:r*2,f:1,t:0});shake=Math.max(shake,.12);
for(const e of en)if(Math.hypot(e.x-x,e.y-e.h/2-y)<r+e.w/2)hit(e,d,(e.x>x?1:-1)*200)}
function hit(e,d,k){if(e.dead)return;if(e.inv>0){if(R()<.15)txt(e.x,e.y-e.h-6,'무적','#ffe08a');return}e.hp-=d;e.fl=.12;e.kx+=e.t==='boss'?0:k;txt(e.x,e.y-e.h-6,Math.round(d),'#fff');if(e.hp<=0){e.dead=1;kill(e)}}
function kill(e){fx.push({a:[FR.exp[1],FR.exp[2],FR.exp[3]],x:e.x,y:e.y-e.h/2,d:.08,sz:e.w*1.6,f:1,t:0});
if(S.ls)p.hp=Math.min(S.maxhp,p.hp+S.ls);
if(e.t==='boss'){bdone=1;boss=null;eb=[];hz=[];for(const o of en)if(o!==e&&!o.dead){o.dead=1}for(let i=0;i<12;i++)dr.push({k:'xp',v:8,x:e.x+rr(-60,60),y:e.y-80,vy:rr(-500,-200),life:1e9});
if(stg===ST.length-1)setTimeout(win,1500);else openPortal();return}
kills++;dr.push({k:'xp',v:e.xp,x:e.x,y:e.y-e.h/2,vy:-200,life:1e9});
if(R()<.2)dr.push({k:'b',b:Object.keys(BF)[R()*4|0],x:e.x,y:e.y-e.h/2,vy:-300,life:12})}
function openPortal(){portal={x:WW-160};ban={s:'포털이 열렸다! → 끝까지 이동 후 '+kl(KB.por),t:3}}
function hurtP(d){if(p.inv>0||p.st==='dead')return;d*=p.b.guard?.4:1;p.hp-=d;p.inv=1;txt(p.x,p.y-100,Math.round(d),'#ff4a6a');shake=.25;
if(p.hp<=0){p.hp=0;p.st='dead';p.t=0;return}p.st='hurt';p.t=0;p.vy=-250;p.vx=-p.face*160}
function pick(d){if(d.k==='xp'){xp+=d.v*S.xpm;chk()}else{p.b[d.b]=12;txt(p.x,p.y-110,BF[d.b][0]+'!',BF[d.b][1]);fx.push({a:[FR.flash[1],FR.flash[2]],x:p.x,y:p.y-50,d:.12,sz:130,f:1,t:0})}}
function chk(){if(xp>=need&&state==='play'){xp-=need;lvl++;need=Math.floor(need*1.3+3);p.hp=Math.min(S.maxhp,p.hp+S.maxhp*.2);
lvFx()}}
function lvFx(){state='lvfx';lt=1;lf=.8;shake=.5;for(let i=0;i<60;i++){const a=R()*6.283,s=rr(80,420);pt.push({x:p.x,y:p.y-50,vx:Math.cos(a)*s,vy:Math.sin(a)*s-140,t:rr(.6,1.3),c:R()<.5?'#ffd84a':'#fff'})}rg.push({x:p.x,y:p.y-50,t:0},{x:p.x,y:p.y-50,t:-.2});fx.push({a:[FR.flash[1],FR.flash[2]],x:p.x,y:p.y-50,d:.3,sz:420,f:1,t:0})}
function vfx(dt){shake=Math.max(0,shake-dt);for(const f of fx)f.t+=dt;fx=fx.filter(f=>f.t<f.a.length*f.d);for(const t of tx){t.y-=40*dt;t.t-=dt}tx=tx.filter(t=>t.t>0);for(const q of pt){q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=300*dt;q.t-=dt}pt=pt.filter(q=>q.t>0);for(const r of rg)r.t+=dt;rg=rg.filter(r=>r.t<.9);lf=Math.max(0,lf-dt*1.2)}
function lvDraw(){g.save();g.globalCompositeOperation='lighter';
for(const r of rg){if(r.t<0)continue;const k=r.t/.9;g.strokeStyle=`rgba(255,216,74,${1-k})`;g.lineWidth=10*(1-k)+2;g.beginPath();g.arc(r.x-cam,r.y,k*520,0,7);g.stroke()}
for(const q of pt){g.fillStyle=q.c;g.globalAlpha=Math.min(1,q.t*2);g.fillRect(q.x-cam-2,q.y-2,4,4)}g.globalAlpha=1;
if(state==='lvfx'){const gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,'#ffd84a00');gr.addColorStop(.5,`rgba(255,230,140,${.6*lt})`);gr.addColorStop(1,'#ffd84a00');g.fillStyle=gr;const bw=60*(1.2-lt);g.fillRect(p.x-cam-bw/2,0,bw,H)}
g.restore();if(lf>0){g.fillStyle=`rgba(255,240,200,${lf*.5})`;g.fillRect(0,0,W,H)}
if(state==='lvfx'){g.textAlign='center';g.font='56px "Do Hyeon",sans-serif';g.fillStyle='#000';g.fillText('LEVEL UP!',W/2+3,203);g.fillStyle='#ffd84a';g.globalAlpha=Math.min(1,lt*2);g.fillText('LEVEL UP!',W/2,200);g.globalAlpha=1;g.textAlign='left'}}
function menu(){state='lvl';const a=UP.map((_,i)=>i).filter(i=>!UP[i][2]||(upc[i]||0)<UP[i][2]).sort(()=>R()-.5);opts=a.slice(0,3);
show(`<h1>LEVEL UP!</h1><p>Lv.${lvl} · 강화를 선택하세요 (1~3 키)</p><div class=row>${opts.map((k,i)=>`<button class=up onclick="pickUp(${i})"><b>${i+1}. ${UP[k][0]}</b><small>현재 ${upc[k]||0}단계</small></button>`).join('')}</div>`)}
function pickUp(i){if(state!=='lvl')return;const k=opts[i];UP[k][1]();upc[k]=(upc[k]||0)+1;hide();state='play';chk()}
function over(){state='over';show(`<h1>마왕, 쓰러지다</h1><p>STAGE ${stg+1} · Lv.${lvl}</p><button onclick="start()">다시 도전</button>`)}
function win(){state='over';show(`<h1>VICTORY</h1><p>용사를 쓰러뜨렸습니다. 이제 세상은 마왕의 것입니다.<br>최종 레벨 Lv.${lvl}</p><button onclick="start()">처음부터 다시</button>`)}
function sumCast(){if(p.st==='n'&&p.sc<=0){p.st='cast';p.t=0;p.fired=0;p.kind='sum';p.am=null}}
function summon(){p.sc=SCD*S.scd;const nw=Math.min(S.sn,MAXA-al.length);if(nw<S.sn){for(const a of al)a.hp=a.mh;txt(p.x,p.y-135,'소환수 회복!','#9aff9a')}const b0=al.length;for(let i=0;i<nw;i++){const bat=(b0+i)%2,o=(i-(nw-1)/2)*40,x=p.x+o*1.2,y=bat?p.y-80:GY;const mh=(bat?30:55)*S.sm*(1+stg*.25);al.push({t:bat?'bat':'slime',x,y,w:bat?36:40,h:bat?26:32,sp:bat?150:120,life:1,ph:R()*6,dir:p.face,cd:0,o,hp:mh,mh,iv:0,fl:0});fx.push({a:[FR.exp[1],FR.exp[2]],x,y:y-16,d:.08,sz:80,f:1,t:0})}
al.forEach((a,i)=>a.o=(i-(al.length-1)/2)*30);txt(p.x,p.y-110,'소환!','#c88aff');shake=.15}
function hurtA(a,d){if(a.life<=0||a.iv>0)return;a.hp-=d;a.iv=.25;a.fl=.12;txt(a.x,a.y-a.h-8,Math.round(d),'#d8a0ff');if(a.hp<=0){a.life=0;fx.push({a:[FR.exp[1],FR.exp[2],FR.exp[3]],x:a.x,y:a.y-a.h/2,d:.07,sz:70,f:1,t:0})}}
function atk(m){if(p.st==='n'){if(m&&mon)p.face=msx+cam>p.x?1:-1;p.st='atk';p.t=0;p.hit=0}}
function cast(){if(p.st==='n'&&p.cd<=0){p.st='cast';p.t=0;p.fired=0;p.kind='mag';p.am=mon?{x:msx+cam,y:msy}:null;if(p.am)p.face=p.am.x>p.x?1:-1}}
function jump(){if(p.g){if(keys[KB.dn]&&p.y<GY){p.dn=.3;p.y+=4}else{p.vy=-S.jump;p.jc=1}p.g=0}else if(p.jc<S.mj){p.vy=-S.jump*.9;p.jc++;fx.push({a:[FR.flash[0]],x:p.x,y:p.y,d:.15,sz:90,f:1,t:0})}}
function enter(){if(portal&&Math.abs(p.x-portal.x)<60){p.hp=Math.min(S.maxhp,p.hp+S.maxhp*.3);go(stg+1)}}
onkeydown=e=>{const k=e.code;
if(wait){e.preventDefault();if(k!=='Escape'){for(const o in KB)if(KB[o]===k&&o!==wait)KB[o]=KB[wait];KB[wait]=k;try{localStorage.setItem('maou_kb2',JSON.stringify(KB))}catch(x){}}wait=null;ks();return}
if(/Arrow|Space/.test(k)||Object.values(KB).includes(k))e.preventDefault();keys[k]=1;if(e.repeat)return;
if(k==='Escape'){if(state==='play')pauseM();else if(state==='pause')resume();return}
if(state==='lvl'&&/Digit[123]/.test(k))return pickUp(+k[5]-1);
if(state!=='play'||p.st==='dead')return;
if(k===KB.jmp)jump();if(k===KB.atk)atk();if(k===KB.mag)cast();if(k===KB.sum){if(p.sc>0)txt(p.x,p.y-110,'소환 대기 '+p.sc.toFixed(1)+'초','#9a8aaa');else sumCast()}if(k===KB.por)enter()};
onkeyup=e=>keys[e.code]=0;
let msx=0,msy=0,mon=0;
cv.onmousemove=e=>{const r=cv.getBoundingClientRect();msx=(e.clientX-r.left)/r.width*W;msy=(e.clientY-r.top)/r.height*H;mon=1};
cv.onmousedown=e=>{e.preventDefault();cv.onmousemove(e);mb[e.button]=1;if(state!=='play'||p.st==='dead')return;if(e.button===0)atk(1);else if(e.button===2)cast()};
onmouseup=e=>mb[e.button]=0;cv.oncontextmenu=e=>e.preventDefault();onblur=()=>{for(const k in keys)keys[k]=0;mb={}};
function bDone(e,z){e.act=null;e.tel=0;e.at=[0,1.5,1.1,.7][z]}
function bLand(e,z){shake=.5;for(const d of[-1,1])eb.push({x:e.x+d*50,y:GY-18,vx:d*[0,400,450,520][z],vy:0,life:2.4,d:24,gw:1});
if(z>=2)for(let i=0;i<6;i++){const a=-Math.PI*(i+.5)/6;eb.push({x:e.x,y:e.y-60,vx:Math.cos(a)*260,vy:Math.sin(a)*260,life:3,d:16})}
if(e.act&&e.act.k==='leap')bDone(e,z)}
function bossAI(e,dt,dx){const z=e.hp>e.mh*.66?1:e.hp>e.mh*.33?2:3;e.inv-=dt;
if(z>e.pz){e.pz=z;e.inv=1.2;e.act=null;e.tel=0;e.at=1.4;shake=.6;ban={s:z===2?'용사가 분노한다!':'최후의 각성 · 빛의 심판',t:2.5};
 for(let i=0;i<16;i++){const a=i/16*6.283;eb.push({x:e.x,y:e.y-80,vx:Math.cos(a)*230,vy:Math.sin(a)*230,life:4,d:18})}
 spawn('paladin',cl(e.x-180,40,WW-40));spawn('swordsman',cl(e.x+180,40,WW-40));if(z===3)spawn('archer',cl(p.x+(R()<.5?-320:320),40,WW-40))}
if(z===3){e.mt=(e.mt??8)-dt;if(e.mt<=0){e.mt=9;if(en.length<6)spawn(R()<.5?'swordsman':'paladin',cl(e.x+(R()<.5?-150:150),40,WW-40))}}
if(e.y<GY||e.vy<0){e.vy+=2200*dt;e.y+=e.vy*dt;e.x+=e.vx*dt;if(e.y>=GY){e.y=GY;e.vy=0;e.vx=0;bLand(e,z)}}
const A=e.act;
if(!A){e.dir=dx>0?1:-1;e.x+=e.dir*[0,55,75,100][z]*dt;e.at-=dt;
 if(e.at<=0){const L=['ring','wave','charge','leap'];if(z>=2)L.push('pillar','wave','leap');if(z>=3)L.push('pillar','charge');let k;do k=L[R()*L.length|0];while(k===e.last);e.last=k;e.act={k,t:0,n:0};if(k==='charge'||k==='wave')e.tel=1}}
else{A.t+=dt;
 if(A.k==='ring'){const n=[0,10,14,18][z];if(A.n<z&&A.t>=.3+A.n*.4){for(let i=0;i<n;i++){const a=i/n*6.283+A.n*.25;eb.push({x:e.x,y:e.y-80,vx:Math.cos(a)*210,vy:Math.sin(a)*210,life:4,d:16})}A.n++;shake=Math.max(shake,.12)}if(A.t>.5+z*.4)bDone(e,z)}
 else if(A.k==='wave'){const sh=z>=3?2:1;if(A.n<sh&&A.t>=.5+A.n*.45){e.tel=0;const c=[0,3,5,7][z],b=Math.atan2(p.y-50-(e.y-100),p.x-e.x);for(let i=0;i<c;i++){const a=b+(i-(c-1)/2)*.16;eb.push({x:e.x+e.dir*40,y:e.y-100,vx:Math.cos(a)*400,vy:Math.sin(a)*400,life:3,d:22,r:13,c:'#9ad8ff'})}A.n++}if(A.t>.7+sh*.45)bDone(e,z)}
 else if(A.k==='charge'){const reps=z>=3?2:1,sp=[0,560,680,820][z],seg=1.25,i=Math.floor(A.t/seg);if(i>=reps)bDone(e,z);else{const lt=A.t-i*seg;if(lt<.55){e.tel=1;e.dir=dx>0?1:-1;e.d0=e.dir}else{e.tel=0;if(A.n<=i){A.n=i+1;shake=.3}e.x+=e.d0*sp*dt}}}
 else if(A.k==='leap'){if(!A.n){A.n=1;const T=.95;e.vy=-2200*T/2;e.vx=(cl(p.x,80,WW-80)-e.x)/T}if(A.t>2)bDone(e,z)}
 else if(A.k==='pillar'){const vol=z>=3?2:1;if(A.n<vol&&A.t>=A.n){const c=z>=3?5:3;for(let i=0;i<c;i++)hz.push({x:cl(p.x+(i-(c-1)/2)*120,30,WW-30),t:-.9,d:26});A.n++}if(A.t>vol+.6)bDone(e,z)}}
e.x=cl(e.x,60,WW-60)}
function upd(dt){time+=dt;const c=ST[stg];if(ban)if((ban.t-=dt)<=0)ban=null;
if(p.st==='dead'){p.t+=dt;p.vx=0;if(p.t>1.6)over()}else{
 const d=(keys[KB.R]?1:0)-(keys[KB.L]?1:0),sp=S.spd*(p.b.spd?1.4:1)*(p.st==='atk'||p.st==='cast'?.45:1);
 p.cd-=dt;p.sc-=dt;p.inv-=dt;p.dn-=dt;
 if(p.st==='hurt'){p.t+=dt;p.vx*=.92;if(p.t>.25)p.st='n'}else{p.vx=d*sp;if(d&&p.st==='n')p.face=d}
 if(p.st==='n'){if(keys[KB.atk]||mb[0])atk(mb[0]);else if(keys[KB.mag]||mb[2])cast();else if(keys[KB.sum])sumCast()}
 if(p.st==='atk'){p.t+=dt;const f=p.t/(.055/asm());if(f>=3&&!p.hit){p.hit=1;melee()}if(f>=5)p.st='n'}
 if(p.st==='cast'){p.t+=dt;const f=p.t/(.085/asm());if(f>=4&&!p.fired){p.fired=1;p.kind==='sum'?summon():shoot()}if(f>=6)p.st='n'}
 for(const k in p.b)if((p.b[k]-=dt)<=0)delete p.b[k]}
const py=p.y;p.vy+=1700*dt;p.y+=p.vy*dt;p.x=cl(p.x+p.vx*dt,20,WW-20);p.g=0;
if(p.y>=GY){p.y=GY;p.vy=0;p.g=1}else if(p.vy>0&&p.dn<=0)for(const q of pl)if(p.x>q.x&&p.x<q.x+q.w&&py<=q.y&&p.y>=q.y){p.y=q.y;p.vy=0;p.g=1}
if(p.g)p.jc=0;
cam+=(cl(p.x-W/2,0,WW-W)-cam)*Math.min(1,dt*6);
if(kills>=c.q&&!portal&&!boss){if(c.boss&&!bdone)mkBoss();else if(!c.boss||bdone)openPortal()}
spt-=dt;if(spt<=0&&kills<c.q&&!boss&&en.length<7+stg*3){spt=1.1;spawn()}
for(const e of en){e.fl-=dt;e.ph+=dt*3;e.ac=(e.ac||0)-dt;const dx=p.x-e.x;
 let ta=null,tx=p.x,ty=p.y-50,td=Math.abs(dx);
 if(e.t!=='boss')for(const a of al){const d=Math.abs(a.x-e.x);if(a.life>0&&d<td&&d<320){td=d;ta=a;tx=a.x;ty=a.y-a.h/2}}
 const tdx=tx-e.x;
 if(e.t==='boss')bossAI(e,dt,dx);else if(e.t==='archer'){const ad=Math.abs(tdx);e.dir=tdx>0?1:-1;e.x+=(ad<240?-e.dir:ad>340?e.dir:0)*e.sp*dt;e.sh-=dt;if(e.sh<=0&&ad<520){e.sh=2.2;const a=Math.atan2(ty-(e.y-45),tdx);eb.push({x:e.x,y:e.y-45,vx:Math.cos(a)*280,vy:Math.sin(a)*280,life:3,d:e.dmg,ar:1})}}
 else{e.dir=tdx>0?1:-1;if(!ta||Math.abs(tdx)>(e.w+ta.w)/2-8)e.x+=e.dir*e.sp*dt}e.x=cl(e.x,20,WW-20);
 e.x+=e.kx*dt;e.kx*=Math.pow(.02,dt);
 if(e.ac<=0)for(const a of al)if(a.life>0&&Math.abs(a.x-e.x)<(e.w+a.w)/2+4&&a.y>e.y-e.h&&a.y-a.h<e.y+4){hurtA(a,e.dmg*(e.t==='boss'?1.5:.7));e.ac=e.t==='boss'?.4:.9;break}
 if(p.inv<=0&&p.st!=='dead'&&Math.abs(dx)<(e.w+30)/2&&p.y>e.y-e.h&&p.y-90<e.y)hurtP(e.dmg)}
for(const a of al){a.ph+=dt*3;a.cd-=dt;a.iv-=dt;a.fl-=dt;let tg=null,bd=450;for(const e of en)if(!e.dead&&Math.abs(e.x-a.x)<bd){bd=Math.abs(e.x-a.x);tg=e}
 const dx=(tg?tg.x:p.x+a.o)-a.x;a.dir=dx>0?1:-1;if(tg||Math.abs(dx)>60)a.x+=a.dir*a.sp*dt;
 if(a.t==='bat')a.y+=(((tg?tg.y-tg.h/2:p.y-90)+Math.sin(a.ph)*12)-a.y)*dt*3;
 if(tg&&a.cd<=0&&Math.abs(tg.x-a.x)<(tg.w+a.w)/2+4&&Math.abs((tg.y-tg.h/2)-(a.y-a.h/2))<(tg.h+a.h)/2){a.cd=.5;hit(tg,dm()*S.sm*(a.t==='bat'?.7:1),a.dir*120)}}
al=al.filter(a=>a.life>0);
en=en.filter(e=>!e.dead);
for(const o of pr){o.x+=o.vx*dt;o.y+=o.vy*dt;o.life-=dt;o.a+=dt;
 for(const e of en)if(!o.dead&&Math.abs(o.x-e.x)<e.w/2+14&&o.y>e.y-e.h-14&&o.y<e.y+10){o.dead=1;boom(o.x,o.y,o.dmg)}
 if((o.life<=0||o.y>=GY-4)&&!o.dead){o.dead=1;boom(o.x,Math.min(o.y,GY-4),o.dmg)}}
pr=pr.filter(o=>!o.dead);en=en.filter(e=>!e.dead);
for(const o of eb){o.x+=o.vx*dt;o.y+=o.vy*dt;o.life-=dt;const od=o.d||14+stg*3,orr=o.r||(o.ar?5:8);
 if(p.inv<=0&&p.st!=='dead'&&(o.gw?Math.abs(o.x-p.x)<28&&p.y>GY-46:Math.hypot(o.x-p.x,o.y-p.y+45)<orr+18)){if(!o.gw)o.life=0;hurtP(od)}
 if(o.life>0)for(const a of al)if(a.life>0&&(o.gw?Math.abs(o.x-a.x)<28&&a.y>GY-40:Math.hypot(o.x-a.x,o.y-(a.y-a.h/2))<orr+a.w*.4)){hurtA(a,od);if(!o.gw){o.life=0;break}}}
for(const h of hz){h.t+=dt;if(h.t>=0&&!h.hit){h.hit=1;shake=Math.max(shake,.2);if(Math.abs(p.x-h.x)<36)hurtP(h.d);for(const a of al)if(Math.abs(a.x-h.x)<36)hurtA(a,h.d)}}
hz=hz.filter(h=>h.t<.35);
eb=eb.filter(o=>o.life>0&&o.y<GY);
for(const d of dr){const dx=p.x-d.x,dy=p.y-45-d.y,ds=Math.hypot(dx,dy)||1;d.life-=dt;
 if(ds<(d.k==='xp'?110:70)*S.mag&&p.st!=='dead'){d.x+=dx/ds*400*dt;d.y+=dy/ds*400*dt;d.vy=0}
 else{d.vy+=900*dt;d.y+=d.vy*dt;if(d.y>GY-8){d.y=GY-8;d.vy=Math.abs(d.vy)>80?-d.vy*.4:0}}
 if(ds<26){d.life=0;pick(d)}}
dr=dr.filter(d=>d.life>0);
vfx(dt)}
function bgd(){const c=ST[stg],gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,c.a);gr.addColorStop(1,c.b);g.fillStyle=gr;g.fillRect(0,0,W,H);
g.fillStyle='#ffffff14';g.beginPath();g.arc(740-cam*.05,110,46,0,7);g.fill();
for(let L=0;L<3;L++){g.fillStyle=`rgba(0,0,0,${.18+L*.16})`;const par=.15+L*.2,hh=130+L*40;g.beginPath();g.moveTo(0,GY);
 for(let x=0;x<=W;x+=24){const wx=x+cam*par;g.lineTo(x,GY-hh*.45-Math.abs(Math.sin(wx*.013+L*2)+Math.sin(wx*.031+L))*hh*.28)}g.lineTo(W,GY);g.fill()}
g.fillStyle='#120a18';g.fillRect(0,GY,W,H-GY);g.fillStyle=c.e+'88';g.fillRect(0,GY,W,3);
for(const q of pl){g.fillStyle='#2a1a34';g.fillRect(q.x-cam,q.y,q.w,12);g.fillStyle=c.e+'aa';g.fillRect(q.x-cam,q.y,q.w,3)}
if(portal){const x=portal.x-cam;g.save();g.translate(x,GY-70);g.globalCompositeOperation='lighter';
 for(let i=0;i<4;i++){g.strokeStyle=`rgba(${120+i*30},80,255,.6)`;g.lineWidth=4;g.beginPath();g.ellipse(0,0,38-i*7,66-i*11,time*(i%2?1:-1)*2,0,5);g.stroke()}
 g.fillStyle='#8a5aff55';g.beginPath();g.ellipse(0,0,34,62,0,0,7);g.fill();g.restore()}}
const HU={farmer:['#8a6a3a',0],villager:['#6a8aa8',1],swordsman:['#8a8f9a',2],archer:['#3a7a4a',3],paladin:['#dcdce8',4]};
function drawE(e){const f=e.fl>0,h=e.h,w=e.w,P=c=>g.fillStyle=f?'#fff':c,S2=c=>g.strokeStyle=f?'#fff':c;g.save();g.translate(e.x-cam,e.y);g.scale(e.dir,1);
if(e.t==='boss'){const b=Math.sin(e.ph)*3;if(e.pz>=2){g.save();g.globalCompositeOperation='lighter';const ac=e.pz>=3?'255,80,60':'255,200,80',gr=g.createRadialGradient(0,-80,10,0,-80,130);gr.addColorStop(0,`rgba(${ac},.45)`);gr.addColorStop(1,`rgba(${ac},0)`);g.fillStyle=gr;g.fillRect(-140,-220,280,240);g.restore()}if(e.inv>0){g.strokeStyle='#ffffff88';g.lineWidth=3;g.beginPath();g.arc(0,-80,95,0,7);g.stroke()}P('#a01828');g.beginPath();g.moveTo(-10,-120+b);g.lineTo(-64,-14);g.lineTo(-20,-8);g.fill();
 P('#c9a227');g.fillRect(-30,-48,22,48);g.fillRect(6,-48,22,48);g.fillRect(-40,-108+b,80,64);P('#fff4c0');g.fillRect(-8,-95+b,16,30);
 P('#e0c0a0');g.beginPath();g.arc(0,-124+b,20,0,7);g.fill();P('#c9a227');g.beginPath();g.arc(0,-128+b,22,Math.PI,0);g.fill();P('#e01830');g.fillRect(-4,-160+b,8,18);
 g.fillStyle=e.tel?'#ff3a3a':'#2a60ff';g.fillRect(6,-124+b,8,6);
 S2('#e8f2ff');g.lineWidth=9;g.beginPath();g.moveTo(40,-70+b);g.lineTo(100,-165+b);g.stroke();S2('#c9a227');g.lineWidth=6;g.beginPath();g.moveTo(30,-78+b);g.lineTo(54,-60+b);g.stroke();if(e.act&&e.act.k==='wave'&&e.tel){g.fillStyle='#bfe6ff';g.globalAlpha=.6+.4*Math.sin(time*40);g.beginPath();g.arc(100,-165+b,10+e.act.t*30,0,7);g.fill();g.globalAlpha=1}}
else{const [bc,k]=HU[e.t],wk=Math.sin(e.ph*2.5)*(e.kx>20?0:1);
 P('#3a2a20');g.fillRect(-w*.3+wk*5,-h*.36,w*.22,h*.36);g.fillRect(w*.06-wk*5,-h*.36,w*.22,h*.36);
 P(bc);g.fillRect(-w*.4,-h*.76,w*.8,h*.42);P('#e0c0a0');g.beginPath();g.arc(0,-h*.86,w*.28,0,7);g.fill();g.fillStyle='#221';g.fillRect(w*.04,-h*.9,w*.1,w*.08);
 if(k===0){P('#d8b050');g.fillRect(-w*.5,-h*.95,w,4);g.fillRect(-w*.25,-h*1.02,w*.5,8)}
 else if(k===1){P('#5a3a20');g.fillRect(-w*.28,-h*1.0,w*.56,6)}
 else if(k===2){P('#d02030');g.fillRect(-w*.3,-h*.93,w*.6,4)}
 else if(k===3){P('#2a5a34');g.beginPath();g.moveTo(-w*.32,-h*.84);g.lineTo(0,-h*1.1);g.lineTo(w*.32,-h*.84);g.fill()}
 else{P('#b8b8cc');g.fillRect(-w*.3,-h*1.0,w*.6,h*.14);P('#d02030');g.fillRect(-3,-h*1.1,6,h*.1)}
 g.lineWidth=3;g.beginPath();
 if(k===0){S2('#7a5530');g.moveTo(w*.4,-h*.3);g.lineTo(w*.7,-h*1.05);g.stroke();S2('#ccc');g.beginPath();g.moveTo(w*.6,-h*1.0);g.lineTo(w*.82,-h*1.0);g.moveTo(w*.6,-h*1.0);g.lineTo(w*.6,-h*1.14);g.moveTo(w*.82,-h*1.0);g.lineTo(w*.82,-h*1.14);g.stroke()}
 else if(k===1){S2('#7a5530');g.moveTo(w*.4,-h*.35);g.lineTo(w*.65,-h*.95);g.stroke();P('#ff9a30');g.beginPath();g.arc(w*.67,-h*1.0,6,0,7);g.fill()}
 else if(k===3){S2('#a0702a');g.arc(w*.55,-h*.6,h*.28,-1.3,1.3);g.stroke()}
 else{S2('#dfe6ee');g.lineWidth=4;g.moveTo(w*.4,-h*.5);g.lineTo(w*.9,-h*(.95+wk*.1));g.stroke();if(k===4){P('#c9a227');g.fillRect(w*.28,-h*.72,w*.3,h*.4)}}}
g.restore()}
function drawA(a){g.save();g.translate(a.x-cam,a.y);g.fillStyle=a.fl>0?'#fff':'#b06aff';
if(a.t==='bat'){const f=Math.sin(a.ph*3)*14;g.beginPath();g.moveTo(0,-15);g.lineTo(-28,-15-f);g.lineTo(-14,-4);g.moveTo(0,-15);g.lineTo(28,-15-f);g.lineTo(14,-4);g.fill();g.beginPath();g.arc(0,-14,10,0,7);g.fill();g.fillStyle='#ff3';g.fillRect(-6,-17,4,4);g.fillRect(2,-17,4,4)}
else{const ry=a.h/2*(1+Math.sin(a.ph*2)*.1);g.beginPath();g.ellipse(0,-ry,a.w/2,ry,0,0,7);g.fill();g.fillStyle='#fff';g.fillRect(-9,-a.h*.62,8,8);g.fillRect(3,-a.h*.62,8,8);g.fillStyle='#d11';g.fillRect(a.dir>0?-4:-9,-a.h*.58,4,4);g.fillRect(a.dir>0?8:3,-a.h*.58,4,4)}
g.restore();if(a.hp<a.mh&&a.life>0)bar(a.x-cam-18,a.y-(a.t==='bat'?40:a.h+12),36,4,a.hp/a.mh,'#b06aff')}
function drawP(){let a,i;const t=time;
if(p.st==='dead'){a=FR.hurt;i=Math.min(5,p.t/.22|0)}else if(p.st==='hurt'){a=FR.hurt;i=0}
else if(p.st==='atk'){a=FR.atk;i=Math.min(4,p.t/(.055/asm())|0)}else if(p.st==='cast'){a=FR.cast;i=Math.min(5,p.t/(.085/asm())|0)}
else if(!p.g){a=FR.walk;i=2}else if(Math.abs(p.vx)>10){a=FR.walk;i=(t/.09|0)%a.length}else{a=FR.idle;i=(t/.5|0)%2}
const f=a[i],sx=p.x-cam;g.save();g.globalAlpha=.35;g.fillStyle='#000';g.beginPath();g.ellipse(sx,p.y+2,26,6,0,0,7);g.fill();g.restore();
g.save();g.globalCompositeOperation='lighter';for(const k in p.b){const gr=g.createRadialGradient(sx,p.y-55,10,sx,p.y-55,80);gr.addColorStop(0,BF[k][1]+'66');gr.addColorStop(1,BF[k][1]+'00');g.fillStyle=gr;g.fillRect(sx-90,p.y-145,180,180)}g.restore();
g.save();g.translate(sx,p.y);g.scale(p.face,1);if(p.inv>0&&p.st!=='dead'&&(time*20|0)%2)g.globalAlpha=.45;g.drawImage(f.i,-f.ax,-f.ay,f.w,f.h);g.restore()}
function bar(x,y,w,h,v,c){g.fillStyle='#000a';g.fillRect(x,y,w,h);g.fillStyle=c;g.fillRect(x,y,w*cl(v,0,1),h);g.strokeStyle='#fff6';g.strokeRect(x+.5,y+.5,w-1,h-1)}
function draw(){g.save();if(shake>0)g.translate(rr(-4,4)*shake*4,rr(-4,4)*shake*4);bgd();
for(const d of dr){g.save();g.globalCompositeOperation='lighter';const c=d.k==='xp'?'#66aaff':BF[d.b][1],x=d.x-cam,r=d.k==='xp'?6:10+Math.sin(time*8)*2;
 const gr=g.createRadialGradient(x,d.y,1,x,d.y,r*2.2);gr.addColorStop(0,c);gr.addColorStop(1,c+'00');g.fillStyle=gr;g.fillRect(x-r*2.2,d.y-r*2.2,r*4.4,r*4.4);g.restore()}
for(const h of hz){const x=h.x-cam;g.save();if(h.t<0){const k=1+h.t/.9;g.fillStyle=`rgba(255,60,60,${.12+.18*k+.08*Math.sin(time*30)})`;g.fillRect(x-34,0,68,GY);g.fillStyle='#ff4a4a';g.fillRect(x-34,GY-4,68,4)}else{g.globalCompositeOperation='lighter';g.globalAlpha=Math.max(0,1-h.t/.35);g.fillStyle='#fff3b0';g.fillRect(x-34,0,68,GY);g.fillStyle='#fff';g.fillRect(x-12,0,24,GY)}g.restore()}
for(const e of en)drawE(e);for(const a of al)drawA(a);drawP();
for(const o of pr){const f=FR.orb[(o.a/.08|0)%3],w=56,h=w*f.h/f.w;g.save();g.globalCompositeOperation='lighter';g.drawImage(f.i,o.x-cam-w/2,o.y-h/2,w,h);g.restore()}
g.save();g.globalCompositeOperation='lighter';for(const o of eb){const x=o.x-cam;if(o.gw){g.fillStyle='#ffb347';g.beginPath();g.ellipse(x,o.y,16,24,0,0,7);g.fill();g.fillStyle='#fff6d0';g.beginPath();g.ellipse(x,o.y+4,7,14,0,0,7);g.fill();continue}const r=o.r||(o.ar?5:8);g.fillStyle=o.c||(o.ar?'#ffe9b0':'#ffd84a');g.beginPath();g.arc(x,o.y,r,0,7);g.fill();g.fillStyle='#fff';g.beginPath();g.arc(x,o.y,r*.4,0,7);g.fill()}g.restore();
for(const f of fx){const im=f.a[Math.min(f.a.length-1,f.t/f.d|0)],w=f.hh?f.hh*im.w/im.h:f.sz,h=f.hh||w*im.h/im.w;g.save();g.translate(f.x-cam,f.y);if(f.f<0)g.scale(-1,1);g.globalCompositeOperation=im.n?'source-over':'lighter';g.drawImage(im.i,-w/2,-h/2,w,h);g.restore()}
g.font='18px "Do Hyeon",sans-serif';g.textAlign='center';for(const t of tx){g.globalAlpha=Math.min(1,t.t*2);g.fillStyle='#000';g.fillText(t.s,t.x-cam+1,t.y+1);g.fillStyle=t.c;g.fillText(t.s,t.x-cam,t.y)}g.globalAlpha=1;g.restore();
g.textAlign='left';g.font='16px "Do Hyeon",sans-serif';g.fillStyle='#fff';
bar(16,14,220,16,p.hp/S.maxhp,'#e0345a');g.fillText(`HP ${Math.ceil(p.hp)}/${S.maxhp}`,22,27);
bar(16,36,220,10,xp/need,'#5ab4ff');g.fillText(`Lv.${lvl}`,244,46);
const c=ST[stg];g.fillText(`${c.n} ${bdone||boss?'':'처치 '+Math.min(kills,c.q)+'/'+c.q}`,16,68);
bar(16,76,60,6,1-Math.max(0,p.cd)/(.7*S.cdr),'#c88aff');g.fillText('우클릭 마법',82,84);bar(16,90,60,6,1-Math.max(0,p.sc)/(SCD*S.scd),'#6aff9a');g.fillText(kl(KB.sum)+' 소환 '+(p.sc>0?Math.ceil(p.sc)+'초':'준비'),82,98);
let bx=16;for(const k in p.b){g.fillStyle=BF[k][1];g.fillRect(bx,106,18,18);g.fillStyle='#fff';g.fillText(Math.ceil(p.b[k]),bx+22,120);bx+=56}
if(boss){bar(W/2-220,16,440,14,boss.hp/boss.mh,'#a020c0');g.textAlign='center';g.fillText('각성한 용사 · '+(boss.pz||1)+'페이즈',W/2,48);g.textAlign='left'}
if(portal){const px=portal.x-cam;if(px<30||px>W-30){g.textAlign=px<30?'left':'right';g.fillStyle='#b48aff';g.font='22px "Do Hyeon",sans-serif';g.fillText(px<30?'◀ 포털':'포털 ▶',px<30?16:W-16,GY-60);g.textAlign='left'}}
if(ban){g.textAlign='center';g.font='36px "Do Hyeon",sans-serif';g.globalAlpha=Math.min(1,ban.t);g.fillStyle='#000';g.fillText(ban.s,W/2+2,182);g.fillStyle='#ffb347';g.fillText(ban.s,W/2,180);g.globalAlpha=1}lvDraw()}
let last=0;function loop(ts){requestAnimationFrame(loop);const dt=Math.min(.033,(ts-last)/1000||0);last=ts;try{if(state==='play')upd(dt);else if(state==='lvfx'){vfx(dt);lt-=dt;if(lt<=0)menu()}if(p)draw()}catch(e){console.error(e);g.setTransform(1,0,0,1,0,0);g.globalAlpha=1;g.globalCompositeOperation='source-over'}}
load(()=>{reset();title();requestAnimationFrame(loop)});
