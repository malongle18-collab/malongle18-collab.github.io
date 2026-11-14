/** Swipe left on a row to reveal a delete action. Bind once on document. */

const OPEN_AT = 44;
const DELETE_AT = 112;
const LOCK = 10;

let drag = null;
let suppressUntil = 0;
let booted = false;

function rowOf(el) {
  return el?.closest?.("[data-swipe-row]") || null;
}

function frontOf(row) {
  return row.querySelector(".swipe-front") || row;
}

function delBtn(row) {
  return row.querySelector(":scope > .swipe-del-btn");
}

function actionWidth(row) {
  return delBtn(row)?.offsetWidth || 88;
}

function interactiveStart(target) {
  return Boolean(target.closest("input:not([type=checkbox]), textarea, select, canvas, a, .sig-pad"));
}

function suppressClick() {
  suppressUntil = Date.now() + 450;
}

function setX(row, x, animate) {
  const front = frontOf(row);
  row.classList.toggle("is-dragging", !animate);
  front.style.transform = x ? `translate3d(${x}px,0,0)` : "";
}

function setOpen(row, open) {
  if (!row) return;
  row.classList.toggle("is-open", open);
  row.classList.remove("is-dragging");
  setX(row, open ? -actionWidth(row) : 0, true);
  const btn = delBtn(row);
  if (btn) btn.tabIndex = open ? 0 : -1;
  row.style.touchAction = "";
}

export function closeSwipeRows(except) {
  document.querySelectorAll("[data-swipe-row].is-open, [data-swipe-row].is-dragging").forEach((row) => {
    if (row === except) return;
    setOpen(row, false);
  });
}

function onDown(e) {
  if (e.isPrimary === false) return;
  if (e.pointerType === "mouse" && e.button !== 0) return;
  const row = rowOf(e.target);
  if (!row) {
    closeSwipeRows();
    return;
  }
  if (e.target.closest(".swipe-del-btn, .swipe-hover-del")) return;
  if (interactiveStart(e.target)) {
    closeSwipeRows(row);
    return;
  }
  closeSwipeRows(row);
  const opened = row.classList.contains("is-open");
  drag = {
    row,
    id: e.pointerId,
    startX: e.clientX,
    startY: e.clientY,
    base: opened ? -actionWidth(row) : 0,
    dx: 0,
    locked: false,
    swiped: false,
  };
}

function onMove(e) {
  if (!drag || e.pointerId !== drag.id) return;
  const dx = e.clientX - drag.startX;
  const dy = e.clientY - drag.startY;
  if (!drag.locked) {
    if (Math.abs(dx) < LOCK && Math.abs(dy) < LOCK) return;
    if (Math.abs(dy) >= Math.abs(dx)) {
      drag = null;
      return;
    }
    drag.locked = true;
    drag.row.style.touchAction = "none";
    try {
      drag.row.setPointerCapture?.(e.pointerId);
    } catch {
      /* ignore */
    }
  }
  drag.dx = dx;
  drag.swiped = true;
  e.preventDefault();
  const w = actionWidth(drag.row);
  const min = -Math.max(w + 56, Math.round(drag.row.offsetWidth * 0.72));
  const x = Math.min(20, Math.max(min, drag.base + dx));
  setX(drag.row, x, false);
}

function finish(e) {
  if (!drag || (e && e.pointerId !== drag.id)) return;
  const { row, dx, base, swiped, locked } = drag;
  drag = null;
  try {
    row.releasePointerCapture?.(e.pointerId);
  } catch {
    /* ignore */
  }
  if (!locked || !swiped) {
    if (row.classList.contains("is-open")) {
      setOpen(row, false);
      suppressClick();
    } else {
      row.classList.remove("is-dragging");
      row.style.touchAction = "";
    }
    return;
  }
  const x = base + dx;
  const width = row.offsetWidth || 0;
  if (x <= -DELETE_AT || (width && x <= -width * 0.45)) {
    setOpen(row, true);
    suppressClick();
    const btn = delBtn(row);
    if (btn) queueMicrotask(() => btn.click());
    return;
  }
  if (x <= -OPEN_AT) {
    setOpen(row, true);
    suppressClick();
    return;
  }
  setOpen(row, false);
  suppressClick();
}

function onClickCapture(e) {
  if (e.target.closest(".swipe-del-btn, .swipe-hover-del")) return;
  if (Date.now() < suppressUntil) {
    e.preventDefault();
    e.stopPropagation();
    return;
  }
  const row = rowOf(e.target);
  if (row?.classList.contains("is-open")) {
    e.preventDefault();
    e.stopPropagation();
    setOpen(row, false);
    return;
  }
  if (!row) closeSwipeRows();
}

export function initSwipe() {
  if (booted) return;
  booted = true;
  document.addEventListener("pointerdown", onDown, true);
  document.addEventListener("pointermove", onMove, { capture: true, passive: false });
  document.addEventListener("pointerup", finish, true);
  document.addEventListener("pointercancel", finish, true);
  document.addEventListener("click", onClickCapture, true);
}
