const express = require('express');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public')); // SPA и статика

// ===== Multer (для загрузки файлов) =====
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'public/uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}-${file.originalname}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// ===== Работа с JSON-файлом =====
const getTasks = () =>
  fs.existsSync('data.json') ? JSON.parse(fs.readFileSync('data.json', 'utf8')) : [];

const saveTasks = (tasks) =>
  fs.writeFileSync('data.json', JSON.stringify(tasks, null, 2));

// ===== REST API =====

app.get('/api/tasks', (req, res) => {
  let tasks = getTasks();
  
  // Фильтрация по статусу
  const filter = req.query.filter;
  if (filter === 'active') {
    tasks = tasks.filter(task => !task.completed);
  } else if (filter === 'completed') {
    tasks = tasks.filter(task => task.completed);
  }
  // Если filter === 'all' или undefined - возвращаем все задачи
  
  res.json(tasks);
});
// Получить одну задачу
app.get('/api/tasks/:id', (req, res) => {
  const task = getTasks().find((t) => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

// Создать задачу
app.post('/api/tasks', upload.single('attachment'), (req, res) => {
  const tasks = getTasks();
  const newTask = {
    id: uuidv4(),
    title: req.body.title,
    description: req.body.description,
    dueDate: req.body.dueDate,
    completed: false,
    createdAt: new Date().toISOString(),
    attachment: req.file ? `/uploads/${req.file.filename}` : null
  };
  tasks.push(newTask);
  saveTasks(tasks);
  res.status(201).json(newTask);
});

// Обновить задачу
app.put('/api/tasks/:id', upload.single('attachment'), (req, res) => {
  const tasks = getTasks();
  const index = tasks.findIndex((t) => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Task not found' });

  let updatedTask = { ...tasks[index], ...req.body };

  if (req.file) {
    if (tasks[index].attachment) {
      const oldFilePath = path.join('public', tasks[index].attachment);
      if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
    }
    updatedTask.attachment = `/uploads/${req.file.filename}`;
  }

  tasks[index] = updatedTask;
  saveTasks(tasks);
  res.json(updatedTask);
});

// Удалить задачу
app.delete('/api/tasks/:id', (req, res) => {
  const tasks = getTasks();
  const index = tasks.findIndex((t) => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Task not found' });

  if (tasks[index].attachment) {
    const filePath = path.join('public', tasks[index].attachment);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  const deleted = tasks.splice(index, 1)[0];
  saveTasks(tasks);
  res.json({ message: 'Deleted successfully', task: deleted });
});

// Запуск сервера
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));