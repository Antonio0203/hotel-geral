const API_URL = 'http://localhost:3000/api';

document.getElementById('form-login').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const senha = document.getElementById('senha').value;
  const errorElement = document.getElementById('login-error');

  errorElement.style.display = 'none';

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, senha })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Falha na autenticação.');
    }

    // Salva o Token JWT e dados do usuário no localStorage
    localStorage.setItem('token', data.token);
    localStorage.setItem('usuario', JSON.stringify(data.usuario));

    // Redireciona para a página principal do Dashboard
    window.location.href = 'index.html';

  } catch (error) {
    errorElement.textContent = error.message;
    errorElement.style.display = 'block';
  }
});