document.getElementById('signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('error-message');

    // For simplicity, we'll assign a random avatar on signup
    const avatar_url = `https://i.pravatar.cc/40?u=${username}`;

    const response = await fetch('/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, avatar_url })
    });

    if (response.ok) {
        // Redirect to login page on successful signup
        window.location.href = '/';
    } else {
        const errorData = await response.json();
        errorMessage.textContent = errorData.message || 'Signup failed';
    }
});