class InstagramChat {
    constructor() {
        this.socket = null;
        this.username = '';
        this.otherUser = '';
        this.isTyping = false;
        this.typingTimeout = null;

        this.initializeElements();
        this.setupEventListeners();
        this.showLoginModal();
    }

    initializeElements() {
        this.loginModal = document.getElementById('loginModal');
        this.usernameInput = document.getElementById('usernameInput');
        this.joinBtn = document.getElementById('joinBtn');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.messagesContainer = document.getElementById('messages');
        this.messagesWrapper = document.getElementById('messagesWrapper');
        this.otherUserName = document.getElementById('otherUserName');
        this.otherUserAvatar = document.getElementById('otherUserAvatar');
        this.userStatus = document.getElementById('userStatus');
    }

    setupEventListeners() {
        // Join chat
        this.joinBtn.addEventListener('click', () => this.joinChat());
        this.usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.joinChat();
        });

        // Send message
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Typing indicator
        this.messageInput.addEventListener('input', () => this.handleTyping());
        this.messageInput.addEventListener('blur', () => this.stopTyping());
    }

    showLoginModal() {
        this.loginModal.style.display = 'flex';
        this.usernameInput.focus();
    }

    hideLoginModal() {
        this.loginModal.style.display = 'none';
    }

    joinChat() {
        const username = this.usernameInput.value.trim();
        if (!username) {
            this.showNotification('Please enter your name');
            return;
        }

        this.username = username;
        this.hideLoginModal();
        this.connectToServer();
    }

    connectToServer() {
        this.socket = io();

        this.socket.emit('join', this.username);

        this.socket.on('userJoined', (data) => {
            this.handleUserJoined(data);
        });

        this.socket.on('userLeft', (data) => {
            this.handleUserLeft(data);
        });

        this.socket.on('message', (data) => {
            this.displayMessage(data);
        });

        this.socket.on('typing', (data) => {
            this.showTypingIndicator(data.username);
        });

        this.socket.on('stopTyping', (data) => {
            this.hideTypingIndicator();
        });

        this.socket.on('userList', (users) => {
            this.updateUserList(users);
        });

        this.socket.on('error', (error) => {
            this.showNotification(error.message);
        });

        this.socket.on('disconnect', () => {
            this.showNotification('Disconnected from server');
        });

        this.socket.on('connect', () => {
            this.showNotification('Connected to chat');
        });
    }

    handleUserJoined(data) {
        this.addStatusMessage(`${data.username} joined the chat`);
        this.updateUserStatus('Active now');
    }

    handleUserLeft(data) {
        this.addStatusMessage(`${data.username} left the chat`);
        this.updateUserStatus('Offline');
    }

    updateUserList(users) {
        const otherUsers = users.filter(user => user !== this.username);
        if (otherUsers.length > 0) {
            this.otherUser = otherUsers[0];
            this.otherUserName.textContent = this.otherUser;
            this.updateUserStatus('Active now');

            // Generate avatar color based on username
            const avatarColor = this.generateAvatarColor(this.otherUser);
            this.otherUserAvatar.src = `https://via.placeholder.com/40x40/${avatarColor}/ffffff?text=${this.otherUser.charAt(0).toUpperCase()}`;
        } else {
            this.otherUserName.textContent = 'Waiting for someone...';
            this.updateUserStatus('No one else here');
        }
    }

    generateAvatarColor(username) {
        const colors = ['E1306C', '833AB4', 'F77737', 'FCAF45', '405DE6', '5B51D8', 'C13584'];
        let hash = 0;
        for (let i = 0; i < username.length; i++) {
            hash = username.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    }

    updateUserStatus(status) {
        this.userStatus.textContent = status;
    }

    sendMessage() {
        const messageText = this.messageInput.value.trim();
        if (!messageText) return;

        const messageData = {
            username: this.username,
            message: messageText,
            timestamp: new Date().toISOString()
        };

        this.socket.emit('message', messageData);
        this.messageInput.value = '';
        this.stopTyping();
        this.adjustTextareaHeight();
    }

    displayMessage(data) {
        const messageElement = this.createMessageElement(data);
        this.messagesContainer.appendChild(messageElement);
        this.scrollToBottom();

        // Hide typing indicator if it exists
        this.hideTypingIndicator();
    }

    createMessageElement(data) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${data.username === this.username ? 'own' : 'other'}`;

        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';

        const messageBubble = document.createElement('div');
        messageBubble.className = 'message-bubble';
        messageBubble.textContent = data.message;

        const messageTime = document.createElement('div');
        messageTime.className = 'message-time';
        messageTime.textContent = this.formatTime(data.timestamp);

        messageContent.appendChild(messageBubble);
        messageContent.appendChild(messageTime);
        messageDiv.appendChild(messageContent);

        return messageDiv;
    }

    addStatusMessage(text) {
        const statusDiv = document.createElement('div');
        statusDiv.className = 'status-message';
        statusDiv.textContent = text;
        this.messagesContainer.appendChild(statusDiv);
        this.scrollToBottom();
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) { // Less than 1 minute
            return 'Just now';
        } else if (diff < 3600000) { // Less than 1 hour
            const minutes = Math.floor(diff / 60000);
            return `${minutes}m ago`;
        } else if (date.toDateString() === now.toDateString()) { // Same day
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    }

    handleTyping() {
        if (!this.isTyping) {
            this.isTyping = true;
            this.socket.emit('typing', { username: this.username });
        }

        clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => {
            this.stopTyping();
        }, 1000);

        this.adjustTextareaHeight();
    }

    stopTyping() {
        if (this.isTyping) {
            this.isTyping = false;
            this.socket.emit('stopTyping', { username: this.username });
        }
        clearTimeout(this.typingTimeout);
    }

    showTypingIndicator(username) {
        if (username === this.username) return;

        this.hideTypingIndicator(); // Remove existing indicator

        const typingDiv = document.createElement('div');
        typingDiv.className = 'message other typing-message';
        typingDiv.innerHTML = `
            <div class="message-content">
                <div class="typing-indicator">
                    <div class="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>
        `;

        this.messagesContainer.appendChild(typingDiv);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        const typingMessage = this.messagesContainer.querySelector('.typing-message');
        if (typingMessage) {
            typingMessage.remove();
        }
    }

    adjustTextareaHeight() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 100) + 'px';
    }

    scrollToBottom() {
        setTimeout(() => {
            this.messagesWrapper.scrollTop = this.messagesWrapper.scrollHeight;
        }, 100);
    }

    showNotification(message) {
        // Create or update connection status
        let statusElement = document.querySelector('.connection-status');
        if (!statusElement) {
            statusElement = document.createElement('div');
            statusElement.className = 'connection-status';
            document.body.appendChild(statusElement);
        }

        statusElement.textContent = message;
        statusElement.classList.add('show');

        setTimeout(() => {
            statusElement.classList.remove('show');
        }, 3000);
    }
}

// Initialize the chat when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new InstagramChat();
});