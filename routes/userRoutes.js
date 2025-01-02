const express = require('express');
const { User } = require('../models');

const router = express.Router();

// 모든 사용자 조회
router.get('/', async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: '사용자 조회 실패' });
  }
});

// 사용자 생성
router.post('/', async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.create({ name, email });
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: '사용자 생성 실패' });
  }
});

// 사용자 수정
router.put('/:id', async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.findByPk(req.params.id);
    if (user) {
      user.name = name || user.name;
      user.email = email || user.email;
      await user.save();
      res.json(user);
    } else {
      res.status(404).json({ error: '사용자를 찾을 수 없음' });
    }
  } catch (error) {
    res.status(400).json({ error: '사용자 수정 실패' });
  }
});

// 사용자 삭제
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (user) {
      await user.destroy();
      res.json({ message: '사용자가 삭제되었습니다.' });
    } else {
      res.status(404).json({ error: '사용자를 찾을 수 없음' });
    }
  } catch (error) {
    res.status(500).json({ error: '사용자 삭제 실패' });
  }
});

module.exports = router;