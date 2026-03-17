"use client";
import { useRef, useState, useCallback, useEffect, useMemo, useReducer } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOM CURSORS  (inline SVG → data-URI)
// Win97: blocky 1-bit arrow with drop shadow pixel
// Mac OS: classic thin arrow with hollow inner
// ─────────────────────────────────────────────────────────────────────────────
const WIN_CURSOR_NORMAL = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='24' viewBox='0 0 20 24'%3E%3Cpolygon points='2,2 2,20 6,16 9,22 11,21 8,15 13,15' fill='white' stroke='black' stroke-width='2' stroke-linejoin='round'/%3E%3Cpolygon points='2,2 2,20 6,16 9,22 11,21 8,15 13,15' fill='white'/%3E%3C/svg%3E") 2 2, default`;

const WIN_CURSOR_POINTER = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='24' viewBox='0 0 20 24'%3E%3Cpolygon points='2,2 2,20 6,16 9,22 11,21 8,15 13,15' fill='white' stroke='black' stroke-width='2' stroke-linejoin='round'/%3E%3Cpolygon points='2,2 2,20 6,16 9,22 11,21 8,15 13,15' fill='%23000080'/%3E%3C/svg%3E") 2 2, pointer`;

const WIN_CURSOR_GRAB = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='22' height='22' viewBox='0 0 22 22'%3E%3Crect x='4' y='10' width='14' height='10' rx='2' fill='white' stroke='black' stroke-width='1.5'/%3E%3Crect x='6' y='6' width='2' height='6' rx='1' fill='white' stroke='black' stroke-width='1.5'/%3E%3Crect x='9' y='4' width='2' height='8' rx='1' fill='white' stroke='black' stroke-width='1.5'/%3E%3Crect x='12' y='5' width='2' height='7' rx='1' fill='white' stroke='black' stroke-width='1.5'/%3E%3Crect x='15' y='7' width='2' height='5' rx='1' fill='white' stroke='black' stroke-width='1.5'/%3E%3C/svg%3E") 8 4, grab`;

const WIN_CURSOR_TEXT = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='20' viewBox='0 0 12 20'%3E%3Cline x1='6' y1='0' x2='6' y2='20' stroke='black' stroke-width='2'/%3E%3Cline x1='2' y1='1' x2='10' y2='1' stroke='black' stroke-width='2'/%3E%3Cline x1='2' y1='19' x2='10' y2='19' stroke='black' stroke-width='2'/%3E%3C/svg%3E") 6 10, text`;

const MAC_CURSOR_NORMAL = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='22' viewBox='0 0 16 22'%3E%3Cpolygon points='1,1 1,18 5,14 8,20 10,19 7,13 12,13' fill='white' stroke='black' stroke-width='1.5' stroke-linejoin='round'/%3E%3C/svg%3E") 1 1, default`;

const MAC_CURSOR_POINTER = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='22' viewBox='0 0 18 22'%3E%3Cpath d='M6 1 L6 13 L4 11 L3 12 L6 17 L8 17 L10 14 L10 7 Q10 6 9 6 Q8 6 8 7 L8 6 Q8 5 7 5 Q6.5 5 6 5.5 L6 5 Q6 4 5 4 Q4 4 4 5 L4 1 Q4 0 5 0 Q6 0 6 1Z' fill='white' stroke='black' stroke-width='1' stroke-linejoin='round'/%3E%3C/svg%3E") 5 0, pointer`;

const MAC_CURSOR_GRAB = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'%3E%3Cpath d='M4 9 Q4 7 6 7 Q6 5 8 5 Q8 3 10 3 Q12 3 12 5 L12 5 Q14 5 14 7 L14 13 Q14 17 10 17 Q6 17 4 13Z' fill='white' stroke='black' stroke-width='1.2'/%3E%3Cpath d='M6 9 L6 7 M8 8 L8 5 M10 8 L10 3 M12 8 L12 5' stroke='black' stroke-width='1'/%3E%3C/svg%3E") 8 6, grab`;

const MAC_CURSOR_TEXT = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='18' viewBox='0 0 10 18'%3E%3Cline x1='5' y1='0' x2='5' y2='18' stroke='black' stroke-width='1.5'/%3E%3Cline x1='1' y1='1' x2='9' y2='1' stroke='black' stroke-width='1.5'/%3E%3Cline x1='1' y1='17' x2='9' y2='17' stroke='black' stroke-width='1.5'/%3E%3C/svg%3E") 5 9, text`;

// ─────────────────────────────────────────────────────────────────────────────
// DITHER ENGINE
// ─────────────────────────────────────────────────────────────────────────────
const PALETTES = {
  bw:      [[0,0,0],[255,255,255]],
  cmyk:    [[0,183,235],[255,0,144],[255,240,0],[0,0,0],[255,255,255]],
  gameboy: [[15,56,15],[48,98,48],[139,172,15],[155,188,15]],
  c64:     [[0,0,0],[255,255,255],[136,0,0],[170,255,238],[204,68,204],[0,204,85],[0,0,170],[238,238,119],[221,136,85],[102,68,0],[255,119,119],[51,51,51],[119,119,119],[170,255,102],[0,136,255],[187,187,187]],
};

const CATEGORIES = ["Halftone","Error Diffusion","Ordered","Pixel Art","Neon Glow"];
const MODES = {
  Halftone:          ["CMYK","Mono"],
  "Error Diffusion": ["Floyd-Steinberg","Atkinson","Sierra","Jarvis"],
  Ordered:           ["Bayer 4x4","Bayer 8x8","Bayer 2x2"],
  "Pixel Art":       ["8-bit","Game Boy","CGA"],
  "Neon Glow":       ["Cyan","Lime","Violet","Rose","Amber","Custom"],
};

// Neon Glow colour map (mode → [r,g,b])
const NEON_COLORS = {
  Cyan:   [0,  220, 240],
  Lime:   [160,255, 0  ],
  Violet: [210,100,255 ],
  Rose:   [255, 60, 180],
  Amber:  [255,180,  0 ],
};

// Presets — each one sets a complete block of settings
const PRESETS = [
  // ── Neon Glow ──────────────────────────────────────────────────────────────
  { name:"Neon Cyan",    emoji:"🩵", category:"Neon Glow", mode:"Cyan",
    cellSize:6,  dotGain:30, blackMix:61, brightness:10, contrast:20, saturation:0,  scale:1,
    cyanAngle:15, magentaAngle:75, yellowAngle:45, blackAngle:45 },
  { name:"Neon Lime",    emoji:"🟢", category:"Neon Glow", mode:"Lime",
    cellSize:5,  dotGain:25, blackMix:61, brightness:15, contrast:25, saturation:0,  scale:1,
    cyanAngle:15, magentaAngle:75, yellowAngle:45, blackAngle:45 },
  { name:"Neon Violet",  emoji:"💜", category:"Neon Glow", mode:"Violet",
    cellSize:7,  dotGain:28, blackMix:61, brightness:5,  contrast:22, saturation:0,  scale:1,
    cyanAngle:15, magentaAngle:75, yellowAngle:45, blackAngle:45 },
  { name:"Neon Rose",    emoji:"🌸", category:"Neon Glow", mode:"Rose",
    cellSize:6,  dotGain:32, blackMix:61, brightness:8,  contrast:20, saturation:0,  scale:1,
    cyanAngle:15, magentaAngle:75, yellowAngle:45, blackAngle:45 },
  { name:"Neon Amber",   emoji:"🔥", category:"Neon Glow", mode:"Amber",
    cellSize:5,  dotGain:35, blackMix:61, brightness:12, contrast:28, saturation:0,  scale:1,
    cyanAngle:15, magentaAngle:75, yellowAngle:45, blackAngle:30 },
  // ── Halftone ───────────────────────────────────────────────────────────────
  { name:"CMYK Press",   emoji:"🖨", category:"Halftone",  mode:"CMYK",
    cellSize:10, dotGain:20, blackMix:61, brightness:0,  contrast:0,  saturation:0,  scale:1,
    cyanAngle:333, magentaAngle:19, yellowAngle:317, blackAngle:45 },
  { name:"Newsprint",    emoji:"📰", category:"Halftone",  mode:"Mono",
    cellSize:8,  dotGain:15, blackMix:61, brightness:-5, contrast:15, saturation:0,  scale:1,
    cyanAngle:45, magentaAngle:45, yellowAngle:45, blackAngle:45 },
  { name:"Fine Print",   emoji:"🔍", category:"Halftone",  mode:"Mono",
    cellSize:4,  dotGain:10, blackMix:61, brightness:0,  contrast:10, saturation:0,  scale:1,
    cyanAngle:45, magentaAngle:45, yellowAngle:45, blackAngle:22 },
  { name:"Coarse Dots",  emoji:"⚫", category:"Halftone",  mode:"Mono",
    cellSize:18, dotGain:5,  blackMix:61, brightness:5,  contrast:20, saturation:0,  scale:1,
    cyanAngle:45, magentaAngle:45, yellowAngle:45, blackAngle:45 },
  { name:"Risograph",    emoji:"🖼", category:"Halftone",  mode:"CMYK",
    cellSize:12, dotGain:40, blackMix:30, brightness:5,  contrast:15, saturation:20, scale:1,
    cyanAngle:15, magentaAngle:75, yellowAngle:0,  blackAngle:45 },
  // ── Error Diffusion ────────────────────────────────────────────────────────
  { name:"Atkinson",     emoji:"🌀", category:"Error Diffusion", mode:"Atkinson",
    cellSize:10, dotGain:20, blackMix:61, brightness:0,  contrast:5,  saturation:0,  scale:1,
    cyanAngle:15, magentaAngle:75, yellowAngle:45, blackAngle:45 },
  { name:"Floyd-Stein",  emoji:"🎲", category:"Error Diffusion", mode:"Floyd-Steinberg",
    cellSize:10, dotGain:20, blackMix:61, brightness:0,  contrast:8,  saturation:10, scale:1,
    cyanAngle:15, magentaAngle:75, yellowAngle:45, blackAngle:45 },
  { name:"Sierra Hi",    emoji:"🏔", category:"Error Diffusion", mode:"Sierra",
    cellSize:10, dotGain:20, blackMix:61, brightness:0,  contrast:12, saturation:5,  scale:1,
    cyanAngle:15, magentaAngle:75, yellowAngle:45, blackAngle:45 },
  // ── Ordered ────────────────────────────────────────────────────────────────
  { name:"Bayer 8×8",    emoji:"▦", category:"Ordered",   mode:"Bayer 8x8",
    cellSize:10, dotGain:20, blackMix:61, brightness:0,  contrast:10, saturation:0,  scale:1,
    cyanAngle:15, magentaAngle:75, yellowAngle:45, blackAngle:45 },
  { name:"Bayer 2×2",    emoji:"▪", category:"Ordered",   mode:"Bayer 2x2",
    cellSize:10, dotGain:20, blackMix:61, brightness:0,  contrast:5,  saturation:0,  scale:1,
    cyanAngle:15, magentaAngle:75, yellowAngle:45, blackAngle:45 },
  // ── Pixel Art ──────────────────────────────────────────────────────────────
  { name:"Game Boy",     emoji:"🎮", category:"Pixel Art", mode:"Game Boy",
    cellSize:10, dotGain:20, blackMix:61, brightness:0,  contrast:10, saturation:-30,scale:3,
    cyanAngle:15, magentaAngle:75, yellowAngle:45, blackAngle:45 },
  { name:"C64 Colors",   emoji:"🕹", category:"Pixel Art", mode:"8-bit",
    cellSize:10, dotGain:20, blackMix:61, brightness:0,  contrast:5,  saturation:30, scale:2,
    cyanAngle:15, magentaAngle:75, yellowAngle:45, blackAngle:45 },
  { name:"CGA Retro",    emoji:"📺", category:"Pixel Art", mode:"CGA",
    cellSize:10, dotGain:20, blackMix:61, brightness:0,  contrast:15, saturation:40, scale:2,
    cyanAngle:15, magentaAngle:75, yellowAngle:45, blackAngle:45 },
];

// ─────────────────────────────────────────────────────────────────────────────
// PRESET_GROUPS — computed once at module level, not inside render
// ─────────────────────────────────────────────────────────────────────────────
const PRESET_GROUPS=[
  {label:"Neon Glow", items:PRESETS.filter(p=>p.category==="Neon Glow")},
  {label:"Halftone",  items:PRESETS.filter(p=>p.category==="Halftone")},
  {label:"Error Diffusion", items:PRESETS.filter(p=>p.category==="Error Diffusion")},
  {label:"Ordered",   items:PRESETS.filter(p=>p.category==="Ordered")},
  {label:"Pixel Art", items:PRESETS.filter(p=>p.category==="Pixel Art")},
];

const BAYER = {
  2:[[0,2],[3,1]],
  4:[[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]],
  8:[[0,32,8,40,2,34,10,42],[48,16,56,24,50,18,58,26],[12,44,4,36,14,46,6,38],[60,28,52,20,62,30,54,22],[3,35,11,43,1,33,9,41],[51,19,59,27,49,17,57,25],[15,47,7,39,13,45,5,37],[63,31,55,23,61,29,53,21]],
};

function nearestColor(r,g,b,palette){
  let best=0,bestD=Infinity;
  for(let i=0;i<palette.length;i++){
    const[pr,pg,pb]=palette[i];
    // Use squared distance — avoids sqrt, same ordering
    const d=(r-pr)**2+(g-pg)**2+(b-pb)**2;
    if(d<bestD){bestD=d;best=i;if(d===0)break;} // early exit on exact match
  }
  return palette[best];
}

function halftoneChannel(d,w,h,ch,angle,cellSize,dotGain){
  const rad=angle*Math.PI/180,cos=Math.cos(rad),sin=Math.sin(rad);
  const out=new Uint8Array(w*h);
  const gainMul=1+dotGain/100;
  const halfCell=cellSize/2;
  for(let y=0;y<h;y++){
    for(let x=0;x<w;x++){
      const rx=cos*x-sin*y,ry=sin*x+cos*y;
      const cx2=Math.round(rx/cellSize)*cellSize,cy2=Math.round(ry/cellSize)*cellSize;
      const ox=cos*cx2+sin*cy2,oy=-sin*cx2+cos*cy2;
      const nx=Math.min(w-1,Math.max(0,Math.round(ox))),ny=Math.min(h-1,Math.max(0,Math.round(oy)));
      const v=d[(ny*w+nx)*4+ch]/255;
      // Use squared comparison — avoids sqrt per pixel
      const dx=x-ox,dy=y-oy;
      const dist2=dx*dx+dy*dy;
      const radius=halfCell*Math.sqrt(1-v)*gainMul; // sqrt only once per cell center sample
      out[y*w+x]=dist2<=(radius*radius)?0:255;
    }
  }
  return out;
}

async function renderDither(srcID,settings){
  const{category,mode,cellSize,dotGain,blackMix,cyanAngle,magentaAngle,yellowAngle,blackAngle,brightness,contrast,saturation,scale,neonColor}=settings;
  const sw=Math.max(1,Math.floor(srcID.width/scale)),sh=Math.max(1,Math.floor(srcID.height/scale));
  const tmp=document.createElement("canvas");tmp.width=sw;tmp.height=sh;
  const tCtx=tmp.getContext("2d");
  const src=document.createElement("canvas");src.width=srcID.width;src.height=srcID.height;
  src.getContext("2d").putImageData(srcID,0,0);
  tCtx.filter=`brightness(${1+brightness/100}) contrast(${1+contrast/100}) saturate(${1+saturation/100})`;
  tCtx.drawImage(src,0,0,sw,sh);tCtx.filter="none";
  const imgData=tCtx.getImageData(0,0,sw,sh);const d=imgData.data;
  const out=new Uint8ClampedArray(sw*sh*4);
  if(category==="Halftone"&&mode==="CMYK"){
    const gD=new Uint8ClampedArray(sw*sh*4);
    for(let i=0;i<sw*sh;i++){const g=Math.round(0.299*d[i*4]+0.587*d[i*4+1]+0.114*d[i*4+2]);gD[i*4]=gD[i*4+1]=gD[i*4+2]=g;gD[i*4+3]=255;}
    const cD=halftoneChannel(d,sw,sh,1,cyanAngle,cellSize,dotGain);
    const mD=halftoneChannel(d,sw,sh,0,magentaAngle,cellSize,dotGain);
    const yD=halftoneChannel(d,sw,sh,2,yellowAngle,cellSize,dotGain);
    const kD=halftoneChannel(gD,sw,sh,0,blackAngle,cellSize*0.9,dotGain);
    const bm=blackMix/100;
    for(let i=0;i<sw*sh;i++){
      let r=255,g=255,b2=255;
      if(cD[i]===0){r-=180;g-=20;b2-=20;}
      if(mD[i]===0){r-=20;g-=180;b2-=20;}
      if(yD[i]===0){r-=20;g-=20;b2-=200;}
      if(kD[i]===0){r=Math.round(r*(1-bm));g=Math.round(g*(1-bm));b2=Math.round(b2*(1-bm));}
      out[i*4]=Math.max(0,r);out[i*4+1]=Math.max(0,g);out[i*4+2]=Math.max(0,b2);out[i*4+3]=255;
    }
  } else if(category==="Halftone"){
    for(let i=0;i<sw*sh;i++){const g=Math.round(0.299*d[i*4]+0.587*d[i*4+1]+0.114*d[i*4+2]);d[i*4]=d[i*4+1]=d[i*4+2]=g;}
    const dots=halftoneChannel(d,sw,sh,0,blackAngle,cellSize,dotGain);
    for(let i=0;i<sw*sh;i++){out[i*4]=out[i*4+1]=out[i*4+2]=dots[i];out[i*4+3]=255;}
  } else if(category==="Error Diffusion"){
    const palette=PALETTES.cmyk;
    const px=new Float32Array(sw*sh*3);
    for(let i=0;i<sw*sh;i++){px[i*3]=d[i*4];px[i*3+1]=d[i*4+1];px[i*3+2]=d[i*4+2];}
    const W=mode==="Atkinson"?[[1,0,1/8],[1,0,2/8],[0,1,-2,1/8],[0,1,-1,1/8],[0,1,0,1/8],[0,2,0,1/8]]:mode==="Sierra"?[[1,0,5/32],[0,1,-2,3/32],[0,1,-1,4/32],[0,1,0,5/32],[0,1,1,4/32],[0,1,2,3/32]]:mode==="Jarvis"?[[1,0,7/48],[2,0,5/48],[0,1,-2,3/48],[0,1,-1,5/48],[0,1,0,7/48],[0,1,1,5/48],[0,1,2,3/48]]:[[1,0,7/16],[0,1,-1,3/16],[0,1,0,5/16],[0,1,1,1/16]];
    for(let y=0;y<sh;y++){
      for(let x=0;x<sw;x++){
        const idx=(y*sw+x)*3;
        const nc=nearestColor(Math.round(px[idx]),Math.round(px[idx+1]),Math.round(px[idx+2]),palette);
        const er=px[idx]-nc[0],eg=px[idx+1]-nc[1],eb=px[idx+2]-nc[2];
        px[idx]=nc[0];px[idx+1]=nc[1];px[idx+2]=nc[2];
        for(const w of W){const nx2=x+w[0],ny2=y+w[1];if(nx2>=0&&nx2<sw&&ny2>=0&&ny2<sh){const ni=(ny2*sw+nx2)*3,wt=w[w.length-1];px[ni]=Math.min(255,Math.max(0,px[ni]+er*wt));px[ni+1]=Math.min(255,Math.max(0,px[ni+1]+eg*wt));px[ni+2]=Math.min(255,Math.max(0,px[ni+2]+eb*wt));}}
      }
      if(y%20===0)await new Promise(r=>setTimeout(r,0));
    }
    for(let i=0;i<sw*sh;i++){out[i*4]=px[i*3];out[i*4+1]=px[i*3+1];out[i*4+2]=px[i*3+2];out[i*4+3]=255;}
  } else if(category==="Ordered"){
    const sMap={"Bayer 2x2":2,"Bayer 4x4":4,"Bayer 8x8":8};
    const size=sMap[mode]||4;const mat=BAYER[size]||BAYER[4];const maxV=size*size;
    const palette=PALETTES.cmyk;
    for(let y=0;y<sh;y++){for(let x=0;x<sw;x++){
      const t2=(mat[y%size][x%size]/maxV-0.5)*80;
      const nc=nearestColor(Math.min(255,Math.max(0,Math.round(d[(y*sw+x)*4]+t2))),Math.min(255,Math.max(0,Math.round(d[(y*sw+x)*4+1]+t2))),Math.min(255,Math.max(0,Math.round(d[(y*sw+x)*4+2]+t2))),palette);
      out[(y*sw+x)*4]=nc[0];out[(y*sw+x)*4+1]=nc[1];out[(y*sw+x)*4+2]=nc[2];out[(y*sw+x)*4+3]=255;
    }}
  } else if(category==="Neon Glow"){
    const [nr,ng,nb] = (mode==="Custom" && neonColor) ? neonColor : (NEON_COLORS[mode]||NEON_COLORS.Cyan);
    const gainMul=1+dotGain/100;
    const halfCell=cellSize/2;
    // Convert to greyscale luminance in-place
    for(let i=0;i<sw*sh;i++){
      const lum=0.299*d[i*4]+0.587*d[i*4+1]+0.114*d[i*4+2];
      d[i*4]=d[i*4+1]=d[i*4+2]=lum;d[i*4+3]=255;
    }
    const angle=blackAngle;
    const rad2=angle*Math.PI/180,cos=Math.cos(rad2),sin=Math.sin(rad2);
    for(let y=0;y<sh;y++){
      for(let x=0;x<sw;x++){
        const rx=cos*x-sin*y,ry=sin*x+cos*y;
        const cx2=Math.round(rx/cellSize)*cellSize,cy2=Math.round(ry/cellSize)*cellSize;
        const ox=cos*cx2+sin*cy2,oy=-sin*cx2+cos*cy2;
        const nx2=Math.min(sw-1,Math.max(0,Math.round(ox))),ny2=Math.min(sh-1,Math.max(0,Math.round(oy)));
        const lum=d[(ny2*sw+nx2)*4]/255;
        const ddx=x-ox,ddy=y-oy;
        const dist2=ddx*ddx+ddy*ddy;
        const radius=halfCell*Math.sqrt(lum)*gainMul;
        const r2=radius*radius;
        if(dist2<=r2){
          const edgeFade=Math.pow(1-(Math.sqrt(dist2)/Math.max(radius,0.001)),0.4);
          const bright=Math.min(255,Math.round(lum*255*edgeFade));
          const pi=(y*sw+x)*4;
          out[pi  ]=Math.round(nr*bright/255);
          out[pi+1]=Math.round(ng*bright/255);
          out[pi+2]=Math.round(nb*bright/255);
          out[pi+3]=255;
        } else {
          const pi=(y*sw+x)*4;
          out[pi]=out[pi+1]=out[pi+2]=0;out[pi+3]=255;
        }
      }
    }
  } else {
    const pMap={"8-bit":"c64","Game Boy":"gameboy","CGA":"cmyk"};
    const palette=PALETTES[pMap[mode]||"c64"];
    const ps=mode==="8-bit"?2:mode==="Game Boy"?3:1;
    for(let y=0;y<sh;y+=ps){for(let x=0;x<sw;x+=ps){
      const nc=nearestColor(d[(y*sw+x)*4],d[(y*sw+x)*4+1],d[(y*sw+x)*4+2],palette);
      for(let dy=0;dy<ps&&y+dy<sh;dy++){for(let dx=0;dx<ps&&x+dx<sw;dx++){
        const i=((y+dy)*sw+(x+dx))*4;out[i]=nc[0];out[i+1]=nc[1];out[i+2]=nc[2];out[i+3]=255;
      }}
    }}
  }
  return new ImageData(out,sw,sh);
}

// ─────────────────────────────────────────────────────────────────────────────
// BACKGROUND REMOVAL ENGINE  — @imgly/background-removal (ML / ONNX, in-browser)
//
// Dynamically imported so it never runs on the server (Next.js safe).
// The library downloads a ~5 MB ONNX model on first use (cached by the browser).
// It returns a Blob (PNG with alpha), which we convert back to ImageData.
// ─────────────────────────────────────────────────────────────────────────────
async function removeBackgroundML(srcID, onProgress){
  // Convert ImageData → Blob (PNG)
  const srcCanvas=document.createElement("canvas");
  srcCanvas.width=srcID.width; srcCanvas.height=srcID.height;
  srcCanvas.getContext("2d").putImageData(srcID,0,0);
  const srcBlob=await new Promise(res=>srcCanvas.toBlob(res,"image/png"));

  // Dynamically import the library (avoids SSR issues)
  const { removeBackground } = await import("@imgly/background-removal");

  const resultBlob = await removeBackground(srcBlob, {
    model: "medium",           // "small" | "medium" — medium = best quality
    output: { format: "image/png", quality: 1 },
    progress: (key, current, total) => {
      if(onProgress && total > 0) onProgress(Math.round((current/total)*100), key);
    },
  });

  // Convert result Blob → ImageData
  const url=URL.createObjectURL(resultBlob);
  return new Promise((resolve, reject)=>{
    const img=new Image();
    img.onload=()=>{
      const cv=document.createElement("canvas");
      cv.width=img.naturalWidth; cv.height=img.naturalHeight;
      cv.getContext("2d").drawImage(img,0,0);
      URL.revokeObjectURL(url);
      resolve(cv.getContext("2d").getImageData(0,0,cv.width,cv.height));
    };
    img.onerror=()=>{ URL.revokeObjectURL(url); reject(new Error("Failed to load result image")); };
    img.src=url;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// DITHER DEFAULTS — module-level so it's never recreated
// ─────────────────────────────────────────────────────────────────────────────
const DITHER_DEFAULTS = {
  category:"Halftone", mode:"CMYK",
  cellSize:10, dotGain:20, blackMix:61,
  cyanAngle:333, magentaAngle:19, yellowAngle:317, blackAngle:45,
  brightness:0, contrast:0, saturation:0, scale:1,
  neonColor:[0,220,240],
};

// ─────────────────────────────────────────────────────────────────────────────
const THEMES = {
  win97: {
    id:"win97",
    desktop:"#008080",
    windowBg:"#c0c0c0",
    titleBg:"linear-gradient(to right,#000080,#1084d0)",
    titleText:"#ffffff",
    titleFont:"'MS Sans Serif',Tahoma,sans-serif",
    titleSize:11, titleBold:true, titlePad:"3px 5px",
    bLight:"#ffffff", bDark:"#808080", bDarkest:"#000000", bRadius:0,
    winShadow:"2px 2px 0 #000000", winRadius:0,
    menuBg:"#c0c0c0", menuHoverBg:"#000080", menuHoverTxt:"#ffffff", menuText:"#000000",
    sidebarBg:"#c0c0c0",
    labelColor:"#000000", sectionColor:"#000080",
    inputBg:"#ffffff", btnBg:"#c0c0c0", btnText:"#000000",
    selectBg:"#ffffff", sliderAccent:"#000080",
    statusBg:"#c0c0c0", canvasBg:"#000080",
    font:"'MS Sans Serif',Tahoma,sans-serif", fontSize:11,
    knobRim:"#808080", knobFace:"#c0c0c0", knobDot:"#000080",
    cursors: {
      default: WIN_CURSOR_NORMAL,
      pointer: WIN_CURSOR_POINTER,
      grab:    WIN_CURSOR_GRAB,
      text:    WIN_CURSOR_TEXT,
    },
  },
  macos: {
    id:"macos",
    desktop:"#336699",
    windowBg:"#dddddd",
    titleBg:"repeating-linear-gradient(to bottom,#d4d0c8 0px,#d4d0c8 1px,#b8b4ac 1px,#b8b4ac 2px)",
    titleText:"#000000",
    titleFont:"'Chicago','Charcoal','Geneva',system-ui,sans-serif",
    titleSize:12, titleBold:false, titlePad:"4px 8px",
    bLight:"#ffffff", bDark:"#888888", bDarkest:"#000000", bRadius:3,
    winShadow:"0 8px 24px rgba(0,0,0,0.45),0 2px 4px rgba(0,0,0,0.3)", winRadius:6,
    menuBg:"#dddddd", menuHoverBg:"#000080", menuHoverTxt:"#ffffff", menuText:"#000000",
    sidebarBg:"#ececec",
    labelColor:"#111111", sectionColor:"#000000",
    inputBg:"#ffffff", btnBg:"#dddddd", btnText:"#000000",
    selectBg:"#ffffff", sliderAccent:"#333333",
    statusBg:"#dddddd", canvasBg:"#2a2a2a",
    font:"'Geneva','Helvetica Neue',Helvetica,sans-serif", fontSize:12,
    knobRim:"#999999", knobFace:"#e0e0e0", knobDot:"#000000",
    cursors: {
      default: MAC_CURSOR_NORMAL,
      pointer: MAC_CURSOR_POINTER,
      grab:    MAC_CURSOR_GRAB,
      text:    MAC_CURSOR_TEXT,
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// BORDER HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function raisedBorder(t){
  if(t.id==="win97")return{borderTop:`2px solid ${t.bLight}`,borderLeft:`2px solid ${t.bLight}`,borderRight:`2px solid ${t.bDark}`,borderBottom:`2px solid ${t.bDark}`};
  return{border:`1px solid #888`,boxShadow:`1px 1px 0 #fff inset,-1px -1px 0 #888 inset`};
}
function sunkenBorder(t){
  if(t.id==="win97")return{borderTop:`2px solid ${t.bDark}`,borderLeft:`2px solid ${t.bDark}`,borderRight:`2px solid ${t.bLight}`,borderBottom:`2px solid ${t.bLight}`};
  return{border:`1px solid #aaa`,boxShadow:`-1px -1px 0 #fff inset,1px 1px 0 #999 inset`};
}

// ─────────────────────────────────────────────────────────────────────────────
// useDrag HOOK  (window dragging)
// ─────────────────────────────────────────────────────────────────────────────
function useDrag(initial){
  const [pos,setPos]=useState(initial);
  const posRef=useRef(initial);
  posRef.current=pos;            // sync update during render — no useEffect lag
  const dragging=useRef(false);
  const off=useRef({x:0,y:0});

  const onMouseDown=useCallback((e)=>{
    if(e.button!==0)return;
    if(e.target.closest("button,input,select,a,label"))return;
    dragging.current=true;
    off.current={x:e.clientX-posRef.current.x,y:e.clientY-posRef.current.y};
    e.preventDefault();
  },[]);

  useEffect(()=>{
    const mv=(e)=>{
      if(!dragging.current)return;
      setPos({
        x:Math.max(0,Math.min(window.innerWidth-200,e.clientX-off.current.x)),
        y:Math.max(0,Math.min(window.innerHeight-60,e.clientY-off.current.y)),
      });
    };
    const up=()=>{dragging.current=false;};
    window.addEventListener("mousemove",mv);
    window.addEventListener("mouseup",up);
    return()=>{window.removeEventListener("mousemove",mv);window.removeEventListener("mouseup",up);};
  },[]);
  return{pos,setPos,onMouseDown};
}

// ─────────────────────────────────────────────────────────────────────────────
// useResize HOOK  (window resizing from SE corner)
// ─────────────────────────────────────────────────────────────────────────────
function useResize(initialW,initialH){
  const [size,setSize]=useState({w:initialW,h:initialH});
  const resizing=useRef(false);
  const start=useRef({x:0,y:0,w:0,h:0});
  const sizeRef=useRef({w:initialW,h:initialH});
  sizeRef.current=size;          // sync update during render

  const onResizeDown=useCallback((e)=>{
    if(e.button!==0)return;
    resizing.current=true;
    start.current={x:e.clientX,y:e.clientY,w:sizeRef.current.w,h:sizeRef.current.h};
    e.preventDefault();e.stopPropagation();
  },[]);

  useEffect(()=>{
    const mv=(e)=>{
      if(!resizing.current)return;
      const dw=e.clientX-start.current.x,dh=e.clientY-start.current.y;
      setSize({w:Math.max(600,start.current.w+dw),h:Math.max(420,start.current.h+dh)});
    };
    const up=()=>{resizing.current=false;};
    window.addEventListener("mousemove",mv);
    window.addEventListener("mouseup",up);
    return()=>{window.removeEventListener("mousemove",mv);window.removeEventListener("mouseup",up);};
  },[]);
  return{size,onResizeDown};
}

// ─────────────────────────────────────────────────────────────────────────────
// KNOB COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
function Knob({label,value,onChange,t}){
  const dragging=useRef(false),startY=useRef(0),startVal=useRef(0);
  const onChangeRef=useRef(onChange);
  onChangeRef.current=onChange; // sync — always latest, no stale closure
  const norm=((value%360)+360)%360/360;
  const angle=norm*300-150,rad=angle*Math.PI/180;
  const cx=18,cy=18,r=12;
  const dotX=cx+r*0.7*Math.sin(rad),dotY=cy-r*0.7*Math.cos(rad);
  const onMD=useCallback((e)=>{
    dragging.current=true;startY.current=e.clientY;startVal.current=value;
    e.preventDefault();e.stopPropagation();
  },[value]);
  useEffect(()=>{
    const mv=(e)=>{
      if(!dragging.current)return;
      const dy=startY.current-e.clientY;
      onChangeRef.current(((Math.round(startVal.current+dy*2.4))%360+360)%360);
    };
    const up=()=>{dragging.current=false;};
    window.addEventListener("mousemove",mv);window.addEventListener("mouseup",up);
    return()=>{window.removeEventListener("mousemove",mv);window.removeEventListener("mouseup",up);};
  },[]); // ← registered once; reads latest onChange via onChangeRef
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
      <span style={{fontSize:10,color:t.labelColor,fontFamily:t.font,whiteSpace:"nowrap"}}>{label}</span>
      <svg width={36} height={36} onMouseDown={onMD}
        style={{cursor:t.cursors.grab,userSelect:"none"}}>
        <circle cx={cx} cy={cy} r={r+4} fill={t.knobRim}/>
        <circle cx={cx} cy={cy} r={r+3} fill={t.bLight}/>
        <circle cx={cx} cy={cy} r={r} fill={t.knobFace} stroke={t.bDark} strokeWidth={1}/>
        <circle cx={dotX} cy={dotY} r={2.5} fill={t.knobDot}/>
      </svg>
      <input type="number" value={value} min={0} max={359}
        onChange={e=>onChange(((Number(e.target.value))%360+360)%360)}
        style={{width:36,textAlign:"center",...sunkenBorder(t),borderRadius:t.bRadius,
          padding:"1px 0",fontSize:10,fontFamily:t.font,background:t.inputBg,
          color:t.labelColor,cursor:t.cursors.text,outline:"none"}}/>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// THEME TOGGLE
// ─────────────────────────────────────────────────────────────────────────────
function ThemeToggle({t,onToggle}){
  const isWin=t.id==="win97";
  return(
    <div onClick={onToggle}
      style={{display:"flex",alignItems:"center",gap:6,padding:"0 6px",userSelect:"none",
        cursor:t.cursors.pointer}}>
      <span style={{fontSize:9,fontFamily:t.font,fontWeight:"bold",letterSpacing:"0.05em",
        color:isWin?"#fff":"rgba(0,0,0,0.5)",textShadow:isWin?"0 1px 2px rgba(0,0,0,0.6)":"none",
        opacity:isWin?1:0.5}}>WIN</span>
      <div style={{width:44,height:20,borderRadius:10,position:"relative",
        background:isWin?"#000080":"#555",...sunkenBorder(t),transition:"background 0.2s"}}>
        <div style={{position:"absolute",top:2,left:isWin?2:22,width:14,height:14,
          borderRadius:"50%",background:isWin?"#ffffff":"#dddddd",
          ...raisedBorder(t),transition:"left 0.18s cubic-bezier(.4,0,.2,1)"}}/>
      </div>
      <span style={{fontSize:9,fontFamily:t.font,fontWeight:"bold",letterSpacing:"0.05em",
        color:isWin?"rgba(0,0,0,0.4)":"#000",opacity:isWin?0.45:1}}>MAC</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED UI ATOMS
// ─────────────────────────────────────────────────────────────────────────────
const EMPTY_STYLE={};
function WinBtn({t,onClick,disabled=false,children,style=EMPTY_STYLE}){
  const [pressed,setPressed]=useState(false);
  const border=pressed?sunkenBorder(t):raisedBorder(t);
  return(
    <button onClick={onClick} disabled={disabled}
      onMouseDown={()=>setPressed(true)} onMouseUp={()=>setPressed(false)} onMouseLeave={()=>setPressed(false)}
      style={{background:t.btnBg,...border,borderRadius:t.bRadius,
        padding:t.id==="win97"?(pressed?"3px 7px 1px 9px":"2px 8px"):"3px 10px",
        cursor:disabled?"not-allowed":t.cursors.pointer,
        fontSize:t.fontSize,fontFamily:t.font,whiteSpace:"nowrap",
        color:disabled?"#808080":t.btnText,
        textShadow:disabled&&t.id==="win97"?"1px 1px 0 #fff":"none",
        outline:"none",...style}}>
      {children}
    </button>
  );
}

function WinSelect({t,value,onChange,options}){
  return(
    <div style={{flex:1,display:"flex",alignItems:"center",gap:4,
      background:t.selectBg,...sunkenBorder(t),borderRadius:t.bRadius,padding:"2px 4px"}}>
      <select value={value} onChange={e=>onChange(e.target.value)}
        style={{flex:1,border:"none",outline:"none",background:"transparent",
          fontSize:t.fontSize,fontFamily:t.font,
          cursor:t.cursors.pointer,color:t.labelColor,appearance:"none"}}>
        {options.map(o=><option key={o} value={o}>{o}</option>)}
      </select>
      <span style={{fontSize:9,color:t.bDark,pointerEvents:"none"}}>▾</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOM SLIDER
// Fully styled — no browser default appearance. Dual-gradient fill track.
// ─────────────────────────────────────────────────────────────────────────────
function SliderRow({t,label,value,min,max,onChange,step=1}){
  const isWin=t.id==="win97";
  const trackRef=useRef(null);
  const rectCache=useRef(null); // cached on mousedown, cleared on mouseup
  const pct=((value-min)/(max-min))*100;

  const valueFromEvent=useCallback((e)=>{
    const rect=rectCache.current||trackRef.current.getBoundingClientRect();
    const ratio=Math.max(0,Math.min(1,(e.clientX-rect.left)/rect.width));
    return Math.round((min+ratio*(max-min))/step)*step;
  },[min,max,step]);

  const handleMouseDown=useCallback((e)=>{
    if(e.button!==0)return;
    rectCache.current=trackRef.current.getBoundingClientRect();
    onChange(valueFromEvent(e));
    const mv=(e2)=>{if(e2.buttons!==1){up();return;}onChange(valueFromEvent(e2));};
    const up=()=>{rectCache.current=null;window.removeEventListener("mousemove",mv);window.removeEventListener("mouseup",up);};
    window.addEventListener("mousemove",mv);
    window.addEventListener("mouseup",up);
  },[onChange,valueFromEvent]);

  const accentFill=isWin?"#000080":"#555555";
  const trackBg=isWin?"#ffffff":"#d0d0d0";
  const thumbBg=isWin?"#c0c0c0":"#f0f0f0";
  const thumbSize=isWin?12:13;
  const trackH=isWin?4:5;

  return(
    <div style={{marginBottom:7,userSelect:"none"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:4}}>
        <span style={{fontSize:t.fontSize-1,color:t.labelColor,fontFamily:t.font,lineHeight:1}}>{label}</span>
        <input type="number" value={value} min={min} max={max} step={step}
          onChange={e=>{const v=Number(e.target.value);if(!isNaN(v))onChange(Math.max(min,Math.min(max,v)));}}
          style={{width:36,textAlign:"right",fontFamily:t.font,fontSize:t.fontSize-1,
            background:t.inputBg,...sunkenBorder(t),borderRadius:t.bRadius,
            padding:"1px 3px",color:t.labelColor,cursor:t.cursors.text,
            outline:"none",border:isWin?"1px inset #808080":"1px solid #aaa",
            MozAppearance:"textfield"}}/>
      </div>
      <div ref={trackRef} onMouseDown={handleMouseDown}
        style={{position:"relative",height:thumbSize+4,display:"flex",
          alignItems:"center",cursor:t.cursors.pointer}}>
        <div style={{
          position:"absolute",left:0,right:0,height:trackH,
          background:trackBg,
          ...(isWin
            ?{borderTop:"1px solid #808080",borderLeft:"1px solid #808080",
               borderBottom:"1px solid #fff",borderRight:"1px solid #fff"}
            :{borderRadius:3,border:"1px solid #bbb",overflow:"hidden"}),
        }}>
          <div style={{
            position:"absolute",left:0,top:0,bottom:0,
            width:`${pct}%`,background:accentFill,
            borderRadius:isWin?0:"3px 0 0 3px",
          }}/>
        </div>
        <div style={{
          position:"absolute",left:`calc(${pct}% - ${thumbSize/2}px)`,
          width:thumbSize,height:thumbSize,background:thumbBg,
          cursor:t.cursors.grab,flexShrink:0,zIndex:1,
          transition:"left 0.05s",
          ...(isWin
            ?{borderTop:"2px solid #fff",borderLeft:"2px solid #fff",
               borderRight:"2px solid #808080",borderBottom:"2px solid #808080"}
            :{borderRadius:"50%",border:"1px solid #999",
               boxShadow:"0 1px 3px rgba(0,0,0,0.3),inset 0 1px 0 rgba(255,255,255,0.8)"}),
        }}/>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COLOR PICKER  (HSV square + hue bar + hex input)
// ─────────────────────────────────────────────────────────────────────────────
function rgbToHsv(r,g,b){
  r/=255;g/=255;b/=255;
  const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;
  let h=0,s=max===0?0:d/max,v=max;
  if(d!==0){
    if(max===r)h=((g-b)/d)%6;
    else if(max===g)h=(b-r)/d+2;
    else h=(r-g)/d+4;
    h=Math.round(h*60);if(h<0)h+=360;
  }
  return[h,s,v];
}
function hsvToRgb(h,s,v){
  const f=(n)=>{const k=(n+h/60)%6;return v-v*s*Math.max(0,Math.min(k,4-k,1));};
  return[Math.round(f(5)*255),Math.round(f(3)*255),Math.round(f(1)*255)];
}
function rgbToHex(r,g,b){return`#${[r,g,b].map(c=>c.toString(16).padStart(2,"0")).join("")}`;}
function hexToRgb(hex){
  const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  return isNaN(r)?null:[r,g,b];
}

function ColorPicker({t,rgb,onChange}){
  const isWin=t.id==="win97";
  const [hue,sat,val]=rgbToHsv(...rgb);
  const [hexInput,setHexInput]=useState(()=>rgbToHex(...rgb));
  const svRef=useRef(null);
  const hRef=useRef(null);
  // Use refs for drag state — avoids re-registering listeners on every pick
  const dragging=useRef(null); // null | "sv" | "h"
  const hsvRef=useRef({hue,sat,val});
  hsvRef.current={hue,sat,val}; // sync during render
  const onChangeRef=useRef(onChange);
  onChangeRef.current=onChange;

  // Keep hex input in sync when rgb changes externally
  useEffect(()=>{ setHexInput(rgbToHex(...rgb)); },[rgb[0],rgb[1],rgb[2]]);

  const hueColor=`hsl(${hue},100%,50%)`;

  // Register drag listeners once
  useEffect(()=>{
    const mv=(e)=>{
      if(!dragging.current)return;
      if(dragging.current==="sv"&&svRef.current){
        const rect=svRef.current.getBoundingClientRect();
        const s=Math.max(0,Math.min(1,(e.clientX-rect.left)/rect.width));
        const v=Math.max(0,Math.min(1,1-(e.clientY-rect.top)/rect.height));
        onChangeRef.current(hsvToRgb(hsvRef.current.hue,s,v));
      }
      if(dragging.current==="h"&&hRef.current){
        const rect=hRef.current.getBoundingClientRect();
        const ratio=Math.max(0,Math.min(1,(e.clientX-rect.left)/rect.width));
        const newH=Math.round(ratio*360);
        onChangeRef.current(hsvToRgb(newH,hsvRef.current.sat,hsvRef.current.val));
      }
    };
    const up=()=>{dragging.current=null;};
    window.addEventListener("mousemove",mv);
    window.addEventListener("mouseup",up);
    return()=>{window.removeEventListener("mousemove",mv);window.removeEventListener("mouseup",up);};
  },[]); // ← registered once only

  const border=isWin
    ?{borderTop:"2px solid #808080",borderLeft:"2px solid #808080",
       borderRight:"2px solid #fff",borderBottom:"2px solid #fff"}
    :{border:"1px solid #999",borderRadius:2};

  return(
    <div style={{display:"flex",flexDirection:"column",gap:6,
      padding:8,...(isWin?raisedBorder(t):{border:"1px solid #aaa",borderRadius:4}),
      background:t.windowBg}}>

      {/* SV square */}
      <div ref={svRef}
        onMouseDown={e=>{
          dragging.current="sv";
          const rect=e.currentTarget.getBoundingClientRect();
          const s=Math.max(0,Math.min(1,(e.clientX-rect.left)/rect.width));
          const v=Math.max(0,Math.min(1,1-(e.clientY-rect.top)/rect.height));
          onChange(hsvToRgb(hue,s,v));
        }}
        style={{position:"relative",width:"100%",height:120,
          background:hueColor,cursor:"crosshair",flexShrink:0,...border}}>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to right,#fff,transparent)"}}/>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,transparent,#000)"}}/>
        <div style={{
          position:"absolute",
          left:`calc(${sat*100}% - 6px)`,top:`calc(${(1-val)*100}% - 6px)`,
          width:12,height:12,
          border:`2px solid ${val>0.4?"#fff":"#888"}`,borderRadius:"50%",
          boxShadow:"0 0 0 1px rgba(0,0,0,0.4)",pointerEvents:"none",
        }}/>
      </div>

      {/* Hue bar */}
      <div ref={hRef}
        onMouseDown={e=>{
          dragging.current="h";
          const rect=e.currentTarget.getBoundingClientRect();
          const ratio=Math.max(0,Math.min(1,(e.clientX-rect.left)/rect.width));
          onChange(hsvToRgb(Math.round(ratio*360),sat,val));
        }}
        style={{position:"relative",height:14,cursor:"ew-resize",flexShrink:0,
          background:"linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)",
          ...border}}>
        <div style={{
          position:"absolute",left:`calc(${(hue/360)*100}% - 5px)`,top:-2,
          width:10,height:18,background:hueColor,
          border:"2px solid #fff",boxShadow:"0 0 0 1px rgba(0,0,0,0.5)",
          borderRadius:isWin?0:2,pointerEvents:"none",
        }}/>
      </div>

      {/* Preview + hex input */}
      <div style={{display:"flex",gap:6,alignItems:"center"}}>
        <div style={{width:28,height:22,flexShrink:0,background:rgbToHex(...rgb),...border}}/>
        <input value={hexInput}
          onChange={e=>{
            setHexInput(e.target.value);
            const parsed=hexToRgb(e.target.value.startsWith("#")?e.target.value:"#"+e.target.value);
            if(parsed)onChange(parsed);
          }}
          onBlur={()=>setHexInput(rgbToHex(...rgb))}
          style={{flex:1,fontFamily:"monospace",fontSize:11,
            background:t.inputBg,...sunkenBorder(t),borderRadius:t.bRadius,
            padding:"2px 4px",color:t.labelColor,outline:"none",
            border:isWin?"1px inset #808080":"1px solid #aaa",
            cursor:t.cursors.text,letterSpacing:"0.05em"}}/>
        <span style={{fontSize:9,fontFamily:"monospace",color:"#888",
          whiteSpace:"nowrap",lineHeight:1.4,textAlign:"right"}}>
          {rgb[0]}<br/>{rgb[1]}<br/>{rgb[2]}
        </span>
      </div>

      {/* Quick neon swatches — fast equality (no JSON.stringify) */}
      <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
        {Object.entries(NEON_COLORS).map(([name,[r,g,b]])=>{
          const active=rgb[0]===r&&rgb[1]===g&&rgb[2]===b;
          return(
            <div key={name} title={name} onClick={()=>onChange([r,g,b])}
              style={{width:18,height:18,cursor:t.cursors.pointer,flexShrink:0,
                background:rgbToHex(r,g,b),
                ...(active?sunkenBorder(t):raisedBorder(t)),
                borderRadius:isWin?0:"50%"}}/>
          );
        })}
        {[["White",[255,255,255]],["Black",[0,0,0]]].map(([name,[r,g,b]])=>(
          <div key={name} title={name} onClick={()=>onChange([r,g,b])}
            style={{width:18,height:18,cursor:t.cursors.pointer,flexShrink:0,
              background:rgbToHex(r,g,b),...raisedBorder(t),borderRadius:isWin?0:"50%"}}/>
        ))}
      </div>
    </div>
  );
}

function Divider({t}){
  return t.id==="win97"
    ?<hr style={{border:"none",borderTop:`1px solid ${t.bDark}`,borderBottom:`1px solid ${t.bLight}`,margin:"6px 0"}}/>
    :<hr style={{border:"none",borderTop:"1px solid #bbb",margin:"6px 0"}}/>;
}

function SectionLabel({t,children}){
  return(
    <div style={{fontWeight:"bold",fontSize:t.id==="win97"?11:10,marginBottom:5,
      color:t.sectionColor,fontFamily:t.font,
      textTransform:t.id==="macos"?"uppercase":"none",
      letterSpacing:t.id==="macos"?"0.07em":"0"}}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE-LEVEL CONSTANTS for components that don't change
// ─────────────────────────────────────────────────────────────────────────────
const MENU_ITEMS     = ["File","Edit","View","Dither","Palette","Help"];
const MAC_MENU_ITEMS = ["🍎","File","Edit","View","Dither","Special","Help"];
const DESKTOP_ICONS_WIN = [
  {id:"dither",label:"DitherBoy",   emoji:"🎨"},
  {id:"mypc",  label:"My Computer", emoji:"💻"},
  {id:"trash", label:"Recycle Bin", emoji:"🗑"},
  {id:"docs",  label:"Documents",   emoji:"📁"},
];
const DESKTOP_ICONS_MAC = [
  {id:"dither",label:"DitherBoy",    emoji:"🎨"},
  {id:"mypc",  label:"Macintosh HD", emoji:"🖥"},
  {id:"trash", label:"Trash",        emoji:"🗑"},
  {id:"docs",  label:"Documents",    emoji:"📁"},
];
// ─────────────────────────────────────────────────────────────────────────────
function TitleBar({t,title,onMouseDown,onMinimize,onMaximize,onClose}){
  const isWin=t.id==="win97";
  return(
    <div onMouseDown={onMouseDown}
      style={{background:t.titleBg,color:t.titleText,padding:t.titlePad,
        display:"flex",alignItems:"center",justifyContent:"space-between",
        fontFamily:t.titleFont,fontSize:t.titleSize,fontWeight:t.titleBold?"bold":"normal",
        userSelect:"none",flexShrink:0,minHeight:isWin?undefined:28,
        cursor:t.cursors.grab}}>
      <div style={{display:"flex",alignItems:"center",gap:6}}>
        {/* Mac: traffic lights */}
        {!isWin&&(
          <div style={{display:"flex",gap:6,marginRight:4}}>
            {[{c:"#ff5f56",cb:onClose},{c:"#ffbd2e",cb:onMinimize},{c:"#27c93f",cb:onMaximize}].map(({c,cb},i)=>(
              <div key={i} onClick={e=>{e.stopPropagation();cb&&cb();}}
                style={{width:12,height:12,borderRadius:"50%",background:c,
                  border:"0.5px solid rgba(0,0,0,0.25)",cursor:t.cursors.pointer,
                  flexShrink:0}}/>
            ))}
          </div>
        )}
        {isWin&&<span style={{fontSize:11,lineHeight:1}}>🎨</span>}
        <span>{title}</span>
      </div>
      {/* Win: control buttons */}
      {isWin&&(
        <div style={{display:"flex",gap:2}}>
          {[{ch:"_",cb:onMinimize},{ch:"□",cb:onMaximize},{ch:"✕",cb:onClose}].map(({ch,cb},i)=>(
            <div key={i} onClick={e=>{e.stopPropagation();cb&&cb();}}
              style={{width:16,height:14,background:t.windowBg,...raisedBorder(t),
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:9,cursor:t.cursors.pointer,fontWeight:"bold",color:"#000",
                userSelect:"none"}}>
              {ch}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MENU BAR
// ─────────────────────────────────────────────────────────────────────────────
function MenuBar({t}){
  const [hov,setHov]=useState(null);
  return(
    <div style={{background:t.menuBg,padding:"2px 4px",display:"flex",
      borderBottom:`1px solid ${t.bDark}`,fontFamily:t.font,fontSize:t.fontSize,flexShrink:0}}>
      {MENU_ITEMS.map(item=>(
        <div key={item} onMouseEnter={()=>setHov(item)} onMouseLeave={()=>setHov(null)}
          style={{padding:"2px 8px",cursor:t.cursors.pointer,
            background:hov===item?t.menuHoverBg:"transparent",
            color:hov===item?t.menuHoverTxt:t.menuText}}>
          {item}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WIN97 TASKBAR
// ─────────────────────────────────────────────────────────────────────────────
function Win97Taskbar({t,windowTitle,minimized,onClickTask,time}){
  return(
    <div style={{position:"fixed",bottom:0,left:0,right:0,height:30,
      background:"#c0c0c0",borderTop:"2px solid #ffffff",
      display:"flex",alignItems:"center",gap:4,padding:"0 4px",
      zIndex:9999,fontFamily:t.font,fontSize:11}}>
      {/* Start button */}
      <button style={{height:22,padding:"0 8px",background:"#c0c0c0",...raisedBorder(t),
        fontFamily:t.font,fontSize:11,fontWeight:"bold",cursor:t.cursors.pointer,
        display:"flex",alignItems:"center",gap:4,outline:"none",color:"#000"}}>
        <span style={{fontSize:13}}>⊞</span> Start
      </button>
      {/* Separator */}
      <div style={{width:2,height:22,borderLeft:"1px solid #808080",borderRight:"1px solid #fff",margin:"0 2px"}}/>
      {/* Task button */}
      <button onClick={onClickTask}
        style={{height:22,padding:"0 10px",background:"#c0c0c0",
          ...(minimized?raisedBorder(t):sunkenBorder(t)),
          fontFamily:t.font,fontSize:11,cursor:t.cursors.pointer,
          maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",
          outline:"none",color:"#000"}}>
        🎨 {windowTitle}
      </button>
      {/* Clock */}
      <div style={{marginLeft:"auto",...sunkenBorder(t),padding:"1px 8px",fontSize:11,
        fontFamily:t.font,color:"#000"}}>
        {time}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAC OS MENU BAR  (top of screen)
// ─────────────────────────────────────────────────────────────────────────────
function MacMenuBar({t,time}){
  const [hov,setHov]=useState(null);
  return(
    <div style={{position:"fixed",top:0,left:0,right:0,height:20,
      background:"white",borderBottom:"1px solid #ccc",
      display:"flex",alignItems:"center",
      fontFamily:t.titleFont,fontSize:12,zIndex:9999,userSelect:"none"}}>
      {MAC_MENU_ITEMS.map((item,i)=>(
        <div key={item} onMouseEnter={()=>setHov(item)} onMouseLeave={()=>setHov(null)}
          style={{padding:"0 10px",height:"100%",display:"flex",alignItems:"center",
            background:hov===item?"#000080":"transparent",
            color:hov===item?"white":"black",cursor:t.cursors.pointer,
            fontWeight:i===0?"bold":"normal"}}>
          {item}
        </div>
      ))}
      <div style={{marginLeft:"auto",padding:"0 12px",fontSize:11,color:"#333",
        fontFamily:t.font}}>{time}</div>
    </div>
  );
}

function DesktopIcons({t,onOpenApp}){
  const isWin=t.id==="win97";
  const icons=isWin?DESKTOP_ICONS_WIN:DESKTOP_ICONS_MAC;
  const [selected,setSelected]=useState(null);
  return(
    <div style={{position:"absolute",top:isWin?8:28,right:8,display:"flex",
      flexDirection:"column",gap:isWin?4:8,alignItems:"center"}}>
      {icons.map(ic=>(
        <div key={ic.id}
          onClick={()=>setSelected(ic.id)}
          onDoubleClick={()=>{if(ic.id==="dither")onOpenApp();}}
          style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,
            padding:"4px 6px",borderRadius:isWin?0:4,userSelect:"none",
            cursor:t.cursors.pointer,
            background:selected===ic.id?(isWin?"#000080":"rgba(0,0,128,0.4)"):"transparent"}}>
          <span style={{fontSize:isWin?24:28,lineHeight:1}}>{ic.emoji}</span>
          <span style={{fontSize:11,fontFamily:t.font,color:"#fff",
            textShadow:"0 1px 3px rgba(0,0,0,0.8)",
            textAlign:"center",maxWidth:64,wordBreak:"break-word",lineHeight:1.2}}>
            {ic.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function DitherBoy(){
  const canvasRef    = useRef(null);
  const thumbRef     = useRef(null);
  const fileInputRef = useRef(null);
  const pendingTimer = useRef(null);

  const [themeId,     setThemeId]    = useState("win97");
  const t = THEMES[themeId];
  const isWin = themeId==="win97";

  // Window state
  const {pos:winPos,setPos:setWinPos,onMouseDown:onTitleMouseDown} = useDrag({x:40,y:isWin?8:28});
  const {size:winSize,onResizeDown} = useResize(920,620);
  const [minimized,  setMinimized]  = useState(false);
  const [maximized,  setMaximized]  = useState(false);

  // Clock
  const [time,setTime] = useState("");
  useEffect(()=>{
    const tick=()=>setTime(new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}));
    tick();const id=setInterval(tick,60000);return()=>clearInterval(id);
  },[]);

  // Image state
  const [srcImageData, setSrcImageData] = useState(null);
  const [imgDims,      setImgDims]      = useState({w:0,h:0});
  const [isDragging,   setIsDragging]   = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status,       setStatus]       = useState("Ready — open an image to begin");
  const [zoom,         setZoom]         = useState(1);
  const [exportFmt,    setExportFmt]    = useState("PNG");
  const [showOriginal, setShowOriginal] = useState(false);
  const origDataRef = useRef(null);

  // ── Dither settings — single useReducer ─────────────────────────────────────
  const [ds, dispatchDs] = useReducer(
    (state, patch) => ({...state, ...patch}),
    DITHER_DEFAULTS
  );
  const { category,mode,cellSize,dotGain,blackMix,
          cyanAngle,magentaAngle,yellowAngle,blackAngle,
          brightness,contrast,saturation,scale,neonColor } = ds;

  // Background removal state
  const [bgRemoved,      setBgRemoved]      = useState(false);
  const [bgRemoving,     setBgRemoving]     = useState(false);
  const [bgProgress,     setBgProgress]     = useState(0);
  const [bgProgressLabel,setBgProgressLabel]= useState("");
  const [bgReplaceFill,  setBgReplaceFill]  = useState("transparent");
  const [bgCustomColor,  setBgCustomColor]  = useState("#ffffff");
  const [bgRemovedData,  setBgRemovedData]  = useState(null);
  const [showBgPanel,    setShowBgPanel]    = useState(false);
  const [lastPreset,     setLastPreset]     = useState(null);

  // Undo/Redo — declared before the render useEffect that writes to them
  const [history,    setHistory]    = useState([]);
  const [historyIdx, setHistoryIdx] = useState(-1);

  // Inject global cursor style — proper cleanup on unmount
  useEffect(()=>{
    let style=document.getElementById("dither-cursor-style");
    const created=!style;
    if(created){style=document.createElement("style");style.id="dither-cursor-style";document.head.appendChild(style);}
    style.textContent=`body{cursor:${t.cursors.default}!important;}input[type=range]{cursor:${t.cursors.pointer}!important;}`;
    return()=>{if(created&&style.parentNode)style.parentNode.removeChild(style);};
  },[t.cursors.default, t.cursors.pointer]);

  // mkSet — memoized per key via a stable cache ref so onChange props are stable
  const mkSetCache=useRef({});
  const mkSet=useCallback((key)=>{
    if(!mkSetCache.current[key]){
      mkSetCache.current[key]=(v)=>{dispatchDs({[key]:v});setLastPreset(null);};
    }
    return mkSetCache.current[key];
  },[]);

  // Load file
  const loadFile=useCallback((file)=>{
    if(!file?.type.startsWith("image/"))return;
    const reader=new FileReader();
    reader.onload=(ev)=>{
      const img=new Image();
      img.onload=()=>{
        const{naturalWidth:w,naturalHeight:h}=img;
        const cv=document.createElement("canvas");cv.width=w;cv.height=h;
        cv.getContext("2d").drawImage(img,0,0);
        const id=cv.getContext("2d").getImageData(0,0,w,h);
        setSrcImageData(id);origDataRef.current=id;
        setImgDims({w,h});setShowOriginal(false);
        setBgRemoved(false);setBgRemovedData(null);setBgRemoving(false);
        setBgProgress(0);setBgProgressLabel("");
        setHistory([]);setHistoryIdx(-1);
        setStatus(`Loaded: ${file.name} (${w}×${h})`);
        if(thumbRef.current){const tc=thumbRef.current;tc.width=90;tc.height=68;tc.getContext("2d").drawImage(img,0,0,90,68);}
      };
      img.src=ev.target.result;
    };
    reader.readAsDataURL(file);
  },[]);

  // Pass ds directly — no need to spread, it's already a plain object
  const settings = ds;

  const handleCat=useCallback((cat)=>{
    dispatchDs({category:cat,mode:MODES[cat][0]});
    setLastPreset(null);
  },[]);
  // mkSet: stable — takes a key string, returns a setter function
  const mkSet=useCallback((key)=>(v)=>{dispatchDs({[key]:v});setLastPreset(null);},[]);

  const applyPreset=useCallback((p)=>{
    dispatchDs({
      category:p.category, mode:p.mode,
      cellSize:p.cellSize, dotGain:p.dotGain, blackMix:p.blackMix,
      brightness:p.brightness, contrast:p.contrast, saturation:p.saturation,
      scale:p.scale,
      cyanAngle:p.cyanAngle, magentaAngle:p.magentaAngle,
      yellowAngle:p.yellowAngle, blackAngle:p.blackAngle,
    });
    setLastPreset(p.name);
  },[]);

  // ── Background Removal ────────────────────────────────────────────────────
  const handleRemoveBg=useCallback(async()=>{
    if(!srcImageData||bgRemoving)return;

    // ── Cache hit: result already exists for this image — just re-enable it ──
    if(bgRemovedData){
      setBgRemoved(true);
      setStatus("Background removed ✓ (cached)");
      return;
    }

    // ── Cache miss: run the ML model ─────────────────────────────────────────
    setBgRemoving(true);
    setBgProgress(0);
    setBgProgressLabel("Initialising…");
    setStatus("Removing background with ML…");
    try{
      const STAGE_LABELS={
        "fetch:model":       "Downloading model…",
        "fetch:chunk":       "Downloading model…",
        "compute:inference": "Running AI segmentation…",
      };
      const result=await removeBackgroundML(srcImageData,(pct,key)=>{
        setBgProgress(pct);
        const label=STAGE_LABELS[key]||"Processing…";
        setBgProgressLabel(label);
        setStatus(`${label} ${pct}%`);
      });
      // Store in state — stays alive until a new image is loaded
      setBgRemovedData(result);
      setBgRemoved(true);
      setBgProgress(100);
      setBgProgressLabel("");
      setStatus("Background removed ✓");
    }catch(e){
      setStatus("BG removal failed: "+e.message);
      console.error(e);
    }finally{
      setBgRemoving(false);
    }
  },[srcImageData,bgRemoving,bgRemovedData]);  // bgRemovedData in deps for cache check

  const handleResetBg=useCallback(()=>{
    // Only toggle the active flag — keep bgRemovedData so re-enabling is instant
    setBgRemoved(false);
    setStatus("Background restored — cached result preserved, click Remove to re-apply instantly");
  },[]);

  // Composite bg-removed image with fill colour before dithering.
  // MUST be before the render useEffect.
  const activeImageData=useMemo(()=>{
    if(!bgRemoved||!bgRemovedData)return srcImageData;
    const{width:w,height:h}=bgRemovedData;
    const cv=document.createElement("canvas");cv.width=w;cv.height=h;
    const ctx=cv.getContext("2d");
    // 1. Paint fill
    if(bgReplaceFill==="black")      {ctx.fillStyle="#000";ctx.fillRect(0,0,w,h);}
    else if(bgReplaceFill==="white") {ctx.fillStyle="#fff";ctx.fillRect(0,0,w,h);}
    else if(bgReplaceFill==="custom"){ctx.fillStyle=bgCustomColor;ctx.fillRect(0,0,w,h);}
    // 2. Composite the masked subject on top via a temp canvas
    //    (putImageData ignores globalCompositeOperation; drawImage respects it)
    const tmp=document.createElement("canvas");tmp.width=w;tmp.height=h;
    tmp.getContext("2d").putImageData(bgRemovedData,0,0);
    ctx.drawImage(tmp,0,0);
    return ctx.getImageData(0,0,w,h);
  },[bgRemoved,bgRemovedData,bgReplaceFill,bgCustomColor,srcImageData]);

  // Render — depends on activeImageData, must come after it
  // Also updates the dithered thumbnail ref after render
  useEffect(()=>{
    if(!activeImageData||showOriginal)return;
    if(pendingTimer.current)clearTimeout(pendingTimer.current);
    pendingTimer.current=setTimeout(async()=>{
      setIsProcessing(true);setStatus("Rendering…");
      try{
        const result=await renderDither(activeImageData,settings);
        const cv=canvasRef.current;if(!cv)return;
        cv.width=result.width;cv.height=result.height;
        cv.getContext("2d").putImageData(result,0,0);
        // Update thumbnail to show dithered result
        if(thumbRef.current){
          const tc=thumbRef.current;tc.width=90;tc.height=68;
          tc.getContext("2d").drawImage(cv,0,0,90,68);
        }
        setStatus(`${result.width}×${result.height} · ${category} · ${mode}${bgRemoved?" · BG removed":""}`);
        // Push to undo history (cap at 20 steps, truncate forward branch on new action)
        setHistory(h=>{
          const branch=h.slice(0,historyIdx+1);
          const next=[...branch,{ds:{...ds},bgRemoved,bgReplaceFill,bgCustomColor}];
          return next.length>20?next.slice(next.length-20):next;
        });
        setHistoryIdx(i=>{
          const newLen=Math.min(i+2,20); // i+1 entries after push, capped at 20
          return newLen-1;
        });
      }catch(e){setStatus("Error: "+e.message);}
      finally{setIsProcessing(false);}
    },80);
  },[activeImageData,settings,showOriginal,category,mode,bgRemoved]);

  // ── Undo / Redo ────────────────────────────────────────────────────────────
  const handleUndo=useCallback(()=>{
    if(historyIdx<=0)return;
    const prev=history[historyIdx-1];
    dispatchDs(prev.ds);
    setBgRemoved(prev.bgRemoved);
    setBgReplaceFill(prev.bgReplaceFill);
    setBgCustomColor(prev.bgCustomColor);
    setHistoryIdx(i=>i-1);
    setStatus("Undo");
  },[history,historyIdx]);

  const handleRedo=useCallback(()=>{
    if(historyIdx>=history.length-1)return;
    const next=history[historyIdx+1];
    dispatchDs(next.ds);
    setBgRemoved(next.bgRemoved);
    setBgReplaceFill(next.bgReplaceFill);
    setBgCustomColor(next.bgCustomColor);
    setHistoryIdx(i=>i+1);
    setStatus("Redo");
  },[history,historyIdx]);

  // ── Export ─────────────────────────────────────────────────────────────────
  const handleExport=useCallback(()=>{
    const cv=canvasRef.current;if(!cv||!srcImageData)return;
    if(exportFmt==="JPEG"&&bgRemoved){
      setStatus("⚠ JPEG doesn't support transparency — switch to PNG to keep removed background");
    }
    const link=document.createElement("a");
    const ext=exportFmt==="PNG"?"png":"jpg";
    link.download=`dithered-${Date.now()}.${ext}`;
    link.href=cv.toDataURL(exportFmt==="PNG"?"image/png":"image/jpeg",0.92);
    link.click();
  },[srcImageData,exportFmt,bgRemoved]);

  // ── Toggle original ────────────────────────────────────────────────────────
  const handleToggleOriginal=useCallback(()=>{
    if(!origDataRef.current)return;
    const next=!showOriginal;
    setShowOriginal(next);
    const cv=canvasRef.current;if(!cv)return;
    if(next){
      cv.width=origDataRef.current.width;cv.height=origDataRef.current.height;
      cv.getContext("2d").putImageData(origDataRef.current,0,0);
      setStatus("Viewing original — toggle again to return to dithered view");
    } else {
      setStatus("Returning to dithered view…");
      cv.width=1;cv.height=1;
    }
  },[showOriginal]);

  // ── Keyboard shortcuts — use refs so listener is registered once, never stale ──
  const handlerRefs=useRef({});
  handlerRefs.current={handleUndo,handleRedo,handleExport,handleToggleOriginal,fileInputRef};
  useEffect(()=>{
    const onKey=(e)=>{
      const ctrl=e.ctrlKey||e.metaKey;
      const{handleUndo,handleRedo,handleExport,handleToggleOriginal,fileInputRef}=handlerRefs.current;
      if(ctrl&&e.key==="z"&&!e.shiftKey){e.preventDefault();handleUndo();}
      if(ctrl&&(e.key==="y"||(e.key==="z"&&e.shiftKey))){e.preventDefault();handleRedo();}
      if(ctrl&&e.key==="o"){e.preventDefault();fileInputRef.current?.click();}
      if(ctrl&&e.key==="s"){e.preventDefault();handleExport();}
      if(ctrl&&e.key==="d"){e.preventDefault();handleToggleOriginal();}
    };
    window.addEventListener("keydown",onKey);
    return()=>window.removeEventListener("keydown",onKey);
  },[]); // ← registered once, never torn down/re-added

  const toggleTheme=()=>{
    const next=themeId==="win97"?"macos":"win97";
    setThemeId(next);
    setWinPos({x:40,y:next==="win97"?8:28});
  };

  // Window controls
  const handleMinimize=()=>setMinimized(m=>!m);
  const handleMaximize=()=>setMaximized(m=>!m);
  const handleClose=()=>setMinimized(true);

  // Computed window geometry
  const winStyle=maximized
    ?{position:"fixed",left:0,top:isWin?0:20,right:0,bottom:isWin?30:0,width:undefined,height:undefined}
    :{position:"absolute",left:winPos.x,top:winPos.y,width:winSize.w,height:winSize.h,
      maxWidth:"calc(100vw - 8px)",maxHeight:`calc(100vh - ${isWin?38:28}px)`};

  // ── Toolbar (inlined JSX — not a component fn, avoids remount on every render) ──
  const toolbarContent=(
    <div style={{background:t.windowBg,padding:"4px 6px",display:"flex",
      alignItems:"center",gap:5,borderBottom:`1px solid ${t.bDark}`,
      flexWrap:"nowrap",flexShrink:0,overflowX:"auto"}}>
      <WinBtn t={t} onClick={()=>fileInputRef.current?.click()} title="Ctrl+O">
        {isWin?"📂 Open…":"⌘ Import…"}
      </WinBtn>
      <WinBtn t={t} disabled={!srcImageData} onClick={handleExport} title="Ctrl+S">
        {isWin?"💾 Save As…":"⌘ Export…"}
      </WinBtn>
      <WinBtn t={t} disabled={!srcImageData} onClick={handleToggleOriginal} title="Ctrl+D">
        {showOriginal?"◑ Dithered":"◑ Original"}
      </WinBtn>
      <WinBtn t={t} disabled={!srcImageData||bgRemoving}
        onClick={bgRemoved?handleResetBg:handleRemoveBg}
        style={bgRemoved?{...sunkenBorder(t),background:isWin?"#000080":"#333",color:"#fff"}:{}}>
        {bgRemoving?"⏳ Removing…":bgRemoved?"✕ Restore BG":bgRemovedData?"⚡ Re-apply BG":"✂ Remove BG"}
      </WinBtn>
      {isWin?<div style={{width:2,height:22,borderLeft:`1px solid ${t.bDark}`,borderRight:`1px solid ${t.bLight}`,margin:"0 2px"}}/>
            :<div style={{width:1,height:20,background:"#bbb",margin:"0 2px"}}/>}
      <WinBtn t={t} disabled={historyIdx<=0} onClick={handleUndo} title="Ctrl+Z">↩</WinBtn>
      <WinBtn t={t} disabled={historyIdx>=history.length-1} onClick={handleRedo} title="Ctrl+Y">↪</WinBtn>
      <select value={exportFmt} onChange={e=>setExportFmt(e.target.value)}
        style={{background:t.inputBg,...sunkenBorder(t),borderRadius:t.bRadius,
          padding:"2px 4px",fontSize:t.fontSize,fontFamily:t.font,
          cursor:t.cursors.pointer,color:t.labelColor,outline:"none"}}>
        <option>PNG</option><option>JPEG</option>
      </select>
      {isWin?<div style={{width:2,height:22,borderLeft:`1px solid ${t.bDark}`,borderRight:`1px solid ${t.bLight}`,margin:"0 2px"}}/>
            :<div style={{width:1,height:20,background:"#bbb",margin:"0 2px"}}/>}
      <div style={{marginLeft:"auto"}}><ThemeToggle t={t} onToggle={toggleTheme}/></div>
    </div>
  );

  // ── Sidebar ───────────────────────────────────────────────────────────────────
  // Defined as JSX, NOT as a component function — avoids remount (scroll reset) on every render
  const sidebarRef = useRef(null);

  const sidebarContent = (
    <div style={{padding:"10px",display:"flex",flexDirection:"column",gap:7}}>

        {/* Thumbnail */}
        <div style={{
          background:isWin?"#000080":"#333",height:68,...sunkenBorder(t),
          borderRadius:t.bRadius,display:"flex",alignItems:"center",
          justifyContent:"center",overflow:"hidden",flexShrink:0,
          backgroundImage:"repeating-conic-gradient(#555 0% 25%,#444 0% 50%)",
          backgroundSize:"12px 12px"}}>
          {srcImageData
            ?<canvas ref={thumbRef} style={{maxWidth:"100%",maxHeight:"100%",imageRendering:"pixelated"}}/>
            :<span style={{color:"#999",fontSize:10,fontFamily:t.font}}>No image</span>}
        </div>

        {/* Import/Export */}
        <WinBtn t={t} onClick={()=>fileInputRef.current?.click()} style={{width:"100%"}}>
          {isWin?"📂 Import":"⌘ Import Image"}
        </WinBtn>
        <div style={{display:"flex",gap:6}}>
          <WinBtn t={t} disabled={!srcImageData} onClick={handleExport} style={{flex:1}}>💾 Export</WinBtn>
          <select value={exportFmt} onChange={e=>setExportFmt(e.target.value)}
            style={{background:t.inputBg,...sunkenBorder(t),borderRadius:t.bRadius,
              padding:"2px 4px",fontSize:t.fontSize-1,fontFamily:t.font,
              cursor:t.cursors.pointer,color:t.labelColor,outline:"none"}}>
            <option>PNG</option><option>JPEG</option>
          </select>
        </div>

        <Divider t={t}/>

        {/* ── Background Removal ──────────────────── */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <SectionLabel t={t}>{isWin?"✂ Background":"BACKGROUND"}</SectionLabel>
          <button onClick={()=>setShowBgPanel(v=>!v)}
            style={{fontSize:10,fontFamily:t.font,background:"none",border:"none",
              cursor:t.cursors.pointer,color:t.labelColor,padding:"0 2px"}}>
            {showBgPanel?"▲":"▼"}
          </button>
        </div>

        {showBgPanel&&<>
          {/* Remove / Restore / Re-apply button */}
          <WinBtn t={t} disabled={!srcImageData||bgRemoving}
            onClick={bgRemoved?handleResetBg:handleRemoveBg}
            style={{width:"100%",justifyContent:"center",
              ...(bgRemoved?{...sunkenBorder(t),background:isWin?"#000080":"#333",color:"#fff"}:{})}}>
            {bgRemoving
              ? "⏳ Processing…"
              : bgRemoved
                ? "✕ Restore Original"
                : bgRemovedData
                  ? "⚡ Re-apply (cached)"
                  : "✂ Remove Background"}
          </WinBtn>

          {/* Cache status badge */}
          {!bgRemoving&&bgRemovedData&&!bgRemoved&&(
            <div style={{display:"flex",alignItems:"center",gap:5,
              padding:"3px 6px",
              background:isWin?"#c0ffc0":"#e8f8e8",
              ...(isWin
                ?{borderTop:"1px solid #008000",borderLeft:"1px solid #008000",
                   borderRight:"1px solid #80ff80",borderBottom:"1px solid #80ff80"}
                :{border:"1px solid #88cc88",borderRadius:3}),
              fontSize:9,fontFamily:t.font,color:isWin?"#004400":"#336633"}}>
              <span>⚡</span>
              <span>Result cached — re-apply is instant, no model re-run</span>
            </div>
          )}

          {/* First-run info — only when no cache exists yet */}
          {!bgRemoving&&!bgRemoved&&!bgRemovedData&&(
            <div style={{fontSize:9,color:"#888",fontFamily:t.font,lineHeight:1.5}}>
              Uses an AI model running locally in your browser. First run downloads ~5 MB model (cached after).
            </div>
          )}

          {/* Progress bar — shown while processing */}
          {bgRemoving&&(
            <div style={{display:"flex",flexDirection:"column",gap:4}}>
              <div style={{fontSize:10,color:t.labelColor,fontFamily:t.font,
                display:"flex",justifyContent:"space-between"}}>
                <span>{bgProgressLabel||"Processing…"}</span>
                <span style={{fontFamily:"monospace"}}>{bgProgress}%</span>
              </div>
              {/* Track */}
              <div style={{height:8,position:"relative",
                background:isWin?"#ffffff":"#d0d0d0",
                ...(isWin
                  ?{borderTop:"1px solid #808080",borderLeft:"1px solid #808080",
                     borderBottom:"1px solid #fff",borderRight:"1px solid #fff"}
                  :{borderRadius:4,border:"1px solid #bbb",overflow:"hidden"})}}>
                <div style={{
                  position:"absolute",top:0,left:0,bottom:0,
                  width:`${bgProgress}%`,
                  background:isWin
                    ?"repeating-linear-gradient(45deg,#000080 0px,#000080 8px,#1084d0 8px,#1084d0 16px)"
                    :"#555",
                  borderRadius:isWin?0:3,
                  transition:"width 0.2s",
                }}/>
              </div>
            </div>
          )}

          {/* Background fill options (only shown after removal) */}
          {bgRemoved&&<>
            <span style={{fontSize:t.fontSize-1,color:t.labelColor,fontFamily:t.font,display:"block",marginTop:4}}>Fill removed area with:</span>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
              {[
                {id:"transparent",label:"Transparent",preview:"repeating-conic-gradient(#ccc 0% 25%,#fff 0% 50%)",previewSize:"6px"},
                {id:"black",      label:"Black",      preview:"#000",previewSize:null},
                {id:"white",      label:"White",      preview:"#fff",previewSize:null},
                {id:"custom",     label:"Custom…",    preview:bgCustomColor,previewSize:null},
              ].map(opt=>(
                <button key={opt.id} onClick={()=>setBgReplaceFill(opt.id)}
                  style={{display:"flex",alignItems:"center",gap:5,padding:"3px 5px",
                    fontFamily:t.font,fontSize:10,cursor:t.cursors.pointer,
                    background:bgReplaceFill===opt.id?(isWin?"#000080":"#333"):t.btnBg,
                    color:bgReplaceFill===opt.id?"#fff":t.btnText,
                    ...(bgReplaceFill===opt.id?sunkenBorder(t):raisedBorder(t)),
                    borderRadius:t.bRadius,outline:"none"}}>
                  <div style={{width:12,height:12,flexShrink:0,border:"1px solid #888",
                    background:opt.preview,backgroundSize:opt.previewSize?`${opt.previewSize} ${opt.previewSize}`:undefined}}/>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
            {bgReplaceFill==="custom"&&(
              <div style={{marginTop:4}}>
                <ColorPicker t={t}
                  rgb={hexToRgb(bgCustomColor)||[255,255,255]}
                  onChange={(rgb)=>setBgCustomColor(rgbToHex(...rgb))}/>
              </div>
            )}
          </>}
        </>}

        <Divider t={t}/>

        {/* ── Presets ─────────────────────────────── */}
        <SectionLabel t={t}>{isWin?"★ Presets":"PRESETS"}</SectionLabel>
        {PRESET_GROUPS.map(grp=>(
          <div key={grp.label}>
            <div style={{fontSize:9,color:t.bDark,fontFamily:t.font,
              textTransform:"uppercase",letterSpacing:"0.08em",
              marginBottom:3,marginTop:2,paddingLeft:1}}>
              {grp.label}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:3,marginBottom:6}}>
              {grp.items.map(p=>{
                const active=lastPreset===p.name;
                return(
                  <button key={p.name} onClick={()=>applyPreset(p)}
                    style={{display:"flex",alignItems:"center",gap:4,
                      padding:"3px 5px",fontFamily:t.font,fontSize:10,
                      cursor:t.cursors.pointer,
                      background:active?(isWin?"#000080":"#333"):t.btnBg,
                      color:active?"#fff":t.btnText,
                      ...(active?sunkenBorder(t):raisedBorder(t)),
                      borderRadius:t.bRadius,outline:"none",textAlign:"left",
                      whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",
                      lineHeight:1.4}}>
                    <span style={{fontSize:12,flexShrink:0}}>{p.emoji}</span>
                    <span style={{overflow:"hidden",textOverflow:"ellipsis"}}>{p.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <Divider t={t}/>

        {/* Style */}
        <SectionLabel t={t}>{isWin?"⚙ Style":"STYLE"}</SectionLabel>

        <div>
          <span style={{fontSize:t.fontSize-1,color:t.labelColor,fontFamily:t.font,display:"block",marginBottom:2}}>Category</span>
          <div style={{display:"flex",gap:4}}>
            <WinSelect t={t} value={category} onChange={handleCat} options={CATEGORIES}/>
            <WinBtn t={t} onClick={()=>{const i=CATEGORIES.indexOf(category);handleCat(CATEGORIES[(i-1+CATEGORIES.length)%CATEGORIES.length]);}}>‹</WinBtn>
            <WinBtn t={t} onClick={()=>{const i=CATEGORIES.indexOf(category);handleCat(CATEGORIES[(i+1)%CATEGORIES.length]);}}>›</WinBtn>
          </div>
        </div>

        <div>
          <span style={{fontSize:t.fontSize-1,color:t.labelColor,fontFamily:t.font,display:"block",marginBottom:2}}>Mode</span>
          <div style={{display:"flex",gap:4}}>
            <WinSelect t={t} value={mode} onChange={v=>{dispatchDs({mode:v});setLastPreset(null);}} options={MODES[category]}/>
            <WinBtn t={t} onClick={()=>{const ms=MODES[category],i=ms.indexOf(mode);dispatchDs({mode:ms[(i-1+ms.length)%ms.length]});setLastPreset(null);}}>‹</WinBtn>
            <WinBtn t={t} onClick={()=>{const ms=MODES[category],i=ms.indexOf(mode);dispatchDs({mode:ms[(i+1)%ms.length]});setLastPreset(null);}}>›</WinBtn>
          </div>
        </div>

        <Divider t={t}/>

        {/* Settings */}
        <SectionLabel t={t}>{isWin?`▼ ${category} Settings`:`▾ ${category.toUpperCase()} SETTINGS`}</SectionLabel>

        {category==="Halftone"&&<>
          <SliderRow t={t} label="Cell Size"  value={cellSize}  min={2}  max={40} onChange={mkSet("cellSize")}/>
          <SliderRow t={t} label="Dot Gain"   value={dotGain}   min={0}  max={100} onChange={mkSet("dotGain")}/>
          {mode==="CMYK"&&<SliderRow t={t} label="Black Mix" value={blackMix} min={0} max={100} onChange={mkSet("blackMix")}/>}
          <div style={{display:"flex",alignItems:"center",gap:6,fontSize:t.fontSize-1,
            color:t.labelColor,fontFamily:t.font,marginBottom:4}}>
            <input type="checkbox" id="phaseOff" style={{accentColor:t.sliderAccent,cursor:t.cursors.pointer}}/>
            <label htmlFor="phaseOff" style={{cursor:t.cursors.pointer}}>Phase Offsets</label>
          </div>
          {mode==="CMYK"?(
            <div style={{display:"flex",gap:4,flexWrap:"wrap",justifyContent:"center",marginTop:4}}>
              <Knob t={t} label="Cyan"    value={cyanAngle}    onChange={mkSet("cyanAngle")}/>
              <Knob t={t} label="Magenta" value={magentaAngle} onChange={mkSet("magentaAngle")}/>
              <Knob t={t} label="Yellow"  value={yellowAngle}  onChange={mkSet("yellowAngle")}/>
              <Knob t={t} label="Black"   value={blackAngle}   onChange={mkSet("blackAngle")}/>
            </div>
          ):(
            <div style={{display:"flex",justifyContent:"center"}}>
              <Knob t={t} label="Angle" value={blackAngle} onChange={mkSet("blackAngle")}/>
            </div>
          )}
        </>}

        {category==="Neon Glow"&&<>
          <SliderRow t={t} label="Cell Size" value={cellSize} min={2} max={40} onChange={mkSet("cellSize")}/>
          <SliderRow t={t} label="Dot Gain"  value={dotGain}  min={0} max={100} onChange={mkSet("dotGain")}/>
          <div style={{display:"flex",justifyContent:"center",marginTop:4}}>
            <Knob t={t} label="Angle" value={blackAngle} onChange={mkSet("blackAngle")}/>
          </div>
          {/* Neon colour picker */}
          <div style={{marginTop:4}}>
            <span style={{fontSize:t.fontSize-1,color:t.labelColor,fontFamily:t.font,
              display:"block",marginBottom:6}}>Glow Color</span>
            <ColorPicker t={t} rgb={
              mode==="Custom"?neonColor:(NEON_COLORS[mode]||NEON_COLORS.Cyan)
            } onChange={(rgb)=>{dispatchDs({neonColor:rgb,mode:"Custom"});setLastPreset(null);}}/>
          </div>
        </>}

        {category!=="Halftone"&&category!=="Neon Glow"&&(
          <div style={{fontSize:t.fontSize-1,color:"#777",fontStyle:"italic",fontFamily:t.font}}>
            {category} · {mode}
          </div>
        )}

        <Divider t={t}/>

        {/* Adjustments */}
        <SectionLabel t={t}>{isWin?"▼ Adjustments":"▾ ADJUSTMENTS"}</SectionLabel>
        <SliderRow t={t} label="Brightness" value={brightness} min={-100} max={100} onChange={mkSet("brightness")}/>
        <SliderRow t={t} label="Contrast"   value={contrast}   min={-100} max={100} onChange={mkSet("contrast")}/>
        <SliderRow t={t} label="Saturation" value={saturation} min={-100} max={100} onChange={mkSet("saturation")}/>
        <SliderRow t={t} label="Downscale"  value={scale}      min={1}    max={8}   onChange={mkSet("scale")}/>

        <Divider t={t}/>

        {/* Info */}
        <SectionLabel t={t}>{isWin?"ℹ Info":"INFO"}</SectionLabel>
        <div style={{fontSize:10,lineHeight:1.8,color:t.labelColor,fontFamily:t.font}}>
          <div>Original: <b>{srcImageData?`${imgDims.w}×${imgDims.h}`:"—"}</b></div>
          <div>Output: <b>{srcImageData?`${Math.floor(imgDims.w/scale)}×${Math.floor(imgDims.h/scale)}`:"—"}</b></div>
          <div>Algorithm: <b>{category}</b></div>
          <div>Mode: <b>{mode}</b></div>
        </div>
      </div>
  ); // end sidebarContent

  // ── Status Bar (inlined JSX — not a component fn) ────────────────────────────
  const statusBarContent=(
    <div style={{background:t.statusBg,borderTop:`1px solid ${t.bDark}`,
      padding:"2px 0",display:"flex",flexShrink:0,alignItems:"center"}}>
      <div style={{flex:1,fontSize:t.fontSize,fontFamily:t.font,color:t.labelColor,
        ...(isWin?{...sunkenBorder(t),padding:"1px 8px",margin:"2px 3px"}:{padding:"2px 10px"}),
      }}>{status}</div>
      {history.length>0&&(
        <div style={{fontSize:t.fontSize-1,fontFamily:t.font,color:t.bDark,
          ...(isWin?{...sunkenBorder(t),padding:"1px 6px",margin:"2px 2px"}:{padding:"2px 8px",borderLeft:"1px solid #bbb"}),
          whiteSpace:"nowrap",
        }}>{historyIdx+1}/{history.length}</div>
      )}
      <div style={{fontSize:t.fontSize-1,fontFamily:t.font,color:t.bDark,
        ...(isWin?{...sunkenBorder(t),padding:"1px 6px",margin:"2px 2px"}:{padding:"2px 8px",borderLeft:"1px solid #bbb"}),
        whiteSpace:"nowrap",letterSpacing:"0.02em",
      }}>{isWin?"Ctrl+Z · Ctrl+S · Ctrl+O":"⌘Z · ⌘S · ⌘O"}</div>
      <div style={{fontSize:t.fontSize,fontFamily:t.font,color:t.labelColor,
        ...(isWin?{...sunkenBorder(t),padding:"1px 8px",margin:"2px 3px"}:{padding:"2px 10px",borderLeft:"1px solid #bbb"}),
        minWidth:90,
      }}>DitherBoy v3.1</div>
      {isWin&&!maximized&&(
        <div onMouseDown={onResizeDown}
          style={{width:14,height:14,flexShrink:0,marginRight:2,cursor:"se-resize",
            display:"flex",alignItems:"flex-end",justifyContent:"flex-end",
            opacity:0.5,userSelect:"none",fontSize:12,lineHeight:1}}>◢</div>
      )}
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  return(
    // Desktop
    <div style={{position:"fixed",inset:0,background:t.desktop,
      fontFamily:t.font,fontSize:t.fontSize,overflow:"hidden",
      transition:"background 0.3s",cursor:t.cursors.default}}>

      {/* Mac OS system menubar */}
      {!isWin&&<MacMenuBar t={t} time={time}/>}

      {/* Desktop icons */}
      <DesktopIcons t={t} onOpenApp={()=>setMinimized(false)}/>

      {/* Desktop watermark */}
      <div style={{position:"absolute",bottom:isWin?36:6,left:8,
        fontSize:10,color:"rgba(255,255,255,0.18)",fontFamily:t.font,
        pointerEvents:"none",letterSpacing:"0.04em"}}>
        {isWin?"DitherBoy™ for Windows 97":"DitherBoy™ for Macintosh"}
      </div>

      {/* ── Draggable Window ── */}
      {!minimized&&(
        <div style={{
          ...winStyle,
          background:t.windowBg,
          ...(isWin
            ?{...raisedBorder(t),boxShadow:t.winShadow}
            :{border:"1px solid #555",borderRadius:t.winRadius,
              boxShadow:t.winShadow,overflow:"hidden"}),
          display:"flex",flexDirection:"column",
          transition:"border-radius 0.2s,box-shadow 0.2s",
          zIndex:100,
        }}>
          <TitleBar t={t} title="DitherBoy — Photo Dithering Studio"
            onMouseDown={maximized?undefined:onTitleMouseDown}
            onMinimize={handleMinimize} onMaximize={handleMaximize} onClose={handleClose}/>
          <MenuBar t={t}/>
          {toolbarContent}

          {/* Body */}
          <div style={{display:"flex",flex:1,overflow:"hidden",minHeight:0}}>

            {/* Canvas area */}
            <div
              onDragOver={e=>{e.preventDefault();setIsDragging(true);}}
              onDragLeave={()=>setIsDragging(false)}
              onDrop={e=>{e.preventDefault();setIsDragging(false);loadFile(e.dataTransfer.files[0]);}}
              onClick={()=>!srcImageData&&fileInputRef.current?.click()}
              style={{flex:1,background:isDragging?"#1010a0":t.canvasBg,
                display:"flex",alignItems:"center",justifyContent:"center",
                position:"relative",overflow:"hidden",
                cursor:srcImageData?t.cursors.default:t.cursors.pointer,
                transition:"background 0.15s"}}>

              {!srcImageData?(
                <div style={{textAlign:"center",display:"flex",flexDirection:"column",
                  alignItems:"center",gap:12,cursor:t.cursors.pointer}}>
                  <svg width={60} height={60} viewBox="0 0 64 64" fill="none">
                    <rect width={64} height={64} rx={isWin?0:8} fill="#555"/>
                    <rect x={8} y={14} width={48} height={36} rx={3} fill="#888"/>
                    <circle cx={22} cy={26} r={5} fill="#666"/>
                    <polyline points="8,44 22,28 34,38 44,28 56,44" fill="none" stroke="#aaa" strokeWidth={2.5}/>
                  </svg>
                  <span style={{fontFamily:t.font,fontSize:13,color:"#bbb"}}>Drop image or click to open</span>
                  <span style={{fontFamily:t.font,fontSize:11,color:"#888"}}>PNG · JPG · GIF · WebP</span>
                </div>
              ):(
                <canvas ref={canvasRef} style={{imageRendering:"pixelated",
                  maxWidth:"100%",maxHeight:"100%",
                  transform:`scale(${zoom})`,transformOrigin:"center center",
                  opacity:isProcessing?0.6:1,transition:"opacity 0.12s"}}/>
              )}

              {isProcessing&&(
                <div style={{position:"absolute",top:10,left:10,
                  background:"rgba(0,0,0,0.65)",color:"white",
                  padding:"3px 10px",borderRadius:isWin?0:4,
                  fontSize:11,fontFamily:t.font}}>
                  ⏳ Rendering…
                </div>
              )}

              {/* Zoom bar */}
              {srcImageData&&(
                <div style={{position:"absolute",bottom:8,left:"50%",transform:"translateX(-50%)",
                  display:"flex",alignItems:"center",gap:4,
                  background:"rgba(0,0,0,0.55)",padding:"3px 8px",
                  borderRadius:isWin?0:6,backdropFilter:"blur(4px)"}}>
                  {[0.25,0.5,1,2].map(z=>(
                    <button key={z} onClick={e=>{e.stopPropagation();setZoom(z);}}
                      style={{background:zoom===z?"rgba(255,255,255,0.3)":"transparent",
                        color:"white",border:"1px solid rgba(255,255,255,0.3)",
                        borderRadius:isWin?0:3,padding:"1px 7px",
                        cursor:t.cursors.pointer,fontSize:10,fontFamily:t.font,outline:"none"}}>
                      {z*100}%
                    </button>
                  ))}
                  <span style={{color:"#aaa",fontSize:10,fontFamily:t.font,
                    marginLeft:4,borderLeft:"1px solid rgba(255,255,255,0.2)",paddingLeft:6}}>
                    {imgDims.w}×{imgDims.h}
                  </span>
                </div>
              )}
            </div>

            {/* ── Sidebar (inlined — no const wrapper to avoid remount on every render) ── */}
            <div ref={sidebarRef}
              style={{width:252,background:t.sidebarBg,borderLeft:`1px solid ${t.bDark}`,
              display:"flex",flexDirection:"column",overflowY:"auto",flexShrink:0,
              scrollbarWidth:"thin",scrollbarColor:`${t.bDark} ${t.windowBg}`}}>
              {sidebarContent}
            </div>
          </div>

          {statusBarContent}

          {/* Mac resize handle (bottom-right corner) */}
          {!isWin&&!maximized&&(
            <div onMouseDown={onResizeDown}
              style={{position:"absolute",bottom:0,right:0,width:14,height:14,
                cursor:"se-resize",display:"flex",alignItems:"flex-end",
                justifyContent:"flex-end",userSelect:"none"}}>
              <svg width={12} height={12} viewBox="0 0 12 12">
                <path d="M12 0 L12 12 L0 12" fill="none" stroke="#888" strokeWidth={1}/>
                <path d="M12 4 L12 12 L4 12" fill="none" stroke="#888" strokeWidth={1}/>
                <path d="M12 8 L12 12 L8 12" fill="none" stroke="#888" strokeWidth={1}/>
              </svg>
            </div>
          )}
        </div>
      )}

      {/* Win97 Taskbar */}
      {isWin&&<Win97Taskbar t={t} windowTitle="DitherBoy" minimized={minimized}
        onClickTask={()=>setMinimized(m=>!m)} time={time}/>}

      <input ref={fileInputRef} type="file" accept="image/*" style={{display:"none"}}
        onChange={e=>loadFile(e.target.files[0])}/>
    </div>
  );
}