// Post-processing: HDR scene target -> bright-pass bloom (quarter res, separable blur) -> composite
// (ACES filmic tone map, warm Belle-Époque colour grade, vignette, light film grain, sRGB out).
import * as THREE from './vendor/three.module.js';
const VS = `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`;
const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2)); quad.frustumCulled = false;
const qs = new THREE.Scene(); qs.add(quad); const qc = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const mat = (fs, u) => new THREE.ShaderMaterial({ vertexShader: VS, fragmentShader: fs, uniforms: u, depthTest: false, depthWrite: false, toneMapped: false });
const BRIGHT = mat(`uniform sampler2D t; uniform float th; uniform vec2 px; varying vec2 vUv;
  void main(){ vec3 c=vec3(0.); c+=texture2D(t,vUv+px*vec2(-1.,-1.)).rgb; c+=texture2D(t,vUv+px*vec2(1.,-1.)).rgb; c+=texture2D(t,vUv+px*vec2(-1.,1.)).rgb; c+=texture2D(t,vUv+px*vec2(1.,1.)).rgb; c*=.25;
  float l=dot(c,vec3(.2126,.7152,.0722)); gl_FragColor=vec4(c*smoothstep(th,th*2.2,l),1.); }`, { t: { value: null }, th: { value: 1.25 }, px: { value: new THREE.Vector2() } });
const BLUR = mat(`uniform sampler2D t; uniform vec2 dir; varying vec2 vUv;
  void main(){ vec3 c=texture2D(t,vUv).rgb*.2270; c+=(texture2D(t,vUv+dir*1.3846).rgb+texture2D(t,vUv-dir*1.3846).rgb)*.3162; c+=(texture2D(t,vUv+dir*3.2308).rgb+texture2D(t,vUv-dir*3.2308).rgb)*.0703; gl_FragColor=vec4(c,1.); }`, { t: { value: null }, dir: { value: new THREE.Vector2() } });
const COMP = mat(`uniform sampler2D t; uniform sampler2D bl; uniform sampler2D ao; uniform float bs, ex, vig, night, grain, time, sat, gr, aoOn; uniform vec3 tint; uniform vec2 sunUV, aoPx; varying vec2 vUv;
  vec3 rrt(vec3 v){ vec3 a=v*(v+.0245786)-.000090537; vec3 b=v*(.983729*v+.4329510)+.238081; return a/b; }
  vec3 aces(vec3 c){ const mat3 I=mat3(vec3(.59719,.07600,.02840),vec3(.35458,.90834,.13383),vec3(.04823,.01566,.83777)); const mat3 O=mat3(vec3(1.60475,-.10208,-.00327),vec3(-.53108,1.10813,-.07276),vec3(-.07367,-.00605,1.07602)); c/=.6; return clamp(O*rrt(I*c),0.,1.); }
  vec3 srgb(vec3 c){ return mix(c*12.92, 1.055*pow(c,vec3(1./2.4))-.055, step(.0031308,c)); }
  float h(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
  void main(){ vec3 c=texture2D(t,vUv).rgb;
    if (aoOn > .5) { float a=0.; a+=texture2D(ao,vUv+aoPx*vec2(-1.,-1.)).r; a+=texture2D(ao,vUv+aoPx*vec2(1.,-1.)).r; a+=texture2D(ao,vUv+aoPx*vec2(-1.,1.)).r; a+=texture2D(ao,vUv+aoPx*vec2(1.,1.)).r; c*=a*.25; }
    vec3 b=texture2D(bl,vUv).rgb; c+=b*bs;
    if (gr > .001) { vec2 dl=(vUv-sunUV)*(1./20.)*.9; vec2 p=vUv; vec3 s=vec3(0.); float w=1.; for(int i=0;i<20;i++){ p-=dl; s+=texture2D(bl,p).rgb*w; w*=.94; } c+=s*(gr*.09)*vec3(1.,.85,.62); }
    c*=ex; c=aces(c);
    float l=dot(c,vec3(.2126,.7152,.0722)); c=mix(vec3(l),c,sat);              // saturation
    c=mix(c, c*tint, .55); c=c+ (vec3(.035,.02,0.)*(1.-l)) * (1.-night);           // warm lift in shadows by day
    c=mix(c, c*vec3(.82,.9,1.12), night*.6);                                       // moonlit blue by night
    vec2 q=vUv-.5; c*=1.-vig*dot(q,q)*1.9;                                         // vignette
    c=srgb(clamp(c,0.,1.)); c+=(h(vUv*913.+time)-.5)*grain; gl_FragColor=vec4(c,1.); }`,
  { t: { value: null }, bl: { value: null }, ao: { value: null }, aoOn: { value: 0 }, aoPx: { value: new THREE.Vector2() }, gr: { value: 0 }, sunUV: { value: new THREE.Vector2(.5, .5) }, bs: { value: .9 }, ex: { value: 1 }, vig: { value: .45 }, night: { value: 0 }, grain: { value: .018 }, time: { value: 0 }, sat: { value: 1.06 }, tint: { value: new THREE.Color(1.03, 1.0, .94) } });
// SSAO (Ultra): half-res, view-space positions from the depth buffer, 12 spiral taps, normal from depth derivatives
const SSAO = mat(`uniform sampler2D dT; uniform mat4 pInv; uniform float rad, str; varying vec2 vUv;
  vec3 vp(vec2 uv){ float d=texture2D(dT,uv).x; vec4 c=vec4(uv*2.-1., d*2.-1., 1.); vec4 v=pInv*c; return v.xyz/v.w; }
  float h(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
  void main(){ float d0=texture2D(dT,vUv).x; if(d0>=.99999){ gl_FragColor=vec4(1.); return; } vec3 p=vp(vUv); vec3 n=normalize(cross(dFdx(p),dFdy(p)));
    float occ=0., r=rad/max(.5,-p.z), j=h(gl_FragCoord.xy)*6.283;
    for(int i=0;i<12;i++){ float fi=float(i)+.5; float a=fi*2.39996+j; vec2 off=vec2(cos(a),sin(a))*r*sqrt(fi/12.); vec3 q=vp(vUv+off); vec3 v=q-p; float l=length(v); occ+=max(0.,dot(n,v/l)-.12)*smoothstep(rad*3.,0.,l); }
    gl_FragColor=vec4(vec3(clamp(1.-occ/12.*str,0.,1.)),1.); }`, { dT: { value: null }, pInv: { value: new THREE.Matrix4() }, rad: { value: .9 }, str: { value: 1.6 } });
SSAO.extensions = { derivatives: true };
const COPY = mat(`uniform sampler2D t; varying vec2 vUv; void main(){ gl_FragColor=texture2D(t,vUv); }`, { t: { value: null } });
export const POST = { on: false, bloom: true, ssao: false, ao: null, w: 0, h: 0, rt: null, a: null, b: null, samples: 0, U: COMP.uniforms };
function mkRT(w, h, s = 0, depthTex = false) { const rt = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples: s, depthBuffer: s >= 0, colorSpace: THREE.LinearSRGBColorSpace }); if (depthTex) { rt.depthTexture = new THREE.DepthTexture(w, h); rt.depthTexture.type = THREE.UnsignedIntType; } return rt; }
export function postSize(r, samples) { const v = r.getDrawingBufferSize(new THREE.Vector2()), w = Math.max(1, v.x | 0), h = Math.max(1, v.y | 0);
  if (w === POST.w && h === POST.h && samples === POST.samples && POST.rt && !!POST.ao === !!POST.ssao) return; POST.w = w; POST.h = h; POST.samples = samples;
  for (const k of ['rt', 'a', 'b', 'ao']) if (POST[k]) { POST[k].dispose(); POST[k] = null; }
  POST.rt = mkRT(w, h, samples, POST.ssao); if (POST.ssao) { POST.ao = mkRT(Math.max(1, w >> 1), Math.max(1, h >> 1)); COMP.uniforms.aoPx.value.set(1 / (w >> 1), 1 / (h >> 1)); } const bw = Math.max(1, w >> 2), bh = Math.max(1, h >> 2); POST.a = mkRT(bw, bh); POST.b = mkRT(bw, bh);
  BRIGHT.uniforms.px.value.set(1 / w, 1 / h); }
function pass(r, m, target) { quad.material = m; r.setRenderTarget(target); r.render(qs, qc); }
export function postRender(r, scene, camera, t) { const tm = r.toneMapping; r.toneMapping = THREE.NoToneMapping;
  r.setRenderTarget(POST.rt); r.render(scene, camera);
  if (POST.bloom) { BRIGHT.uniforms.t.value = POST.rt.texture; pass(r, BRIGHT, POST.a);
    for (let k = 0; k < 2; k++) { BLUR.uniforms.t.value = POST.a.texture; BLUR.uniforms.dir.value.set((1 + k) / POST.a.width, 0); pass(r, BLUR, POST.b);
      BLUR.uniforms.t.value = POST.b.texture; BLUR.uniforms.dir.value.set(0, (1 + k) / POST.a.height); pass(r, BLUR, POST.a); } }
  const aoOn = !!(POST.ssao && POST.ao && POST.rt.depthTexture); if (aoOn) { SSAO.uniforms.dT.value = POST.rt.depthTexture; SSAO.uniforms.pInv.value.copy(camera.projectionMatrixInverse); pass(r, SSAO, POST.ao); COMP.uniforms.ao.value = POST.ao.texture; } COMP.uniforms.aoOn.value = aoOn ? 1 : 0;
  COMP.uniforms.t.value = POST.rt.texture; COMP.uniforms.bl.value = POST.a.texture; COMP.uniforms.bs.value = POST.bloom ? POST.bs ?? .9 : 0; COMP.uniforms.time.value = t % 100;
  pass(r, COMP, null); r.toneMapping = tm; }
