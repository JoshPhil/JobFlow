import express from 'express';
import db from '../db';
import { authenticateToken } from '../middleware/auth';

interface AuthRequest extends express.Request {
  userId?: number;
}

const router = express.Router();

router.use(authenticateToken);

// Get all tasks for a project
router.get('/project/:projectId', async (req: AuthRequest, res) => {
  const { projectId } = req.params;

  try {
    const result = await db.query(
      `SELECT * FROM tasks WHERE user_id = $1 AND project_id = $2 ORDER BY created_at DESC`, [req.userId, projectId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Add a task to a project
router.post('/', async (req: AuthRequest, res) => {
  const { project_id, title, description, status, due_date } = req.body;

  try {
    const result = await db.query(
      `INSERT INTO tasks (user_id, project_id, title, description, status, due_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.userId, project_id, title, description, status || 'todo', due_date]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update a task by ID
router.put('/:id', async (req: AuthRequest, res) => {
  const taskId = req.params.id;
  const { title, description, status, due_date } = req.body;

  try {
    // Check ownership first
    const task = await db.query(
      'SELECT * FROM tasks WHERE id = $1 AND user_id = $2', [taskId, req.userId]
    );
    if (task.rows.length === 0) {
        res.status(404).json({ error: 'Task not found' });
        return
    }

    const result = await db.query(
      `UPDATE tasks SET title = $1, description = $2, status = $3, due_date = $4 WHERE id = $5 RETURNING *`,
      [title, description, status, due_date, taskId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Delete a task
router.delete('/:id', async (req: AuthRequest, res) => {
  const taskId = req.params.id;

  try {
    const task = await db.query(
      'SELECT * FROM tasks WHERE id = $1 AND user_id = $2', [taskId, req.userId]
    );
    if (task.rows.length === 0) {
     res.status(404).json({ error: 'Task not found' });
     return
    }

    await db.query('DELETE FROM tasks WHERE id = $1', [taskId]);
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default router;
