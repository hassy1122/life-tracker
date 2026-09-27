import { Router } from 'express';
import Task from '../models/Task.js';
import { requireAuth } from '../middleware/auth.js';
import { isValidIsoDate, todayInTz } from '../lib/dates.js';

const router = Router();
router.use(requireAuth);

const PRIORITIES = ['low', 'medium', 'high'];

function serialize(task) {
  return {
    id: task._id.toString(),
    title: task.title,
    dueDate: task.dueDate,
    priority: task.priority,
    completed: task.completed,
    goalId: task.goalId,
    createdAt: task.createdAt,
  };
}

function validate(body) {
  const { title, dueDate, priority, completed, goalId } = body || {};
  if (!title || typeof title !== 'string' || !title.trim()) {
    return { error: 'Task title is required' };
  }
  if (dueDate != null && !isValidIsoDate(dueDate)) {
    return { error: 'Due date must be YYYY-MM-DD' };
  }
  if (priority !== undefined && !PRIORITIES.includes(priority)) {
    return { error: 'Priority must be low, medium or high' };
  }
  return {
    values: {
      title: String(title).trim().slice(0, 200),
      dueDate: dueDate ?? null,
      priority: priority ?? 'medium',
      completed: typeof completed === 'boolean' ? completed : undefined,
      goalId: goalId ?? null,
    },
  };
}

router.get('/', async (req, res) => {
  const today = todayInTz(req.user.timezone);
  const { from, to } = req.query;
  const filter = { userId: req.user._id };

  if (req.query.completed === 'true') filter.completed = true;
  else if (req.query.completed === 'false') filter.completed = false;

  if (isValidIsoDate(from) || isValidIsoDate(to)) {
    filter.dueDate = {};
    if (isValidIsoDate(from)) filter.dueDate.$gte = from;
    if (isValidIsoDate(to)) filter.dueDate.$lte = to;
    if (req.query.undated === 'false') filter.dueDate.$ne = null;
  } else if (req.query.undated === 'false') {
    filter.dueDate = { $ne: null };
  }

  const tasks = await Task.find(filter).sort('completed dueDate -priority createdAt');
  res.json({ today, tasks: tasks.map(serialize) });
});

router.post('/', async (req, res) => {
  const parsed = validate(req.body);
  if (parsed.error) return res.status(400).json({ error: parsed.error });
  const values = parsed.values;
  const task = await Task.create({
    userId: req.user._id,
    title: values.title,
    dueDate: values.dueDate,
    priority: values.priority,
    goalId: values.goalId,
  });
  res.status(201).json({ task: serialize(task) });
});

router.put('/:id', async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, userId: req.user._id });
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const parsed = validate({ ...task.toObject(), ...req.body });
  if (parsed.error) return res.status(400).json({ error: parsed.error });
  const values = parsed.values;

  task.title = values.title;
  task.dueDate = values.dueDate;
  task.priority = values.priority;
  task.goalId = values.goalId;
  if (values.completed !== undefined && values.completed !== task.completed) {
    task.completed = values.completed;
    task.completedAt = values.completed ? new Date() : null;
  }

  await task.save();
  res.json({ task: serialize(task) });
});

router.delete('/:id', async (req, res) => {
  const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.status(204).end();
});

export default router;
