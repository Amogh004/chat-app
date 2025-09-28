document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('error-message');

    const response = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    if (response.ok) {
        const user = await response.json();
        // Redirect to the chat page, passing user info as query params
        window.location.href = `/?username=${user.username}&avatar=${encodeURIComponent(user.avatar_url)}`;
    } else {
        errorMessage.textContent = 'Invalid username or password';
    }
});