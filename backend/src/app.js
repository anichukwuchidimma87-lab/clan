app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://clan-omega.vercel.app', 
    'https://clan-lywmh76ho-chidimma-s-projects.vercel.app' // Add this exact line
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));