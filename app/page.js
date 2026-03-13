"use client";
import { useRef, useState, useCallback, useEffect, useMemo } from "react";

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

const CATEGORIES = ["Halftone","Error Diffusion","Ordered","Pixel Art"];
const MODES = {
  Halftone:          ["CMYK","Mono"],
  "Error Diffusion": ["Floyd-Steinberg","Atkinson","Sierra","Jarvis"],
  Ordered:           ["Bayer 4x4","Bayer 8x8","Bayer 2x2"],
  "Pixel Art":       ["8-bit","Game Boy","CGA"],
};

const BAYER = {
  2:[[0,2],[3,1]],
  4:[[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]],
  8:[[0,32,8,40,2,34,10,42],[48,16,56,24,50,18,58,26],[12,44,4,36,14,46,6,38],[60,28,52,20,62,30,54,22],[3,35,11,43,1,33,9,41],[51,19,59,27,49,17,57,25],[15,47,7,39,13,45,5,37],[63,31,55,23,61,29,53,21]],
};

function nearestColor(r,g,b,palette){
  let best=0,bestD=Infinity;
  for(let i=0;i<palette.length;i++){
    const[pr,pg,pb]=palette[i];const d=(r-pr)**2+(g-pg)**2+(b-pb)**2;
    if(d<bestD){bestD=d;best=i;}
  }
  return palette[best];
}

function halftoneChannel(d,w,h,ch,angle,cellSize,dotGain){
  const rad=angle*Math.PI/180,cos=Math.cos(rad),sin=Math.sin(rad);
  const out=new Uint8Array(w*h);
  for(let y=0;y<h;y++){
    for(let x=0;x<w;x++){
      const rx=cos*x-sin*y,ry=sin*x+cos*y;
      const cx2=Math.round(rx/cellSize)*cellSize,cy2=Math.round(ry/cellSize)*cellSize;
      const ox=cos*cx2+sin*cy2,oy=-sin*cx2+cos*cy2;
      const nx=Math.min(w-1,Math.max(0,Math.round(ox))),ny=Math.min(h-1,Math.max(0,Math.round(oy)));
      const v=d[(ny*w+nx)*4+ch]/255;
      const r2=Math.sqrt((x-ox)**2+(y-oy)**2);
      const radius=(cellSize/2)*Math.sqrt(1-v)*(1+dotGain/100);
      out[y*w+x]=r2<=radius?0:255;
    }
  }
  return out;
}

async function renderDither(srcID,settings){
  const{category,mode,cellSize,dotGain,blackMix,cyanAngle,magentaAngle,yellowAngle,blackAngle,brightness,contrast,saturation,scale}=settings;
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
// THEME DEFINITIONS
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
  const dragging=useRef(false);
  const off=useRef({x:0,y:0});
  const onMouseDown=useCallback((e)=>{
    if(e.button!==0)return;
    if(e.target.closest("button,input,select,a,label"))return;
    dragging.current=true;
    off.current={x:e.clientX-pos.x,y:e.clientY-pos.y};
    e.preventDefault();
  },[pos]);
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
  const onResizeDown=useCallback((e)=>{
    if(e.button!==0)return;
    resizing.current=true;
    start.current={x:e.clientX,y:e.clientY,w:size.w,h:size.h};
    e.preventDefault();e.stopPropagation();
  },[size]);
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
  const norm=((value%360)+360)%360/360;
  const angle=norm*300-150,rad=angle*Math.PI/180;
  const cx=18,cy=18,r=12;
  const dotX=cx+r*0.7*Math.sin(rad),dotY=cy-r*0.7*Math.cos(rad);
  const onMD=(e)=>{dragging.current=true;startY.current=e.clientY;startVal.current=value;e.preventDefault();e.stopPropagation();};
  useEffect(()=>{
    const mv=(e)=>{if(!dragging.current)return;const dy=startY.current-e.clientY;onChange(((Math.round(startVal.current+dy*2.4))%360+360)%360);};
    const up=()=>{dragging.current=false;};
    window.addEventListener("mousemove",mv);window.addEventListener("mouseup",up);
    return()=>{window.removeEventListener("mousemove",mv);window.removeEventListener("mouseup",up);};
  },[onChange]);
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
function WinBtn({t,onClick,disabled=false,children,style={}}){
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

function SliderRow({t,label,value,min,max,onChange,step=1}){
  return(
    <div style={{marginBottom:6}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
        <span style={{fontSize:t.fontSize-1,color:t.labelColor,fontFamily:t.font}}>{label}</span>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:6}}>
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={e=>onChange(Number(e.target.value))}
          style={{flex:1,cursor:t.cursors.pointer,accentColor:t.sliderAccent,height:16}}/>
        <input type="number" value={value} min={min} max={max} step={step}
          onChange={e=>onChange(Number(e.target.value))}
          style={{width:38,textAlign:"center",fontFamily:t.font,fontSize:t.fontSize-1,
            background:t.inputBg,...sunkenBorder(t),borderRadius:t.bRadius,
            padding:"1px 0",color:t.labelColor,cursor:t.cursors.text,outline:"none"}}/>
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
// TITLE BAR
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
        {isWin&&<img src="/ditherboy-icon.svg" style={{width:16,height:16,imageRendering:"pixelated"}} alt="" />}
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
  const items=["File","Edit","View","Dither","Palette","Help"];
  return(
    <div style={{background:t.menuBg,padding:"2px 4px",display:"flex",
      borderBottom:`1px solid ${t.bDark}`,fontFamily:t.font,fontSize:t.fontSize,flexShrink:0}}>
      {items.map(item=>(
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
        <img src="/ditherboy-icon.svg" style={{width:14,height:14,marginRight:4,imageRendering:"pixelated"}} alt="" /> {windowTitle}
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
  const items=["🍎","File","Edit","View","Dither","Special","Help"];
  return(
    <div style={{position:"fixed",top:0,left:0,right:0,height:20,
      background:"white",borderBottom:"1px solid #ccc",
      display:"flex",alignItems:"center",
      fontFamily:t.titleFont,fontSize:12,zIndex:9999,userSelect:"none"}}>
      {items.map((item,i)=>(
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

// ─────────────────────────────────────────────────────────────────────────────
// DESKTOP ICONS
// ─────────────────────────────────────────────────────────────────────────────
function DesktopIcons({t,onOpenApp}){
  const isWin=t.id==="win97";
  const icons=[
    {id:"dither",label:"DitherBoy",emoji:"/ditherboy-icon.svg"},
    {id:"mypc",  label:isWin?"My Computer":"Macintosh HD",emoji:isWin?"💻":"🖥"},
    {id:"trash", label:isWin?"Recycle Bin":"Trash",emoji:"🗑"},
    {id:"docs",  label:"Documents",emoji:"📁"},
  ];
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
            background:selected===ic.id
              ?(isWin?"#000080":"rgba(0,0,128,0.4)")
              :"transparent"}}>
          {ic.emoji.endsWith(".svg") 
            ? <img src={ic.emoji} alt={ic.label} style={{width:isWin?24:28,height:isWin?24:28,imageRendering:"pixelated"}} />
            : <span style={{fontSize:isWin?24:28,lineHeight:1}}>{ic.emoji}</span>}
          <span style={{fontSize:isWin?11:11,fontFamily:t.font,
            color:selected===ic.id?"#fff":"#fff",
            textShadow:"0 1px 3px rgba(0,0,0,0.8)",
            textAlign:"center",maxWidth:64,wordBreak:"break-word",
            lineHeight:1.2}}>
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
    tick();const id=setInterval(tick,10000);return()=>clearInterval(id);
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

  // Dither settings
  const [category,     setCategory]     = useState("Halftone");
  const [mode,         setMode]         = useState("CMYK");
  const [cellSize,     setCellSize]     = useState(10);
  const [dotGain,      setDotGain]      = useState(20);
  const [blackMix,     setBlackMix]     = useState(61);
  const [cyanAngle,    setCyanAngle]    = useState(333);
  const [magentaAngle, setMagentaAngle] = useState(19);
  const [yellowAngle,  setYellowAngle]  = useState(317);
  const [blackAngle,   setBlackAngle]   = useState(45);
  const [brightness,   setBrightness]   = useState(0);
  const [contrast,     setContrast]     = useState(0);
  const [saturation,   setSaturation]   = useState(0);
  const [scale,        setScale]        = useState(1);

  // Inject global cursor style
  useEffect(()=>{
    let style=document.getElementById("dither-cursor-style");
    if(!style){style=document.createElement("style");style.id="dither-cursor-style";document.head.appendChild(style);}
    style.textContent=`body{cursor:${t.cursors.default}!important;}input[type=range]{cursor:${t.cursors.pointer}!important;}`;
    return()=>{};
  },[t.cursors.default, t.cursors.pointer]);

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
        setStatus(`Loaded: ${file.name} (${w}×${h})`);
        if(thumbRef.current){const tc=thumbRef.current;tc.width=90;tc.height=68;tc.getContext("2d").drawImage(img,0,0,90,68);}
      };
      img.src=ev.target.result;
    };
    reader.readAsDataURL(file);
  },[]);

  // Live render
  const settings=useMemo(()=>({category,mode,cellSize,dotGain,blackMix,cyanAngle,magentaAngle,yellowAngle,blackAngle,brightness,contrast,saturation,scale}),[category,mode,cellSize,dotGain,blackMix,cyanAngle,magentaAngle,yellowAngle,blackAngle,brightness,contrast,saturation,scale]);

  useEffect(()=>{
    if(!srcImageData||showOriginal)return;
    if(pendingTimer.current)clearTimeout(pendingTimer.current);
    pendingTimer.current=setTimeout(async()=>{
      setIsProcessing(true);setStatus("Rendering…");
      try{
        const result=await renderDither(srcImageData,settings);
        const cv=canvasRef.current;if(!cv)return;
        cv.width=result.width;cv.height=result.height;
        cv.getContext("2d").putImageData(result,0,0);
        setStatus(`${result.width}×${result.height} · ${category} · ${mode}`);
      }catch(e){setStatus("Error: "+e.message);}
      finally{setIsProcessing(false);}
    },80);
  },[srcImageData,settings,showOriginal,category,mode]);

  const handleCat=(cat)=>{setCategory(cat);setMode(MODES[cat][0]);};

  const handleExport=()=>{
    const cv=canvasRef.current;if(!cv||!srcImageData)return;
    const link=document.createElement("a");
    link.download=`dithered.${exportFmt.toLowerCase()}`;
    link.href=cv.toDataURL(exportFmt==="PNG"?"image/png":"image/jpeg");
    link.click();
  };

  const handleToggleOriginal=()=>{
    if(!origDataRef.current)return;
    const next=!showOriginal;
    setShowOriginal(next);
    const cv=canvasRef.current;if(!cv)return;
    if(next){
      cv.width=origDataRef.current.width;cv.height=origDataRef.current.height;
      cv.getContext("2d").putImageData(origDataRef.current,0,0);
      setStatus("Viewing original");
    }
  };

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

  // ── Toolbar ──────────────────────────────────────────────────────────────────
  const Toolbar=()=>(
    <div style={{background:t.windowBg,padding:"4px 6px",display:"flex",
      alignItems:"center",gap:5,borderBottom:`1px solid ${t.bDark}`,
      flexWrap:"nowrap",flexShrink:0,overflowX:"auto"}}>
      <WinBtn t={t} onClick={()=>fileInputRef.current?.click()}>
        {isWin?"📂 Open…":"⌘ Import…"}
      </WinBtn>
      <WinBtn t={t} disabled={!srcImageData} onClick={handleExport}>
        {isWin?"💾 Save As…":"⌘ Export…"}
      </WinBtn>
      <WinBtn t={t} disabled={!srcImageData} onClick={handleToggleOriginal}>
        {showOriginal?"◑ Dithered":"◑ Original"}
      </WinBtn>
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
  const Sidebar=()=>(
    <div style={{width:240,background:t.sidebarBg,borderLeft:`1px solid ${t.bDark}`,
      display:"flex",flexDirection:"column",overflowY:"auto",flexShrink:0,
      scrollbarWidth:"thin",scrollbarColor:`${t.bDark} ${t.windowBg}`}}>
      <div style={{padding:"10px",display:"flex",flexDirection:"column",gap:7}}>

        {/* Thumbnail */}
        <div style={{background:isWin?"#000080":"#333",height:68,...sunkenBorder(t),
          borderRadius:t.bRadius,display:"flex",alignItems:"center",
          justifyContent:"center",overflow:"hidden",flexShrink:0}}>
          {srcImageData
            ?<canvas ref={thumbRef} style={{maxWidth:"100%",maxHeight:"100%",imageRendering:"pixelated"}}/>
            :<span style={{color:"#666",fontSize:10,fontFamily:t.font}}>No image</span>}
        </div>

        {/* Import/Export */}
        <WinBtn t={t} onClick={()=>fileInputRef.current?.click()} style={{width:"100%"}}>
          {isWin?"Import":"Import Image"}
        </WinBtn>
        <div style={{display:"flex",gap:6}}>
          <WinBtn t={t} disabled={!srcImageData} onClick={handleExport} style={{flex:1}}>Export</WinBtn>
          <select value={exportFmt} onChange={e=>setExportFmt(e.target.value)}
            style={{background:t.inputBg,...sunkenBorder(t),borderRadius:t.bRadius,
              padding:"2px 4px",fontSize:t.fontSize-1,fontFamily:t.font,
              cursor:t.cursors.pointer,color:t.labelColor,outline:"none"}}>
            <option>PNG</option><option>JPEG</option>
          </select>
        </div>

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
            <WinSelect t={t} value={mode} onChange={setMode} options={MODES[category]}/>
            <WinBtn t={t} onClick={()=>{const ms=MODES[category],i=ms.indexOf(mode);setMode(ms[(i-1+ms.length)%ms.length]);}}>‹</WinBtn>
            <WinBtn t={t} onClick={()=>{const ms=MODES[category],i=ms.indexOf(mode);setMode(ms[(i+1)%ms.length]);}}>›</WinBtn>
          </div>
        </div>

        <Divider t={t}/>

        {/* Settings */}
        <SectionLabel t={t}>{isWin?`▼ ${category} Settings`:`▾ ${category.toUpperCase()} SETTINGS`}</SectionLabel>

        {category==="Halftone"&&<>
          <SliderRow t={t} label="Cell Size"  value={cellSize}  min={2}  max={40} onChange={setCellSize}/>
          <SliderRow t={t} label="Dot Gain"   value={dotGain}   min={0}  max={100} onChange={setDotGain}/>
          {mode==="CMYK"&&<SliderRow t={t} label="Black Mix" value={blackMix} min={0} max={100} onChange={setBlackMix}/>}
          <div style={{display:"flex",alignItems:"center",gap:6,fontSize:t.fontSize-1,
            color:t.labelColor,fontFamily:t.font,marginBottom:4}}>
            <input type="checkbox" id="phaseOff" style={{accentColor:t.sliderAccent,cursor:t.cursors.pointer}}/>
            <label htmlFor="phaseOff" style={{cursor:t.cursors.pointer}}>Phase Offsets</label>
          </div>
          {mode==="CMYK"?(
            <div style={{display:"flex",gap:4,flexWrap:"wrap",justifyContent:"center",marginTop:4}}>
              <Knob t={t} label="Cyan"    value={cyanAngle}    onChange={setCyanAngle}/>
              <Knob t={t} label="Magenta" value={magentaAngle} onChange={setMagentaAngle}/>
              <Knob t={t} label="Yellow"  value={yellowAngle}  onChange={setYellowAngle}/>
              <Knob t={t} label="Black"   value={blackAngle}   onChange={setBlackAngle}/>
            </div>
          ):(
            <div style={{display:"flex",justifyContent:"center"}}>
              <Knob t={t} label="Angle" value={blackAngle} onChange={setBlackAngle}/>
            </div>
          )}
        </>}

        {category!=="Halftone"&&(
          <div style={{fontSize:t.fontSize-1,color:"#777",fontStyle:"italic",fontFamily:t.font}}>
            {category} · {mode}
          </div>
        )}

        <Divider t={t}/>

        {/* Adjustments */}
        <SectionLabel t={t}>{isWin?"▼ Adjustments":"▾ ADJUSTMENTS"}</SectionLabel>
        <SliderRow t={t} label="Brightness" value={brightness} min={-100} max={100} onChange={setBrightness}/>
        <SliderRow t={t} label="Contrast"   value={contrast}   min={-100} max={100} onChange={setContrast}/>
        <SliderRow t={t} label="Saturation" value={saturation} min={-100} max={100} onChange={setSaturation}/>
        <SliderRow t={t} label="Downscale"  value={scale}      min={1}    max={8}   onChange={setScale}/>

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
    </div>
  );

  // ── Status Bar ────────────────────────────────────────────────────────────────
  const StatusBar=()=>(
    <div style={{background:t.statusBg,borderTop:`1px solid ${t.bDark}`,
      padding:"2px 0",display:"flex",flexShrink:0,alignItems:"center"}}>
      {[status,"DitherBoy v3.0"].map((txt,i)=>(
        <div key={i} style={{
          flex:i===0?1:"0 0 auto",minWidth:i===1?100:undefined,
          fontSize:t.fontSize,fontFamily:t.font,color:t.labelColor,
          ...(isWin?{...sunkenBorder(t),padding:"1px 8px",margin:"2px 3px"}
                  :{padding:"2px 10px",borderLeft:i===1?"1px solid #bbb":"none"}),
        }}>{txt}</div>
      ))}
      {/* Win: resize grip */}
      {isWin&&!maximized&&(
        <div onMouseDown={onResizeDown}
          style={{width:14,height:14,flexShrink:0,marginRight:2,cursor:"se-resize",
            display:"flex",alignItems:"flex-end",justifyContent:"flex-end",
            opacity:0.5,userSelect:"none",fontSize:12,lineHeight:1}}>
          ◢
        </div>
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
          <Toolbar/>

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

            <Sidebar/>
          </div>

          <StatusBar/>

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