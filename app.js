const { SUPABASE_URL, SUPABASE_ANON_KEY } = window.APP_CONFIG || {};
const supabaseReady =
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  !SUPABASE_URL.includes("YOUR_PROJECT_ID") &&
  !SUPABASE_ANON_KEY.includes("YOUR_SUPABASE");

const supabaseClient = supabaseReady
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const state = {
  user: null,
  events: [],
  currentDate: new Date(),
  view: "month",
  notifiedKeys: new Set()
};

const els = {
  authStatus: document.querySelector("#authStatus"),
  loginOpenBtn: document.querySelector("#loginOpenBtn"),
  logoutBtn: document.querySelector("#logoutBtn"),
  loginDialog: document.querySelector("#loginDialog"),
  loginForm: document.querySelector("#loginForm"),
  closeLoginBtn: document.querySelector("#closeLoginBtn"),
  emailInput: document.querySelector("#emailInput"),
  loginMessage: document.querySelector("#loginMessage"),
  prevBtn: document.querySelector("#prevBtn"),
  nextBtn: document.querySelector("#nextBtn"),
  todayBtn: document.querySelector("#todayBtn"),
  monthViewBtn: document.querySelector("#monthViewBtn"),
  weekViewBtn: document.querySelector("#weekViewBtn"),
  periodTitle: document.querySelector("#periodTitle"),
  calendarRoot: document.querySelector("#calendarRoot"),
  todayList: document.querySelector("#todayList"),
  searchDate: document.querySelector("#searchDate"),
  searchBtn: document.querySelector("#searchBtn"),
  searchResult: document.querySelector("#searchResult"),
  reminderMinutes: document.querySelector("#reminderMinutes"),
  notificationBtn: document.querySelector("#notificationBtn"),
  newEventBtn: document.querySelector("#newEventBtn"),
  eventDialog: document.querySelector("#eventDialog"),
  eventForm: document.querySelector("#eventForm"),
  closeDialogBtn: document.querySelector("#closeDialogBtn"),
  dialogTitle: document.querySelector("#dialogTitle"),
  eventId: document.querySelector("#eventId"),
  eventDate: document.querySelector("#eventDate"),
  startTime: document.querySelector("#startTime"),
  endTime: document.querySelector("#endTime"),
  friendName: document.querySelector("#friendName"),
  memo: document.querySelector("#memo"),
  deleteEventBtn: document.querySelector("#deleteEventBtn")
};

const weekdays = ["日", "月", "火", "水", "木", "金", "土"];

init();

async function init() {
  bindEvents();
  setDefaultDates();

  if (!supabaseClient) {
    setLoggedOut("Supabase未設定");
    render();
    return;
  }

  const { data } = await supabaseClient.auth.getSession();
  state.user = data.session?.user || null;
  updateAuthUi();

  supabaseClient.auth.onAuthStateChange((_event, session) => {
    state.user = session?.user || null;
    updateAuthUi();
    loadEvents();
  });

  await loadEvents();
  setInterval(checkReminders, 30000);
}

function bindEvents() {
  els.loginOpenBtn.addEventListener("click", () => els.loginDialog.showModal());
  els.closeLoginBtn.addEventListener("click", () => els.loginDialog.close());
  els.loginForm.addEventListener("submit", handleLogin);
  els.logoutBtn.addEventListener("click", handleLogout);
  els.prevBtn.addEventListener("click", () => movePeriod(-1));
  els.nextBtn.addEventListener("click", () => movePeriod(1));
  els.todayBtn.addEventListener("click", () => {
    state.currentDate = new Date();
    render();
  });
  els.monthViewBtn.addEventListener("click", () => setView("month"));
  els.weekViewBtn.addEventListener("click", () => setView("week"));
  els.newEventBtn.addEventListener("click", () => openEventDialog(toDateKey(new Date())));
  els.closeDialogBtn.addEventListener("click", () => els.eventDialog.close());
  els.eventForm.addEventListener("submit", handleSaveEvent);
  els.deleteEventBtn.addEventListener("click", handleDeleteEvent);
  els.searchBtn.addEventListener("click", renderSearch);
  els.searchDate.addEventListener("change", renderSearch);
  els.notificationBtn.addEventListener("click", requestNotificationPermission);
}

function setDefaultDates() {
  const today = toDateKey(new Date());
  els.searchDate.value = today;
  els.eventDate.value = today;
}

async function handleLogin(event) {
  event.preventDefault();
  if (!supabaseClient) {
    els.loginMessage.textContent = "config.jsにSupabase設定を入力してください。";
    return;
  }

  els.loginMessage.textContent = "送信中...";
  const email = els.emailInput.value.trim();
  const { error } = await supabaseClient.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.origin
    }
  });

  els.loginMessage.textContent = error
    ? `送信に失敗しました: ${error.message}`
    : "ログインリンクをメールに送信しました。";
}

async function handleLogout() {
  await supabaseClient.auth.signOut();
}

async function loadEvents() {
  if (!supabaseClient || !state.user) {
    state.events = [];
    render();
    return;
  }

  const { data, error } = await supabaseClient
    .from("friend_events")
    .select("*")
    .eq("user_id", state.user.id)
    .order("event_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    alert(`予定の読み込みに失敗しました: ${error.message}`);
    return;
  }

  state.events = data || [];
  render();
}

async function handleSaveEvent(event) {
  event.preventDefault();
  if (!ensureLogin()) return;

  const payload = {
    event_date: els.eventDate.value,
    start_time: els.startTime.value || null,
    end_time: els.endTime.value || null,
    friend_name: els.friendName.value.trim(),
    memo: els.memo.value.trim(),
    reminder_minutes: Number(els.reminderMinutes.value),
    user_id: state.user.id
  };

  const id = els.eventId.value;
  const request = id
    ? supabaseClient.from("friend_events").update(payload).eq("id", id).eq("user_id", state.user.id)
    : supabaseClient.from("friend_events").insert(payload);

  const { error } = await request;
  if (error) {
    alert(`保存に失敗しました: ${error.message}`);
    return;
  }

  els.eventDialog.close();
  await loadEvents();
}

async function handleDeleteEvent() {
  if (!ensureLogin()) return;
  const id = els.eventId.value;
  if (!id || !confirm("この予定を削除しますか？")) return;

  const { error } = await supabaseClient
    .from("friend_events")
    .delete()
    .eq("id", id)
    .eq("user_id", state.user.id);

  if (error) {
    alert(`削除に失敗しました: ${error.message}`);
    return;
  }

  els.eventDialog.close();
  await loadEvents();
}

function ensureLogin() {
  if (supabaseClient && state.user) return true;
  alert("先にログインしてください。");
  return false;
}

function setLoggedOut(label = "未ログイン") {
  els.authStatus.textContent = label;
  els.loginOpenBtn.classList.remove("hidden");
  els.logoutBtn.classList.add("hidden");
}

function updateAuthUi() {
  if (!state.user) {
    setLoggedOut();
    return;
  }
  els.authStatus.textContent = state.user.email || "ログイン中";
  els.loginOpenBtn.classList.add("hidden");
  els.logoutBtn.classList.remove("hidden");
  els.loginDialog.close();
}

function setView(view) {
  state.view = view;
  els.monthViewBtn.classList.toggle("active", view === "month");
  els.weekViewBtn.classList.toggle("active", view === "week");
  render();
}

function movePeriod(direction) {
  const next = new Date(state.currentDate);
  if (state.view === "month") {
    next.setMonth(next.getMonth() + direction);
  } else {
    next.setDate(next.getDate() + direction * 7);
  }
  state.currentDate = next;
  render();
}

function render() {
  if (state.view === "month") renderMonth();
  if (state.view === "week") renderWeek();
  renderToday();
  renderSearch();
}

function renderMonth() {
  const year = state.currentDate.getFullYear();
  const month = state.currentDate.getMonth();
  els.periodTitle.textContent = `${year}年 ${month + 1}月`;

  const firstDay = new Date(year, month, 1);
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - firstDay.getDay());

  const wrapper = document.createElement("div");
  wrapper.className = "month-grid";
  addWeekHeaders(wrapper);

  for (let i = 0; i < 42; i += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    wrapper.appendChild(createDayCell(date, date.getMonth() !== month));
  }

  els.calendarRoot.replaceChildren(wrapper);
}

function renderWeek() {
  const current = new Date(state.currentDate);
  const start = new Date(current);
  start.setDate(current.getDate() - current.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  els.periodTitle.textContent = `${formatJapaneseDate(start)} - ${formatJapaneseDate(end)}`;

  const wrapper = document.createElement("div");
  wrapper.className = "week-grid";
  addWeekHeaders(wrapper);

  for (let i = 0; i < 7; i += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    wrapper.appendChild(createDayCell(date, false));
  }

  els.calendarRoot.replaceChildren(wrapper);
}

function addWeekHeaders(wrapper) {
  weekdays.forEach((day) => {
    const header = document.createElement("div");
    header.className = "weekday";
    header.textContent = day;
    wrapper.appendChild(header);
  });
}

function createDayCell(date, isMuted) {
  const key = toDateKey(date);
  const cell = document.createElement("section");
  cell.className = "day-cell";
  if (isMuted) cell.classList.add("muted-day");
  if (key === toDateKey(new Date())) cell.classList.add("today");

  const head = document.createElement("div");
  head.className = "day-head";

  const number = document.createElement("span");
  number.className = "date-number";
  number.textContent = String(date.getDate());

  const addBtn = document.createElement("button");
  addBtn.className = "add-mini";
  addBtn.type = "button";
  addBtn.textContent = "+";
  addBtn.setAttribute("aria-label", `${key}に予定追加`);
  addBtn.addEventListener("click", () => openEventDialog(key));

  head.append(number, addBtn);
  cell.appendChild(head);

  getEventsByDate(key).forEach((item) => {
    const chip = document.createElement("button");
    chip.className = "event-chip";
    chip.type = "button";
    chip.textContent = `${formatTimeRange(item)} ${item.friend_name}`;
    chip.addEventListener("click", () => openEventDialog(key, item));
    cell.appendChild(chip);
  });

  return cell;
}

function renderToday() {
  const today = toDateKey(new Date());
  renderEventList(els.todayList, getEventsByDate(today));
}

function renderSearch() {
  if (!els.searchDate.value) {
    els.searchResult.textContent = "日付を選んでください";
    els.searchResult.classList.add("empty");
    return;
  }
  renderEventList(els.searchResult, getEventsByDate(els.searchDate.value));
}

function renderEventList(root, items) {
  root.replaceChildren();
  if (!items.length) {
    root.textContent = "予定はありません";
    root.classList.add("empty");
    return;
  }

  root.classList.remove("empty");
  items.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.addEventListener("click", () => openEventDialog(item.event_date, item));

    const article = document.createElement("article");
    article.className = "event-item";

    const main = document.createElement("div");
    const time = document.createElement("strong");
    time.className = "event-time";
    time.textContent = formatTimeRange(item);

    const friend = document.createElement("span");
    friend.className = "event-friend";
    friend.textContent = item.friend_name;

    const memo = document.createElement("p");
    memo.className = "event-memo";
    memo.textContent = item.memo || "メモなし";

    main.append(time, friend);
    article.append(main, memo);
    button.appendChild(article);
    root.appendChild(button);
  });
}

function openEventDialog(dateKey, item = null) {
  if (!ensureLogin()) return;

  els.dialogTitle.textContent = item ? "予定編集" : "予定追加";
  els.eventId.value = item?.id || "";
  els.eventDate.value = item?.event_date || dateKey;
  els.startTime.value = normalizeTime(item?.start_time) || "";
  els.endTime.value = normalizeTime(item?.end_time) || "";
  els.friendName.value = item?.friend_name || "";
  els.memo.value = item?.memo || "";
  els.deleteEventBtn.classList.toggle("hidden", !item);
  els.eventDialog.showModal();
}

function getEventsByDate(dateKey) {
  return state.events
    .filter((event) => event.event_date === dateKey)
    .sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""));
}

async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    alert("このブラウザは通知に対応していません。");
    return;
  }
  const result = await Notification.requestPermission();
  alert(result === "granted" ? "通知を許可しました。" : "通知は許可されませんでした。");
}

function checkReminders() {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const now = new Date();
  state.events.forEach((event) => {
    if (!event.start_time) return;

    const remindAt = new Date(`${event.event_date}T${normalizeTime(event.start_time)}`);
    remindAt.setMinutes(remindAt.getMinutes() - Number(event.reminder_minutes || 0));

    const diff = Math.abs(now.getTime() - remindAt.getTime());
    const key = `${event.id}:${event.event_date}:${event.start_time}`;
    if (diff <= 30000 && !state.notifiedKeys.has(key)) {
      state.notifiedKeys.add(key);
      new Notification("ゲーム予定の時間です", {
        body: `${formatTimeRange(event)} ${event.friend_name}`
      });
    }
  });
}

function formatTimeRange(event) {
  const start = normalizeTime(event.start_time);
  const end = normalizeTime(event.end_time);
  if (start && end) return `${start}-${end}`;
  if (start) return start;
  return "時間未設定";
}

function normalizeTime(value) {
  return value ? String(value).slice(0, 5) : "";
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatJapaneseDate(date) {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}
