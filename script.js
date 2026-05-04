const TodoModel = (() => {
    const DEFAULT_PROJECT_NAME = "Inbox";
    const PRIORITY_ORDER = {
        high: 0,
        medium: 1,
        low: 2
    };
    const SORT_MODES = ["default", "date", "priority", "priority-date"];

    function createId() {
        return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    }

    function normalizePriority(priority) {
        if (priority === "high" || priority === "medium" || priority === "low") {
            return priority;
        }

        return "medium";
    }

    function createTodo(todoData = {}) {
        return {
            id: todoData.id || createId(),
            title: (todoData.title || "").trim() || "Untitled Todo",
            description: todoData.description || "",
            dueDate: todoData.dueDate || "",
            priority: normalizePriority(todoData.priority),
            completed: Boolean(todoData.completed),
            createdAt: typeof todoData.createdAt === "number" ? todoData.createdAt : Date.now()
        };
    }

    function createProject(projectData = {}) {
        return {
            id: projectData.id || createId(),
            name: (projectData.name || "Project").trim() || "Project",
            defaultProject: Boolean(projectData.defaultProject),
            todos: Array.isArray(projectData.todos) ? projectData.todos.map(createTodo) : []
        };
    }

    function createInitialState() {
        const inboxProject = createProject({
            name: DEFAULT_PROJECT_NAME,
            defaultProject: true
        });

        return {
            selectedProjectId: inboxProject.id,
            sortMode: "default",
            projects: [inboxProject]
        };
    }

    function normalizeState(rawState) {
        if (!rawState || !Array.isArray(rawState.projects) || rawState.projects.length === 0) {
            return createInitialState();
        }

        const projects = rawState.projects.map(createProject);
        let defaultProject = projects.find((project) => project.defaultProject);

        if (!defaultProject) {
            defaultProject = createProject({
                name: DEFAULT_PROJECT_NAME,
                defaultProject: true
            });
            projects.unshift(defaultProject);
        }

        const selectedProject = projects.find((project) => project.id === rawState.selectedProjectId);
        const sortMode = SORT_MODES.includes(rawState.sortMode) ? rawState.sortMode : "default";

        return {
            selectedProjectId: selectedProject ? selectedProject.id : projects[0].id,
            sortMode,
            projects
        };
    }

    function getProjectById(state, projectId) {
        return state.projects.find((project) => project.id === projectId) || null;
    }

    function getSelectedProject(state) {
        return getProjectById(state, state.selectedProjectId) || state.projects[0] || null;
    }

    function getTodoById(project, todoId) {
        if (!project) {
            return null;
        }

        return project.todos.find((todo) => todo.id === todoId) || null;
    }

    function addProject(state, name) {
        const trimmedName = name.trim();

        if (trimmedName === "") {
            return {
                ok: false,
                message: "Project name cannot be empty."
            };
        }

        const duplicateProject = state.projects.find(
            (project) => project.name.toLowerCase() === trimmedName.toLowerCase()
        );

        if (duplicateProject) {
            return {
                ok: false,
                message: "Project name already exists."
            };
        }

        const project = createProject({ name: trimmedName });
        state.projects.push(project);
        state.selectedProjectId = project.id;

        return {
            ok: true,
            project
        };
    }

    function deleteProject(state, projectId) {
        const project = getProjectById(state, projectId);

        if (!project) {
            return false;
        }

        state.projects = state.projects.filter((item) => item.id !== projectId);

        if (state.projects.length === 0) {
            const replacementProject = createProject({
                name: DEFAULT_PROJECT_NAME,
                defaultProject: true
            });
            state.projects.push(replacementProject);
        }

        if (state.selectedProjectId === projectId) {
            state.selectedProjectId = state.projects[0].id;
        }

        return true;
    }

    function renameProject(state, projectId, name) {
        const project = getProjectById(state, projectId);
        const trimmedName = name.trim();

        if (!project) {
            return {
                ok: false,
                message: "Project could not be found."
            };
        }

        if (trimmedName === "") {
            return {
                ok: false,
                message: "Project name cannot be empty."
            };
        }

        const duplicateProject = state.projects.find(
            (item) => item.id !== projectId && item.name.toLowerCase() === trimmedName.toLowerCase()
        );

        if (duplicateProject) {
            return {
                ok: false,
                message: "Project name already exists."
            };
        }

        project.name = trimmedName;

        return {
            ok: true,
            project
        };
    }

    function selectProject(state, projectId) {
        const project = getProjectById(state, projectId);

        if (!project) {
            return false;
        }

        state.selectedProjectId = projectId;
        return true;
    }

    function addTodo(state, projectId, todoData) {
        const project = getProjectById(state, projectId);

        if (!project) {
            return null;
        }

        const todo = createTodo(todoData);
        project.todos.push(todo);
        return todo;
    }

    function updateTodo(state, projectId, todoId, todoData) {
        const project = getProjectById(state, projectId);
        const todo = getTodoById(project, todoId);

        if (!todo) {
            return null;
        }

        todo.title = (todoData.title || "").trim() || todo.title;
        todo.description = todoData.description || "";
        todo.dueDate = todoData.dueDate || "";
        todo.priority = normalizePriority(todoData.priority);
        todo.completed = Boolean(todoData.completed);

        return todo;
    }

    function toggleTodo(state, projectId, todoId) {
        const project = getProjectById(state, projectId);
        const todo = getTodoById(project, todoId);

        if (!todo) {
            return false;
        }

        todo.completed = !todo.completed;
        return true;
    }

    function deleteTodo(state, projectId, todoId) {
        const project = getProjectById(state, projectId);

        if (!project) {
            return false;
        }

        const originalLength = project.todos.length;
        project.todos = project.todos.filter((todo) => todo.id !== todoId);
        return project.todos.length !== originalLength;
    }

    function sortTodos(todos, sortMode) {
        const items = todos.slice();

        return items.sort((firstTodo, secondTodo) => {
            if (firstTodo.completed !== secondTodo.completed) {
                return Number(firstTodo.completed) - Number(secondTodo.completed);
            }

            if (sortMode === "date") {
                return compareByDate(firstTodo, secondTodo) || compareByCreated(secondTodo, firstTodo);
            }

            if (sortMode === "priority") {
                return compareByPriority(firstTodo, secondTodo) || compareByCreated(secondTodo, firstTodo);
            }

            if (sortMode === "priority-date") {
                return (
                    compareByPriority(firstTodo, secondTodo) ||
                    compareByDate(firstTodo, secondTodo) ||
                    compareByCreated(secondTodo, firstTodo)
                );
            }

            return compareByCreated(secondTodo, firstTodo);
        });
    }

    function compareByDate(firstTodo, secondTodo) {
        if (!firstTodo.dueDate && !secondTodo.dueDate) {
            return 0;
        }

        if (!firstTodo.dueDate) {
            return 1;
        }

        if (!secondTodo.dueDate) {
            return -1;
        }

        return firstTodo.dueDate.localeCompare(secondTodo.dueDate);
    }

    function compareByPriority(firstTodo, secondTodo) {
        return PRIORITY_ORDER[firstTodo.priority] - PRIORITY_ORDER[secondTodo.priority];
    }

    function compareByCreated(firstTodo, secondTodo) {
        return firstTodo.createdAt - secondTodo.createdAt;
    }

    return {
        createInitialState,
        normalizeState,
        getSelectedProject,
        getProjectById,
        getTodoById,
        addProject,
        deleteProject,
        renameProject,
        selectProject,
        addTodo,
        updateTodo,
        toggleTodo,
        deleteTodo,
        sortTodos
    };
})();

const Storage = (() => {
    const STORAGE_KEY = "simple-odin-todo-list";

    function loadState() {
        try {
            const savedState = localStorage.getItem(STORAGE_KEY);

            if (!savedState) {
                return TodoModel.createInitialState();
            }

            return TodoModel.normalizeState(JSON.parse(savedState));
        } catch (error) {
            console.error("Failed to load local storage data:", error);
            return TodoModel.createInitialState();
        }
    }

    function saveState(state) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (error) {
            console.error("Failed to save local storage data:", error);
        }
    }

    return {
        loadState,
        saveState
    };
})();

const App = (() => {
    const elements = {
        projectForm: document.querySelector("#project-form"),
        projectNameInput: document.querySelector("#project-name"),
        projectError: document.querySelector("#project-error"),
        projectList: document.querySelector("#project-list"),
        currentProjectName: document.querySelector("#current-project-name"),
        sortMode: document.querySelector("#sort-mode"),
        openTodoModalBtn: document.querySelector("#open-todo-modal-btn"),
        emptyState: document.querySelector("#empty-state"),
        todoList: document.querySelector("#todo-list"),
        todoModal: document.querySelector("#todo-modal"),
        closeTodoModalBtn: document.querySelector("#close-todo-modal-btn"),
        cancelTodoBtn: document.querySelector("#cancel-todo-btn"),
        todoModalTitle: document.querySelector("#todo-modal-title"),
        todoForm: document.querySelector("#todo-form"),
        todoTitleInput: document.querySelector("#todo-title"),
        todoDescriptionInput: document.querySelector("#todo-description"),
        todoDateInput: document.querySelector("#todo-date"),
        todoPriorityInput: document.querySelector("#todo-priority"),
        confirmModal: document.querySelector("#confirm-modal"),
        closeConfirmModalBtn: document.querySelector("#close-confirm-modal-btn"),
        cancelConfirmBtn: document.querySelector("#cancel-confirm-btn"),
        confirmActionBtn: document.querySelector("#confirm-action-btn"),
        confirmTitle: document.querySelector("#confirm-title"),
        confirmMessage: document.querySelector("#confirm-message")
    };

    let state = Storage.loadState();
    let editingTodoId = null;
    let editingProjectId = null;
    let pendingConfirmAction = null;

    function init() {
        bindEvents();
        render();
    }

    function bindEvents() {
        elements.projectForm.addEventListener("submit", handleProjectSubmit);
        elements.projectList.addEventListener("click", handleProjectListClick);
        elements.sortMode.addEventListener("change", handleSortChange);
        elements.openTodoModalBtn.addEventListener("click", () => openTodoModal());
        elements.closeTodoModalBtn.addEventListener("click", closeTodoModal);
        elements.cancelTodoBtn.addEventListener("click", closeTodoModal);
        elements.todoModal.addEventListener("click", handleModalBackdropClick);
        elements.todoForm.addEventListener("submit", handleTodoSubmit);
        elements.todoList.addEventListener("click", handleTodoListClick);
        elements.closeConfirmModalBtn.addEventListener("click", closeConfirmModal);
        elements.cancelConfirmBtn.addEventListener("click", closeConfirmModal);
        elements.confirmActionBtn.addEventListener("click", handleConfirmAction);
        elements.confirmModal.addEventListener("click", handleConfirmBackdropClick);
        document.addEventListener("keydown", handleGlobalKeydown);
    }

    function handleProjectSubmit(event) {
        event.preventDefault();

        const result = TodoModel.addProject(state, elements.projectNameInput.value);

        if (!result.ok) {
            elements.projectError.textContent = result.message;
            return;
        }

        elements.projectError.textContent = "";
        elements.projectForm.reset();
        persistAndRender();
    }

    function handleProjectListClick(event) {
        const projectSelectButton = event.target.closest("[data-project-id]");
        const projectEditButton = event.target.closest("[data-edit-project-id]");
        const projectDeleteButton = event.target.closest("[data-delete-project-id]");

        if (projectEditButton) {
            const projectId = projectEditButton.dataset.editProjectId;
            const project = TodoModel.getProjectById(state, projectId);

            if (!project) {
                return;
            }

            const nextName = window.prompt("Rename project", project.name);

            if (nextName === null) {
                return;
            }

            const result = TodoModel.renameProject(state, projectId, nextName);

            if (!result.ok) {
                elements.projectError.textContent = result.message;
                return;
            }

            elements.projectError.textContent = "";
            persistAndRender();
            return;
        }

        if (projectDeleteButton) {
            const projectId = projectDeleteButton.dataset.deleteProjectId;
            const project = TodoModel.getProjectById(state, projectId);

            if (!project) {
                return;
            }

            openConfirmModal({
                title: "Delete project?",
                message: `Delete "${project.name}" and all of its todos? This action cannot be undone.`,
                confirmText: "Delete Project",
                onConfirm() {
                    TodoModel.deleteProject(state, projectId);

                    if (editingProjectId === projectId) {
                        closeTodoModal();
                    }

                    persistAndRender();
                }
            });
            return;
        }

        if (projectSelectButton) {
            elements.projectError.textContent = "";
            TodoModel.selectProject(state, projectSelectButton.dataset.projectId);
            render();
        }
    }

    function handleSortChange() {
        state.sortMode = elements.sortMode.value;
        Storage.saveState(state);
        renderTodos();
    }

    function handleModalBackdropClick(event) {
        if (event.target === elements.todoModal) {
            closeTodoModal();
        }
    }

    function handleConfirmBackdropClick(event) {
        if (event.target === elements.confirmModal) {
            closeConfirmModal();
        }
    }

    function handleTodoSubmit(event) {
        event.preventDefault();

        const formData = {
            title: elements.todoTitleInput.value,
            description: elements.todoDescriptionInput.value.trim(),
            dueDate: elements.todoDateInput.value,
            priority: elements.todoPriorityInput.value,
            completed: false
        };

        if (editingTodoId && editingProjectId) {
            const existingProject = TodoModel.getProjectById(state, editingProjectId);
            const existingTodo = TodoModel.getTodoById(existingProject, editingTodoId);

            if (existingTodo) {
                formData.completed = existingTodo.completed;
                TodoModel.updateTodo(state, editingProjectId, editingTodoId, formData);
            }
        } else {
            const selectedProject = TodoModel.getSelectedProject(state);

            if (!selectedProject) {
                return;
            }

            TodoModel.addTodo(state, selectedProject.id, formData);
        }

        closeTodoModal();
        persistAndRender();
    }

    function handleTodoListClick(event) {
        const actionButton = event.target.closest("[data-action]");

        if (!actionButton) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        const selectedProject = TodoModel.getSelectedProject(state);

        if (!selectedProject) {
            return;
        }

        const action = actionButton.dataset.action;
        const todoId = actionButton.dataset.todoId;

        if (action === "toggle") {
            TodoModel.toggleTodo(state, selectedProject.id, todoId);
            persistAndRender();
            return;
        }

        if (action === "edit") {
            const todo = TodoModel.getTodoById(selectedProject, todoId);

            if (todo) {
                openTodoModal(todo, selectedProject.id);
            }

            return;
        }

        if (action === "delete") {
            const todo = TodoModel.getTodoById(selectedProject, todoId);

            if (!todo) {
                return;
            }

            openConfirmModal({
                title: "Delete todo?",
                message: `Delete "${todo.title}" from "${selectedProject.name}"? This action cannot be undone.`,
                confirmText: "Delete Todo",
                onConfirm() {
                    TodoModel.deleteTodo(state, selectedProject.id, todoId);
                    persistAndRender();
                }
            });
        }
    }

    function openTodoModal(todo = null, projectId = null) {
        editingTodoId = todo ? todo.id : null;
        editingProjectId = projectId;
        elements.todoModalTitle.textContent = todo ? "Edit Todo" : "Add Todo";
        elements.todoForm.reset();
        elements.todoPriorityInput.value = "medium";

        if (todo) {
            elements.todoTitleInput.value = todo.title;
            elements.todoDescriptionInput.value = todo.description;
            elements.todoDateInput.value = todo.dueDate;
            elements.todoPriorityInput.value = todo.priority;
        }

        elements.todoModal.classList.remove("is-hidden");
        document.body.classList.add("modal-open");
        elements.todoTitleInput.focus();
    }

    function closeTodoModal() {
        editingTodoId = null;
        editingProjectId = null;
        elements.todoForm.reset();
        elements.todoPriorityInput.value = "medium";
        elements.todoModal.classList.add("is-hidden");
        syncBodyModalState();
    }

    function openConfirmModal({ title, message, confirmText, onConfirm }) {
        pendingConfirmAction = typeof onConfirm === "function" ? onConfirm : null;
        elements.confirmTitle.textContent = title;
        elements.confirmMessage.textContent = message;
        elements.confirmActionBtn.textContent = confirmText;
        elements.confirmModal.classList.remove("is-hidden");
        syncBodyModalState();
        elements.confirmActionBtn.focus();
    }

    function closeConfirmModal() {
        pendingConfirmAction = null;
        elements.confirmModal.classList.add("is-hidden");
        syncBodyModalState();
    }

    function handleConfirmAction() {
        if (typeof pendingConfirmAction === "function") {
            pendingConfirmAction();
        }

        closeConfirmModal();
    }

    function handleGlobalKeydown(event) {
        if (event.key !== "Escape") {
            return;
        }

        if (!elements.confirmModal.classList.contains("is-hidden")) {
            closeConfirmModal();
            return;
        }

        if (!elements.todoModal.classList.contains("is-hidden")) {
            closeTodoModal();
        }
    }

    function syncBodyModalState() {
        const todoModalOpen = !elements.todoModal.classList.contains("is-hidden");
        const confirmModalOpen = !elements.confirmModal.classList.contains("is-hidden");

        if (todoModalOpen || confirmModalOpen) {
            document.body.classList.add("modal-open");
        } else {
            document.body.classList.remove("modal-open");
        }
    }

    function persistAndRender() {
        Storage.saveState(state);
        render();
    }

    function render() {
        renderProjects();
        renderHeader();
        renderTodos();
        elements.sortMode.value = state.sortMode;
    }

    function renderProjects() {
        elements.projectList.textContent = "";

        state.projects.forEach((project) => {
            const projectRow = document.createElement("div");
            const projectSelectButton = document.createElement("button");
            const projectLabel = document.createElement("span");
            const projectIcon = document.createElement("span");
            const projectName = document.createElement("span");
            const projectCount = document.createElement("span");
            const projectActionGroup = document.createElement("div");
            const projectEditButton = document.createElement("button");

            projectRow.className = "project-row";

            projectSelectButton.type = "button";
            projectSelectButton.className = "project-select-btn";
            projectSelectButton.dataset.projectId = project.id;

            if (project.id === state.selectedProjectId) {
                projectSelectButton.classList.add("active");
            }

            projectLabel.className = "project-label";
            projectIcon.className = "mdi mdi-folder-outline";
            projectIcon.setAttribute("aria-hidden", "true");

            projectName.className = "project-name";
            projectName.textContent = project.name;

            projectCount.className = "project-count";
            projectCount.textContent = `${project.todos.length}`;

            projectLabel.appendChild(projectIcon);
            projectLabel.appendChild(projectName);
            projectSelectButton.appendChild(projectLabel);
            projectSelectButton.appendChild(projectCount);

            projectActionGroup.className = "project-action-group";

            projectEditButton.type = "button";
            projectEditButton.className = "icon-action-btn project-edit-btn";
            projectEditButton.dataset.editProjectId = project.id;
            projectEditButton.setAttribute("aria-label", `Rename ${project.name}`);
            projectEditButton.innerHTML = '<span class="mdi mdi-pencil-outline" aria-hidden="true"></span>';
            projectActionGroup.appendChild(projectEditButton);

            const projectDeleteButton = document.createElement("button");
            projectDeleteButton.type = "button";
            projectDeleteButton.className = "icon-action-btn project-delete-btn";
            projectDeleteButton.innerHTML = '<span class="mdi mdi-trash-can-outline" aria-hidden="true"></span>';

            projectDeleteButton.dataset.deleteProjectId = project.id;
            projectDeleteButton.setAttribute("aria-label", `Delete ${project.name}`);

            projectActionGroup.appendChild(projectDeleteButton);
            projectSelectButton.appendChild(projectActionGroup);

            projectRow.appendChild(projectSelectButton);
            elements.projectList.appendChild(projectRow);
        });
    }

    function renderHeader() {
        const selectedProject = TodoModel.getSelectedProject(state);

        if (!selectedProject) {
            elements.currentProjectName.textContent = "Inbox";
            return;
        }

        elements.currentProjectName.textContent = selectedProject.name;
    }

    function renderTodos() {
        const selectedProject = TodoModel.getSelectedProject(state);
        const todos = selectedProject ? TodoModel.sortTodos(selectedProject.todos, state.sortMode) : [];

        elements.todoList.textContent = "";
        elements.emptyState.hidden = todos.length !== 0;

        todos.forEach((todo) => {
            elements.todoList.appendChild(createTodoElement(todo));
        });
    }

    function createTodoElement(todo) {
        const card = document.createElement("details");
        const summary = document.createElement("summary");
        const summaryLeft = document.createElement("div");
        const summaryRight = document.createElement("div");
        const titleRow = document.createElement("div");
        const title = document.createElement("h3");
        const date = document.createElement("p");
        const priorityPill = document.createElement("span");
        const statusPill = document.createElement("span");
        const actionGroup = document.createElement("div");
        const body = document.createElement("div");
        const description = document.createElement("p");
        const metaGrid = document.createElement("div");
        const createdItem = document.createElement("p");
        const dueDateItem = document.createElement("p");
        const priorityItem = document.createElement("p");
        const statusItem = document.createElement("p");
        const toggleButton = document.createElement("button");
        const editButton = document.createElement("button");
        const deleteButton = document.createElement("button");

        card.className = "todo-card";

        summary.className = "todo-summary";
        summaryLeft.className = "todo-summary-left";
        summaryRight.className = "todo-summary-right";
        titleRow.className = "todo-title-row";
        title.className = "todo-title";
        date.className = "todo-date";
        priorityPill.className = `priority-pill ${todo.priority}`;
        actionGroup.className = "todo-action-group";
        body.className = "todo-body";
        metaGrid.className = "todo-meta-grid";
        createdItem.className = "todo-meta-item";
        dueDateItem.className = "todo-meta-item";
        priorityItem.className = "todo-meta-item";
        statusItem.className = "todo-meta-item";
        description.className = "todo-description";

        if (todo.completed) {
            summary.classList.add("is-complete");
            statusPill.className = "status-pill";
            statusPill.textContent = "Done";
        }

        title.textContent = todo.title;
        date.textContent = todo.dueDate ? `Due ${formatDate(todo.dueDate)}` : "No due date";
        priorityPill.textContent = capitalize(todo.priority);
        description.textContent = todo.description || "No description added.";
        createdItem.innerHTML = `<span class="todo-meta-label">Created:</span><span>${formatCreatedDate(todo.createdAt)}</span>`;
        dueDateItem.innerHTML = `<span class="todo-meta-label">Due:</span><span>${todo.dueDate ? formatDate(todo.dueDate) : "No due date"}</span>`;
        priorityItem.innerHTML = `<span class="todo-meta-label">Priority:</span><span>${capitalize(todo.priority)}</span>`;
        statusItem.innerHTML = `<span class="todo-meta-label">Status:</span><span>${todo.completed ? "Completed" : "Pending"}</span>`;

        toggleButton.type = "button";
        toggleButton.className = "icon-action-btn todo-toggle-btn";
        toggleButton.dataset.action = "toggle";
        toggleButton.dataset.todoId = todo.id;
        toggleButton.setAttribute("aria-label", todo.completed ? "Mark todo as undone" : "Mark todo as done");
        toggleButton.innerHTML = `<span class="mdi ${todo.completed ? "mdi-checkbox-marked-circle-outline" : "mdi-checkbox-blank-circle-outline"}" aria-hidden="true"></span>`;

        editButton.type = "button";
        editButton.className = "icon-action-btn todo-edit-btn";
        editButton.dataset.action = "edit";
        editButton.dataset.todoId = todo.id;
        editButton.setAttribute("aria-label", `Edit ${todo.title}`);
        editButton.innerHTML = '<span class="mdi mdi-pencil-outline" aria-hidden="true"></span>';

        deleteButton.type = "button";
        deleteButton.className = "icon-action-btn todo-delete-btn";
        deleteButton.dataset.action = "delete";
        deleteButton.dataset.todoId = todo.id;
        deleteButton.setAttribute("aria-label", `Delete ${todo.title}`);
        deleteButton.innerHTML = '<span class="mdi mdi-trash-can-outline" aria-hidden="true"></span>';

        titleRow.appendChild(title);
        summaryLeft.appendChild(titleRow);
        summaryLeft.appendChild(date);

        summaryRight.appendChild(priorityPill);
        if (todo.completed) {
            summaryRight.appendChild(statusPill);
        }
        actionGroup.appendChild(toggleButton);
        actionGroup.appendChild(editButton);
        actionGroup.appendChild(deleteButton);
        summaryRight.appendChild(actionGroup);
        summary.appendChild(summaryLeft);
        summary.appendChild(summaryRight);

        metaGrid.appendChild(createdItem);
        metaGrid.appendChild(dueDateItem);
        metaGrid.appendChild(priorityItem);
        metaGrid.appendChild(statusItem);
        body.appendChild(description);
        body.appendChild(metaGrid);

        card.appendChild(summary);
        card.appendChild(body);

        return card;
    }

    function formatDate(dateString) {
        const date = new Date(`${dateString}T00:00:00`);

        if (Number.isNaN(date.getTime())) {
            return "Invalid date";
        }

        return date.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    }

    function formatCreatedDate(timestamp) {
        const date = new Date(timestamp);

        if (Number.isNaN(date.getTime())) {
            return "Unknown";
        }

        return date.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    }

    function capitalize(value) {
        return value.charAt(0).toUpperCase() + value.slice(1);
    }

    return {
        init
    };
})();

App.init();
