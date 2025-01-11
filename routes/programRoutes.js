const express = require('express');
const { Program } = require('../models');

const router = express.Router();

// 프로그램 전체 조회
router.get('/', async (req, res) => {
  try {
    const programs = await Program.findAll();
    res.json(programs);
  } catch (error) {
    res.status(500).json({ error: '프로그램 조회 실패' });
  }
});

// 프로그램 생성
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;
    const program = await Program.create({ name, description });
    res.status(201).json(program);
  } catch (error) {
    res.status(400).json({ error: '프로그램 생성 실패' });
  }
});

// 프로그램 삭제
router.delete('/:id', async (req, res) => {
  try {
    const program = await Program.findByPk(req.params.id);
    if (program) {
      await program.destroy();
      res.json({ message: '프로그램 삭제 완료' });
    } else {
      res.status(404).json({ error: '프로그램을 찾을 수 없음' });
    }
  } catch (error) {
    res.status(500).json({ error: '프로그램 삭제 실패' });
  }
});

module.exports = router;
