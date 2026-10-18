const pool = require('../config/db');

// Listar quartos disponíveis com busca por datas e capacidade
exports.listarQuartosDisponiveis = async (req, res) => {
  const { checkin, checkout, adultos, criancas } = req.query;
  try {
    const query = `
      SELECT q.*, 
        COALESCE(json_agg(iq.url_imagem) FILTER (WHERE iq.url_imagem IS NOT NULL), '[]') AS imagens,
        COALESCE(AVG(a.nota_geral), 5.0)::NUMERIC(2,1) as media_estrelas
      FROM quartos q
      LEFT JOIN imagens_quarto iq ON q.id = iq.quarto_id
      LEFT JOIN avaliacoes a ON q.id = a.quarto_id
      WHERE q.capacidade_adultos >= $1 
        AND q.capacidade_criancas >= $2
        AND (q.bloqueado_ate IS NULL OR q.bloqueado_ate < NOW())
        AND q.id NOT IN (
          SELECT quarto_id FROM reservas 
          WHERE status IN ('Confirmada', 'Ocupada')
          AND ($3::DATE < data_checkout AND $4::DATE > data_checkin)
        )
      GROUP BY q.id;
    `;
    const values = [adultos || 1, criancas || 0, checkin || '1970-01-01', checkout || '1970-01-02'];
    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Trava de Reserva (15 minutos contra Overbooking)
exports.travarQuarto = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(
      "UPDATE quartos SET bloqueado_ate = NOW() + INTERVAL '15 minutes' WHERE id = \$1",
      [id]
    );
    res.json({ message: 'Quarto reservado temporariamente por 15 minutos.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// CRUD Admin - Criar Quarto com Imagens
exports.criarQuarto = async (req, res) => {
  const { nome, categoria, descricao, capacidade_adultos, capacidade_criancas, preco_diaria, comodidades } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO quartos (nome, categoria, descricao, capacidade_adultos, capacidade_criancas, preco_diaria, comodidades_json)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [nome, categoria, descricao, capacidade_adultos, capacidade_criancas, preco_diaria, JSON.stringify(comodidades || [])]
    );
    const quartoId = result.rows[0].id;

    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        await pool.query(
          `INSERT INTO imagens_quarto (quarto_id, url_imagem, eh_principal) VALUES ($1, $2, $3)`,
          [quartoId, `/uploads/${req.files[i].filename}`, i === 0]
        );
      }
    }
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Atualizar Status de Governança
exports.atualizarGovernanca = async (req, res) => {
  const { id } = req.params;
  const { status_governanca } = req.body;
  try {
    await pool.query('UPDATE quartos SET status_governanca = \$1 WHERE id = \$2', [status_governanca, id]);
    res.json({ message: 'Status de governança atualizado com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};