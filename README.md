# Simple Todo List

Simple Todo List is a browser-based task manager built with HTML, CSS, and vanilla JavaScript. It lets users organize todos by project, set due dates and priorities, mark items complete, sort tasks, and keep their data saved in the browser.

This project is intentionally lightweight: there is no backend, no build step, and no framework. Everything runs directly in the browser.

## What The App Does

The app helps users manage tasks across multiple projects.

Users can:

- Create new projects.
- Rename projects.
- Delete projects with confirmation.
- Add todos to the selected project.
- Edit existing todos.
- Delete todos with confirmation.
- Mark todos as complete or incomplete.
- Add a title, description, due date, and priority.
- Sort todos by newest, due date, priority, or priority plus date.
- Expand todo cards to view extra details.
- Keep their todos after refreshing the page.

The default project is `Inbox`, which gives the user a place to start immediately.

## Tech Used

- **HTML5** for the page structure, forms, modals, sidebar, toolbar, and todo list.
- **CSS3** for layout, responsive design, colors, spacing, cards, modals, buttons, and priority/status styling.
- **Vanilla JavaScript** for app logic, state management, rendering, events, sorting, modals, and local storage.
- **Browser Local Storage API** for saving projects and todos in the user's browser.
- **Material Design Icons CDN** for icons used in buttons and project/todo actions.

The icon stylesheet is loaded from:

```html
https://cdn.jsdelivr.net/npm/@mdi/font@7.4.47/css/materialdesignicons.min.css
```

## Packages And Dependencies

This project does not use npm packages or a JavaScript framework.

There is no:

- `package.json`
- `node_modules`
- React
- Vite
- Express
- Database
- Build command

The only external dependency is the Material Design Icons CSS file loaded through a CDN in `index.html`.

## How Data Is Stored

All user data is stored in the browser using `localStorage`.

The storage key is:

```js
simple-odin-todo-list
```

The app saves one state object that contains:

- The selected project ID.
- The active sort mode.
- A list of projects.
- A list of todos inside each project.

The general data shape looks like this:

```js
{
  selectedProjectId: "project-id",
  sortMode: "default",
  projects: [
    {
      id: "project-id",
      name: "Inbox",
      defaultProject: true,
      todos: [
        {
          id: "todo-id",
          title: "Finish assignment",
          description: "Complete the final section",
          dueDate: "2026-05-10",
          priority: "high",
          completed: false,
          createdAt: 1778390000000
        }
      ]
    }
  ]
}
```

When the page loads, the app tries to read saved data from `localStorage`. If no data exists, or if the saved data cannot be parsed, the app creates a fresh default state with an `Inbox` project.

When the user adds, edits, completes, deletes, or sorts items, the app saves the updated state back into `localStorage`.

## Project Files

```text
Todo-List-Project/
  index.html
  styles.css
  script.js
  README.md
```

## What Each File Does

### `index.html`

This file defines the app's structure.

It includes:

- The page title and metadata.
- The Material Design Icons CDN stylesheet.
- The local `styles.css` file.
- The sidebar for projects.
- The project creation form.
- The main header with the current project name.
- The sort dropdown.
- The add todo button.
- The empty state message.
- The todo list container.
- The add/edit todo modal.
- The delete confirmation modal.
- The local `script.js` file.

Important IDs from this file are used by JavaScript, such as:

- `project-form`
- `project-name`
- `project-list`
- `sort-mode`
- `open-todo-modal-btn`
- `todo-list`
- `todo-modal`
- `todo-form`
- `confirm-modal`

### `styles.css`

This file controls the full visual design.

It includes:

- CSS variables for colors, shadows, borders, and status colors.
- A two-column layout with sidebar and main content.
- Project list styling.
- Buttons and icon button styling.
- Todo card styling.
- Priority pills for low, medium, and high priority.
- Completed todo styling.
- Modal and confirmation dialog styling.
- Focus styles for form controls.
- Responsive layouts for tablets and mobile screens.
- Screen-reader-only helper styles through `.sr-only`.

The CSS makes the app feel like a polished productivity tool instead of a plain form demo.

### `script.js`

This file contains the app's behavior.

It is organized into three main modules:

#### `TodoModel`

Handles the data rules for projects and todos.

Responsibilities:

- Create project IDs and todo IDs.
- Create todo objects.
- Create project objects.
- Create the initial app state.
- Normalize saved data loaded from `localStorage`.
- Add, rename, select, and delete projects.
- Add, update, toggle, and delete todos.
- Sort todos by selected sort mode.
- Keep completed todos after incomplete todos in sorted lists.

#### `Storage`

Handles saving and loading data.

Responsibilities:

- Read saved state from `localStorage`.
- Parse saved JSON.
- Fall back to a fresh initial state if loading fails.
- Save the current state as JSON.
- Catch storage errors so the app does not crash.

#### `App`

Connects the data model to the user interface.

Responsibilities:

- Select important DOM elements.
- Bind form, click, change, and keyboard events.
- Render projects.
- Render the current project header.
- Render todos.
- Open and close the todo modal.
- Open and close the confirmation modal.
- Handle add, edit, delete, complete, and sort actions.
- Save state after user changes.
- Format dates for display.

The app starts with:

```js
App.init();
```

## How The App Works

1. `index.html` loads the page structure, styles, icons, and script.
2. `script.js` loads saved state from `localStorage`.
3. If saved data exists, the app normalizes it so missing or invalid fields do not break the UI.
4. If saved data does not exist, the app creates a default `Inbox` project.
5. The app binds event listeners to forms, buttons, modals, the sort dropdown, and keyboard events.
6. The app renders the project list, header, and todo list.
7. User actions update the in-memory state.
8. The state is saved back into `localStorage`.
9. The UI re-renders so the user sees the latest data.

## How To Run The Project

Because this is a static frontend project, you can run it without installing anything.

Option 1:

1. Open the project folder.
2. Double-click `index.html`.
3. The app opens in your browser.

Option 2:

1. Open the folder in VS Code.
2. Use a local static server or the Live Server extension.
3. Open the local URL in your browser.

## How To Implement This Yourself

### 1. Build The HTML Structure

Create:

- A sidebar for projects.
- A form for adding projects.
- A main content area for the selected project.
- A sort dropdown.
- A button to open the todo modal.
- A container for todo cards.
- A modal form for adding and editing todos.
- A confirmation modal for destructive actions.

Use IDs on elements that JavaScript needs to access.

### 2. Create A Data Model

Define functions that create and update data instead of putting all logic directly inside event handlers.

Useful model functions include:

- `createTodo`
- `createProject`
- `addProject`
- `renameProject`
- `deleteProject`
- `addTodo`
- `updateTodo`
- `toggleTodo`
- `deleteTodo`
- `sortTodos`

This keeps the app easier to reason about and easier to extend.

### 3. Save Data With Local Storage

Use `localStorage.setItem()` to save the state:

```js
localStorage.setItem("my-todo-app", JSON.stringify(state));
```

Use `localStorage.getItem()` to load it:

```js
const savedState = localStorage.getItem("my-todo-app");
```

Then parse it:

```js
const state = JSON.parse(savedState);
```

Wrap storage code in `try/catch` so corrupted data or browser storage issues do not break the app.

### 4. Render From State

Instead of manually changing the page in many separate places, keep one state object and render the UI from that state.

A simple flow is:

1. User clicks a button.
2. Event handler updates the state.
3. App saves the state.
4. App re-renders the visible UI.

That pattern is used throughout this project.

### 5. Add Sorting

Give each todo:

- `createdAt`
- `dueDate`
- `priority`
- `completed`

Then create sort modes that compare those fields. This project supports:

- `default`: newest first.
- `date`: earliest due date first.
- `priority`: high priority first.
- `priority-date`: priority first, then due date.

### 6. Add Modals

Use a hidden modal for adding and editing todos. The same form can support both actions by storing the ID of the todo currently being edited.

Use a separate confirmation modal before deleting projects or todos. This protects users from accidental data loss.

### 7. Style The App Responsively

Use CSS Grid and media queries so the layout works on desktop and smaller screens.

This project switches from a two-column sidebar layout to a stacked layout on smaller screens.

## Technical Highlights

From an employer's perspective, this project demonstrates:

- DOM manipulation without relying on a framework.
- Modular JavaScript organization.
- Client-side state management.
- Persistent browser storage.
- CRUD operations for nested data.
- Defensive loading and data normalization.
- Sorting logic with multiple criteria.
- Responsive CSS layout.
- Accessible form labels and ARIA-friendly controls.
- Confirmation flows for destructive actions.

## Limitations

- Data is stored only in the current browser.
- There is no account system or cloud sync.
- Clearing browser storage will remove saved projects and todos.
- The Material Design Icons file depends on a CDN connection.
- There are no automated tests yet.

## Future Improvements

- Add search or filtering.
- Add project color labels.
- Add drag-and-drop todo ordering.
- Add recurring tasks.
- Add local export/import as JSON.
- Add browser notifications for due dates.
- Add automated tests for the model and storage logic.
- Replace `window.prompt()` project renaming with a custom modal.

