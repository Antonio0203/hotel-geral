const API_URL = 'http://localhost:3000/api';

async function buscarQuartos() {
  const checkin = document.getElementById('checkin').value;
  const checkout = document.getElementById('checkout').value;
  const adultos = document.getElementById('adultos').value;
  const criancas = document.getElementById('criancas').value;

  const res = await fetch(`${API_URL}/quartos?checkin=${checkin}&checkout=${checkout}&adultos=${adultos}&criancas=${criancas}`);
  const quartos = await res.json();

  const container = document.getElementById('grid-quartos');
  container.innerHTML = '';

  quartos.forEach(q => {
    const imgUrl = q.imagens.length > 0 ? `http://localhost:3000${q.imagens[0]}` : 'https://via.placeholder.com/300x200';
    container.innerHTML += `
      <div class="card-quarto">
        <img src="${imgUrl}" alt="${q.nome}">
        <div class="card-body">
          <h3>${q.nome}</h3>
          <p>${q.descricao ? q.descricao.substring(0, 80) : ''}...</p>
          <p>★ ${q.media_estrelas} / 5.0</p>
          <p class="price">R$ ${parseFloat(q.preco_diaria).toFixed(2)} / noite</p>
          <div class="btn-group">
            <button class="btn-detalhes" onclick="abrirDetalhes(${q.id})">VER DETALHES</button>
            <button class="btn-selecionar" onclick="iniciarReserva(${q.id})">SELECIONAR</button>
          </div>
        </div>
      </div>
    `;
  });
}

document.addEventListener('DOMContentLoaded', buscarQuartos);