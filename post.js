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
const COMP = mat(`uniform sampler2D t; uniform sampler2D bl; uniform float bs, ex, vig, night, grain, time, sat; uniform vec3 tint; varying vec2 vUv;
  vec3 rrt(vec3 v){ vec3 a=v*(v+.0245786)-.000090537; vec3 b=v*(.983729*v+.4329510)+.238081; return a/b; }
  vec3 aces(vec3 c){ const mat3 I=mat3(vec3(.59719,.07600,.02840),vec3(.35458,.90834,.13383),vec3(.04823,.01566,.83777)); const mat3 O=mat3(vec3(1.60475,-.10208,-.00327),vec3(-.53108,1.10813,-.07276),vec3(-.07367,-.00605,1.07602)); c/=.6; return clamp(O*rrt(I*c),0.,1.); }
  vec3 srgb(vec3 c){ return mix(c*12.92, 1.055*pow(c,vec3(1./2.4))-.055, step(.0031308,c)); }
  float h(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
  void main(){ vec3 c=texture2D(t,vUv).rgb; vec3 b=texture2D(bl,vUv).rgb; c+=b*bs; c*=ex; c=aces(c);
    float l=dot(c,vec3(.2126,.7152,.0722)); c=mix(vec3(l),c,sat);              // saturation
    c=mix(c, c*tint, .55); c=c+ (vec3(.035,.02,0.)*(1.-l)) * (1.-night);           // warm lift in shadows by day
    c=mix(c, c*vec3(.82,.9,1.12), night*.6);                                       // moonlit blue by night
    vec2 q=vUv-.5; c*=1.-vig*dot(q,q)*1.9;                                         // vignette
    c=srgb(clamp(c,0.,1.)); c+=(h(vUv*913.+time)-.5)*grain; gl_FragColor=vec4(c,1.); }`,
  { t: { value: null }, bl: { value: null }, bs: { value: .9 }, ex: { value: 1 }, vig: { value: .45 }, night: { value: 0 }, grain: { value: .018 }, time: { value: 0 }, sat: { value: 1.06 }, tint: { value: new THREE.Color(1.03, 1.0, .94) } });
const COPY = mat(`uniform sampler2D t; varying vec2 vUv; void main(){ gl_FragColor=texture2D(t,vUv); }`, { t: { value: null } });
export const POST = { on: false, bloom: true, w: 0, h: 0, rt: null, a: null, b: null, samples: 0, U: COMP.uniforms };
function mkRT(w, h, s = 0) { return new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples: s, depthBuffer: s >= 0, colorSpace: THREE.LinearSRGBColorSpace }); }
export function postSize(r, samples) { const v = r.getDrawingBufferSize(new THREE.Vector2()), w = Math.max(1, v.x | 0), h = Math.max(1, v.y | 0);
  if (w === POST.w && h === POST.h && samples === POST.samples && POST.rt) return; POST.w = w; POST.h = h; POST.samples = samples;
  for (const k of ['rt', 'a', 'b']) if (POST[k]) POST[k].dispose();
  POST.rt = mkRT(w, h, samples); const bw = Math.max(1, w >> 2), bh = Math.max(1, h >> 2); POST.a = mkRT(bw, bh); POST.b = mkRT(bw, bh);
  BRIGHT.uniforms.px.value.set(1 / w, 1 / h); }
function pass(r, m, target) { quad.material = m; r.setRenderTarget(target); r.render(qs, qc); }
export function postRender(r, scene, camera, t) { const tm = r.toneMapping; r.toneMapping = THREE.NoToneMapping;
  r.setRenderTarget(POST.rt); r.render(scene, camera);
  if (POST.bloom) { BRIGHT.uniforms.t.value = POST.rt.texture; pass(r, BRIGHT, POST.a);
    for (let k = 0; k < 2; k++) { BLUR.uniforms.t.value = POST.a.texture; BLUR.uniforms.dir.value.set((1 + k) / POST.a.width, 0); pass(r, BLUR, POST.b);
      BLUR.uniforms.t.value = POST.b.texture; BLUR.uniforms.dir.value.set(0, (1 + k) / POST.a.height); pass(r, BLUR, POST.a); } }
  COMP.uniforms.t.value = POST.rt.texture; COMP.uniforms.bl.value = POST.a.texture; COMP.uniforms.bs.value = POST.bloom ? POST.bs ?? .9 : 0; COMP.uniforms.time.value = t % 100;
  pass(r, COMP, null); r.toneMapping = tm; }
