const API_URL = 'http://localhost:3000/api';
const TOKEN = localStorage.getItem('token');

// Validação de Sessão JWT
if (!TOKEN) {
  window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', () => {
  // Inicialização dos módulos do painel
  carregarQuartos();
  carregarGanttOcupacao();
  inicializarGraficos();

  // Handler do Botão Logout
  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      window.location.href = 'login.html';
    });
  }

  // Handler do Formulário de Cadastro de Quarto
  const formQuarto = document.getElementById('form-novo-quarto');
  if (formQuarto) {
    formQuarto.addEventListener('submit', cadastrarQuarto);
  }
});

/* ==========================================================================
   1. GESTÃO DE QUARTOS (LISTAGEM E CADASTRO COM MULTIPLE IMAGES)
   ========================================================================== */

// Listar todos os quartos cadastrados no banco
async function carregarQuartos() {
  try {
    const res = await fetch(`${API_URL}/quartos`);
    const quartos = await res.json();

    const tbody = document.getElementById('tabela-quartos');
    if (!tbody) return;

    tbody.innerHTML = '';

    quartos.forEach(q => {
      tbody.innerHTML += `
        <tr>
          <td>#${q.id}</td>
          <td><strong>${q.nome}</strong></td>
          <td>${q.categoria}</td>
          <td>${q.capacidade_adultos} Ad. / ${q.capacidade_criancas} Cr.</td>
          <td>R$ ${parseFloat(q.preco_diaria).toFixed(2)}</td>
          <td><span class="badge ${getBadgeClass(q.status_governanca)}">${q.status_governanca || 'Limpo'}</span></td>
        </tr>
      `;
    });
  } catch (err) {
    console.error('Erro ao carregar quartos:', err);
  }
}

// Submeter Novo Quarto enviando FormData com Imagens e JWT Header
async function cadastrarQuarto(e) {
  e.preventDefault();

  const formData = new FormData();
  formData.append('nome', document.getElementById('quarto-nome').value);
  formData.append('categoria', document.getElementById('quarto-categoria').value);
  formData.append('preco_diaria', document.getElementById('quarto-preco').value);
  formData.append('capacidade_adultos', document.getElementById('quarto-adultos').value);
  formData.append('capacidade_criancas', document.getElementById('quarto-criancas').value);
  formData.append('descricao', document.getElementById('quarto-descricao').value);

  // Anexar lista de arquivos de imagem
  const inputImagens = document.getElementById('quarto-imagens');
  if (inputImagens.files.length > 0) {
    for (let i = 0; i < inputImagens.files.length; i++) {
      formData.append('imagens', inputImagens.files[i]);
    }
  }

  try {
    const response = await fetch(`${API_URL}/admin/quartos`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}` // Token JWT mantido no Header
      },
      body: formData // Envio em multipart/form-data automático
    });

    if (!response.ok) {
      throw new Error('Erro ao salvar o quarto.');
    }

    alert('Quarto cadastrado com sucesso!');
    document.getElementById('form-novo-quarto').reset();
    carregarQuartos(); // Recarrega a tabela

  } catch (err) {
    alert(err.message);
  }
}

// Alterar Status de Governança
async function mudarGovernanca(quartoId, novoStatus) {
  try {
    const res = await fetch(`${API_URL}/admin/quartos/${quartoId}/governanca`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      },
      body: JSON.stringify({ status_governanca: novoStatus })
    });
    const data = await res.json();
    alert(data.message);
    carregarQuartos();
  } catch (err) {
    console.error('Erro ao atualizar governança:', err);
  }
}

/* ==========================================================================
   2. MAPA DE OCUPAÇÃO (VISÃO GANTT DINÂMICA)
   ========================================================================== */

async function carregarGanttOcupacao() {
  try {
    // Busca dados combinados de quartos e reservas
    const [resQuartos, resReservas] = await Promise.all([
      fetch(`${API_URL}/quartos`),
      fetch(`${API_URL}/admin/reservas`, {
        headers: { 'Authorization': `Bearer ${TOKEN}` }
      }).catch(() => ({ json: () => [] })) // Fallback seguro para mock/testes
    ]);

    const quartos = await resQuartos.json();
    const reservas = (await resReservas.json()) || [];

    const container = document.querySelector('.gantt-container');
    if (!container) return;

    // Gerar os próximos 5 dias a partir de hoje
    const datas = [];
    const hoje = new Date();
    for (let i = 0; i < 5; i++) {
      const d = new Date(hoje);
      d.setDate(hoje.getDate() + i);
      datas.push(d.toISOString().split('T')[0]);
    }

    // Montar Cabeçalho do Gantt
    let html = `
      <div class="gantt-header">
        <div><strong>Quarto</strong></div>
        ${datas.map(d => `<div><strong>${d.split('-').slice(1).reverse().join('/')}</strong></div>`).join('')}
      </div>
    `;

    // Montar Linhas por Quarto
    quartos.forEach(q => {
      html += `<div class="gantt-row"><div><strong>${q.nome}</strong></div>`;

      datas.forEach(dataStr => {
        // Verifica se há reserva correspondente a este quarto e data
        const reserva = reservas.find(r => 
          r.quarto_id === q.id && 
          dataStr >= r.data_checkin && 
          dataStr < r.data_checkout
        );

        if (reserva) {
          const statusClass = `status-${reserva.status.toLowerCase()}`;
          html += `<div class="status-block ${statusClass}" title="Cliente: ${reserva.cliente_nome}">${reserva.status}</div>`;
        } else {
          html += `<div class="status-block" style="background:#f8f9fa;">Livre</div>`;
        }
      });

      html += `</div>`;
    });

    container.innerHTML = html;

  } catch (err) {
    console.error('Erro ao montar Mapa de Ocupação Gantt:', err);
  }
}

/* ==========================================================================
   3. RELATÓRIOS E GRÁFICOS ANALÍTICOS (CHART.JS)
   ========================================================================== */

function inicializarGraficos() {
  const ctxOcupacao = document.getElementById('chart-ocupacao');
  const ctxFaturamento = document.getElementById('chart-faturamento');

  if (ctxOcupacao) {
    new Chart(ctxOcupacao, {
      type: 'doughnut',
      data: {
        labels: ['Ocupado', 'Confirmado', 'Livre', 'Manutenção'],
        datasets: [{
          data: [40, 25, 30, 5],
          backgroundColor: ['#3498db', '#2ecc71', '#ecf0f1', '#e74c3c']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: { display: true, text: 'Taxa de Ocupação Atual (%)' }
        }
      }
    });
  }

  if (ctxFaturamento) {
    new Chart(ctxFaturamento, {
      type: 'bar',
      data: {
        labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
        datasets: [{
          label: 'Faturamento (R$)',
          data: [1200, 1900, 3000, 2500, 4800, 6200, 4100],
          backgroundColor: '#8c6d58'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: { display: true, text: 'Faturamento Estimado na Semana' }
        }
      }
    });
  }
}

// Auxiliar para estilizar badges
function getBadgeClass(status) {
  switch ((status || '').toLowerCase()) {
    case 'limpo': return 'badge-limpo';
    case 'sujo': return 'badge-sujo';
    case 'manutencao': return 'badge-manutencao';
    default: return 'badge-limpo';
  }
}