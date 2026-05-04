let openCreateTodoBtn = document.querySelector("#open-create-todo-btn");
let createTodoForm = document.querySelector("#create-todo-form");
let editTodoForm = document.querySelector("#edit-todo-form");

let todoList = document.querySelector(".todo-list");
let createTodoOverlay = document.querySelector("#create-todo");
let editTodoOverlay = document.querySelector("#edit-todo");

let createTodoTitleInput = document.querySelector("#create-todo-title");
let editTodoTitleInput = document.querySelector("#edit-todo-title");

let createTodoTimeInput = document.querySelector("#create-todo-time");
let editTodoTimeInput = document.querySelector("#edit-todo-time");

let createTodoTextInput = document.querySelector("#create-todo-text");
let editTodoTextInput = document.querySelector("#edit-todo-text");

let todos = [];
let nextId = 0;
let activeTodo = null;
let activeTodoElements = null;

openCreateTodoBtn.addEventListener("click", () => {
    createTodoOverlay.style.display = "flex";
    createTodoTitleInput.focus();
});

createTodoForm.addEventListener("submit", (event) => {
    event.preventDefault();

    let title = createTodoTitleInput.value.trim();
    let text = createTodoTextInput.value.trim();
    let time = createTodoTimeInput.value;

    if (title === "") {
        createTodoTitleInput.focus();
        return;
    }

    nextId++;
    let todo = createTodo(nextId, title, text, time);
    todos.push(todo);
    todoList.appendChild(renderTodoCard(todo));

    resetCreateForm();
    createTodoOverlay.style.display = "none";
});

editTodoForm.addEventListener("submit", (event) => {
    event.preventDefault();

    let updatedTitle = editTodoTitleInput.value.trim();
    let updatedText = editTodoTextInput.value.trim();
    let updatedTime = editTodoTimeInput.value;

    if (updatedTitle === "" || activeTodo === null || activeTodoElements === null) {
        return;
    }

    activeTodo.title = updatedTitle;
    activeTodo.text = updatedText;
    activeTodo.time = updatedTime;

    activeTodoElements.title.textContent = updatedTitle;
    activeTodoElements.preview.textContent = getPreviewText(updatedText);
    activeTodoElements.description.textContent = updatedText || "No description";
    activeTodoElements.time.textContent = formatTodoDate(updatedTime);
    activeTodoElements.card.dataset.expanded = "false";

    editTodoOverlay.style.display = "none";
    resetEditForm();
});

createTodoOverlay.addEventListener("click", (event) => {
    if (event.target === createTodoOverlay) {
        createTodoOverlay.style.display = "none";
        resetCreateForm();
    }
});

editTodoOverlay.addEventListener("click", (event) => {
    if (event.target === editTodoOverlay) {
        editTodoOverlay.style.display = "none";
        resetEditForm();
    }
});

function createTodo(id, title, text, time) {
    return {
        id,
        title,
        text,
        time
    };
}

function renderTodoCard(todo) {
    let todoCard = document.createElement("article");
    let todoMain = document.createElement("div");
    let todoTopRow = document.createElement("div");
    let todoMeta = document.createElement("div");
    let todoTitle = document.createElement("div");
    let todoTime = document.createElement("div");
    let todoPreview = document.createElement("div");
    let todoDescription = document.createElement("div");
    let todoActions = document.createElement("div");
    let editTodoBtn = document.createElement("button");
    let deleteTodoBtn = document.createElement("button");

    todoCard.className = "card";
    todoCard.dataset.expanded = "false";

    todoMain.className = "card-main";
    todoTopRow.className = "card-top-row";
    todoMeta.className = "card-meta";
    todoTitle.className = "card-title";
    todoTime.className = "card-time";
    todoPreview.className = "card-preview";
    todoDescription.className = "card-description";
    todoActions.className = "card-actions";

    editTodoBtn.type = "button";
    deleteTodoBtn.type = "button";
    editTodoBtn.textContent = "Edit";
    deleteTodoBtn.textContent = "Delete";

    todoTitle.textContent = todo.title;
    todoTime.textContent = formatTodoDate(todo.time);
    todoPreview.textContent = getPreviewText(todo.text);
    todoDescription.textContent = todo.text || "No description";

    deleteTodoBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        todos = todos.filter((todoItem) => todoItem.id !== todo.id);
        todoCard.remove();
    });

    editTodoBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        openEditTodo(todo, {
            card: todoCard,
            title: todoTitle,
            preview: todoPreview,
            description: todoDescription,
            time: todoTime
        });
    });

    todoCard.addEventListener("click", () => {
        let isExpanded = todoCard.dataset.expanded === "true";
        todoCard.dataset.expanded = isExpanded ? "false" : "true";
    });

    todoMeta.appendChild(todoTitle);
    todoMeta.appendChild(todoTime);
    todoTopRow.appendChild(todoMeta);

    todoActions.appendChild(editTodoBtn);
    todoActions.appendChild(deleteTodoBtn);
    todoTopRow.appendChild(todoActions);

    todoMain.appendChild(todoTopRow);
    todoMain.appendChild(todoPreview);
    todoMain.appendChild(todoDescription);

    todoCard.appendChild(todoMain);

    return todoCard;
}

function openEditTodo(todo, todoElements) {
    activeTodo = todo;
    activeTodoElements = todoElements;

    editTodoTitleInput.value = todo.title;
    editTodoTextInput.value = todo.text || "";
    editTodoTimeInput.value = todo.time || "";

    editTodoOverlay.style.display = "flex";
    editTodoTitleInput.focus();
}

function getPreviewText(text) {
    if (!text) {
        return "No description";
    }

    if (text.length <= 80) {
        return text;
    }

    return `${text.slice(0, 80)}...`;
}

function formatTodoDate(time) {
    return time || "No date";
}

function resetCreateForm() {
    createTodoForm.reset();
}

function resetEditForm() {
    editTodoForm.reset();
    activeTodo = null;
    activeTodoElements = null;
}
