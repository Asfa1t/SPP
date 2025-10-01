const API_URL = '/api/tasks';
const taskForm = document.getElementById('taskForm');
const taskList = document.getElementById('taskList');

let currentFilter = 'all';
let editingTaskId = null;

// Загружаем задачи с учетом фильтра
async function loadTasks() {
  const url = currentFilter === 'all' ? API_URL : `${API_URL}?filter=${currentFilter}`;
  const res = await fetch(url);
  const tasks = await res.json();
  renderTasks(tasks);
}

function renderTasks(tasks) {
  taskList.innerHTML = '';
  
  if (tasks.length === 0) {
    taskList.innerHTML = '<p class="no-tasks">No tasks found</p>';
    return;
  }
  
  tasks.forEach(task => {
    const div = document.createElement('div');
    div.className = `task-item ${task.completed ? 'completed' : ''}`;
    div.innerHTML = `
      <h3>${task.title}</h3>
      <p>${task.description || ''}</p>
      ${task.dueDate ? `<p>Due: ${new Date(task.dueDate).toLocaleDateString()}</p>` : ''}
      ${task.attachment ? `<p><a href="${task.attachment}" target="_blank">Download Attachment</a></p>` : ''}
      <div class="task-actions">
        <button onclick="toggleTask('${task.id}', ${task.completed})">
          ${task.completed ? 'Mark Active' : 'Mark Completed'}
        </button>
        <button onclick="editTask('${task.id}')">Edit</button>
        <button onclick="deleteTask('${task.id}')" class="delete-btn">Delete</button>
      </div>
    `;
    taskList.appendChild(div);
  });
}

// Обработчики фильтров
document.addEventListener('DOMContentLoaded', function() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  
  filterButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Убираем активный класс у всех кнопок
      filterButtons.forEach(btn => btn.classList.remove('active'));
      // Добавляем активный класс текущей кнопке
      this.classList.add('active');
      
      currentFilter = this.dataset.filter;
      loadTasks();
    });
  });
});

// Создание или обновление задачи
taskForm.addEventListener('submit', async e => {
  e.preventDefault();
  const formData = new FormData(taskForm);
  
  let url = API_URL;
  let method = 'POST';
  
  if (editingTaskId) {
    url = `${API_URL}/${editingTaskId}`;
    method = 'PUT';
  }
  
  const res = await fetch(url, { method, body: formData });
  if (res.ok) {
    taskForm.reset();
    editingTaskId = null;
    document.querySelector('button[type="submit"]').textContent = 'Add Task';
    loadTasks();
  }
});

async function toggleTask(id, completed) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ completed: !completed })
  });
  if (res.ok) loadTasks();
}

// Редактирование задачи
async function editTask(id) {
  const res = await fetch(`${API_URL}/${id}`);
  if (res.ok) {
    const task = await res.json();
    
    // Заполняем форму данными задачи
    document.querySelector('input[name="title"]').value = task.title;
    document.querySelector('textarea[name="description"]').value = task.description || '';
    document.querySelector('input[name="dueDate"]').value = task.dueDate || '';
    
    editingTaskId = task.id;
    document.querySelector('button[type="submit"]').textContent = 'Update Task';
    
    // Прокручиваем к форме
    document.querySelector('.task-form').scrollIntoView({ behavior: 'smooth' });
  }
}

// Удаление задачи с подтверждением
async function deleteTask(id) {
  const confirmDelete = confirm('Are you sure you want to delete this task? This action cannot be undone.');
  
  if (confirmDelete) {
    const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    if (res.ok) loadTasks();
  }
}

loadTasks();