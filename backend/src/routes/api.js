const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const auth = require('../middlewares/auth');

const quartoController = require('../controllers/quartoController');

const authController = require('../controllers/authController');

router.post('/auth/login', authController.login);

// Configuração do Multer para Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads/')),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// Rotas Públicas (Cliente)
router.get('/quartos', quartoController.listarQuartosDisponiveis);
router.post('/quartos/:id/travar', quartoController.travarQuarto);

// Rotas Privadas (Admin/Staff)
router.post('/admin/quartos', auth, upload.array('imagens', 5), quartoController.criarQuarto);
router.patch('/admin/quartos/:id/governanca', auth, quartoController.atualizarGovernanca);

module.exports = router;