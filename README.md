# Todo

A modern, browser-based todo app with a calendar view. No backend, no build step, no framework — just HTML, CSS, and vanilla JavaScript.

## Features

- **Calendar view** — see todos plotted on a monthly calendar. Click any day to view, add, edit, or delete todos for that date.
- **List view** — flat list of all todos with filter, sort, search, and tag filtering.
- **Add / edit / delete todos** — title, description, due date, priority, tags, and repeat interval.
- **Complete todos** — toggle completion with a single click. Completed todos are visually distinguished.
- **Priority levels** — Low, Medium, High with color-coded badges.
- **Tags** — add comma-separated tags to any todo. Filter the list by tag.
- **Repeat** — mark a todo as Daily, Weekly, or Monthly.
- **Overdue detection** — incomplete todos past their due date are highlighted.
- **Filter** — All, Active, Completed, Overdue.
- **Sort** — Newest first, Due date, Priority, A → Z.
- **Search** — live search across title, description, and tags.
- **Persistent storage** — all data saved in `localStorage`, survives page refresh.
- **Responsive** — works on desktop, tablet, and mobile.
- **Accessible** — ARIA roles, labels, keyboard navigation, focus management.

## Tech

- **HTML5** — page structure, modals, forms.
- **CSS3** — design tokens, calendar grid, responsive layout.
- **Vanilla JavaScript** — state management, rendering, CRUD, storage.
- **localStorage** — client-side persistence.
- **Material Design Icons** (CDN) — icons throughout the UI.

## Files

```
Todo-List-Project/
  index.html   — app structure and modals
  styles.css   — design system and layout
  script.js    — TodoModel, Storage, App logic
  README.md
```

## How to run

Open `index.html` directly in a browser, or serve the folder with any static server (e.g. VS Code Live Server).

## Data shape

Stored under the key `todo-app-v2` in `localStorage`:

```js
{
  todos: [
    {
      id: "abc123",
      title: "Finish report",
      description: "Include Q2 numbers",
      dueDate: "2026-06-01",
      priority: "high",       // "low" | "medium" | "high"
      tags: ["work"],
      repeat: "none",         // "none" | "daily" | "weekly" | "monthly"
      completed: false,
      completedAt: null,
      createdAt: 1716000000000
    }
  ],
  sortMode: "default",        // "default" | "date" | "priority" | "az"
  filterMode: "all"           // "all" | "active" | "completed" | "overdue"
}
```

## Code structure

### `TodoModel`

Pure data functions — no DOM access.

- `createTodo` / `addTodo` / `updateTodo` / `toggleTodo` / `deleteTodo`
- `filterTodos` — applies filter mode and search query
- `filterByTag` — narrows results to a single tag
- `sortTodos` — sorts by the selected sort mode
- `getTodosForDate` — returns todos for a specific calendar day
- `getAllTags` — collects all unique tags across todos
- `isOverdue` — returns true if a todo is past due and incomplete

### `Storage`

- `load` — reads and normalizes state from `localStorage`
- `save` — serializes state to `localStorage`

### `App`

Connects the model to the DOM.

- Calendar rendering — 7-column grid, day cells with todo chips
- List rendering — filtered, sorted todo cards
- Todo modal — add and edit form
- Day modal — todos for a clicked calendar day
- Confirm modal — delete confirmation
- Event delegation for list and day modal actions
- Keyboard support (Escape closes modals)

## Limitations

- Data is local to the browser. Clearing site data removes all todos.
- No cloud sync or account system.
- Repeat todos do not auto-generate future instances — the field is informational.
- No drag-and-drop reordering.
