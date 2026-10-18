const API_URL = 'http://localhost:3000/api';
const TOKEN = localStorage.getItem('token');

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
  } catch (err) {
    console.error(err);
  }
}