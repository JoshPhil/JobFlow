import express from 'express';
import dotenv from 'dotenv';
import db from './db';
import projectsRoutes from './routes/projects';

import authRoutes from './routes/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectsRoutes);

app.get('/', (req, res) => {
  res.send('TaskFlow backend is running!');
});

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
  db.query('SELECT NOW()')
  .then(res => {
    console.log('Connected to PostgreSQL:', res.rows[0]);
  })
  .catch(err => {
    console.error('Database connection error:', err);
  });

});
