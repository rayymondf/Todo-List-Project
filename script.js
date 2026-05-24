// ─── TodoModel ───────────────────────────────────────────────────────────────

const TodoModel = (() => {
    const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };
    const VALID_PRIORITIES = ["low", "medium", "high"];
    const VALID_REPEATS = ["none", "daily", "weekly", "monthly"];
    const VALID_SORTS = ["default", "date", "priority", "az"];
    const VALID_FILTERS = ["all", "active", "completed", "overdue"];

    function createId() {
        return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    }

    function normalizePriority(v) {
        return VALID_PRIORITIES.includes(v) ? v : "medium";
    }

    function normalizeRepeat(v) {
        return VALID_REPEATS.includes(v) ? v : "none";
    }

    function parseTags(raw) {
        if (Array.isArray(raw)) return raw.map(t => String(t).trim()).filter(Boolean);
        if (typeof raw === "string") return raw.split(",").map(t => t.trim()).filter(Boolean);
        return [];
    }

    function createTodo(data = {}) {
        return {
            id: data.id || createId(),
            title: (String(data.title || "")).trim() || "Untitled",
            description: String(data.description || "").trim(),
            dueDate: data.dueDate || "",
            priority: normalizePriority(data.priority),
            tags: parseTags(data.tags),
            repeat: normalizeRepeat(data.repeat),
            completed: Boolean(data.completed),
            completedAt: data.completedAt || null,
            createdAt: typeof data.createdAt === "number" ? data.createdAt : Date.now()
        };
    }

    function createInitialState() {
        return { todos: [], sortMode: "default", filterMode: "all", searchQuery: "" };
    }

    function normalizeState(raw) {
        if (!raw || !Array.isArray(raw.todos)) return createInitialState();
        return {
            todos: raw.todos.map(createTodo),
            sortMode: VALID_SORTS.includes(raw.sortMode) ? raw.sortMode : "default",
            filterMode: VALID_FILTERS.includes(raw.filterMode) ? raw.filterMode : "all",
            searchQuery: ""
        };
    }

    function getTodoById(state, id) {
        return state.todos.find(t => t.id === id) || null;
    }

    function addTodo(state, data) {
        const todo = createTodo(data);
        state.todos.push(todo);
        return todo;
    }

    function updateTodo(state, id, data) {
        const todo = getTodoById(state, id);
        if (!todo) return null;
        todo.title = (String(data.title || "")).trim() || todo.title;
        todo.description = String(data.description || "").trim();
        todo.dueDate = data.dueDate || "";
        todo.priority = normalizePriority(data.priority);
        todo.tags = parseTags(data.tags);
        todo.repeat = normalizeRepeat(data.repeat);
        return todo;
    }

    function toggleTodo(state, id) {
        const todo = getTodoById(state, id);
        if (!todo) return false;
        todo.completed = !todo.completed;
        todo.completedAt = todo.completed ? Date.now() : null;
        return true;
    }

    function deleteTodo(state, id) {
        const before = state.todos.length;
        state.todos = state.todos.filter(t => t.id !== id);
        return state.todos.length !== before;
    }

    function isOverdue(todo) {
        if (!todo.dueDate || todo.completed) return false;
        return todo.dueDate < todayString();
    }

    function todayString() {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    }

    function filterTodos(todos, filterMode, searchQuery) {
        const q = (searchQuery || "").toLowerCase().trim();
        return todos.filter(todo => {
            if (filterMode === "active" && todo.completed) return false;
            if (filterMode === "completed" && !todo.completed) return false;
            if (filterMode === "overdue" && !isOverdue(todo)) return false;
            if (q) {
                const haystack = `${todo.title} ${todo.description} ${todo.tags.join(" ")}`.toLowerCase();
                if (!haystack.includes(q)) return false;
            }
            return true;
        });
    }

    function filterByTag(todos, tag) {
        if (!tag) return todos;
        return todos.filter(t => t.tags.includes(tag));
    }

    function sortTodos(todos, sortMode) {
        return todos.slice().sort((a, b) => {
            if (a.completed !== b.completed) return Number(a.completed) - Number(b.completed);
            if (sortMode === "date") return cmpDate(a, b) || cmpCreated(b, a);
            if (sortMode === "priority") return cmpPriority(a, b) || cmpCreated(b, a);
            if (sortMode === "az") return a.title.localeCompare(b.title);
            return cmpCreated(b, a);
        });
    }

    function cmpDate(a, b) {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
    }

    function cmpPriority(a, b) {
        return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    }

    function cmpCreated(a, b) {
        return a.createdAt - b.createdAt;
    }

    function getAllTags(state) {
        const set = new Set();
        state.todos.forEach(t => t.tags.forEach(tag => set.add(tag)));
        return [...set].sort();
    }

    function getTodosForDate(state, dateString) {
        return state.todos.filter(t => t.dueDate === dateString);
    }

    return {
        createInitialState, normalizeState,
        getTodoById, addTodo, updateTodo, toggleTodo, deleteTodo,
        filterTodos, filterByTag, sortTodos,
        getAllTags, getTodosForDate, isOverdue, todayString
    };
})();

// ─── Storage ─────────────────────────────────────────────────────────────────

const Storage = (() => {
    const KEY = "todo-app-v2";

    function load() {
        try {
            const raw = localStorage.getItem(KEY);
            return raw ? TodoModel.normalizeState(JSON.parse(raw)) : TodoModel.createInitialState();
        } catch {
            return TodoModel.createInitialState();
        }
    }

    function save(state) {
        try {
            localStorage.setItem(KEY, JSON.stringify(state));
        } catch (e) {
            console.error("Storage save failed:", e);
        }
    }

    return { load, save };
})();


// ─── App ─────────────────────────────────────────────────────────────────────

const App = (() => {
    // DOM refs
    const el = {
        searchInput: document.querySelector("#search-input"),
        viewCalBtn: document.querySelector("#view-calendar-btn"),
        viewListBtn: document.querySelector("#view-list-btn"),
        calendarView: document.querySelector("#calendar-view"),
        listView: document.querySelector("#list-view"),
        calPrev: document.querySelector("#cal-prev-btn"),
        calNext: document.querySelector("#cal-next-btn"),
        calToday: document.querySelector("#cal-today-btn"),
        calHeading: document.querySelector("#cal-heading"),
        calGrid: document.querySelector("#calendar-grid"),
        filterBtns: document.querySelectorAll(".filter-btn"),
        sortMode: document.querySelector("#sort-mode"),
        tagFilterBar: document.querySelector("#tag-filter-bar"),
        emptyState: document.querySelector("#empty-state"),
        todoList: document.querySelector("#todo-list"),
        // todo modal
        todoModal: document.querySelector("#todo-modal"),
        todoModalTitle: document.querySelector("#todo-modal-title"),
        closeTodoModal: document.querySelector("#close-todo-modal-btn"),
        cancelTodoBtn: document.querySelector("#cancel-todo-btn"),
        todoForm: document.querySelector("#todo-form"),
        todoTitle: document.querySelector("#todo-title"),
        todoDesc: document.querySelector("#todo-description"),
        todoDate: document.querySelector("#todo-date"),
        todoPriority: document.querySelector("#todo-priority"),
        todoTags: document.querySelector("#todo-tags"),
        todoRepeat: document.querySelector("#todo-repeat"),
        todoFormError: document.querySelector("#todo-form-error"),
        // day modal
        dayModal: document.querySelector("#day-modal"),
        dayModalTitle: document.querySelector("#day-modal-title"),
        closeDayModal: document.querySelector("#close-day-modal-btn"),
        dayTodoList: document.querySelector("#day-todo-list"),
        addTodoOnDayBtn: document.querySelector("#add-todo-on-day-btn"),
        // confirm modal
        confirmModal: document.querySelector("#confirm-modal"),
        confirmTitle: document.querySelector("#confirm-title"),
        confirmMessage: document.querySelector("#confirm-message"),
        closeConfirmModal: document.querySelector("#close-confirm-modal-btn"),
        cancelConfirmBtn: document.querySelector("#cancel-confirm-btn"),
        confirmActionBtn: document.querySelector("#confirm-action-btn"),
        openTodoModalBtn: document.querySelector("#open-todo-modal-btn")
    };

    let state = Storage.load();
    let currentView = "calendar";
    let calYear, calMonth;
    let editingId = null;
    let pendingDayDate = null;
    let pendingConfirm = null;
    let activeTag = null;

    function init() {
        const now = new Date();
        calYear = now.getFullYear();
        calMonth = now.getMonth();
        bindEvents();
        render();
    }

    // ── Events ────────────────────────────────────────────────────────────────

    function bindEvents() {
        el.openTodoModalBtn.addEventListener("click", () => openTodoModal());
        el.viewCalBtn.addEventListener("click", () => switchView("calendar"));
        el.viewListBtn.addEventListener("click", () => switchView("list"));
        el.calPrev.addEventListener("click", () => { stepMonth(-1); renderCalendar(); });
        el.calNext.addEventListener("click", () => { stepMonth(1); renderCalendar(); });
        el.calToday.addEventListener("click", () => {
            const now = new Date();
            calYear = now.getFullYear();
            calMonth = now.getMonth();
            renderCalendar();
        });
        el.searchInput.addEventListener("input", () => {
            state.searchQuery = el.searchInput.value;
            renderList();
        });
        el.filterBtns.forEach(btn => btn.addEventListener("click", () => {
            state.filterMode = btn.dataset.filter;
            el.filterBtns.forEach(b => b.classList.toggle("active", b === btn));
            Storage.save(state);
            renderList();
        }));
        el.sortMode.addEventListener("change", () => {
            state.sortMode = el.sortMode.value;
            Storage.save(state);
            renderList();
        });
        el.todoList.addEventListener("click", handleListClick);
        // todo modal
        el.closeTodoModal.addEventListener("click", closeTodoModal);
        el.cancelTodoBtn.addEventListener("click", closeTodoModal);
        el.todoModal.addEventListener("click", e => { if (e.target === el.todoModal) closeTodoModal(); });
        el.todoForm.addEventListener("submit", handleTodoSubmit);
        // day modal
        el.closeDayModal.addEventListener("click", closeDayModal);
        el.dayModal.addEventListener("click", e => { if (e.target === el.dayModal) closeDayModal(); });
        el.addTodoOnDayBtn.addEventListener("click", () => {
            const date = pendingDayDate;
            closeDayModal();
            openTodoModal(null, date);
        });
        el.dayTodoList.addEventListener("click", handleDayListClick);
        // confirm modal
        el.closeConfirmModal.addEventListener("click", closeConfirmModal);
        el.cancelConfirmBtn.addEventListener("click", closeConfirmModal);
        el.confirmModal.addEventListener("click", e => { if (e.target === el.confirmModal) closeConfirmModal(); });
        el.confirmActionBtn.addEventListener("click", () => {
            if (typeof pendingConfirm === "function") pendingConfirm();
            closeConfirmModal();
        });
        document.addEventListener("keydown", e => {
            if (e.key !== "Escape") return;
            if (!el.confirmModal.classList.contains("is-hidden")) { closeConfirmModal(); return; }
            if (!el.dayModal.classList.contains("is-hidden")) { closeDayModal(); return; }
            if (!el.todoModal.classList.contains("is-hidden")) { closeTodoModal(); return; }
        });
    }

    function stepMonth(delta) {
        calMonth += delta;
        if (calMonth > 11) { calMonth = 0; calYear++; }
        if (calMonth < 0) { calMonth = 11; calYear--; }
    }


    // ── Modal helpers ─────────────────────────────────────────────────────────

    function openTodoModal(todo = null, prefillDate = null) {
        editingId = todo ? todo.id : null;
        el.todoModalTitle.textContent = todo ? "Edit Todo" : "Add Todo";
        el.todoForm.reset();
        el.todoFormError.textContent = "";
        el.todoPriority.value = "medium";
        if (todo) {
            el.todoTitle.value = todo.title;
            el.todoDesc.value = todo.description;
            el.todoDate.value = todo.dueDate;
            el.todoPriority.value = todo.priority;
            el.todoTags.value = todo.tags.join(", ");
            el.todoRepeat.value = todo.repeat;
        } else if (prefillDate) {
            el.todoDate.value = prefillDate;
        }
        showModal(el.todoModal);
        el.todoTitle.focus();
    }

    function closeTodoModal() {
        editingId = null;
        hideModal(el.todoModal);
    }

    function openDayModal(dateString) {
        pendingDayDate = dateString;
        const d = new Date(`${dateString}T00:00:00`);
        el.dayModalTitle.textContent = d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
        renderDayList(dateString);
        showModal(el.dayModal);
    }

    function closeDayModal() {
        pendingDayDate = null;
        hideModal(el.dayModal);
    }

    function openConfirmModal({ title, message, onConfirm }) {
        pendingConfirm = onConfirm;
        el.confirmTitle.textContent = title;
        el.confirmMessage.textContent = message;
        showModal(el.confirmModal);
        el.confirmActionBtn.focus();
    }

    function closeConfirmModal() {
        pendingConfirm = null;
        hideModal(el.confirmModal);
    }

    function showModal(modal) {
        modal.classList.remove("is-hidden");
        document.body.classList.add("modal-open");
    }

    function hideModal(modal) {
        modal.classList.add("is-hidden");
        const anyOpen = [el.todoModal, el.dayModal, el.confirmModal].some(m => !m.classList.contains("is-hidden"));
        if (!anyOpen) document.body.classList.remove("modal-open");
    }

    // ── Form submit ───────────────────────────────────────────────────────────

    function handleTodoSubmit(e) {
        e.preventDefault();
        const title = el.todoTitle.value.trim();
        if (!title) {
            el.todoFormError.textContent = "Title is required.";
            el.todoTitle.focus();
            return;
        }
        el.todoFormError.textContent = "";
        const data = {
            title,
            description: el.todoDesc.value,
            dueDate: el.todoDate.value,
            priority: el.todoPriority.value,
            tags: el.todoTags.value,
            repeat: el.todoRepeat.value
        };
        if (editingId) {
            TodoModel.updateTodo(state, editingId, data);
        } else {
            TodoModel.addTodo(state, data);
        }
        Storage.save(state);
        closeTodoModal();
        render();
    }

    // ── List click handler ────────────────────────────────────────────────────

    function handleListClick(e) {
        const btn = e.target.closest("[data-action]");
        if (!btn) return;
        e.stopPropagation();
        dispatchTodoAction(btn.dataset.action, btn.dataset.id);
    }

    function handleDayListClick(e) {
        const btn = e.target.closest("[data-action]");
        if (!btn) return;
        e.stopPropagation();
        dispatchTodoAction(btn.dataset.action, btn.dataset.id, true);
    }

    function dispatchTodoAction(action, id, fromDay = false) {
        const todo = TodoModel.getTodoById(state, id);
        if (!todo) return;
        if (action === "toggle") {
            TodoModel.toggleTodo(state, id);
            Storage.save(state);
            render();
            if (fromDay && pendingDayDate) renderDayList(pendingDayDate);
        } else if (action === "edit") {
            if (fromDay) closeDayModal();
            openTodoModal(todo);
        } else if (action === "delete") {
            openConfirmModal({
                title: "Delete todo?",
                message: `"${todo.title}" will be permanently deleted.`,
                onConfirm() {
                    TodoModel.deleteTodo(state, id);
                    Storage.save(state);
                    render();
                    if (fromDay && pendingDayDate) renderDayList(pendingDayDate);
                }
            });
        }
    }


    // ── Render ────────────────────────────────────────────────────────────────

    function render() {
        if (currentView === "calendar") renderCalendar();
        else renderList();
    }

    function switchView(view) {
        currentView = view;
        el.calendarView.classList.toggle("is-hidden", view !== "calendar");
        el.listView.classList.toggle("is-hidden", view !== "list");
        el.viewCalBtn.classList.toggle("active", view === "calendar");
        el.viewListBtn.classList.toggle("active", view === "list");
        el.viewCalBtn.setAttribute("aria-pressed", String(view === "calendar"));
        el.viewListBtn.setAttribute("aria-pressed", String(view === "list"));
        render();
    }

    // ── Calendar ──────────────────────────────────────────────────────────────

    function renderCalendar() {
        const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const today = TodoModel.todayString();
        const firstDay = new Date(calYear, calMonth, 1).getDay();
        const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

        el.calHeading.textContent = new Date(calYear, calMonth).toLocaleDateString(undefined, { month: "long", year: "numeric" });
        el.calGrid.innerHTML = "";

        // Day-of-week headers
        DAYS.forEach(d => {
            const hdr = document.createElement("div");
            hdr.className = "cal-day-header";
            hdr.textContent = d;
            el.calGrid.appendChild(hdr);
        });

        // Empty cells before first day
        for (let i = 0; i < firstDay; i++) {
            const blank = document.createElement("div");
            blank.className = "cal-cell cal-cell--empty";
            el.calGrid.appendChild(blank);
        }

        // Day cells
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const todos = TodoModel.getTodosForDate(state, dateStr);
            const cell = document.createElement("div");
            cell.className = "cal-cell";
            cell.setAttribute("role", "gridcell");
            cell.setAttribute("tabindex", "0");
            cell.setAttribute("aria-label", `${dateStr}, ${todos.length} todo${todos.length !== 1 ? "s" : ""}`);
            if (dateStr === today) cell.classList.add("cal-cell--today");

            const num = document.createElement("span");
            num.className = "cal-day-num";
            num.textContent = day;
            cell.appendChild(num);

            // Show up to 3 todo dots/chips
            const visible = todos.slice(0, 3);
            visible.forEach(t => {
                const chip = document.createElement("span");
                chip.className = `cal-chip cal-chip--${t.priority}${t.completed ? " cal-chip--done" : ""}`;
                chip.textContent = t.title;
                cell.appendChild(chip);
            });
            if (todos.length > 3) {
                const more = document.createElement("span");
                more.className = "cal-more";
                more.textContent = `+${todos.length - 3} more`;
                cell.appendChild(more);
            }

            cell.addEventListener("click", () => openDayModal(dateStr));
            cell.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openDayModal(dateStr); } });
            el.calGrid.appendChild(cell);
        }
    }

    // ── List view ─────────────────────────────────────────────────────────────

    function renderList() {
        el.sortMode.value = state.sortMode;

        // Sync filter buttons
        el.filterBtns.forEach(b => b.classList.toggle("active", b.dataset.filter === state.filterMode));

        // Tag filter bar
        renderTagBar();

        let todos = TodoModel.filterTodos(state.todos, state.filterMode, state.searchQuery);
        todos = TodoModel.filterByTag(todos, activeTag);
        todos = TodoModel.sortTodos(todos, state.sortMode);

        el.emptyState.classList.toggle("is-hidden", todos.length > 0);
        el.todoList.innerHTML = "";
        todos.forEach(t => el.todoList.appendChild(createTodoCard(t)));
    }

    function renderTagBar() {
        const tags = TodoModel.getAllTags(state);
        el.tagFilterBar.innerHTML = "";
        if (tags.length === 0) return;

        const allBtn = document.createElement("button");
        allBtn.className = `tag-chip${activeTag === null ? " active" : ""}`;
        allBtn.textContent = "All tags";
        allBtn.addEventListener("click", () => { activeTag = null; renderList(); });
        el.tagFilterBar.appendChild(allBtn);

        tags.forEach(tag => {
            const btn = document.createElement("button");
            btn.className = `tag-chip${activeTag === tag ? " active" : ""}`;
            btn.textContent = tag;
            btn.addEventListener("click", () => { activeTag = activeTag === tag ? null : tag; renderList(); });
            el.tagFilterBar.appendChild(btn);
        });
    }

    function createTodoCard(todo) {
        const overdue = TodoModel.isOverdue(todo);
        const li = document.createElement("li");
        li.className = `todo-card${todo.completed ? " todo-card--done" : ""}${overdue ? " todo-card--overdue" : ""}`;

        li.innerHTML = `
            <button class="todo-toggle icon-btn" data-action="toggle" data-id="${todo.id}" aria-label="${todo.completed ? "Mark incomplete" : "Mark complete"}">
                <span class="mdi ${todo.completed ? "mdi-check-circle" : "mdi-circle-outline"}" aria-hidden="true"></span>
            </button>
            <div class="todo-body">
                <div class="todo-top">
                    <span class="todo-title">${escHtml(todo.title)}</span>
                    <span class="priority-badge priority-badge--${todo.priority}">${capitalize(todo.priority)}</span>
                </div>
                ${todo.description ? `<p class="todo-desc">${escHtml(todo.description)}</p>` : ""}
                <div class="todo-meta">
                    ${todo.dueDate ? `<span class="todo-date${overdue ? " todo-date--overdue" : ""}"><span class="mdi mdi-calendar-outline" aria-hidden="true"></span>${formatDate(todo.dueDate)}</span>` : ""}
                    ${todo.repeat !== "none" ? `<span class="todo-repeat"><span class="mdi mdi-repeat" aria-hidden="true"></span>${capitalize(todo.repeat)}</span>` : ""}
                    ${todo.tags.map(tag => `<span class="tag-pill">${escHtml(tag)}</span>`).join("")}
                </div>
            </div>
            <div class="todo-actions">
                <button class="icon-btn todo-edit-btn" data-action="edit" data-id="${todo.id}" aria-label="Edit ${escHtml(todo.title)}">
                    <span class="mdi mdi-pencil-outline" aria-hidden="true"></span>
                </button>
                <button class="icon-btn todo-delete-btn" data-action="delete" data-id="${todo.id}" aria-label="Delete ${escHtml(todo.title)}">
                    <span class="mdi mdi-trash-can-outline" aria-hidden="true"></span>
                </button>
            </div>`;
        return li;
    }

    // ── Day modal list ────────────────────────────────────────────────────────

    function renderDayList(dateString) {
        const todos = TodoModel.getTodosForDate(state, dateString);
        el.dayTodoList.innerHTML = "";
        if (todos.length === 0) {
            el.dayTodoList.innerHTML = `<li class="day-empty">No todos for this day.</li>`;
            return;
        }
        todos.forEach(todo => {
            const li = document.createElement("li");
            li.className = `day-todo-item${todo.completed ? " day-todo-item--done" : ""}`;
            li.innerHTML = `
                <button class="icon-btn" data-action="toggle" data-id="${todo.id}" aria-label="${todo.completed ? "Mark incomplete" : "Mark complete"}">
                    <span class="mdi ${todo.completed ? "mdi-check-circle" : "mdi-circle-outline"}" aria-hidden="true"></span>
                </button>
                <span class="day-todo-title">${escHtml(todo.title)}</span>
                <span class="priority-badge priority-badge--${todo.priority}">${capitalize(todo.priority)}</span>
                <div class="day-todo-actions">
                    <button class="icon-btn" data-action="edit" data-id="${todo.id}" aria-label="Edit">
                        <span class="mdi mdi-pencil-outline" aria-hidden="true"></span>
                    </button>
                    <button class="icon-btn" data-action="delete" data-id="${todo.id}" aria-label="Delete">
                        <span class="mdi mdi-trash-can-outline" aria-hidden="true"></span>
                    </button>
                </div>`;
            el.dayTodoList.appendChild(li);
        });
    }

    // ── Utilities ─────────────────────────────────────────────────────────────

    function formatDate(dateString) {
        const d = new Date(`${dateString}T00:00:00`);
        return isNaN(d) ? dateString : d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    }

    function capitalize(s) {
        return s.charAt(0).toUpperCase() + s.slice(1);
    }

    function escHtml(s) {
        return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    return { init };
})();

App.init();
