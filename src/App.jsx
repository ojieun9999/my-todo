import { useState, useEffect, useRef } from "react";

const STORAGE_KEY = "mytodo_v7";
const ACCENT      = "#4D96FF";
const CATEGORIES  = ["전체", "미완료", "중요", "완료", "보관함"];
const SWIPE_TRIGGER = 72;
const SWIPE_MAX     = 120;

const DEFAULT_TODOS = [
  { id: 1, text: "디자인 시스템 정리하기",   done: false, priority: true,  archived: false, createdAt: Date.now() - 86400000 },
  { id: 2, text: "장보기 — 계란, 우유, 빵", done: false, priority: false, archived: false, createdAt: Date.now() - 3600000  },
  { id: 3, text: "운동 30분",               done: true,  priority: false, archived: true,  createdAt: Date.now() - 7200000  },
  { id: 4, text: "친구에게 연락하기",        done: false, priority: true,  archived: false, createdAt: Date.now()            },
];

function validateTodos(raw) {
  if (!Array.isArray(raw)) return null;
  const clean = raw.filter(t =>
    t && typeof t === "object" &&
    typeof t.id       === "number" &&
    typeof t.text     === "string" &&
    typeof t.done     === "boolean" &&
    typeof t.priority === "boolean" &&
    typeof t.archived === "boolean" &&
    typeof t.createdAt === "number"
  ).map(t => ({
    id:        Number(t.id),
    text:      String(t.text).slice(0, 200),
    done:      Boolean(t.done),
    priority:  Boolean(t.priority),
    archived:  Boolean(t.archived),
    createdAt: Number(t.createdAt),
  }));
  if (clean.length === 0) return null;
  return clean;
}

const MAX_STORAGE_BYTES = 500000;

const ps = {
  async load() {
    try {
      const r = await window.storage.get(STORAGE_KEY);
      if (r?.value) { const parsed = JSON.parse(r.value); return validateTodos(parsed); }
    } catch {}
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v) { const parsed = JSON.parse(v); return validateTodos(parsed); }
    } catch {}
    return null;
  },
  async save(data) {
    const s = JSON.stringify(data);
    if (s.length > MAX_STORAGE_BYTES) { console.warn("Too large"); return; }
    try { await window.storage.set(STORAGE_KEY, s); } catch {}
    try { localStorage.setItem(STORAGE_KEY, s); } catch {}
  },
};

const Ic = {
  Check: ({ done }) => (
    <div style={{
      width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
      background: done ? ACCENT : "transparent",
      border: done ? "none" : "1.8px solid rgba(255,255,255,0.28)",
      display: "flex", alignItems: "center", justifyContent: "center",
      transition: "all 0.22s cubic-bezier(0.34,1.56,0.64,1)",
      boxShadow: done ? "0 0 8px rgba(77,150,255,.45)" : "none",
    }}>
      {done && (
        <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
          <path d="M1 3.5L3.2 5.8L8 1" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </div>
  ),
  Star: ({ on }) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={on ? "#FFD93D" : "none"} stroke={on ? "#FFD93D" : "rgba(255,255,255,0.2)"} strokeWidth="2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  Archive: ({ s }) => { const sz = s||18; return <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>; },
  Unarchive: ({ s }) => { const sz = s||18; return <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><polyline points="10 14 12 12 14 14"/><line x1="12" y1="12" x2="12" y2="17"/></svg>; },
  Trash: ({ s }) => { const sz = s||18; return <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>; },
  Plus: ({ s }) => { const sz = s||16; return <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; },
  Drag: () => <svg width="14" height="14" viewBox="0 0 24 24"><circle cx="9" cy="6" r="1.2" fill="rgba(255,255,255,0.25)"/><circle cx="15" cy="6" r="1.2" fill="rgba(255,255,255,0.25)"/><circle cx="9" cy="12" r="1.2" fill="rgba(255,255,255,0.25)"/><circle cx="15" cy="12" r="1.2" fill="rgba(255,255,255,0.25)"/><circle cx="9" cy="18" r="1.2" fill="rgba(255,255,255,0.25)"/><circle cx="15" cy="18" r="1.2" fill="rgba(255,255,255,0.25)"/></svg>,
  DL: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  UL: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  Copy: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>,
  X: ({ s }) => { const sz = s||13; return <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; },
  Grid: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  Send: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
};

function useSwipeDir(onRight, onLeft) {
  const [offsetX, setOffsetX] = useState(0);
  const [triggered, setTriggered] = useState(null);
  const [swiping, setSwiping] = useState(false);
  const startX = useRef(0), startY = useRef(0), axis = useRef(null);
  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
  const onTouchStart = e => { startX.current=e.touches[0].clientX; startY.current=e.touches[0].clientY; axis.current=null; setSwiping(true); };
  const onTouchMove = e => {
    const dx=e.touches[0].clientX-startX.current, dy=e.touches[0].clientY-startY.current;
    if (!axis.current) { if(Math.abs(dx)<5&&Math.abs(dy)<5) return; axis.current=Math.abs(dx)>=Math.abs(dy)?"h":"v"; }
    if (axis.current==="v") { setSwiping(false); return; }
    if (dx>0&&!onRight) return; if (dx<0&&!onLeft) return;
    e.preventDefault();
    const c=clamp(dx,onLeft?-SWIPE_MAX:0,onRight?SWIPE_MAX:0);
    setOffsetX(c);
    if (c>=SWIPE_TRIGGER) setTriggered("right"); else if (c<=-SWIPE_TRIGGER) setTriggered("left"); else setTriggered(null);
  };
  const onTouchEnd = () => {
    setSwiping(false);
    if (triggered==="right"&&onRight) { setOffsetX(400); setTimeout(()=>{ onRight(); setOffsetX(0); setTriggered(null); },260); }
    else if (triggered==="left"&&onLeft) { setOffsetX(-400); setTimeout(()=>{ onLeft(); setOffsetX(0); setTriggered(null); },260); }
    else { setOffsetX(0); setTriggered(null); }
  };
  return { offsetX, showRight:swiping&&offsetX>4, showLeft:swiping&&offsetX<-4, onTouchStart, onTouchMove, onTouchEnd };
}

function SwipeRow({ todo, isArchiveView, onToggle, onArchive, onDelete, onEdit, onTogglePri, dragging, isOver, onDragStart, onDragOver, onDrop, onDragEnd }) {
  const swipe = useSwipeDir(() => onArchive(todo.id), isArchiveView ? () => onDelete(todo.id) : null);
  return (
    <div onDragOver={e=>{e.preventDefault();onDragOver(e,todo.id);}} onDrop={e=>onDrop(e,todo.id)} onDragEnd={onDragEnd}
      style={{ position:"relative", borderRadius:18, overflow:"hidden", opacity:dragging?0.35:1, transition:"opacity .18s", outline:isOver?"2px solid rgba(77,150,255,.45)":"none" }}>
      <div style={{ position:"absolute", inset:0, borderRadius:18, background:isArchiveView?"#4D96FF":"#6BCB77", display:"flex", alignItems:"center", paddingLeft:22, opacity:swipe.showRight?1:0, transition:"opacity .12s", pointerEvents:"none" }}>
        {isArchiveView ? <Ic.Unarchive s={18}/> : <Ic.Archive s={18}/>}
      </div>
      {isArchiveView && (
        <div style={{ position:"absolute", inset:0, borderRadius:18, background:"#FF3B30", display:"flex", alignItems:"center", justifyContent:"flex-end", paddingRight:22, opacity:swipe.showLeft?1:0, transition:"opacity .12s", pointerEvents:"none" }}>
          <Ic.Trash s={18}/>
        </div>
      )}
      <div onTouchStart={swipe.onTouchStart} onTouchMove={swipe.onTouchMove} onTouchEnd={swipe.onTouchEnd}
        style={{ display:"flex", alignItems:"center", gap:11, background:todo.done?"rgba(255,255,255,.025)":"rgba(255,255,255,.04)", borderRadius:18, padding:"13px 14px", border:"1px solid rgba(255,255,255,.07)", transform:"translateX("+swipe.offsetX+"px)", transition:swipe.offsetX!==0?"none":"transform .3s cubic-bezier(.34,1.56,.64,1)", position:"relative", zIndex:1, userSelect:"none", touchAction:"pan-y" }}>
        <button onClick={()=>onToggle(todo.id)} onMouseDown={e=>e.stopPropagation()} style={{ background:"none", border:"none", padding:0, cursor:"pointer", flexShrink:0 }}>
          <Ic.Check done={todo.done}/>
        </button>
        <div style={{ flex:1, minWidth:0 }} onDoubleClick={()=>onEdit(todo.id,todo.text)}>
          <div style={{ fontSize:14.5, color:todo.done?"rgba(255,255,255,.22)":"rgba(255,255,255,.86)", textDecoration:todo.done?"line-through":"none", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", transition:"color .2s" }}>
            {todo.archived && <span style={{ fontSize:10, marginRight:4, opacity:.4 }}>📦</span>}
            {todo.text}
          </div>
          <div style={{ fontSize:10, color:"rgba(255,255,255,.18)", marginTop:2 }}>
            {new Date(todo.createdAt).toLocaleDateString("ko-KR",{ month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" })}
          </div>
        </div>
        {!todo.done && (
          <button onClick={()=>onTogglePri(todo.id)} onMouseDown={e=>e.stopPropagation()} style={{ background:"none", border:"none", padding:3, cursor:"pointer", flexShrink:0 }}>
            <Ic.Star on={todo.priority}/>
          </button>
        )}
        <div draggable onDragStart={e=>onDragStart(e,todo.id)} onMouseDown={e=>e.stopPropagation()} style={{ flexShrink:0, cursor:"grab", padding:"4px 2px", touchAction:"none", display:"flex", alignItems:"center" }}>
          <Ic.Drag/>
        </div>
      </div>
    </div>
  );
}

function WidgetSwipeRow({ todo, onToggle, onArchive, dragging, isOver, onDragStart, onDragOver, onDrop, onDragEnd }) {
  const swipe = useSwipeDir(()=>onArchive(todo.id), null);
  return (
    <div onDragOver={e=>{e.preventDefault();onDragOver(e,todo.id);}} onDrop={e=>onDrop(e,todo.id)} onDragEnd={onDragEnd}
      style={{ position:"relative", borderRadius:11, overflow:"hidden", opacity:dragging?0.35:1, outline:isOver?"2px solid rgba(77,150,255,.4)":"none", transition:"opacity .15s" }}>
      <div style={{ position:"absolute", inset:0, borderRadius:11, background:"#6BCB77", display:"flex", alignItems:"center", paddingLeft:12, opacity:swipe.showRight?1:0, transition:"opacity .12s", pointerEvents:"none" }}>
        <Ic.Archive s={13}/>
      </div>
      <div onTouchStart={swipe.onTouchStart} onTouchMove={swipe.onTouchMove} onTouchEnd={swipe.onTouchEnd}
        style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(255,255,255,.04)", borderRadius:11, padding:"8px 9px", border:"1px solid rgba(255,255,255,.05)", transform:"translateX("+swipe.offsetX+"px)", transition:swipe.offsetX!==0?"none":"transform .3s cubic-bezier(.34,1.56,.64,1)", position:"relative", zIndex:1, userSelect:"none", touchAction:"pan-y" }}>
        <button onClick={()=>onToggle(todo.id)} onMouseDown={e=>e.stopPropagation()} style={{ background:"none", border:"none", padding:0, cursor:"pointer", flexShrink:0 }}>
          <Ic.Check done={todo.done}/>
        </button>
        <span style={{ flex:1, fontSize:12.5, color:todo.done?"rgba(255,255,255,.25)":"rgba(255,255,255,.82)", textDecoration:todo.done?"line-through":"none", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{todo.text}</span>
        {todo.priority&&!todo.done&&<Ic.Star on={true}/>}
        <div draggable onDragStart={e=>onDragStart(e,todo.id)} onMouseDown={e=>e.stopPropagation()} style={{ flexShrink:0, cursor:"grab", padding:"2px", touchAction:"none", display:"flex", alignItems:"center" }}>
          <Ic.Drag/>
        </div>
      </div>
    </div>
  );
}

function Widget({ todos, setTodos, onToggle, onArchive, onAdd, size }) {
  const [showAdd, setShowAdd] = useState(false);
  const [addText, setAddText] = useState("");
  const [draggingId, setDraggingId] = useState(null);
  const [overId, setOverId] = useState(null);
  const addRef = useRef(null);
  const activeTodos = todos.filter(t=>!t.archived);
  const incomplete = activeTodos.filter(t=>!t.done).length;
  const handleAdd = () => { if(!addText.trim()) return; onAdd(addText.trim()); setAddText(""); setShowAdd(false); };
  useEffect(()=>{ if(showAdd) setTimeout(()=>addRef.current&&addRef.current.focus(),80); },[showAdd]);
  const wDragStart=(e,id)=>{setDraggingId(id);e.dataTransfer.effectAllowed="move";};
  const wDragOver=(e,id)=>{e.preventDefault();setOverId(id);};
  const wDrop=(e,dropId)=>{ e.preventDefault(); if(!draggingId||draggingId===dropId){setDraggingId(null);setOverId(null);return;} setTodos(prev=>{const next=[...prev];const fi=next.findIndex(t=>t.id===draggingId);const ti=next.findIndex(t=>t.id===dropId);if(fi===-1||ti===-1)return prev;const moved=next.splice(fi,1)[0];next.splice(ti,0,moved);return next;}); setDraggingId(null);setOverId(null); };
  const wDragEnd=()=>{setDraggingId(null);setOverId(null);};
  const bg="linear-gradient(145deg,#141428,#1a1a35)", shadow="0 24px 48px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.07)", sub="rgba(255,255,255,.3)";
  if (size==="small") return (
    <div style={{ width:158, height:158, borderRadius:28, padding:16, background:bg, boxShadow:shadow, display:"flex", flexDirection:"column", justifyContent:"space-between", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:-30, right:-30, width:100, height:100, borderRadius:"50%", background:"radial-gradient(circle,rgba(77,150,255,.16) 0%,transparent 70%)" }}/>
      <div style={{ fontSize:9, fontWeight:700, color:sub, letterSpacing:1.4 }}>MY TODO</div>
      <div>
        <div style={{ fontSize:46, fontWeight:800, color:"#fff", lineHeight:1, letterSpacing:-2 }}>{incomplete}</div>
        <div style={{ fontSize:10, color:sub, marginTop:2 }}>남은 할 일</div>
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:9, color:"rgba(255,255,255,.22)" }}>{activeTodos.filter(t=>t.done).length}/{activeTodos.length} 완료</span>
        <button onClick={()=>setShowAdd(true)} style={{ width:24, height:24, borderRadius:8, background:"rgba(77,150,255,.2)", border:"1px solid rgba(77,150,255,.4)", cursor:"pointer", color:ACCENT, display:"flex", alignItems:"center", justifyContent:"center" }}><Ic.Plus s={12}/></button>
      </div>
      {showAdd && (
        <div style={{ position:"absolute", inset:0, borderRadius:28, background:"linear-gradient(145deg,#1a1a38,#20203a)", padding:14, display:"flex", flexDirection:"column", gap:8, zIndex:10 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:10, fontWeight:700, color:sub, letterSpacing:1 }}>빠른 추가</span>
            <button onClick={()=>{setShowAdd(false);setAddText("");}} style={{ background:"none", border:"none", cursor:"pointer", color:sub, padding:2 }}><Ic.X s={11}/></button>
          </div>
          <input ref={addRef} value={addText} onChange={e=>setAddText(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")handleAdd();if(e.key==="Escape"){setShowAdd(false);setAddText("");}}} placeholder="할 일 입력..." maxLength={40} style={{ background:"rgba(255,255,255,.08)", border:"1px solid rgba(255,255,255,.15)", borderRadius:10, padding:"6px 9px", color:"#fff", fontSize:11, outline:"none", fontFamily:"inherit", width:"100%" }}/>
          <button onClick={handleAdd} disabled={!addText.trim()} style={{ background:addText.trim()?ACCENT:"rgba(255,255,255,.08)", border:"none", borderRadius:10, padding:"6px", color:addText.trim()?"#fff":sub, fontSize:11, fontWeight:700, cursor:addText.trim()?"pointer":"default", display:"flex", alignItems:"center", justifyContent:"center", gap:4 }}><Ic.Send/> 추가</button>
        </div>
      )}
    </div>
  );
  const rows=size==="large"?activeTodos.slice(0,6):activeTodos.slice(0,3), h=size==="large"?400:220;
  return (
    <div style={{ width:338, height:h, borderRadius:28, padding:"16px 15px", background:bg, boxShadow:shadow, overflow:"hidden", position:"relative" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <span style={{ fontSize:10, fontWeight:700, color:sub, letterSpacing:1.3 }}>MY TODO</span>
        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
          <span style={{ fontSize:10, color:sub }}><span style={{ color:ACCENT, fontWeight:700 }}>{incomplete}</span>개 남음</span>
          <button onClick={()=>setShowAdd(v=>!v)} style={{ width:22, height:22, borderRadius:7, background:showAdd?"rgba(77,150,255,.2)":"rgba(255,255,255,.08)", border:showAdd?"1px solid rgba(77,150,255,.4)":"1px solid rgba(255,255,255,.1)", cursor:"pointer", color:showAdd?ACCENT:sub, display:"flex", alignItems:"center", justifyContent:"center", transition:"all .2s" }}>{showAdd?<Ic.X s={10}/>:<Ic.Plus s={12}/>}</button>
        </div>
      </div>
      {showAdd && (
        <div style={{ background:"rgba(77,150,255,.1)", border:"1px solid rgba(77,150,255,.25)", borderRadius:14, padding:"10px 12px", marginBottom:9 }}>
          <div style={{ display:"flex", gap:6 }}>
            <input ref={addRef} value={addText} onChange={e=>setAddText(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")handleAdd();if(e.key==="Escape")setShowAdd(false);}} placeholder="새 할 일 입력..." maxLength={50} style={{ flex:1, background:"rgba(255,255,255,.08)", border:"1px solid rgba(255,255,255,.15)", borderRadius:9, padding:"6px 10px", color:"#fff", fontSize:12, outline:"none", fontFamily:"inherit" }}/>
            <button onClick={handleAdd} disabled={!addText.trim()} style={{ width:30, height:30, borderRadius:9, border:"none", background:addText.trim()?ACCENT:"rgba(255,255,255,.06)", cursor:addText.trim()?"pointer":"default", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, opacity:addText.trim()?1:0.35 }}><Ic.Send/></button>
          </div>
        </div>
      )}
      <div style={{ display:"flex", flexDirection:"column", gap:6, overflow:"hidden" }}>
        {rows.map(todo=>(
          <WidgetSwipeRow key={todo.id} todo={todo} onToggle={onToggle} onArchive={onArchive} dragging={draggingId===todo.id} isOver={overId===todo.id&&draggingId!==todo.id} onDragStart={wDragStart} onDragOver={wDragOver} onDrop={wDrop} onDragEnd={wDragEnd}/>
        ))}
      </div>
      {activeTodos.length>rows.length&&!showAdd&&<div style={{ marginTop:7, textAlign:"center", fontSize:10, color:sub }}>+{activeTodos.length-rows.length}개 더</div>}
    </div>
  );
}

function BackupModal({ todos, onImport, onClose }) {
  const [tab, setTab] = useState("export");
  const [pasteText, setPaste] = useState("");
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef(null);
  const exportJSON = JSON.stringify({ version:2, exportedAt:new Date().toISOString(), todos }, null, 2);
  const makeCSV = () => { const hdr="id,text,done,priority,archived,createdAt"; const rows=todos.map(t=>t.id+',"'+t.text.replace(/"/g,'""')+'",'+t.done+','+t.priority+','+(!!t.archived)+','+new Date(t.createdAt).toISOString()); return [hdr].concat(rows).join("\n"); };
  const dl = (content,name,type) => { const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([content],{type})); a.download=name; a.click(); URL.revokeObjectURL(a.href); };
  const handleCopy = () => navigator.clipboard.writeText(exportJSON).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);});
  const tryImport = text => {
    try {
      if (!text||text.length>MAX_STORAGE_BYTES) throw new Error("size");
      const p=JSON.parse(text);
      if (p.version!==2) throw new Error("version");
      const clean=validateTodos(p.todos);
      if (!clean) throw new Error("invalid");
      onImport(clean); setErr("");
    } catch(e) {
      if(e.message==="size") setErr("파일이 너무 커요.");
      else if(e.message==="version") setErr("지원하지 않는 버전이에요.");
      else setErr("올바른 JSON 형식이 아니에요.");
    }
  };
  const today=new Date().toISOString().slice(0,10);
  const pill=c=>({ display:"flex", alignItems:"center", justifyContent:"center", gap:6, background:c+"22", border:"1px solid "+c+"44", borderRadius:12, padding:"10px 14px", cursor:"pointer", color:c, fontSize:12, fontWeight:600 });
  return (
    <div style={{ position:"fixed", inset:0, zIndex:1000, background:"rgba(0,0,0,.75)", backdropFilter:"blur(12px)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }} onClick={onClose}>
      <div style={{ width:"100%", maxWidth:440, background:"linear-gradient(145deg,#18182e,#1e1e38)", borderRadius:26, border:"1px solid rgba(255,255,255,.1)", boxShadow:"0 40px 80px rgba(0,0,0,.4)", overflow:"hidden" }} onClick={e=>e.stopPropagation()}>
        <div style={{ padding:"20px 22px 14px", borderBottom:"1px solid rgba(255,255,255,.07)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontSize:17, fontWeight:700, color:"#fff" }}>백업 &amp; 복원</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,.4)", marginTop:2 }}>{todos.length}개 항목</div>
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,.08)", border:"none", borderRadius:10, padding:8, cursor:"pointer", color:"rgba(255,255,255,.4)" }}><Ic.X/></button>
        </div>
        <div style={{ display:"flex", padding:"12px 22px 0", gap:6 }}>
          {[["export","내보내기"],["import","가져오기"]].map(item=>(
            <button key={item[0]} onClick={()=>setTab(item[0])} style={{ flex:1, padding:9, borderRadius:12, border:"none", cursor:"pointer", background:tab===item[0]?"rgba(77,150,255,.2)":"rgba(255,255,255,.05)", color:tab===item[0]?"#fff":"rgba(255,255,255,.4)", fontSize:13, fontWeight:600 }}>{item[1]}</button>
          ))}
        </div>
        <div style={{ padding:"18px 22px 26px" }}>
          {tab==="export" ? (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div style={{ background:"rgba(0,0,0,.3)", borderRadius:14, padding:14, border:"1px solid rgba(255,255,255,.06)", maxHeight:110, overflow:"auto" }}>
                <pre style={{ margin:0, fontSize:10.5, color:"rgba(255,255,255,.45)", fontFamily:"monospace", whiteSpace:"pre-wrap", wordBreak:"break-all" }}>{exportJSON.slice(0,280)}{exportJSON.length>280?"\n...":""}</pre>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                <button onClick={()=>dl(exportJSON,"todo_"+today+".json","application/json")} style={pill("#4D96FF")}><Ic.DL/> JSON</button>
                <button onClick={()=>dl(makeCSV(),"todo_"+today+".csv","text/csv")} style={pill("#6BCB77")}><Ic.DL/> CSV</button>
                <button onClick={handleCopy} style={pill(copied?"#6BCB77":"#C77DFF")}><Ic.Copy/> {copied?"완료!":"복사"}</button>
              </div>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <button onClick={()=>fileRef.current&&fileRef.current.click()} style={{ ...pill("#4D96FF"), justifyContent:"center", padding:14 }}><Ic.UL/> JSON 파일 업로드</button>
              <input ref={fileRef} type="file" accept=".json" style={{ display:"none" }} onChange={e=>{ const f=e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=ev=>tryImport(ev.target.result); r.readAsText(f); }}/>
              <textarea value={pasteText} onChange={e=>setPaste(e.target.value)} placeholder='{"version":2,"todos":[...]} JSON 붙여넣기' style={{ background:"rgba(0,0,0,.3)", border:"1px solid rgba(255,255,255,.08)", borderRadius:14, padding:14, color:"rgba(255,255,255,.7)", fontSize:12, fontFamily:"monospace", resize:"vertical", minHeight:80, outline:"none", width:"100%" }}/>
              {err&&<div style={{ fontSize:11, color:"#FF6B6B" }}>{err}</div>}
              <button onClick={()=>tryImport(pasteText)} disabled={!pasteText.trim()} style={{ ...pill("#4D96FF"), justifyContent:"center", padding:13, opacity:pasteText.trim()?1:0.4 }}>복원하기</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TodoApp() {
  const [todos, setTodos] = useState(DEFAULT_TODOS);
  const [loaded, setLoaded] = useState(false);
  const [inputText, setInputText] = useState("");
  const [category, setCategory] = useState("전체");
  const [showWidget, setShowWidget] = useState(false);
  const [widgetSize, setWidgetSize] = useState("large");
  const [showBackup, setShowBackup] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [toast, setToast] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const [overId, setOverId] = useState(null);
  const inputRef = useRef(null);

  useEffect(()=>{ ps.load().then(data=>{ if(data&&Array.isArray(data)) setTodos(data); setLoaded(true); }); },[]);
  useEffect(()=>{ if(loaded) ps.save(todos); },[todos,loaded]);

  const toast$ = (msg,type) => { setToast({msg,type:type||"ok"}); setTimeout(()=>setToast(null),2200); };
  const addTodo = () => { const text=inputText.trim().slice(0,200); if(!text) return; setTodos(p=>[{id:Date.now(),text,done:false,priority:false,archived:false,createdAt:Date.now()},...p]); setInputText(""); toast$("추가됐어요!"); };
  const toggle = id => { const todo=todos.find(t=>t.id===id); if(!todo) return; if(!todo.done){setTodos(p=>p.map(t=>t.id===id?{...t,done:true,archived:true}:t));toast$("완료! 보관함으로 이동했어요 ✓");}else{setTodos(p=>p.map(t=>t.id===id?{...t,done:false,archived:false}:t));toast$("다시 목록으로 이동했어요");} };
  const togglePri = id => setTodos(p=>p.map(t=>t.id===id?{...t,priority:!t.priority}:t));
  const archiveTodo = id => { const todo=todos.find(t=>t.id===id); setTodos(p=>p.map(t=>t.id===id?{...t,archived:!t.archived}:t)); toast$(todo&&todo.archived?"복원됐어요!":"보관함으로 이동했어요 📦"); };
  const deleteTodo = id => { setTodos(p=>p.filter(t=>t.id!==id)); toast$("완전 삭제됐어요","warn"); };
  const widgetAdd = rawText => { const text=String(rawText).trim().slice(0,200); if(!text) return; setTodos(p=>[{id:Date.now(),text,done:false,priority:false,archived:false,createdAt:Date.now()},...p]); toast$("추가됐어요!"); };
  const startEdit = (id,text) => { setEditingId(id); setEditText(text); };
  const saveEdit = id => { const text=editText.trim().slice(0,200); if(text) setTodos(p=>p.map(t=>t.id===id?{...t,text}:t)); setEditingId(null); };
  const handleDragStart=(e,id)=>{setDraggingId(id);e.dataTransfer.effectAllowed="move";};
  const handleDragOver=(e,id)=>{e.preventDefault();setOverId(id);};
  const handleDrop=(e,dropId)=>{ e.preventDefault(); if(!draggingId||draggingId===dropId){setDraggingId(null);setOverId(null);return;} setTodos(prev=>{const next=[...prev];const fi=next.findIndex(t=>t.id===draggingId);const ti=next.findIndex(t=>t.id===dropId);if(fi===-1||ti===-1)return prev;const moved=next.splice(fi,1)[0];next.splice(ti,0,moved);return next;}); setDraggingId(null);setOverId(null); };
  const handleDragEnd=()=>{setDraggingId(null);setOverId(null);};

  const isArchiveView=category==="보관함";
  const activeTodos=todos.filter(t=>!t.archived);
  const archivedCnt=todos.filter(t=>t.archived).length;
  const filtered=todos.filter(t=>{ if(isArchiveView) return t.archived; if(t.archived) return false; if(category==="미완료") return !t.done; if(category==="중요") return t.priority; if(category==="완료") return t.done; return true; });
  const incomplete=activeTodos.filter(t=>!t.done).length;
  const dateStr=new Date().toLocaleDateString("ko-KR",{month:"long",day:"numeric",weekday:"short"});
  const BG="#0c0c18";

  return (
    <div style={{ minHeight:"100vh", background:BG, fontFamily:"'SF Pro Display',-apple-system,BlinkMacSystemFont,sans-serif", display:"flex", justifyContent:"center", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"fixed", top:-150, left:-100, width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle,rgba(77,150,255,.06) 0%,transparent 65%)", pointerEvents:"none", zIndex:0 }}/>
      <div style={{ position:"fixed", bottom:-100, right:-100, width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle,rgba(199,125,255,.06) 0%,transparent 65%)", pointerEvents:"none", zIndex:0 }}/>
      {toast&&<div style={{ position:"fixed", top:24, left:"50%", transform:"translateX(-50%)", background:toast.type==="warn"?"rgba(255,80,80,.15)":"rgba(77,150,255,.15)", border:"1px solid "+(toast.type==="warn"?"rgba(255,80,80,.35)":"rgba(77,150,255,.3)"), color:toast.type==="warn"?"#FF6B6B":ACCENT, borderRadius:14, padding:"10px 20px", fontSize:13, fontWeight:600, backdropFilter:"blur(10px)", zIndex:2000, animation:"fadeDown .28s ease", whiteSpace:"nowrap" }}>{toast.msg}</div>}
      {showBackup&&<BackupModal todos={todos} onImport={imported=>{setTodos(imported);toast$(imported.length+"개 복원됐어요!");setShowBackup(false);}} onClose={()=>setShowBackup(false)}/>}
      <div style={{ width:"100%", maxWidth:440, position:"relative", zIndex:1 }}>
        <div style={{ padding:"52px 24px 0" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,.28)", letterSpacing:.8, marginBottom:6 }}>{dateStr}</div>
              <h1 style={{ fontSize:30, fontWeight:800, color:"#fff", margin:"0 0 4px", letterSpacing:-.8 }}>나의 할 일</h1>
              <div style={{ fontSize:13, color:"rgba(255,255,255,.3)" }}>
                {incomplete>0?(incomplete+"개 남았어요"):"모두 완료! 🎉"}
                {archivedCnt>0&&<span style={{ marginLeft:8, fontSize:11, opacity:.5 }}>📦 {archivedCnt}</span>}
              </div>
            </div>
            <div style={{ display:"flex", gap:8, marginTop:4 }}>
              <button onClick={()=>setShowWidget(v=>!v)} style={{ width:40, height:40, borderRadius:13, cursor:"pointer", border:"1px solid "+(showWidget?ACCENT+"55":"rgba(255,255,255,.09)"), background:showWidget?ACCENT+"22":"rgba(255,255,255,.04)", color:showWidget?ACCENT:"rgba(255,255,255,.3)", display:"flex", alignItems:"center", justifyContent:"center", transition:"all .2s" }}><Ic.Grid/></button>
              <button onClick={()=>setShowBackup(true)} style={{ width:40, height:40, borderRadius:13, cursor:"pointer", border:"1px solid rgba(255,255,255,.09)", background:"rgba(255,255,255,.04)", color:"rgba(255,255,255,.3)", display:"flex", alignItems:"center", justifyContent:"center" }}><Ic.DL/></button>
            </div>
          </div>
        </div>
        {showWidget&&(
          <div style={{ margin:"20px 16px 0", background:"rgba(255,255,255,.025)", borderRadius:22, padding:18, border:"1px solid rgba(255,255,255,.06)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <span style={{ fontSize:12, fontWeight:600, color:"rgba(255,255,255,.5)" }}>위젯 미리보기</span>
              <div style={{ display:"flex", gap:5 }}>
                {["small","medium","large"].map(s=>(
                  <button key={s} onClick={()=>setWidgetSize(s)} style={{ padding:"4px 10px", borderRadius:8, border:"none", cursor:"pointer", background:widgetSize===s?"rgba(77,150,255,.25)":"rgba(255,255,255,.05)", color:widgetSize===s?"#fff":"rgba(255,255,255,.35)", fontSize:11, fontWeight:700, transition:"all .15s" }}>{s==="small"?"S":s==="medium"?"M":"L"}</button>
                ))}
              </div>
            </div>
            <div style={{ display:"flex", justifyContent:"center" }}>
              <Widget todos={todos} setTodos={setTodos} onToggle={toggle} onArchive={archiveTodo} onAdd={widgetAdd} size={widgetSize}/>
            </div>
            <div style={{ marginTop:10, fontSize:10.5, color:"rgba(255,255,255,.2)", textAlign:"center" }}>→ 스와이프 보관  ·  ⠿ 순서변경</div>
          </div>
        )}
        <div style={{ padding:"20px 20px 14px", display:"flex", gap:7, overflowX:"auto" }}>
          {CATEGORIES.map(cat=>{ const cnt=cat==="보관함"?archivedCnt:cat==="전체"?activeTodos.length:cat==="미완료"?activeTodos.filter(t=>!t.done).length:cat==="중요"?activeTodos.filter(t=>t.priority).length:activeTodos.filter(t=>t.done).length; const active=category===cat; return <button key={cat} onClick={()=>setCategory(cat)} style={{ background:active?"rgba(77,150,255,.18)":"rgba(255,255,255,.04)", border:"1px solid "+(active?"rgba(77,150,255,.45)":"rgba(255,255,255,.07)"), borderRadius:20, padding:"6px 14px", cursor:"pointer", color:active?ACCENT:"rgba(255,255,255,.38)", fontSize:12.5, fontWeight:500, whiteSpace:"nowrap", transition:"all .2s" }}>{cat==="보관함"?"📦 보관함":cat} <span style={{ opacity:.6 }}>{cnt}</span></button>; })}
        </div>
        {isArchiveView&&archivedCnt>0&&<div style={{ margin:"0 14px 10px", padding:"8px 14px", borderRadius:12, background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)", fontSize:11, color:"rgba(255,255,255,.35)", display:"flex", gap:12 }}><span>→ 복원</span><span>← 완전삭제</span></div>}
        <div style={{ padding:"0 14px", display:"flex", flexDirection:"column", gap:7 }}>
          {filtered.length===0&&<div style={{ textAlign:"center", padding:"48px 0", color:"rgba(255,255,255,.18)", fontSize:14 }}>{isArchiveView?"보관된 항목이 없어요":"항목이 없어요"}</div>}
          {filtered.map((todo,idx)=>(
            <div key={todo.id} style={{ animation:"slideIn .3s cubic-bezier(.34,1.56,.64,1) "+(idx*.03)+"s both" }}>
              {editingId===todo.id?(
                <div style={{ display:"flex", gap:8, padding:"4px 0" }}>
                  <input autoFocus value={editText} onChange={e=>setEditText(e.target.value)} onBlur={()=>saveEdit(todo.id)} onKeyDown={e=>{if(e.key==="Enter")saveEdit(todo.id);if(e.key==="Escape")setEditingId(null);}} style={{ flex:1, background:"rgba(77,150,255,.1)", border:"1px solid rgba(77,150,255,.4)", borderRadius:14, padding:"12px 16px", color:"#fff", fontSize:14.5, outline:"none", fontFamily:"inherit" }}/>
                  <button onClick={()=>saveEdit(todo.id)} style={{ background:ACCENT, border:"none", borderRadius:12, padding:"0 16px", color:"#fff", cursor:"pointer", fontWeight:700, fontSize:13 }}>저장</button>
                </div>
              ):(
                <SwipeRow todo={todo} isArchiveView={isArchiveView} onToggle={toggle} onArchive={archiveTodo} onDelete={deleteTodo} onEdit={startEdit} onTogglePri={togglePri} dragging={draggingId===todo.id} isOver={overId===todo.id&&draggingId!==todo.id} onDragStart={handleDragStart} onDragOver={handleDragOver} onDrop={handleDrop} onDragEnd={handleDragEnd}/>
              )}
            </div>
          ))}
          {filtered.length>0&&<div style={{ textAlign:"center", padding:"6px 0 2px", fontSize:10.5, color:"rgba(255,255,255,.12)" }}>{isArchiveView?"→ 복원  ·  ← 완전삭제":"→ 스와이프 보관  ·  ⠿ 순서변경  ·  더블탭 수정"}</div>}
        </div>
        <div style={{ position:"sticky", bottom:0, padding:"16px 14px 36px", background:"linear-gradient(to top,"+BG+" 65%,transparent)", marginTop:16 }}>
          <div style={{ display:"flex", gap:9 }}>
            <input ref={inputRef} value={inputText} onChange={e=>setInputText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addTodo()} placeholder="새로운 할 일을 입력하세요..." style={{ flex:1, background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.09)", borderRadius:16, padding:"14px 18px", color:"#fff", fontSize:14.5, outline:"none", fontFamily:"inherit", transition:"all .2s" }} onFocus={e=>{e.target.style.border="1px solid "+ACCENT+"99";e.target.style.background=ACCENT+"11";}} onBlur={e=>{e.target.style.border="1px solid rgba(255,255,255,.09)";e.target.style.background="rgba(255,255,255,.06)";}}/>
            <button onClick={addTodo} disabled={!inputText.trim()} style={{ width:50, height:50, borderRadius:15, border:"none", background:inputText.trim()?ACCENT:"rgba(255,255,255,.05)", cursor:inputText.trim()?"pointer":"default", color:inputText.trim()?"#fff":"rgba(255,255,255,.15)", transition:"all .28s cubic-bezier(.34,1.56,.64,1)", transform:inputText.trim()?"scale(1)":"scale(.9)", boxShadow:inputText.trim()?"0 6px 20px rgba(77,150,255,.5)":"none", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}><Ic.Plus/></button>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes slideIn { from { opacity:0; transform:translateY(10px) scale(.97) } to { opacity:1; transform:none } }
        @keyframes fadeDown { from { opacity:0; transform:translate(-50%,-10px) } to { opacity:1; transform:translate(-50%,0) } }
        * { box-sizing:border-box; }
        ::-webkit-scrollbar { display:none; }
        input::placeholder { color:rgba(255,255,255,.22); }
        textarea::placeholder { color:rgba(255,255,255,.22); }
        body { margin:0; }
      `}</style>
    </div>
  );
}

export default function App() { return <TodoApp/>; }
