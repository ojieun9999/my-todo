import { useState, useRef, useEffect } from "react";

const LONG_PRESS_DURATION = 500;
const SWIPE_COMMIT = 180;
const SWIPE_THRESHOLD = 60;

// ── Toss-style design tokens ──────────────────────────────────
const T = {
  // dark
  dk: {
    bg:        "#111111",
    surface:   "#1c1c1e",
    surface2:  "#2c2c2e",
    border:    "#2c2c2e",
    tabBg:     "#1c1c1e",
    tabActive: "#2c2c2e",
    label:     "#f2f2f7",
    sub:       "#8e8e93",
    muted:     "#3a3a3c",
    accent:    "#3182f6",
    accentSub: "rgba(49,130,246,0.12)",
    done:      "#48484a",
    danger:    "#ff3b30",
    success:   "#34c759",
    restore:   "#3182f6",
    toggle:    "#2c2c2e",
    toggleKnob:"#3182f6",
  },
  // light
  lt: {
    bg:        "#f2f2f7",
    surface:   "#ffffff",
    surface2:  "#f2f2f7",
    border:    "#e5e5ea",
    tabBg:     "#e5e5ea",
    tabActive: "#ffffff",
    label:     "#111111",
    sub:       "#8e8e93",
    muted:     "#c7c7cc",
    accent:    "#3182f6",
    accentSub: "rgba(49,130,246,0.08)",
    done:      "#c7c7cc",
    danger:    "#ff3b30",
    success:   "#34c759",
    restore:   "#3182f6",
    toggle:    "#e5e5ea",
    toggleKnob:"#3182f6",
  },
};
/*
const formatDate = (ts) => {
  const d = new Date(ts);
  const date = d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
  const time = d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  return `${date} ${time}`;
};*/

const INITIAL_TODOS = [
  { id: 1, text: "디자인 시스템 문서 작성", done: false, createdAt: Date.now() - 86400000 },
 /* { id: 2, text: "주간 보고서 제출", done: false, createdAt: Date.now() - 3600000 },
  { id: 3, text: "독서 30분", done: true,  createdAt: Date.now() - 7200000 },
  { id: 4, text: "팀 미팅 준비", done: false, createdAt: Date.now() - 1800000 },*/
];

// ── TodoItem ──────────────────────────────────────────────────
function TodoItem({ todo, dark, selected, onSelect, onToggle, onDelete, onEditConfirm, isTrash = false, onRestore }) {
  const c = dark ? T.dk : T.lt;

  const [offsetX, setOffsetX]   = useState(0);
  const [swiping, setSwiping]   = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);
  const [pressed, setPressed]   = useState(false);
  const [removing, setRemoving] = useState(false);

  const touchStartX  = useRef(null);
  const touchStartY  = useRef(null);
  const isScrolling  = useRef(false);
  const longPressTimer = useRef(null);
  const editRef      = useRef(null);
  const curOffset    = useRef(0);
  const mouseStartX  = useRef(null);
  const mouseSwipe   = useRef(false);
  const didMove      = useRef(false);

  useEffect(() => {
    if (isEditing && editRef.current) {
      editRef.current.focus();
      const len = editRef.current.value.length;
      editRef.current.setSelectionRange(len, len);
    }
  }, [isEditing]);
  useEffect(() => { curOffset.current = offsetX; }, [offsetX]);

  const startEdit  = () => { setEditText(todo.text); setIsEditing(true); };
  const confirmEdit = () => {
    const t = editText.trim();
    if (t) onEditConfirm(todo.id, t);
    setIsEditing(false);
  };
  const commitSwipe = (offset) => {
    if (isTrash) {
      if (offset > SWIPE_COMMIT)       { setOffsetX(0); onRestore(todo.id); }
      else if (offset < -SWIPE_COMMIT) { setRemoving(true); setTimeout(() => onDelete(todo.id), 260); }
      else setOffsetX(0);
    } else {
      if (offset > SWIPE_COMMIT)       { setOffsetX(0); onToggle(todo.id); }
      else if (offset < -SWIPE_COMMIT) { setRemoving(true); setTimeout(() => onDelete(todo.id), 260); }
      else setOffsetX(0);
    }
  };

  const startPress = () => {
    if (isEditing || isTrash) return;
    setPressed(true);
    longPressTimer.current = setTimeout(() => { setPressed(false); startEdit(); }, LONG_PRESS_DURATION);
  };
  const endPress = () => { clearTimeout(longPressTimer.current); setPressed(false); };

  const onTouchStart = (e) => {
    if (isEditing) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isScrolling.current = false; setSwiping(false); didMove.current = false;
    startPress();
  };
  const onTouchMove = (e) => {
    if (touchStartX.current === null || isEditing) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;
    didMove.current = true;
    if (!swiping && Math.abs(dy) > Math.abs(dx) + 5) { isScrolling.current = true; endPress(); return; }
    if (isScrolling.current) return;
    if (Math.abs(dx) > 8) {
      clearTimeout(longPressTimer.current); setPressed(false); setSwiping(true);
      setOffsetX(Math.max(-SWIPE_COMMIT - 30, Math.min(SWIPE_COMMIT + 30, dx)));
    }
  };
  const onTouchEnd = () => {
    if (!swiping) {
      endPress();
      if (!didMove.current && !isEditing && !isTrash) onSelect(todo.id);
      touchStartX.current = null; return;
    }
    setSwiping(false); touchStartX.current = null;
    commitSwipe(curOffset.current);
  };

  const onMouseDown = (e) => {
    if (isEditing) return;
    mouseStartX.current = e.clientX; mouseSwipe.current = false; didMove.current = false;
    startPress();
  };
  const onMouseMove = (e) => {
    if (mouseStartX.current === null || isEditing) return;
    const dx = e.clientX - mouseStartX.current;
    if (Math.abs(dx) > 8 && !mouseSwipe.current) {
      clearTimeout(longPressTimer.current); setPressed(false);
      mouseSwipe.current = true; didMove.current = true;
    }
    if (mouseSwipe.current) setOffsetX(Math.max(-SWIPE_COMMIT - 30, Math.min(SWIPE_COMMIT + 30, dx)));
  };
  const onMouseUp = () => {
    if (!mouseSwipe.current) {
      endPress();
      if (!didMove.current && !isEditing && !isTrash) onSelect(todo.id);
      mouseStartX.current = null; return;
    }
    const saved = curOffset.current;
    mouseStartX.current = null; mouseSwipe.current = false;
    commitSwipe(saved);
  };

  const leftRatio  = Math.min(1, Math.max(0,  offsetX) / SWIPE_THRESHOLD);
  const rightRatio = Math.min(1, Math.max(0, -offsetX) / SWIPE_THRESHOLD);

  return (
    <div style={{
      position: "relative", borderRadius: 16, overflow: "hidden",
      height: removing ? 0 : undefined,
      opacity: removing ? 0 : 1,
      transition: removing ? "height 0.24s ease, opacity 0.24s ease, margin 0.24s" : "none",
      marginBottom: 6,
    }}>
      {/* → swipe bg */}
      <div style={{
        position: "absolute", inset: 0, borderRadius: 16,
        background: isTrash ? c.restore : c.success,
        display: "flex", alignItems: "center", paddingLeft: 22,
        opacity: leftRatio, pointerEvents: "none",
      }}>
        <span style={{ color: "#fff", fontWeight: 600, fontSize: 14, letterSpacing: "-0.01em" }}>
          {isTrash ? "복원" : (todo.done ? "되돌리기" : "완료")}
        </span>
      </div>
      {/* ← swipe bg */}
      <div style={{
        position: "absolute", inset: 0, borderRadius: 16,
        background: c.danger,
        display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 22,
        opacity: rightRatio, pointerEvents: "none",
      }}>
        <span style={{ color: "#fff", fontWeight: 600, fontSize: 14, letterSpacing: "-0.01em" }}>
          {isTrash ? "완전삭제" : "삭제"}
        </span>
      </div>

      {/* card */}
      <div
        style={{
          position: "relative",
          background: selected ? c.accentSub : c.surface,
          borderRadius: 16,
          padding: "10px 16px",
          display: "flex", alignItems: "flex-start", gap: 12,
          border: `1.5px solid ${selected ? c.accent : (isEditing ? c.accent : c.border)}`,
          transform: `translateX(${offsetX}px) scale(${pressed ? 0.985 : 1})`,
          transition: (swiping || mouseSwipe.current)
            ? "transform 0.04s linear"
            : "transform 0.3s cubic-bezier(.4,0,.2,1), border-color 0.15s, background 0.15s",
          opacity: (todo.done && !isEditing && !isTrash) ? 0.45 : 1,
          userSelect: "none", WebkitUserSelect: "none",
          touchAction: "pan-y",
          cursor: isEditing ? "text" : "pointer",
        }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={() => { if (mouseStartX.current !== null) onMouseUp(); endPress(); }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Checkbox */}
        {!isTrash && (
          <div
            onClick={(e) => { e.stopPropagation(); if (!isEditing) onToggle(todo.id); }}
            onMouseDown={e => e.stopPropagation()}
            style={{
              width: 22, height: 22, minWidth: 22, minHeight: 22, borderRadius: 11, flexShrink: 0,
              border: `1.5px solid ${todo.done ? c.accent : c.muted}`,
              background: todo.done ? c.accent : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", transition: "all 0.18s", boxSizing: "border-box",
            }}
          >
            {todo.done && (
              <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                <path d="M1 4.5L4 7.5L10 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
        )}

        {/* Text + date */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {isEditing ? (
            <textarea
              ref={editRef}
              value={editText}
              onChange={e => setEditText(e.target.value)}
              onBlur={confirmEdit}
              onKeyDown={e => { if (e.key === "Escape") { e.preventDefault(); setIsEditing(false); } }}
              onClick={e => e.stopPropagation()}
              onMouseDown={e => e.stopPropagation()}
              onTouchStart={e => e.stopPropagation()}
              rows={2}
              style={{
                width: "100%", background: "transparent",
                border: "none", outline: "none", resize: "none",
                fontSize: 14, fontWeight: 500, lineHeight: "1.5",
                color: c.label, fontFamily: "inherit", letterSpacing: "-0.01em",
              }}
            />
          ) : (
            <span style={{
              fontSize: 14, fontWeight: 500, lineHeight: "1.5",
              color: isTrash ? c.sub : c.label,
              textDecoration: (todo.done && !isTrash) || isTrash ? "line-through" : "none",
              display: "-webkit-box",
              WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
              overflow: "hidden", wordBreak: "break-word", whiteSpace: "pre-wrap",
              letterSpacing: "-0.01em",
            }}>{todo.text}</span>
          )}
          /*
          <div style={{
            fontSize: 12, color: c.sub,
            marginTop: 5, letterSpacing: "-0.01em",
          }}>
            {isTrash
              ? `삭제됨 · ${formatDate(todo.trashedAt)}`
              : formatDate(todo.createdAt)
            }
          </div>*/
        </div>

        {/* Save btn (edit mode) */}
        {isEditing && (
          <button
            onClick={(e) => { e.stopPropagation(); confirmEdit(); }}
            onMouseDown={e => e.stopPropagation()}
            style={{
              padding: "6px 14px", borderRadius: 10, border: "none",
              background: c.accent, color: "#fff",
              fontSize: 13, fontWeight: 600, letterSpacing: "-0.01em",
              cursor: "pointer", flexShrink: 0, alignSelf: "center",
            }}
          >저장</button>
        )}

        {/* Selected dot */}
        {selected && !isEditing && (
          <div style={{
            width: 7, height: 7, borderRadius: "50%",
            background: c.accent,
            flexShrink: 0, alignSelf: "center",
          }} />
        )}
      </div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────
export default function App() {
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem("dark") === "true"; } catch { return false; }
  });
  const [todos, setTodos] = useState(() => {
    try {
      const saved = localStorage.getItem("todos");
      return saved ? JSON.parse(saved) : INITIAL_TODOS;
    } catch { return INITIAL_TODOS; }
  });
  const [trash, setTrash] = useState(() => {
    try {
      const saved = localStorage.getItem("trash");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [input, setInput]     = useState("");
  const [filter, setFilter]   = useState("all");
  const [selectedId, setSelectedId] = useState(null);

  const wrapperRef = useRef(null);
  const headerRef  = useRef(null);
  const c = dark ? T.dk : T.lt;
  const showTrash = filter === "trash";

  // localStorage 저장
  useEffect(() => {
    try { localStorage.setItem("todos", JSON.stringify(todos)); } catch {}
  }, [todos]);
  useEffect(() => {
    try { localStorage.setItem("trash", JSON.stringify(trash)); } catch {}
  }, [trash]);
  useEffect(() => {
    try { localStorage.setItem("dark", String(dark)); } catch {}
  }, [dark]);

  useEffect(() => {
    const handleOutside = (e) => {
      if (selectedId === null) return;
      const inList   = wrapperRef.current?.contains(e.target);
      const inHeader = headerRef.current?.contains(e.target);
      if (!inList && !inHeader) setSelectedId(null);
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, [selectedId]);

  const addTodo = () => {
    const t = input.trim();
    if (!t) return;
    setTodos(p => [{ id: Date.now(), text: t, done: false, createdAt: Date.now() }, ...p]);
    setInput("");
  };

  const deleteTodo = (id) => {
    const item = todos.find(t => t.id === id);
    if (item) setTrash(p => [{ ...item, trashedAt: Date.now() }, ...p]);
    setTodos(p => p.filter(t => t.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const restoreFromTrash = (id) => {
    const item = trash.find(t => t.id === id);
    if (item) { const { trashedAt, ...rest } = item; setTodos(p => [...p, rest]); }
    setTrash(p => p.filter(t => t.id !== id));
  };

  const permanentDelete = (id) => setTrash(p => p.filter(t => t.id !== id));
  const clearTrash = () => setTrash([]);

  const filtered = todos.filter(t =>
    filter === "all" ? true : filter === "active" ? !t.done : filter === "done" ? t.done : true
  );

  const selectedIndex = filtered.findIndex(t => t.id === selectedId);
  const canUp   = selectedId !== null && selectedIndex > 0;
  const canDown = selectedId !== null && selectedIndex < filtered.length - 1;

  const handleSelect = (id) => setSelectedId(prev => prev === id ? null : id);

  const handleEditConfirm = (id, text) =>
    setTodos(p => p.map(t => t.id === id ? { ...t, text } : t));

  const moveSelected = (dir) => {
    if (selectedId === null) return;
    const ids = filtered.map(t => t.id);
    const idx = ids.indexOf(selectedId);
    const swapWith = dir === "up" ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= ids.length) return;
    const newIds = [...ids];
    [newIds[idx], newIds[swapWith]] = [newIds[swapWith], newIds[idx]];
    setTodos(prev => {
      const filteredIdSet = new Set(ids);
      const map = Object.fromEntries(prev.map(t => [t.id, t]));
      let cursor = 0;
      return prev.map(t => filteredIdSet.has(t.id) ? map[newIds[cursor++]] : t);
    });
  };

  const TABS = [
    ["all",    "전체"],
    ["active", "미완료"],
    ["done",   "완료"],
    ["trash",  trash.length > 0 ? `삭제 (${trash.length})` : "삭제"],
  ];

  return (
    <div style={{
      minHeight: "100dvh",
      height: "100dvh",
      overflow: "hidden",
      background: c.bg,
      transition: "background 0.3s",
      fontFamily: "-apple-system, 'Pretendard', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif",
    }}>
      <div style={{ maxWidth: 480, margin: "0 auto", paddingBottom: 100 }}>

        {/* ── Sticky header ── */}
        <div ref={headerRef} style={{
          position: "sticky", top: 0, zIndex: 50,
          background: c.bg,
          padding: "52px 20px 0",
          transition: "background 0.3s",
        }}>

          {/* Title row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: c.sub, letterSpacing: "-0.01em", marginBottom: 4 }}>
                {new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "short" })}
              </p>
              <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: c.label, letterSpacing: "-0.03em", lineHeight: 1.15 }}>
                오늘의 할 일
              </h1>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 4 }}>
              {/* Dark / Light toggle */}
              <button onClick={() => setDark(p => !p)} style={{
                width: 56, height: 30, borderRadius: 15, border: "none",
                background: c.toggle, position: "relative", cursor: "pointer",
                transition: "background 0.25s", flexShrink: 0, padding: 0,
              }}>
                <div style={{
                  position: "absolute", top: 3, left: dark ? 26 : 3,
                  width: 24, height: 24, borderRadius: 12,
                  background: c.toggleKnob,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, transition: "left 0.25s cubic-bezier(.4,0,.2,1)",
                  boxShadow: "0 1px 6px rgba(0,0,0,0.18)",
                }}>{dark ? "🌙" : "☀️"}</div>
              </button>
            </div>
          </div>

          {/* Filter tabs */}
          <div style={{
            display: "flex", gap: 0,
            background: c.tabBg,
            borderRadius: 12, padding: 3,
            marginBottom: 8,
          }}>
            {TABS.map(([val, label]) => {
              const active = filter === val;
              const isTrashTab = val === "trash";
              return (
                <button key={val} onClick={() => { setFilter(val); setSelectedId(null); }} style={{
                  flex: 1, padding: "8px 4px", borderRadius: 10, border: "none",
                  background: active ? c.tabActive : "transparent",
                  color: active
                    ? (isTrashTab ? c.danger : c.label)
                    : c.sub,
                  fontSize: 12, fontWeight: active ? 600 : 400,
                  cursor: "pointer", transition: "all 0.15s",
                  letterSpacing: "-0.01em", whiteSpace: "nowrap",
                  boxShadow: active ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                }}>{label}</button>
              );
            })}
          </div>

          {/* Hint + reorder row */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            fontSize: 12, color: c.sub, letterSpacing: "-0.01em",
            padding: "8px 2px 10px",
            minHeight: 36,
          }}>
            {showTrash ? (
              <>
                <span>→ 복원 · ← 완전삭제</span>
                {trash.length > 0 && (
                  <span onClick={clearTrash} style={{ color: c.danger, cursor: "pointer", fontWeight: 600 }}>
                    전체 삭제
                  </span>
                )}
              </>
            ) : (
              <>
                <span>← 삭제 · → 완료 · 탭 선택</span>
                {/* Reorder buttons — 탭 아래 우측 */}
                <div style={{
                  display: "flex", gap: 4, alignItems: "center",
                  maxWidth: (selectedId !== null) ? 100 : 0,
                  opacity: (selectedId !== null) ? 1 : 0,
                  overflow: "hidden",
                  transition: "max-width 0.25s cubic-bezier(.4,0,.2,1), opacity 0.2s",
                }}>
                  {[["up", "↑", canUp], ["down", "↓", canDown]].map(([dir, label, enabled]) => (
                    <button key={dir} onClick={() => moveSelected(dir)} disabled={!enabled} style={{
                      width: 28, height: 26, borderRadius: 8, border: "none",
                      background: enabled ? c.accent : c.surface2,
                      color: enabled ? "#fff" : c.muted,
                      fontSize: 13, fontWeight: 700,
                      cursor: enabled ? "pointer" : "default",
                      transition: "all 0.15s", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>{label}</button>
                  ))}
                  <button onClick={() => setSelectedId(null)} style={{
                    width: 28, height: 26, borderRadius: 8, border: "none",
                    background: c.surface2, color: c.sub,
                    fontSize: 12, cursor: "pointer", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>✕</button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── List ── */}
        <div style={{ padding: "0 20px" }} ref={wrapperRef}>
          {showTrash ? (
            trash.length === 0 ? (
              <EmptyState dark={dark} c={c} text="삭제된 항목이 없어요" />
            ) : (
              trash.map(todo => (
                <TodoItem key={todo.id} todo={todo} dark={dark}
                  selected={false} onSelect={() => {}} onToggle={() => {}}
                  onDelete={permanentDelete} onEditConfirm={() => {}}
                  isTrash={true} onRestore={restoreFromTrash}
                />
              ))
            )
          ) : (
            <>
              {filtered.length === 0 ? (
                <EmptyState dark={dark} c={c} text="할 일이 없어요 🎉" />
              ) : (
                filtered.map(todo => (
                  <TodoItem key={todo.id} todo={todo} dark={dark}
                    selected={selectedId === todo.id}
                    onSelect={handleSelect}
                    onToggle={(id) => setTodos(p => p.map(t => t.id === id ? { ...t, done: !t.done } : t))}
                    onDelete={deleteTodo}
                    onEditConfirm={handleEditConfirm}
                  />
                ))
              )}

            </>
          )}
        </div>

        {/* ── Fixed bottom input ── */}
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          zIndex: 100,
          background: c.bg,
          borderTop: `1px solid ${c.border}`,
          padding: "12px 20px",
          paddingBottom: "calc(12px + env(safe-area-inset-bottom))",
        }}>
          <div style={{
            maxWidth: 480, margin: "0 auto",
            background: c.surface,
            borderRadius: 14,
            padding: "10px 14px",
            display: "flex", gap: 10, alignItems: "center",
            border: `1.5px solid ${c.border}`,
          }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTodo(); } }}
              onFocus={e => {
                // iOS Safari 키보드 올라올 때 화면 크기 변경 방지
                setTimeout(() => { e.target.scrollIntoView({ block: "center" }); }, 300);
              }}
              placeholder="할 일 추가"
              style={{
                flex: 1, background: "transparent", border: "none", outline: "none",
                fontSize: 14, color: c.label, fontFamily: "inherit",
                letterSpacing: "-0.01em",
              }}
            />
            <button onClick={addTodo} style={{
              width: 32, height: 32, borderRadius: 10, border: "none",
              background: input.trim() ? c.accent : c.surface2,
              color: input.trim() ? "#fff" : c.muted,
              fontSize: 20, lineHeight: 1,
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.15s", flexShrink: 0,
            }}>+</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ c, text }) {
  return (
    <div style={{
      textAlign: "center", padding: "60px 0",
      fontSize: 14, color: c.sub, letterSpacing: "-0.01em",
    }}>{text}</div>
  );
}