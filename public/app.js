document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    const messageInput = document.getElementById('message-input');
    const sendButton = document.querySelector('.send-button');
    const chatMessages = document.getElementById('chat-messages');
    const anonymousCheckbox = document.getElementById('anonymous-checkbox');
    const typingIndicator = document.getElementById('typing-indicator');

    const params = new URLSearchParams(window.location.search);
    const currentUser = params.get('username');
    const avatarUrl = params.get('avatar');

    if (!currentUser) {
        window.location.href = '/'; // Redirect to login if no user
        return;
    }

    document.querySelector('.user-icon img').src = avatarUrl;
    document.querySelector('.user-icon img').alt = currentUser;

    function appendMessage({ username, message, is_anonymous, timestamp, avatar_url }) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');

        const isSent = username === currentUser && !is_anonymous;
        messageElement.classList.add(isSent ? 'sent' : 'received');

        if (!isSent) {
            const avatarImg = document.createElement('img');
            avatarImg.src = is_anonymous ? 'https://i.pravatar.cc/40?u=anonymous' : avatar_url;
            avatarImg.classList.add('message-avatar');
            messageElement.appendChild(avatarImg);
        }

        const bubbleContainer = document.createElement('div');
        bubbleContainer.classList.add('bubble-container');
        const messageBubble = document.createElement('div');
        messageBubble.classList.add('message-bubble');
        const usernameElement = document.createElement('div');
        usernameElement.classList.add('username');
        usernameElement.textContent = is_anonymous ? 'Anonymous' : username;
        const messageText = document.createElement('div');
        messageText.textContent = message;
        const time = new Date(timestamp);
        const timestampElement = document.createElement('div');
        timestampElement.classList.add('timestamp');
        timestampElement.textContent = `${time.getHours()}:${String(time.getMinutes()).padStart(2, '0')}`;

        messageBubble.appendChild(usernameElement);
        messageBubble.appendChild(messageText);
        bubbleContainer.appendChild(messageBubble);
        bubbleContainer.appendChild(timestampElement);
        messageElement.appendChild(bubbleContainer);
        
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    sendButton.addEventListener('click', () => {
        const message = messageInput.value.trim();
        if (message) {
            const isAnonymous = anonymousCheckbox.checked;
            const messageData = {
                username: isAnonymous ? 'Anonymous' : currentUser,
                message,
                is_anonymous: isAnonymous,
                avatar_url: avatarUrl
            };
            socket.emit('send message', messageData);
            socket.emit('stop typing');
            messageInput.value = '';
        }
    });

    let typingTimer;
    const doneTypingInterval = 1000;

    messageInput.addEventListener('keyup', () => {
        clearTimeout(typingTimer);
        
        // This is the fix for the anonymous typing bug
        const isAnonymous = anonymousCheckbox.checked;
        const typingUsername = isAnonymous ? 'Anonymous' : currentUser;
        socket.emit('typing', { username: typingUsername });
        // ---
        
        typingTimer = setTimeout(() => {
            socket.emit('stop typing');
        }, doneTypingInterval);
    });
    
    socket.on('user typing', (data) => {
        typingIndicator.textContent = `${data.username} is typing...`;
    });

    socket.on('user stop typing', () => {
        typingIndicator.textContent = '';
    });

    socket.on('receive message', (data) => {
        typingIndicator.textContent = '';
        appendMessage(data);
    });

    socket.on('load all messages', (messages) => {
        messages.forEach(message => {
            appendMessage(message);
        });
    });
});