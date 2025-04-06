import express from 'express';

const app = express();

// Tambahkan trust proxy
app.set('trust proxy', true); 