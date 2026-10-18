async function abrirDetalhes(quartoId) {
  const modal = document.getElementById('modal-detalhes');
  const body = document.getElementById('modal-detalhes-body');
  
  body.innerHTML = '<p>Carregando detalhes...</p>';
  modal.style.display = 'flex';

  // Busca detalhes específicos do quarto
  const res = await fetch(`${API_URL}/quartos`);
  const quartos = await res.json();
  const q = quartos.find(item => item.id === quartoId);

  body.innerHTML = `
    <h2>${q.nome}</h2>
    <p style="margin: 10px 0;"><strong>Categoria:</strong> ${q.categoria}</p>
    <p>${q.descricao}</p>
    <h4 style="margin-top: 15px;">Comodidades:</h4>
    <ul>${(q.comodidades_json || []).map(c => `<li>${c}</li>`).join('')}</ul>
    <p class="price" style="margin-top: 15px;">R$ ${parseFloat(q.preco_diaria).toFixed(2)} / noite</p>
  `;
}

async function iniciarReserva(quartoId) {
  // Trava temporária de 15 minutos
  await fetch(`${API_URL}/quartos/${quartoId}/travar`, { method: 'POST' });
  alert('Quarto reservado temporariamente por 15 minutos! Preencha seus dados para concluir.');
}

function fecharModal(id) {
  document.getElementById(id).style.display = 'none';
}