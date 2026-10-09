import * as THREE from './vendor/three.module.js';
const $=id=>document.getElementById(id), viewport=$('viewport');
const scene=new THREE.Scene();scene.background=new THREE.Color('#0b1220');
const camera=new THREE.PerspectiveCamera(45,1,.001,1e8);
const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));viewport.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xffffff,0x334466,2.5));
const light=new THREE.DirectionalLight(0xffffff,2);light.position.set(3,4,5);scene.add(light);
const pivot=new THREE.Group();scene.add(pivot);
// STEP/SolidWorks uses Z-up; Three.js screen uses Y-up.
const cadFrame=new THREE.Group();cadFrame.rotation.x=-Math.PI/2;pivot.add(cadFrame);
const group=new THREE.Group();cadFrame.add(group);
let center=new THREE.Vector3(),radius=1,distance=10,pan=new THREE.Vector3(),loaded=false;
function resize(){let w=viewport.clientWidth,h=viewport.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/Math.max(1,h);camera.updateProjectionMatrix()}
window.addEventListener('resize',resize);resize();
function frame(){requestAnimationFrame(frame);camera.position.copy(pan).add(new THREE.Vector3(0,0,distance));camera.up.set(0,1,0);camera.lookAt(pan);renderer.render(scene,camera)}frame();
function fit(){if(!loaded)return;pan.set(0,0,0);const halfV=THREE.MathUtils.degToRad(camera.fov/2);const halfH=Math.atan(Math.tan(halfV)*camera.aspect);const smallest=Math.max(.05,Math.min(halfV,halfH));distance=radius/Math.sin(smallest)*1.18;camera.near=Math.max(.001,distance-radius*2);camera.far=Math.max(1000,distance+radius*10);camera.updateProjectionMatrix()}
function view(name){const v={iso:[.615,-Math.PI/4,0],front:[0,0,0],back:[0,Math.PI,0],left:[0,-Math.PI/2,0],right:[0,Math.PI/2,0],top:[Math.PI/2,0,0]};const a=v[name]||v.iso;pivot.quaternion.setFromEuler(new THREE.Euler(a[0],a[1],a[2],'XYZ'));}
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>view(b.dataset.view));
$('fit').onclick=fit;
const open=()=>window.AndroidBridge?.openFile();$('open').onclick=open;$('openEmpty').onclick=open;
window.showStatus=t=>{$('busyText').textContent=t;$('busy').classList.remove('hidden');$('error').classList.add('hidden')};
window.showError=t=>{$('busy').classList.add('hidden');$('error').textContent=t;$('error').classList.remove('hidden')};
// Center of the entire model's geometric extent is the fixed rotation pivot.
function enclosingRadius(bounds,pivot){
 let max=0;
 for(const x of [bounds.min.x,bounds.max.x])
 for(const y of [bounds.min.y,bounds.max.y])
 for(const z of [bounds.min.z,bounds.max.z])
 max=Math.max(max,pivot.distanceToSquared(new THREE.Vector3(x,y,z)));
 return Math.max(.01,Math.sqrt(max));
}
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
// Reset previous model transform before calculating bounds for the new model.
group.position.set(0,0,0);
group.rotation.set(0,0,0);cadFrame.rotation.set(-Math.PI/2,0,0);pivot.rotation.set(0,0,0);pivot.quaternion.identity();
meshes.forEach(m=>group.add(m));
const bounds=new THREE.Box3().setFromObject(group);
// Fixed bounding-box midpoint prevents asymmetric surface density from shifting the pivot.
bounds.getCenter(center);
radius=enclosingRadius(bounds,center);
group.position.copy(center).multiplyScalar(-1);
pivot.position.set(0,0,0);pivot.quaternion.identity();
loaded=true;view('iso');fit();$('empty').classList.add('hidden');$('busy').classList.add('hidden');
}catch(e){window.showError('Dosya açılamadı: '+(e.message||e))}
};
const active=new Map();let prev=null;
function pair(){let p=[...active.values()];if(p.length!==2)return null;return {x:(p[0].x+p[1].x)/2,y:(p[0].y+p[1].y)/2,d:Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)}}
viewport.addEventListener('pointerdown',e=>{if(!loaded)return;viewport.setPointerCapture(e.pointerId);active.set(e.pointerId,{x:e.clientX,y:e.clientY});prev=active.size===1?{x:e.clientX,y:e.clientY}:pair()});
viewport.addEventListener('pointermove',e=>{if(!active.has(e.pointerId))return;active.set(e.pointerId,{x:e.clientX,y:e.clientY});let now=active.size===1?{x:e.clientX,y:e.clientY}:pair();if(!now||!prev){prev=now;return}
if(active.size===1){const dx=now.x-prev.x,dy=now.y-prev.y;const axis=new THREE.Vector3(dy,dx,0);const angle=axis.length()*.008;if(angle>0){axis.normalize();pivot.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(axis,angle)).normalize()}}
else{if(now.d>0&&prev.d>0)distance=Math.max(radius*.05,Math.min(radius*500,distance*prev.d/now.d));let scale=2*distance*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))/viewport.clientHeight;camera.updateMatrixWorld();pan.addScaledVector(new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,0),-(now.x-prev.x)*scale).addScaledVector(new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,1),(now.y-prev.y)*scale)}prev=now
});
function end(e){active.delete(e.pointerId);prev=active.size===1?[...active.values()][0]:pair()}
viewport.addEventListener('pointerup',end);viewport.addEventListener('pointercancel',end);
viewport.addEventListener('wheel',e=>{e.preventDefault();distance=Math.max(radius*.05,Math.min(radius*500,distance*Math.exp(e.deltaY*.001)))},{passive:false});
