// src/utils/color.js
// Color manipulation utilities for 1970s glow effect

function hexToHsl(hex){
  let c = hex.replace('#','');
  if (c.length === 3) c = c.split('').map(x=>x+x).join('');
  const num = parseInt(c,16);
  const r = (num >> 16) & 255, g = (num >> 8) & 255, b = num & 255;
  const rn=r/255, gn=g/255, bn=b/255;
  const max = Math.max(rn,gn,bn), min = Math.min(rn,gn,bn);
  let h,s,l = (max+min)/2;
  if(max===min){ h=0; s=0; }
  else{
    const d = max-min;
    s = l>0.5 ? d/(2-max-min) : d/(max+min);
    switch(max){
      case rn: h = (gn-bn)/d + (gn<bn?6:0); break;
      case gn: h = (bn-rn)/d + 2; break;
      case bn: h = (rn-gn)/d + 4; break;
    }
    h = h*60;
  }
  return {h, s, l};
}

function hslToHex(h,s,l){
  h = (h%360+360)%360;
  const c = (1 - Math.abs(2*l - 1)) * s;
  const x = c * (1 - Math.abs((h/60)%2 - 1));
  const m = l - c/2;
  let [r,g,b]=[0,0,0];
  if (0<=h && h<60) [r,g,b]=[c,x,0];
  else if (60<=h && h<120) [r,g,b]=[x,c,0];
  else if (120<=h && h<180) [r,g,b]=[0,c,x];
  else if (180<=h && h<240) [r,g,b]=[0,x,c];
  else if (240<=h && h<300) [r,g,b]=[x,0,c];
  else [r,g,b]=[c,0,x];
  const toHex = v => ('0'+Math.round((v+m)*255).toString(16)).slice(-2);
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** From a base hex, create near/far glow shades (same hue, higher sat, darker) */
export function deriveGlowFromBase(baseHex){
  const {h,s,l} = hexToHsl(baseHex);
  const s1 = Math.min(1, s + 0.15);
  const s2 = Math.min(1, s + 0.35);
  const l1 = Math.max(0, l + 0.01);
  const l2 = Math.max(0, l + 0.01);
  return {
    glow1: hslToHex(h, s1, l1),
    glow2: hslToHex(h, s2, l2)
  };
}
