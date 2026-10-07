import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { fileURLToPath } from 'url';
import db from './src/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const uploadDir = path.join(__dirname, 'public', 'uploads', 'withdrawals');
const gameAssetDir = path.join(__dirname, 'data', 'game-assets');
fs.mkdirSync(uploadDir, { recursive: true });
fs.mkdirSync(gameAssetDir, { recursive: true });

app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
app.use('/data/game-assets', express.static(gameAssetDir));

// Fix CSP & Permissions Policy
app.use((req, res, next) => {
    res.setHeader("Permissions-Policy", "geolocation=(self), camera=(self), microphone=(self)");
    res.setHeader("Content-Security-Policy", "default-src * 'unsafe-inline' 'unsafe-eval' data: blob: gap:; connect-src * 'unsafe-inline' ws: wss:; img-src * data: blob:; frame-src *; media-src *;");
    res.setHeader("Access-Control-Allow-Origin", "*");
    next();
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === "attachment") {
            cb(null, uploadDir);
        } else {
            cb(null, gameAssetDir);
        }
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.fieldname === "attachment") {
            if (!file.originalname.match(/\.(jpg|jpeg|png|webp|pdf)$/i)) {
                return cb(new Error('Only JPG/PNG/WEBP/PDF image files allowed!'), false);
            }
        }
        cb(null, true);
    }
});

const ADMIN_PIN = process.env.ADMIN_PIN || "64686123";

app.post('/api/admin/login', (req, res) => {
    const { pin } = req.body;
    if (pin === ADMIN_PIN) {
        const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
        db.prepare(`INSERT INTO admin_sessions (token) VALUES (?)`).run(token);
        return res.json({ success: true, token });
    }
    res.status(401).json({ success: false, error: "Invalid Admin PIN" });
});

app.post('/api/account/location', (req, res) => {
    const { userId, latitude, longitude, accuracy } = req.body;
    if (!userId || !latitude || !longitude) {
        return res.status(400).json({ success: false, error: "Invalid payload" });
    }
    try {
        db.prepare(`INSERT INTO user_locations (user_id, latitude, longitude, accuracy) VALUES (?, ?, ?, ?)`).run(userId, latitude, longitude, accuracy || null);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/withdrawals', upload.single('attachment'), (req, res) => {
    const { userId, amount, method, accountNo, note } = req.body;
    const attachmentPath = req.file ? `/uploads/withdrawals/${req.file.filename}` : null;

    try {
        const user = db.prepare(`SELECT balance FROM users WHERE id = ?`).get(userId);
        if (!user || user.balance < amount) {
            return res.status(400).json({ success: false, error: "Insufficient balance" });
        }

        db.prepare(`UPDATE users SET balance = balance - ? WHERE id = ?`).run(amount, userId);

        const stmt = db.prepare(`
            INSERT INTO withdrawals (user_id, amount, method, account_no, note, attachment_url, status)
            VALUES (?, ?, ?, ?, ?, ?, 'Approved')
        `);
        const result = stmt.run(userId, amount, method, accountNo, note || '', attachmentPath);

        res.json({ success: true, message: "Withdrawal request processed!", id: result.lastInsertRowid });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`TakaBazar V12.13 Server running on port ${PORT}`));
