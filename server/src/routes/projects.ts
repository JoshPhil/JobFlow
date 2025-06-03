import express from 'express';
import db from '../db';
import { authenticateToken } from '../middleware/auth';

interface AuthRequest extends express.Request {
  userId?: number;
}

const router = express.Router();

router.use(authenticateToken);

// Get all projects for logged-in user
router.get('/', async (req: AuthRequest, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Add a new project
router.post('/', async (req: AuthRequest, res) => {
  const { name, description } = req.body;

  try {
    const result = await db.query(
      `INSERT INTO projects (user_id, name, description)
       VALUES ($1, $2, $3) RETURNING *`,
      [req.userId, name, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Update a project by ID
router.put('/:id', async (req: AuthRequest, res) => {
  const projectId = req.params.id;
  const { name, description } = req.body;

  try {
    // Check ownership first
    const project = await db.query(
      'SELECT * FROM projects WHERE id = $1 AND user_id = $2',
      [projectId, req.userId]
    );
    if (project.rows.length === 0) {
      res.status(404).json({ error: 'Project not found' });
      return
    }

    const result = await db.query(
      `UPDATE projects SET name = $1, description = $2
       WHERE id = $3 RETURNING *`,
      [name, description, projectId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete a project by ID
router.delete('/:id', async (req: AuthRequest, res) => {
  const projectId = req.params.id;

  try {
    const project = await db.query(
      'SELECT * FROM projects WHERE id = $1 AND user_id = $2',
      [projectId, req.userId]
    );
    if (project.rows.length === 0) {
      res.status(404).json({ error: 'Project not found' });
      return
    }

    await db.query('DELETE FROM projects WHERE id = $1', [projectId]);
    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete project' });
  }
}); 

export default router;
