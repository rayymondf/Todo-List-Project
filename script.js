let openCreateTodoBtn = document.querySelector("#open-create-todo-btn");
let createTodoBtn = document.querySelector("#create-todo-btn");
let saveEditBtn = document.querySelector("#save-edit-btn");

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
let activeTodoTitleElement = null;
let activeTodoTextElement = null;
let activeTodoTimeElement = null;

openCreateTodoBtn.addEventListener("click", () => {
    createTodoOverlay.style.display = "flex";
    createTodoTitleInput.focus();
});

createTodoBtn.addEventListener("click", () => {
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
    let todoCard = renderTodoCard(todo);

    todoList.appendChild(todoCard);
    resetCreateForm();
    createTodoOverlay.style.display = "none";
});

saveEditBtn.addEventListener("click", () => {
    let updatedTitle = editTodoTitleInput.value.trim();
    let updatedText = editTodoTextInput.value.trim();
    let updatedTime = editTodoTimeInput.value;

    if (updatedTitle === "" || activeTodo === null || activeTodoTitleElement === null) {
        return;
    }

    activeTodo.title = updatedTitle;
    activeTodo.text = updatedText;
    activeTodo.time = updatedTime;

    activeTodoTitleElement.textContent = updatedTitle;
    activeTodoTextElement.textContent = updatedText || "No description";
    activeTodoTimeElement.textContent = updatedTime || "No date";

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

function createTodo(id, title,text,time) {
    return {
        id,
        title,
        text,
        time,
        width: 95,
        height: 50
    };
}

function renderTodoCard(todo) {
    let todoCard = document.createElement("div");
    let todoContent = document.createElement("div");
    let todoTitle = document.createElement("div");
    let todoText = document.createElement("div");
    let todoTime = document.createElement("div");
    let deleteTodoBtn = document.createElement("button");
    deleteTodoBtn.classList.add("delete")


    todoCard.style.margin = "10px 20px";
    todoCard.style.padding = "15px";
    todoCard.style.width = "95%";
    todoCard.style.minHeight = "70px";
    todoCard.style.outline = "1px solid black";
    todoCard.style.flexShrink = "0";
    todoCard.style.borderRadius = "10px";
    todoCard.style.display = "flex";
    todoCard.style.alignItems = "flex-start";
    todoCard.style.justifyContent = "space-between";
    todoCard.classList.add("card");

    todoContent.style.display = "flex";
    todoContent.style.flexDirection = "column";
    todoContent.style.gap = "6px";

    todoTitle.style.fontWeight = "700";
    todoTitle.textContent = todo.title;
    todoText.textContent = todo.text || "No description";
    todoTime.textContent = todo.time || "No date";
    deleteTodoBtn.textContent = "Delete";

    deleteTodoBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        todos = todos.filter((todoItem) => todoItem.id !== todo.id);
        todoCard.remove();
    });

    todoCard.addEventListener("click", () => {
        activeTodo = todo;
        activeTodoTitleElement = todoTitle;
        activeTodoTextElement = todoText;
        activeTodoTimeElement = todoTime;

        editTodoTitleInput.value = todo.title;
        editTodoTextInput.value = todo.text || "";
        editTodoTimeInput.value = todo.time || "";

        editTodoOverlay.style.display = "flex";
        editTodoTitleInput.focus();
    });

    todoContent.appendChild(todoTitle);
    todoContent.appendChild(todoText);
    todoContent.appendChild(todoTime);

    todoCard.appendChild(todoContent);
    todoCard.appendChild(deleteTodoBtn);

    return todoCard;
}

function resetCreateForm() {
    createTodoTitleInput.value = "";
    createTodoTextInput.value = "";
    createTodoTimeInput.value = "";
}

function resetEditForm() {
    editTodoTitleInput.value = "";
    editTodoTextInput.value = "";
    editTodoTimeInput.value = "";
    activeTodo = null;
    activeTodoTitleElement = null;
    activeTodoTextElement = null;
    activeTodoTimeElement = null;
}
