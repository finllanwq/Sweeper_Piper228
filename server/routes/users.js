const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { users } = require('../db');

// РЕГИСТРАЦИЯ
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password)
    return res.status(400).json({ error: 'Заполни все поля' });
  if (users.find(u => u.username === username))
    return res.status(409).json({ error: 'Логин уже занят' });
  const hash = await bcrypt.hash(password, 10);
  const user = { id: users.length+1, username, email, password_hash: hash, mmr:0, rank_name:'Herald', wins:0, losses:0, level:1 };
  users.push(user);
  res.json({ success: true });
});

// ВХОД
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Введи логин и пароль' });
  const user = users.find(u => u.username === username);
  if (!user) return res.status(401).json({ error: 'Неверный логин или пароль' });
  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) return res.status(401).json({ error: 'Неверный логин или пароль' });
  req.session.userId = user.id;
  req.session.username = user.username;
  res.json({ success: true, username: user.username });
});

// ВЫХОД
router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// ПРОФИЛЬ
router.get('/me', (req, res) => {
  if (!req.session.userId)
    return res.status(401).json({ error: 'Не авторизован' });
  const user = users.find(u => u.id === req.session.userId);
  if (!user) return res.status(404).json({ error: 'Не найден' });
  res.json(user);
});

// ОБНОВЛЕНИЕ СТАТИСТИКИ
router.post('/update-stats', (req, res) => {
  if (!req.session.userId)
    return res.status(401).json({ error: 'Не авторизован' });
  const { win } = req.body;
  const user = users.find(u => u.id === req.session.userId);
  if (!user) return res.status(404).json({ error: 'Не найден' });
  if (win) {
    user.wins++;
    user.mmr += 25;
    user.level = Math.floor(user.wins / 3) + 1;
    if (user.mmr >= 4620) user.rank_name = 'Divine';
    else if (user.mmr >= 3850) user.rank_name = 'Ancient';
    else if (user.mmr >= 3080) user.rank_name = 'Legend';
    else if (user.mmr >= 2310) user.rank_name = 'Archon';
    else if (user.mmr >= 1540) user.rank_name = 'Crusader';
    else if (user.mmr >= 770) user.rank_name = 'Guardian';
    else user.rank_name = 'Herald';
  } else {
    user.losses++;
    user.mmr = Math.max(0, user.mmr - 15);
  }
  res.json({ success: true, user });
});

module.exports = router;