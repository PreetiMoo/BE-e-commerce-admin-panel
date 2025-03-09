import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import path from 'path';
import productRoutes from '../src/routes/product.routes';
import { AppDataSource } from './data-source';

config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: ['http://localhost:5173','https://fe-e-commerce-admin-panel.vercel.app','https://fe-e-commerce-admin-panel-boyg0q5nb-preetimoos-projects.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/products', productRoutes);


AppDataSource.initialize()
  .then(() => {
    console.log('Connected to PostgreSQL database');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(error => {
    console.error('Database connection error:', error);
  });

export default app;