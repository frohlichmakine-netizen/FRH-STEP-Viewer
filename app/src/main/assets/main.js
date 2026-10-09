import * as THREE from './vendor/three.module.js';
const $=id=>document.getElementById(id), viewport=$('viewport');
const scene=new THREE.Scene();scene.background=new THREE.Color('#0b1220');
const camera=new THREE.PerspectiveCamera(45,1,.001,1e8);
const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));viewport.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xffffff,0x334466,2.5));
const light=new THREE.DirectionalLight(0xffffff,2);light.position.set(3,4,5);scene.add(light);
const group=new THREE.Group();scene.add(group);
let center=new THREE.Vector3(),radius=1,distance=10,yaw=.7,pitch=.5,pan=new THREE.Vector3(),loaded=false;
function resize(){let w=viewport.clientWidth,h=viewport.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/Math.max(1,h);camera.updateProjectionMatrix()}
window.addEventListener('resize',resize);resize();
function frame(){requestAnimationFrame(frame);let t=center.clone().add(pan),cp=Math.cos(pitch);camera.position.copy(t).add(new THREE.Vector3(cp*Math.sin(yaw),Math.sin(pitch),cp*Math.cos(yaw)).multiplyScalar(distance));camera.up.set(0,1,0);camera.lookAt(t);renderer.render(scene,camera)}frame();
function fit(){if(!loaded)return;pan.set(0,0,0);distance=radius/Math.sin(THREE.MathUtils.degToRad(camera.fov/2))*1.5;camera.near=Math.max(.001,radius/10000);camera.far=Math.max(1000,radius*1000);camera.updateProjectionMatrix()}
function view(name){let v={iso:[.7,.5],front:[0,0],back:[Math.PI,0],left:[-Math.PI/2,0],right:[Math.PI/2,0],top:[0,Math.PI/2-.001]};[yaw,pitch]=v[name]||v.iso}
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>view(b.dataset.view));
$('fit').onclick=fit;
const open=()=>window.AndroidBridge?.openFile();$('open').onclick=open;$('openEmpty').onclick=open;
window.showStatus=t=>{$('busyText').textContent=t;$('busy').classList.remove('hidden');$('error').classList.add('hidden')};
window.showError=t=>{$('busy').classList.add('hidden');$('error').textContent=t;$('error').classList.remove('hidden')};
let occtPromise;
function getOcct(){return occtPromise??=(window.occtimportjs({locateFile:p=>new URL('./vendor/'+p,location.href).href}).catch(e=>{occtPromise=null;throw e}))}
window.loadStepFromAndroid=async(name,size)=>{
window.showStatus('CAD geometrisi işleniyor…');$('filename').textContent=name;
try{
const parser=await getOcct();
const res=await fetch('/model/current.step?t='+Date.now(),{cache:'no-store'});
if(!res.ok)throw Error('Dosya okunamadı');
const data=new Uint8Array(await res.arrayBuffer());
const result=parser.ReadStepFile(data,{linearDeflectionType:'bounding_box_ratio',linearDeflection:0.1,angularDeflection:0.5});
if(!result.success)throw Error('STEP geometrisi çözümlenemedi');
const meshes=[];
for(const m of result.meshes||[]){
const pos=m.attributes?.position?.array,idx=m.index?.array;if(!pos||!idx)continue;
const geom=new THREE.BufferGeometry();geom.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geom.setIndex(idx);
if(m.attributes.normal?.array?.length===pos.length)geom.setAttribute('normal',new THREE.Float32BufferAttribute(m.attributes.normal.array,3));else geom.computeVertexNormals();
const c=m.color||[.68,.78,.85];
const mat=new THREE.MeshStandardMaterial({color:new THREE.Color(c[0],c[1],c[2]),roughness:.72,metalness:.12,side:THREE.DoubleSide});
meshes.push(new THREE.Mesh(geom,mat));
}
if(!meshes.length)throw Error('Görüntülenebilir geometri yok');
for(const m of [...group.children]){group.remove(m);m.geometry.dispose();m.material.dispose()}
meshes.forEach(m=>group.add(m));
let b=new THREE.Box3().setFromObject(group);b.getCenter(center);radius=Math.max(.01,b.getBoundingSphere(new THREE.Sphere()).radius);
loaded=true;view('iso');fit();$('empty').classList.add('hidden');$('busy').classList.add('hidden');
}catch(e){window.showError('Dosya açılamadı: '+(e.message||e))}
};
const active=new Map();let prev=null;
function pair(){let p=[...active.values()];if(p.length!==2)return null;return {x:(p[0].x+p[1].x)/2,y:(p[0].y+p[1].y)/2,d:Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)}}
viewport.addEventListener('pointerdown',e=>{if(!loaded)return;viewport.setPointerCapture(e.pointerId);active.set(e.pointerId,{x:e.clientX,y:e.clientY});prev=active.size===1?{x:e.clientX,y:e.clientY}:pair()});
viewport.addEventListener('pointermove',e=>{if(!active.has(e.pointerId))return;active.set(e.pointerId,{x:e.clientX,y:e.clientY});let now=active.size===1?{x:e.clientX,y:e.clientY}:pair();if(!now||!prev){prev=now;return}
if(active.size===1){yaw-=(now.x-prev.x)*.008;pitch=Math.max(-1.569,Math.min(1.569,pitch+(now.y-prev.y)*.008))}
else{if(now.d>0&&prev.d>0)distance=Math.max(radius*.05,Math.min(radius*500,distance*prev.d/now.d));let scale=2*distance*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))/viewport.clientHeight;camera.updateMatrixWorld();pan.addScaledVector(new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,0),-(now.x-prev.x)*scale).addScaledVector(new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,1),(now.y-prev.y)*scale)}prev=now
});
function end(e){active.delete(e.pointerId);prev=active.size===1?[...active.values()][0]:pair()}
viewport.addEventListener('pointerup',end);viewport.addEventListener('pointercancel',end);
viewport.addEventListener('wheel',e=>{e.preventDefault();distance=Math.max(radius*.05,Math.min(radius*500,distance*Math.exp(e.deltaY*.001)))},{passive:false});
