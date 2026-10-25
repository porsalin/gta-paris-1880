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
const COMP = mat(`uniform sampler2D t; uniform sampler2D bl; uniform sampler2D ao; uniform sampler2D lo; uniform float bs, ex, vig, night, grain, time, sat, gr, aoOn, ts, ssr, wet; uniform vec3 tint; uniform vec2 sunUV, aoPx; varying vec2 vUv;
  vec3 rrt(vec3 v){ vec3 a=v*(v+.0245786)-.000090537; vec3 b=v*(.983729*v+.4329510)+.238081; return a/b; }
  vec3 aces(vec3 c){ const mat3 I=mat3(vec3(.59719,.07600,.02840),vec3(.35458,.90834,.13383),vec3(.04823,.01566,.83777)); const mat3 O=mat3(vec3(1.60475,-.10208,-.00327),vec3(-.53108,1.10813,-.07276),vec3(-.07367,-.00605,1.07602)); c/=.6; return clamp(O*rrt(I*c),0.,1.); }
  vec3 srgb(vec3 c){ return mix(c*12.92, 1.055*pow(c,vec3(1./2.4))-.055, step(.0031308,c)); }
  float h(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
  void main(){ vec4 c4=texture2D(t,vUv); vec3 c=c4.rgb;
    if (ssr > .5 && c4.a < .5) { // Seine: screen-space reflection of the far quay and its facades
      float k=0.; for(int i=1;i<=28;i++){ float o=float(i)*.0055; vec2 u=vUv+vec2(0.,o); if(u.y>1.) break; if(texture2D(t,u).a>.5){ k=o; break; } }
      if (k > 0.) { vec2 ru=vUv+vec2(sin(vUv.y*260.+time*1.7)*.0025+sin(vUv.x*90.-time)*.0012, k*1.55); vec4 rc=texture2D(t,clamp(ru,0.,1.)); if(rc.a>.5) c=mix(c, rc.rgb*vec3(.62,.7,.74)+c*.12, .62*smoothstep(.16,.0,k)*smoothstep(1.,.97,ru.y)); } }
    if (ts > .001) { float f=smoothstep(.28,.5,abs(vUv.y-.5))+smoothstep(.4,.5,abs(vUv.x-.5))*.5; c=mix(c, texture2D(lo,vUv).rgb, clamp(f*ts,0.,1.)); }
    if (aoOn > .5) { float a=0.; a+=texture2D(ao,vUv+aoPx*vec2(-1.,-1.)).r; a+=texture2D(ao,vUv+aoPx*vec2(1.,-1.)).r; a+=texture2D(ao,vUv+aoPx*vec2(-1.,1.)).r; a+=texture2D(ao,vUv+aoPx*vec2(1.,1.)).r; c*=a*.25; }
    vec3 b=texture2D(bl,vUv).rgb; c+=b*bs;
    if (gr > .001) { vec2 dl=(vUv-sunUV)*(1./20.)*.9; vec2 p=vUv; vec3 s=vec3(0.); float w=1.; for(int i=0;i<20;i++){ p-=dl; s+=texture2D(bl,p).rgb*w; w*=.94; } c+=s*(gr*.09)*vec3(1.,.85,.62); }
    c*=ex; c=aces(c);
    c=mix(c, c*c*(3.-2.*c), .22);                                                  // gentle S-curve for depth
    float lg=dot(c,vec3(.2126,.7152,.0722)); c*=mix(mix(vec3(.9,.97,1.08), vec3(1.), smoothstep(.0,.45,lg)), vec3(1.06,1.,.9), smoothstep(.5,1.,lg)*(1.-night*.7)); // split tone: cool shadows, warm highlights
    float l=dot(c,vec3(.2126,.7152,.0722)); c=mix(vec3(l),c,sat);              // saturation
    c=mix(c, c*tint, .55); c=c+ (vec3(.035,.02,0.)*(1.-l)) * (1.-night);           // warm lift in shadows by day
    c=mix(c, c*vec3(.82,.9,1.12), night*.6);                                       // moonlit blue by night
    vec2 q=vUv-.5; c*=1.-vig*dot(q,q)*1.9;                                         // vignette
    c=srgb(clamp(c,0.,1.)); c+=(h(vUv*913.+time)-.5)*grain; gl_FragColor=vec4(c,1.); }`,
  { t: { value: null }, bl: { value: null }, ao: { value: null }, lo: { value: null }, ts: { value: 0 }, ssr: { value: 0 }, wet: { value: 0 }, aoOn: { value: 0 }, aoPx: { value: new THREE.Vector2() }, gr: { value: 0 }, sunUV: { value: new THREE.Vector2(.5, .5) }, bs: { value: .9 }, ex: { value: 1 }, vig: { value: .45 }, night: { value: 0 }, grain: { value: .018 }, time: { value: 0 }, sat: { value: 1.06 }, tint: { value: new THREE.Color(1.03, 1.0, .94) } });
// PAINT: Impressionist oil-on-canvas pass. Brush-direction warp + Kuwahara (picks the calmest quadrant => flat
// dabs of paint with crisp-but-soft edges), muted harmonious palette, lifted shadows, canvas weave and colour bleed.
const PAINT = mat(`uniform sampler2D t; uniform vec2 px; uniform float q, night, time; varying vec2 vUv;
  float h(vec2 p){ vec3 q=fract(vec3(p.xyx)*.1031); q+=dot(q,q.yzx+33.33); return fract((q.x+q.y)*q.z); }
  float n2(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y); }
  void main(){ vec2 sp=vUv/px; // brush strokes: a slowly varying stroke angle; warp along it
    float ang=n2(sp*.012)*6.283; vec2 dir=vec2(cos(ang),sin(ang)); float st=n2(vec2(dot(sp,dir)*.11, dot(sp,vec2(-dir.y,dir.x))*.32)+n2(sp*.02)*7.);
    vec2 uv=vUv+dir*px*(st-.5)*1.4*q;
    vec3 c;
    if (q > 1.5) { vec3 m[4]; vec3 s2[4]; for(int k=0;k<4;k++){ m[k]=vec3(0.); s2[k]=vec3(0.); }
      for(int j=0;j<=2;j++) for(int i=0;i<=2;i++){ vec2 o=(vec2(float(i),float(j))*mat2(dir.x,dir.y,-dir.y,dir.x)*vec2(1.9,.9))*px*1.25;
        vec3 a=texture2D(t,uv+vec2(-o.x,-o.y)).rgb; m[0]+=a; s2[0]+=a*a; vec3 b=texture2D(t,uv+vec2(o.x,-o.y)).rgb; m[1]+=b; s2[1]+=b*b;
        vec3 cc=texture2D(t,uv+vec2(-o.x,o.y)).rgb; m[2]+=cc; s2[2]+=cc*cc; vec3 d=texture2D(t,uv+o).rgb; m[3]+=d; s2[3]+=d*d; }
      float best=1e9; c=vec3(0.); for(int k=0;k<4;k++){ vec3 mu=m[k]/9.; vec3 v=abs(s2[k]/9.-mu*mu); float vs=v.r+v.g+v.b; if(vs<best){best=vs;c=mu;} } }
    else c=texture2D(t,uv).rgb*.6+(texture2D(t,uv+px*vec2(1.5,0)).rgb+texture2D(t,uv-px*vec2(0,1.5)).rgb)*.2;
    // palette: muted, harmonious, no pure blacks; ochre-warm lights, grey-blue shade
    float l=dot(c,vec3(.299,.587,.114)); c=mix(vec3(l),c,.86); c+=(vec3(n2(sp*.035),n2(sp*.035+17.),n2(sp*.035+41.))-.5)*vec3(.035,.025,.04)*min(q,1.); // broken colour
    c=mix(c, mix(vec3(.08,.085,.1)*(1.-night*.5), vec3(1.,.965,.9), c), .7);
    c=mix(c, c*vec3(1.06,1.,.88), smoothstep(.45,.9,l)*(1.-night)); c=mix(c, c*vec3(.86,.9,1.1), 1.-smoothstep(.08,.5,l)); // Caillebotte blue-violet shade
    { float cl=smoothstep(.35,.7,n2(sp*.0022+vec2(time*.012,time*.004))); c*=mix(1.,mix(.84,1.05,cl),1.-night); } // drifting cloud light over the city
    c=mix(c, mix(vec3(.74,.77,.8),vec3(.12,.13,.17),night), .07); // aerial haze
    // canvas weave + pigment granulation + stroke ridges
    float w=sin(sp.x*1.9)*sin(sp.y*1.9); float g=n2(sp*.7); c*=1.+(g-.5)*.035+0.;
    c=mix(c, vec3(.93,.9,.83), .02); // ground of the canvas showing through
    gl_FragColor=vec4(clamp(c,0.,1.),1.); }`, { t: { value: null }, px: { value: new THREE.Vector2() }, q: { value: 2 }, night: { value: 0 }, time: { value: 0 } });
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
export const POST = { paint: 2, on: false, bloom: true, ssao: false, fx: 2, c: null, d: null, ao: null, w: 0, h: 0, rt: null, a: null, b: null, samples: 0, U: COMP.uniforms };
function mkRT(w, h, s = 0, depthTex = false) { const rt = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples: s, depthBuffer: s >= 0, colorSpace: THREE.LinearSRGBColorSpace }); if (depthTex) { rt.depthTexture = new THREE.DepthTexture(w, h); rt.depthTexture.type = THREE.UnsignedIntType; } return rt; }
export function postSize(r, samples) { const v = r.getDrawingBufferSize(new THREE.Vector2()), w = Math.max(1, v.x | 0), h = Math.max(1, v.y | 0);
  if (w === POST.w && h === POST.h && samples === POST.samples && POST.rt && !!POST.ao === !!POST.ssao) return; POST.w = w; POST.h = h; POST.samples = samples;
  for (const k of ['rt', 'a', 'b', 'ao', 'c', 'd', 'p']) if (POST[k]) { POST[k].dispose(); POST[k] = null; }
  POST.rt = mkRT(w, h, samples, POST.ssao); if (POST.ssao) { POST.ao = mkRT(Math.max(1, w >> 1), Math.max(1, h >> 1)); COMP.uniforms.aoPx.value.set(1 / (w >> 1), 1 / (h >> 1)); } const bw = Math.max(1, w >> 2), bh = Math.max(1, h >> 2); POST.p = mkRT(w, h); POST.a = mkRT(bw, bh); POST.b = mkRT(bw, bh); POST.c = mkRT(bw, bh); POST.d = mkRT(bw, bh);
  BRIGHT.uniforms.px.value.set(1 / w, 1 / h); }
function pass(r, m, target) { quad.material = m; r.setRenderTarget(target); r.render(qs, qc); }
export function postRender(r, scene, camera, t) { const tm = r.toneMapping; r.toneMapping = THREE.NoToneMapping;
  r.setRenderTarget(POST.rt); r.render(scene, camera);
  if (POST.bloom) { BRIGHT.uniforms.t.value = POST.rt.texture; pass(r, BRIGHT, POST.a);
    for (let k = 0; k < 2; k++) { BLUR.uniforms.t.value = POST.a.texture; BLUR.uniforms.dir.value.set((1 + k) / POST.a.width, 0); pass(r, BLUR, POST.b);
      BLUR.uniforms.t.value = POST.b.texture; BLUR.uniforms.dir.value.set(0, (1 + k) / POST.a.height); pass(r, BLUR, POST.a); } }
  const tsOn = POST.fx >= 2; if (tsOn) { COPY.uniforms.t.value = POST.rt.texture; pass(r, COPY, POST.c); for (let k = 0; k < 2; k++) { BLUR.uniforms.t.value = POST.c.texture; BLUR.uniforms.dir.value.set((1 + k) / POST.c.width, 0); pass(r, BLUR, POST.d); BLUR.uniforms.t.value = POST.d.texture; BLUR.uniforms.dir.value.set(0, (1 + k) / POST.c.height); pass(r, BLUR, POST.c); } COMP.uniforms.lo.value = POST.c.texture; }
  COMP.uniforms.ts.value = tsOn ? .65 : 0; COMP.uniforms.ssr.value = POST.fx >= 1 ? 1 : 0;
  const aoOn = !!(POST.ssao && POST.ao && POST.rt.depthTexture); if (aoOn) { SSAO.uniforms.dT.value = POST.rt.depthTexture; SSAO.uniforms.pInv.value.copy(camera.projectionMatrixInverse); pass(r, SSAO, POST.ao); COMP.uniforms.ao.value = POST.ao.texture; } COMP.uniforms.aoOn.value = aoOn ? 1 : 0;
  COMP.uniforms.t.value = POST.rt.texture; COMP.uniforms.bl.value = POST.a.texture; COMP.uniforms.bs.value = POST.bloom ? POST.bs ?? .9 : 0; COMP.uniforms.time.value = t % 100;
  if (POST.paint > 0 && POST.p) { pass(r, COMP, POST.p); PAINT.uniforms.t.value = POST.p.texture; PAINT.uniforms.px.value.set(1 / POST.p.width, 1 / POST.p.height); PAINT.uniforms.q.value = POST.paint; PAINT.uniforms.night.value = COMP.uniforms.night.value; PAINT.uniforms.time.value = t % 1000; pass(r, PAINT, null); }
  else pass(r, COMP, null); r.toneMapping = tm; }
