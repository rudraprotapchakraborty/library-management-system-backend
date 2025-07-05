import express from 'express';
import cors from 'cors';
import bookRoutes from './routes/book.routes';
import borrowRoutes from './routes/borrow.routes';
import { errorHandler } from './middlewares/error.middleware';


const app = express();
app.use(cors()); 
app.use(express.json());

app.use('/api/books', bookRoutes);
app.use('/api/borrow', borrowRoutes);

app.use(errorHandler);

export default app;
