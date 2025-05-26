import express from 'express';
import db from '../db';
import { authenticateToken } from '../middleware/auth';

interface AuthRequest extends express.Request {
  userId?: number;
}

const router = express.Router();

router.use(authenticateToken);

// Get all jobs for logged-in user
router.get('/', async (req: AuthRequest, res) => {
  try {
    const result = await db.query('SELECT * FROM jobs WHERE user_id = $1 ORDER BY created_at DESC', [req.userId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// Add a new job
router.post('/', async (req: AuthRequest, res) => {
  const { company, position, status, location, job_posting_url, notes } = req.body;

  try {
    const result = await db.query(
      `INSERT INTO jobs (user_id, company, position, status, location, job_posting_url, notes) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.userId, company, [position], status || 'applied', location, job_posting_url, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add job' });
  }
});

// Update a job by ID
router.put('/:id', async (req: AuthRequest, res) => {
  const jobId = req.params.id;
  const { company, position, status, location, job_posting_url, notes } = req.body;

  try {
    // Check ownership first
    const job = await db.query('SELECT * FROM jobs WHERE id = $1 AND user_id = $2', [jobId, req.userId]);
    if (job.rows.length === 0) {
        res.status(404).json({ error: 'Job not found' });
        return;
    }

    const result = await db.query(
      `UPDATE jobs SET company = $1, position = $2, status = $3, location = $4, job_posting_url = $5, notes = $6
       WHERE id = $7 RETURNING *`,
      [company, position, status, location, job_posting_url, notes, jobId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update job' });
  }
});

// Delete a job by ID
router.delete('/:id', async (req: AuthRequest, res) => {
  const jobId = req.params.id;
  try {
    // Check ownership first
    const job = await db.query('SELECT * FROM jobs WHERE id = $1 AND user_id = $2', [jobId, req.userId]);
    if (job.rows.length === 0) {
        res.status(404).json({ error: 'Job not found' });
        return;
    }

    await db.query('DELETE FROM jobs WHERE id = $1', [jobId]);
    res.json({ message: 'Job deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete job' });
  }
});

export default router;
