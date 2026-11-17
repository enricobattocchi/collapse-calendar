// Opens calendar doors in place and remembers which ones this visitor opened.
// Without JavaScript, each door front is a plain link to its day page.
(() => {
  const KEY = "collapse-calendar:opened";
  let opened = [];
  try { opened = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { opened = []; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(opened)); } catch {} };

  const reset = document.querySelector("button.reset");
  const doors = [...document.querySelectorAll(".door[data-date]:not(.locked)")].filter((d) => d.querySelector(".inside"));
  const syncReset = () => { if (reset) reset.hidden = !doors.some((d) => d.classList.contains("open")); };
  const setOpen = (door, open) => {
    door.classList.toggle("open", open);
    door.querySelectorAll(".inside a").forEach((a) => (a.tabIndex = open ? 0 : -1));
    const front = door.querySelector(".front");
    if (front) front.tabIndex = open ? -1 : 0;
  };

  for (const door of doors) {
    const date = door.dataset.date;
    setOpen(door, opened.includes(date));
    door.querySelector(".front")?.addEventListener("click", (event) => {
      event.preventDefault();
      setOpen(door, true);
      if (!opened.includes(date)) { opened.push(date); save(); }
      syncReset();
      door.querySelector(".inside .read")?.focus({ preventScroll: true });
    });
  }
  reset?.addEventListener("click", () => {
    opened = [];
    save();
    doors.forEach((d) => setOpen(d, false));
    syncReset();
  });
  syncReset();
})();
