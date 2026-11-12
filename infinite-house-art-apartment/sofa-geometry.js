/* Consistent 3-D geometry for Infinite House sofa.
 * Every sprite is projected from exactly the same model at 60-degree yaw steps.
 * Handmade cel-shaded polygons, no 3D library and no external dependency. */
(function(){
'use strict';
function drawSofa(canvas, rotation){
 const ctx=canvas.getContext('2d');
 const S=70, ca=Math.cos(rotation),sa=Math.sin(rotation);
 const faces=[], strokes=[];
 const rgb=s=>[parseInt(s.slice(1,3),16),parseInt(s.slice(3,5),16),parseInt(s.slice(5,7),16)];
 function shade(s,amount){let [r,g,b]=rgb(s);return `rgb(${Math.max(0,Math.min(255,r*amount))|0},${Math.max(0,Math.min(255,g*amount))|0},${Math.max(0,Math.min(255,b*amount))|0})`}
 function rotated(p){return [p[0]*ca+p[2]*sa,p[1],p[2]*ca-p[0]*sa]}
 function project(p){const v=rotated(p);return [152+(v[0]-v[2])*.78*S,191+(v[0]+v[2])*.28*S-v[1]*.97*S]}
 function depth(p){const v=rotated(p);return v[0]+v[2]}
 function seen(normal){const n=rotated(normal);return n[0]+n[2]+n[1]*.56>0.01}
 function face(points,color,stroke=true,width=2,normal=null){
   if(normal&&!seen(normal))return;
   faces.push({points,color,stroke,width,depth:points.reduce((t,p)=>t+depth(p),0)/points.length});
 }
 function stroke(points,color='#5c3332',width=2,normal=null){
   if(normal&&!seen(normal))return;
   strokes.push({points,color,width,depth:points.reduce((t,p)=>t+depth(p),0)/points.length+.012});
 }
 function box(x0,x1,y0,y1,z0,z1,col){
   face([[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]],shade(col,1.00),true,2.7,[0,0,1]);
   face([[x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0]],shade(col,.80),true,2.7,[0,0,-1]);
   face([[x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0]],shade(col,.80),true,2.4,[-1,0,0]);
   face([[x1,y0,z1],[x1,y0,z0],[x1,y1,z0],[x1,y1,z1]],shade(col,.85),true,2.4,[1,0,0]);
   face([[x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0]],shade(col,1.15),true,2.4,[0,1,0]);
 }
 function softCushion(x0,x1,z0,z1){
   const y0=.53,y1=.82,bevel=.095;
   box(x0,x1,y0,y1,z0,z1,'#db5140');
   face([[x0+bevel,y1+.045,z1-bevel],[x1-bevel,y1+.045,z1-bevel],[x1-bevel,y1+.045,z0+bevel],[x0+bevel,y1+.045,z0+bevel]],'#ff7955',false,0,[0,1,0]);
   face([[x0+bevel,y1+.045,z1-bevel],[x1-bevel,y1+.045,z1-bevel],[x1,y1-.055,z1],[x0,y1-.055,z1]],'#ed6b4c',false,0,[0,0,1]);
   stroke([[x0+.11,y1-.075,z1+.014],[x0+.24,y1-.13,z1+.026],[x1-.22,y1-.13,z1+.026],[x1-.1,y1-.075,z1+.014]],'#963c32',1.3,[0,0,1]);
 }
 // Feet, body and solid backrest frame.
 for(const x of [-1.30,1.30])for(const z of [-.57,.66])box(x-.10,x+.10,.045,.28,z-.085,z+.085,'#673936');
 box(-1.64,1.64,.24,.58,-.76,.78,'#b43f35');
 box(-1.61,1.61,.36,.66,-.78,-.46,'#b34436');
 // Extruded scalloped upholstery shell, identical around all sides.
 const top=[[-1.63,1.24],[-1.57,1.44],[-1.43,1.56],[-1.19,1.63],[-.97,1.62],[-.77,1.56],[-.61,1.72],[-.37,1.85],[-.10,1.89],[.15,1.88],[.40,1.76],[.59,1.60],[.87,1.62],[1.17,1.60],[1.42,1.49],[1.60,1.33]];
 const shape=[[-1.66,.54],[-1.66,1.07],...top,[1.66,1.08],[1.66,.54]];
 const back=.79,front=.49;
 const backFace=shape.map(([x,y])=>[x,y,-back]);
 const frontFace=shape.map(([x,y])=>[x,y,-front]);
 face(backFace,'#b83b31',true,3,[0,0,-1]);
 if(seen([0,0,-1]))faces[faces.length-1].depth=99;
 face(frontFace,'#d84835',true,3,[0,0,1]);
 // The single large back silhouette must be behind cushions when seen from the front.
 // Sorting by its center incorrectly covers smaller pillows near the far arm.
 if(seen([0,0,1]))faces[faces.length-1].depth=-99;
 for(let i=0;i<shape.length;i++){
   let j=(i+1)%shape.length;
   const a=shape[i],b=shape[j];
   const n=[b[1]-a[1],0,a[0]-b[0]];
   // narrow connecting side surfaces; dark contour line along wavy top
   face([[a[0],a[1],-back],[b[0],b[1],-back],[b[0],b[1],-front],[a[0],a[1],-front]],shade('#be4738',a[1]>1.3?1.1:.82),true,1.9,n);
 }
 // 3 seats, fixed volume at every rotation.
 softCushion(-1.44,-.49,-.50,.68);
 softCushion(-.48,.48,-.50,.68);
 softCushion(.49,1.44,-.50,.68);
 // Rounded rolled arms; tube surface along depth, end disks.
 for(const x of [-1.55,1.55]){
   let ring=[];const n=15,rr=.27,ry=.24;
   for(let j=0;j<n;j++){let t=j*2*Math.PI/n;ring.push([x+rr*Math.cos(t),.99+ry*Math.sin(t)])}
   for(let j=0;j<n;j++){
     let k=(j+1)%n,a=ring[j],b=ring[k];
     const normal=[(a[0]+b[0])/2-x,(a[1]+b[1])/2-.99,0];
     face([[a[0],a[1],-.64],[b[0],b[1],-.64],[b[0],b[1],.78],[a[0],a[1],.78]],shade('#d24c38',.89+.20*Math.max(0,normal[1]/ry)),false,0,normal);
   }
   face(ring.map(([px,py])=>[px,py,-.64]),'#b73e31',true,2.8,[0,0,-1]);
   face(ring.map(([px,py])=>[px,py,.78]),'#e45e45',true,2.8,[0,0,1]);
   box(x-.23,x+.23,.34,.95,.52,.76,'#ba4136');
 }
 // Upholstery buttons and seams on front-facing backrest.
 for(const x of [-.93,0,.93]){
   const y=x===0?1.49:1.36,z=-.475;
   if(seen([0,0,1])){
     face([[x,y-.085,z],[x+.065,y,z],[x,y+.085,z],[x-.065,y,z]],'#7f292b',false,0,[0,0,1]);
     face([[x-.018,y,z+.005],[x,y+.04,z+.005],[x+.017,y,z+.005],[x,y-.04,z+.005]],'#f07855',false,0,[0,0,1]);
   }
 }
 // Two soft, fixed-position throw pillows, shallow 3-D volumes.
 function pillow(x,y,z,w,h,color,tilt){
   const corners=[[-w/2,-h/2],[w/2,-h/2],[w/2,h/2],[-w/2,h/2]].map(([a,b])=>[x+a*Math.cos(tilt)-b*Math.sin(tilt),y+a*Math.sin(tilt)+b*Math.cos(tilt)]);
   const poly=corners.map(([px,py])=>[px,py,z]);
   face(poly,color,true,3,[0,0,1]);
   stroke([poly[0],poly[1]],'#f2a947',1,[0,0,1]);
   return [x,y,z+.025];
 }
 const f=pillow(-1.00,1.11,-.28,.58,.55,'#ffcf58',-.17);
 pillow(.97,1.09,-.285,.55,.58,'#a174c3',.12);
 if(seen([0,0,1])){
   for(let i=0;i<5;i++){
     const t=i*Math.PI*2/5;
     const x=f[0]+Math.cos(t)*.080,y=f[1]+Math.sin(t)*.080,z=f[2];
     face(Array.from({length:9},(_,j)=>[x+.05*Math.cos(j*Math.PI*2/8),y+.05*Math.sin(j*Math.PI*2/8),z]),'#cb7057',true,1,[0,0,1]);
   }
   face(Array.from({length:11},(_,j)=>[f[0]+.037*Math.cos(j*Math.PI*2/10),f[1]+.037*Math.sin(j*Math.PI*2/10),f[2]+.002]),'#7b4f35',false,0,[0,0,1]);
 }
 // Green blanket draped from right arm: supported by geometry, not the viewing angle.
 face([[1.33,1.21,.18],[1.80,1.21,.18],[1.80,1.16,.72],[1.35,1.16,.72]],'#9abc68',true,2,[0,1,0]);
 face([[1.79,1.18,.34],[1.79,.57,.32],[1.79,.54,.79],[1.79,1.15,.79]],'#88aa55',true,2,[1,0,0]);
 for(let k=0;k<5;k++){
   const z=.38+k*.08;
   stroke([[1.80,.57,z],[1.80,.45,z+.01]],'#4f6b35',1.5,[1,0,0]);
 }
 const primitives=[...faces.map(v=>({...v,kind:'face'})),...strokes.map(v=>({...v,kind:'stroke'}))].sort((a,b)=>a.depth-b.depth);
 for(const p of primitives){
   if(!p.points.length)continue;
   const coords=p.points.map(project);
   ctx.beginPath();ctx.moveTo(...coords[0]);for(let i=1;i<coords.length;i++)ctx.lineTo(...coords[i]);
   if(p.kind==='face'){
     ctx.closePath();ctx.fillStyle=p.color;ctx.fill();
     if(p.stroke){ctx.lineWidth=p.width;ctx.strokeStyle='#643a38';ctx.lineJoin='round';ctx.stroke();}
   }else{ctx.lineWidth=p.width;ctx.strokeStyle=p.color;ctx.lineCap='round';ctx.stroke();}
 }
}
function makeSofaSprite(index){
 const work=document.createElement('canvas');work.width=608;work.height=430;
 const c=work.getContext('2d');c.scale(2,2);drawSofa(work,(index%6)*Math.PI/3);
 const data=c.getImageData(0,0,work.width,work.height).data;
 let x0=work.width,y0=work.height,x1=0,y1=0;
 for(let y=0;y<work.height;y++)for(let x=0;x<work.width;x++){
   if(data[(y*work.width+x)*4+3]>20){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y)}
 }
 if(x1<=x0||y1<=y0)throw Error('Failed to render sofa');
 const pad=6;x0=Math.max(0,x0-pad);x1=Math.min(work.width,x1+pad);y0=Math.max(0,y0-pad);y1=Math.min(work.height,y1+pad);
 const sprite=document.createElement('canvas');sprite.width=Math.ceil((x1-x0)/2);sprite.height=Math.ceil((y1-y0)/2);
 sprite.getContext('2d').drawImage(work,x0,y0,x1-x0,y1-y0,0,0,sprite.width,sprite.height);
 sprite.pivotX=(152*2-x0)/2;sprite.pivotY=(191*2-y0)/2;
 return sprite;
}
window.makeSofaSprite=makeSofaSprite;
})();
