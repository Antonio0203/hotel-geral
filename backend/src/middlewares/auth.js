const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ message: 'Acesso negado. Token não fornecido.' });

  try {
    const verified = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET || 'secret_tavares');
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ message: 'Token inválido.' });
  }
};