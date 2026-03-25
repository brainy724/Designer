const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'salon-secret-2024';

app.use(cors());
app.use(express.json());

// ─── Database Setup ───────────────────────────────────────────────────────────

const db = new Database(path.join(__dirname, 'salon.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS designers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    specialty TEXT NOT NULL,
    description TEXT,
    login_id TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    working_start TEXT DEFAULT '10:00',
    working_end TEXT DEFAULT '19:00'
  );

  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    price INTEGER NOT NULL,
    description TEXT,
    category TEXT
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    designer_id INTEGER NOT NULL,
    service_id INTEGER NOT NULL,
    booking_date TEXT NOT NULL,
    booking_time TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (designer_id) REFERENCES designers(id),
    FOREIGN KEY (service_id) REFERENCES services(id)
  );
`);

// ─── Seed Data ────────────────────────────────────────────────────────────────

function seedIfEmpty() {
  const designerCount = db.prepare('SELECT COUNT(*) as cnt FROM designers').get().cnt;
  if (designerCount > 0) return;

  const hash = bcrypt.hashSync('1234', 10);

  const insertDesigner = db.prepare(
    'INSERT INTO designers (name, specialty, description, login_id, password_hash) VALUES (?, ?, ?, ?, ?)'
  );
  insertDesigner.run('김지수', '커트 전문', '10년 경력의 커트 전문 디자이너입니다. 고객의 얼굴형과 라이프스타일에 맞는 최적의 스타일을 제안합니다.', 'jisu', hash);
  insertDesigner.run('이민준', '컬러 전문', '트렌디한 컬러링을 전문으로 하며, 손상 없이 아름다운 컬러를 표현합니다.', 'minjun', hash);
  insertDesigner.run('박소연', '펌 전문', '자연스러운 웨이브부터 강한 볼륨 펌까지, 다양한 펌 스타일의 전문가입니다.', 'soyeon', hash);

  const insertService = db.prepare(
    'INSERT INTO services (name, duration_minutes, price, description, category) VALUES (?, ?, ?, ?, ?)'
  );
  insertService.run('커트', 30, 25000, '기본 커트 서비스입니다.', '커트');
  insertService.run('레이어드 커트', 45, 35000, '층이 있는 레이어드 스타일 커트입니다.', '커트');
  insertService.run('염색', 90, 80000, '전체 염색 서비스입니다. 다양한 컬러 상담 가능합니다.', '컬러');
  insertService.run('탈색', 120, 100000, '전체 탈색 서비스입니다. 헤어 상태 확인 후 진행합니다.', '컬러');
  insertService.run('일반 펌', 120, 80000, '자연스러운 웨이브 펌입니다.', '펌');
  insertService.run('볼륨 펌', 150, 100000, '풍성한 볼륨감을 주는 펌입니다.', '펌');
  insertService.run('트리트먼트', 45, 40000, '손상된 모발을 케어하는 집중 트리트먼트입니다.', '케어');
  insertService.run('두피케어', 60, 50000, '두피 건강을 위한 전문 케어 서비스입니다.', '케어');
}

seedIfEmpty();

// ─── Auth Middleware ───────────────────────────────────────────────────────────

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '인증이 필요합니다.' });
  }
  try {
    const token = authHeader.split(' ')[1];
    req.designer = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
  }
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// Auth
app.post('/api/auth/login', (req, res) => {
  const { login_id, password } = req.body;
  if (!login_id || !password) {
    return res.status(400).json({ error: '아이디와 비밀번호를 입력해주세요.' });
  }
  const designer = db.prepare('SELECT * FROM designers WHERE login_id = ?').get(login_id);
  if (!designer || !bcrypt.compareSync(password, designer.password_hash)) {
    return res.status(401).json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' });
  }
  const token = jwt.sign(
    { id: designer.id, name: designer.name, login_id: designer.login_id },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
  const { password_hash, ...designerData } = designer;
  res.json({ token, designer: designerData });
});

// Designers (public)
app.get('/api/designers', (req, res) => {
  const designers = db.prepare(
    'SELECT id, name, specialty, description, working_start, working_end FROM designers'
  ).all();
  res.json(designers);
});

// Services (public)
app.get('/api/services', (req, res) => {
  const services = db.prepare('SELECT * FROM services ORDER BY category, price').all();
  res.json(services);
});

// Available slots (public)
app.get('/api/available-slots', (req, res) => {
  const { designer_id, date, service_id } = req.query;
  if (!designer_id || !date || !service_id) {
    return res.status(400).json({ error: 'designer_id, date, service_id가 필요합니다.' });
  }

  const designer = db.prepare('SELECT * FROM designers WHERE id = ?').get(designer_id);
  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(service_id);
  if (!designer || !service) {
    return res.status(404).json({ error: '디자이너 또는 서비스를 찾을 수 없습니다.' });
  }

  // Get existing bookings for that designer on that date (not cancelled)
  const existingBookings = db.prepare(`
    SELECT b.booking_time, s.duration_minutes
    FROM bookings b
    JOIN services s ON b.service_id = s.id
    WHERE b.designer_id = ? AND b.booking_date = ? AND b.status != 'cancelled'
  `).all(designer_id, date);

  // Generate all possible 30-min slots within working hours
  const [startH, startM] = designer.working_start.split(':').map(Number);
  const [endH, endM] = designer.working_end.split(':').map(Number);
  const workStart = startH * 60 + startM;
  const workEnd = endH * 60 + endM;

  const allSlots = [];
  for (let t = workStart; t + service.duration_minutes <= workEnd; t += 30) {
    const hh = String(Math.floor(t / 60)).padStart(2, '0');
    const mm = String(t % 60).padStart(2, '0');
    allSlots.push({ time: `${hh}:${mm}`, minutes: t });
  }

  // Filter out past slots if today
  const now = new Date();
  const todayStr = now.toLocaleDateString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).replace(/\. /g, '-').replace('.', '').trim();
  const isToday = date === now.toISOString().split('T')[0];
  const currentMinutes = now.getHours() * 60 + now.getMinutes() + 30; // 30min buffer

  // Filter out slots that overlap with existing bookings
  const available = allSlots.filter(slot => {
    if (isToday && slot.minutes < currentMinutes) return false;

    const slotEnd = slot.minutes + service.duration_minutes;
    for (const booking of existingBookings) {
      const [bh, bm] = booking.booking_time.split(':').map(Number);
      const bookingStart = bh * 60 + bm;
      const bookingEnd = bookingStart + booking.duration_minutes;
      // Check overlap
      if (slot.minutes < bookingEnd && slotEnd > bookingStart) return false;
    }
    return true;
  });

  res.json(available.map(s => s.time));
});

// Create booking (public)
app.post('/api/bookings', (req, res) => {
  const { customer_name, customer_phone, customer_email, designer_id, service_id, booking_date, booking_time, notes } = req.body;

  if (!customer_name || !customer_phone || !designer_id || !service_id || !booking_date || !booking_time) {
    return res.status(400).json({ error: '필수 정보를 모두 입력해주세요.' });
  }

  // Check slot still available
  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(service_id);
  if (!service) return res.status(404).json({ error: '서비스를 찾을 수 없습니다.' });

  const [bh, bm] = booking_time.split(':').map(Number);
  const newStart = bh * 60 + bm;
  const newEnd = newStart + service.duration_minutes;

  const conflicts = db.prepare(`
    SELECT b.id, b.booking_time, s.duration_minutes
    FROM bookings b
    JOIN services s ON b.service_id = s.id
    WHERE b.designer_id = ? AND b.booking_date = ? AND b.status != 'cancelled'
  `).all(designer_id, booking_date);

  for (const c of conflicts) {
    const [ch, cm] = c.booking_time.split(':').map(Number);
    const cStart = ch * 60 + cm;
    const cEnd = cStart + c.duration_minutes;
    if (newStart < cEnd && newEnd > cStart) {
      return res.status(409).json({ error: '해당 시간은 이미 예약이 있습니다. 다른 시간을 선택해주세요.' });
    }
  }

  const result = db.prepare(`
    INSERT INTO bookings (customer_name, customer_phone, customer_email, designer_id, service_id, booking_date, booking_time, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(customer_name, customer_phone, customer_email || null, designer_id, service_id, booking_date, booking_time, notes || null);

  const booking = db.prepare(`
    SELECT b.*, d.name as designer_name, s.name as service_name, s.price, s.duration_minutes
    FROM bookings b
    JOIN designers d ON b.designer_id = d.id
    JOIN services s ON b.service_id = s.id
    WHERE b.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(booking);
});

// Get designer's bookings (protected)
app.get('/api/bookings/my', authMiddleware, (req, res) => {
  const { date, status, from, to } = req.query;
  let query = `
    SELECT b.*, d.name as designer_name, s.name as service_name, s.price, s.duration_minutes, s.category
    FROM bookings b
    JOIN designers d ON b.designer_id = d.id
    JOIN services s ON b.service_id = s.id
    WHERE b.designer_id = ?
  `;
  const params = [req.designer.id];

  if (date) { query += ' AND b.booking_date = ?'; params.push(date); }
  if (from) { query += ' AND b.booking_date >= ?'; params.push(from); }
  if (to) { query += ' AND b.booking_date <= ?'; params.push(to); }
  if (status) { query += ' AND b.status = ?'; params.push(status); }

  query += ' ORDER BY b.booking_date, b.booking_time';

  const bookings = db.prepare(query).all(...params);
  res.json(bookings);
});

// Update booking status (protected)
app.put('/api/bookings/:id/status', authMiddleware, (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: '유효하지 않은 상태값입니다.' });
  }

  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
  if (!booking) return res.status(404).json({ error: '예약을 찾을 수 없습니다.' });
  if (booking.designer_id !== req.designer.id) {
    return res.status(403).json({ error: '권한이 없습니다.' });
  }

  db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run(status, req.params.id);

  const updated = db.prepare(`
    SELECT b.*, d.name as designer_name, s.name as service_name, s.price, s.duration_minutes
    FROM bookings b
    JOIN designers d ON b.designer_id = d.id
    JOIN services s ON b.service_id = s.id
    WHERE b.id = ?
  `).get(req.params.id);

  res.json(updated);
});

// Get booking stats (protected)
app.get('/api/bookings/stats', authMiddleware, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const stats = {
    today_total: db.prepare("SELECT COUNT(*) as cnt FROM bookings WHERE designer_id = ? AND booking_date = ?").get(req.designer.id, today).cnt,
    today_pending: db.prepare("SELECT COUNT(*) as cnt FROM bookings WHERE designer_id = ? AND booking_date = ? AND status = 'pending'").get(req.designer.id, today).cnt,
    today_confirmed: db.prepare("SELECT COUNT(*) as cnt FROM bookings WHERE designer_id = ? AND booking_date = ? AND status = 'confirmed'").get(req.designer.id, today).cnt,
    today_completed: db.prepare("SELECT COUNT(*) as cnt FROM bookings WHERE designer_id = ? AND booking_date = ? AND status = 'completed'").get(req.designer.id, today).cnt,
    upcoming: db.prepare("SELECT COUNT(*) as cnt FROM bookings WHERE designer_id = ? AND booking_date > ? AND status NOT IN ('cancelled','completed')").get(req.designer.id, today).cnt,
  };
  res.json(stats);
});

app.listen(PORT, () => {
  console.log(`✅ 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`   디자이너 계정: jisu/1234, minjun/1234, soyeon/1234`);
});
