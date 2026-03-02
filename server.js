const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'listings.json');

app.use(cors());
app.use(express.json());

// Serve static front-end
app.use(express.static(path.join(__dirname)));

function readData(){
  try{ return JSON.parse(fs.readFileSync(DATA_FILE,'utf8')) }catch(e){ return [] }
}

function writeData(data){
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// Basic Auth middleware for protecting admin endpoints
// Older Basic Auth removed; implement JWT-based login and verification

// Provide a default bcrypt hash for password "password" when none supplied.
const DEFAULT_PASS = 'password';
const DEFAULT_HASH = bcrypt.hashSync(DEFAULT_PASS, 10);

function getAdminHash(){
  return process.env.ADMIN_PASS_HASH || DEFAULT_HASH;
}

function getAdminUser(){
  return process.env.ADMIN_USER || 'admin';
}

function getJwtSecret(){
  return process.env.ADMIN_JWT_SECRET || 'dev-secret-change-me';
}

// Login endpoint: accepts { user, pass } and returns { token }
app.post('/api/admin/login', async (req, res) => {
  const { user, pass } = req.body || {};
  const adminUser = getAdminUser();
  const adminHash = getAdminHash();
  if(!user || !pass) return res.status(400).json({ error: 'Missing credentials' });
  if(user !== adminUser) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(pass, adminHash);
  if(!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ user: adminUser }, getJwtSecret(), { expiresIn: '12h' });
  res.json({ token });
});

function requireBearerAuth(req, res, next){
  const auth = req.headers.authorization || '';
  if(!auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' });
  const token = auth.split(' ')[1];
  try{
    const payload = jwt.verify(token, getJwtSecret());
    req.admin = payload;
    return next();
  }catch(e){
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// API: list all
app.get('/api/listings', (req, res) => {
  const data = readData();
  res.json(data);
});

// API: get by id
app.get('/api/listings/:id', (req, res) => {
  const id = Number(req.params.id);
  const data = readData();
  const item = data.find(x => x.id === id);
  if(!item) return res.status(404).json({error:'Not found'});
  res.json(item);
});

// API: create
app.post('/api/listings', requireBearerAuth, (req, res) => {
  const data = readData();
  const body = req.body || {};
  const nextId = data.reduce((m,x)=>Math.max(m,x.id||0),0)+1;
  const newItem = Object.assign({
    id: nextId,
    title: body.title || 'Untitled',
    type: body.type || 'Residential',
    price: body.price || 0,
    location: body.location || '',
    beds: body.beds || 0,
    baths: body.baths || 0,
    size: body.size || 0,
    lat: body.lat,
    lon: body.lon,
    image: body.image || ''
  }, body);
  data.push(newItem);
  writeData(data);
  res.status(201).json(newItem);
});

app.listen(PORT, ()=> console.log(`Server running on http://localhost:${PORT}`));
