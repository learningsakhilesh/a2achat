class AuthManager {
    constructor() {
        this.currentUser = null;
        this.users = JSON.parse(localStorage.getItem('a2achat_users') || '[]');
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Form submissions
        document.getElementById('loginFormElement').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        document.getElementById('signupFormElement').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSignup();
        });

        // Social login buttons
        document.querySelector('.social-btn.google').addEventListener('click', () => {
            this.handleSocialLogin('google');
        });

        document.querySelector('.social-btn.github').addEventListener('click', () => {
            this.handleSocialLogin('github');
        });

        // Password validation for signup
        document.getElementById('signupPassword').addEventListener('input', () => {
            this.validatePassword();
        });

        document.getElementById('confirmPassword').addEventListener('input', () => {
            this.validatePasswordMatch();
        });

        // Username availability check
        document.getElementById('signupUsername').addEventListener('input', () => {
            this.checkUsernameAvailability();
        });
    }

    showLogin() {
        document.getElementById('loginForm').classList.remove('hidden');
        document.getElementById('signupForm').classList.add('hidden');
    }

    showSignup() {
        document.getElementById('signupForm').classList.remove('hidden');
        document.getElementById('loginForm').classList.add('hidden');
    }

    async handleLogin() {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) {
            this.showError('Please fill in all fields');
            return;
        }

        this.showLoading('Signing you in...');

        // Simulate API call
        setTimeout(() => {
            const user = this.users.find(u => u.email === email && u.password === password);

            if (user) {
                this.currentUser = user;
                localStorage.setItem('a2achat_currentUser', JSON.stringify(user));
                this.redirectToChat();
            } else {
                this.hideLoading();
                this.showError('Invalid email or password');
            }
        }, 1500);
    }

    async handleSignup() {
        const fullName = document.getElementById('signupFullName').value.trim();
        const email = document.getElementById('signupEmail').value.trim();
        const username = document.getElementById('signupUsername').value.trim();
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const agreeTerms = document.getElementById('agreeTerms').checked;

        // Validation
        if (!fullName || !email || !username || !password || !confirmPassword) {
            this.showError('Please fill in all fields');
            return;
        }

        if (!agreeTerms) {
            this.showError('Please agree to the terms and privacy policy');
            return;
        }

        if (password !== confirmPassword) {
            this.showError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            this.showError('Password must be at least 6 characters long');
            return;
        }

        if (!this.isValidEmail(email)) {
            this.showError('Please enter a valid email address');
            return;
        }

        // Check if user already exists
        if (this.users.find(u => u.email === email)) {
            this.showError('An account with this email already exists');
            return;
        }

        if (this.users.find(u => u.username === username)) {
            this.showError('This username is already taken');
            return;
        }

        this.showLoading('Creating your account...');

        // Simulate API call
        setTimeout(() => {
            const newUser = {
                id: Date.now().toString(),
                fullName,
                email,
                username,
                password, // In real app, this would be hashed
                avatar: this.generateAvatar(username),
                createdAt: new Date().toISOString()
            };

            this.users.push(newUser);
            localStorage.setItem('a2achat_users', JSON.stringify(this.users));

            this.currentUser = newUser;
            localStorage.setItem('a2achat_currentUser', JSON.stringify(newUser));

            this.redirectToChat();
        }, 2000);
    }

    handleSocialLogin(provider) {
        this.showLoading(`Connecting with ${provider.charAt(0).toUpperCase() + provider.slice(1)}...`);

        // Simulate social login
        setTimeout(() => {
            const socialUser = {
                id: Date.now().toString(),
                fullName: `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
                email: `user@${provider}.com`,
                username: `${provider}_user_${Date.now()}`,
                avatar: this.generateAvatar(`${provider}_user`),
                provider: provider,
                createdAt: new Date().toISOString()
            };

            this.currentUser = socialUser;
            localStorage.setItem('a2achat_currentUser', JSON.stringify(socialUser));

            this.redirectToChat();
        }, 2000);
    }

    validatePassword() {
        const password = document.getElementById('signupPassword').value;
        const passwordInput = document.getElementById('signupPassword');

        if (password.length < 6) {
            passwordInput.style.borderColor = '#e74c3c';
        } else {
            passwordInput.style.borderColor = '#27ae60';
        }
    }

    validatePasswordMatch() {
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const confirmInput = document.getElementById('confirmPassword');

        if (confirmPassword && password !== confirmPassword) {
            confirmInput.style.borderColor = '#e74c3c';
        } else if (confirmPassword) {
            confirmInput.style.borderColor = '#27ae60';
        }
    }

    checkUsernameAvailability() {
        const username = document.getElementById('signupUsername').value.trim();
        const usernameInput = document.getElementById('signupUsername');

        if (username.length < 3) {
            usernameInput.style.borderColor = '#e74c3c';
            return;
        }

        const exists = this.users.find(u => u.username === username);
        if (exists) {
            usernameInput.style.borderColor = '#e74c3c';
        } else {
            usernameInput.style.borderColor = '#27ae60';
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    generateAvatar(username) {
        const colors = ['E1306C', '833AB4', 'F77737', 'FCAF45', '405DE6', '5B51D8', 'C13584'];
        let hash = 0;
        for (let i = 0; i < username.length; i++) {
            hash = username.charCodeAt(i) + ((hash << 5) - hash);
        }
        const color = colors[Math.abs(hash) % colors.length];
        return `https://via.placeholder.com/40x40/${color}/ffffff?text=${username.charAt(0).toUpperCase()}`;
    }

    showLoading(message) {
        const overlay = document.getElementById('loadingOverlay');
        const messageElement = overlay.querySelector('p');
        messageElement.textContent = message;
        overlay.classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loadingOverlay').classList.add('hidden');
    }

    showError(message) {
        // Create or update error message
        let errorDiv = document.querySelector('.error-message');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.style.cssText = `
                background: #fee;
                color: #c33;
                padding: 1rem;
                border-radius: 8px;
                margin-bottom: 1rem;
                border: 1px solid #fcc;
                text-align: center;
                animation: fadeIn 0.3s ease;
            `;

            const activeForm = document.querySelector('.auth-form:not(.hidden)');
            activeForm.insertBefore(errorDiv, activeForm.firstChild);
        }

        errorDiv.textContent = message;

        // Remove error after 5 seconds
        setTimeout(() => {
            if (errorDiv) {
                errorDiv.remove();
            }
        }, 5000);
    }

    redirectToChat() {
        this.hideLoading();

        // Show success message
        this.showLoading('Welcome! Redirecting to chat...');

        setTimeout(() => {
            window.location.href = '/chat';
        }, 1500);
    }
}

// Utility functions
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = input.parentNode.querySelector('.toggle-password');

    if (input.type === 'password') {
        input.type = 'text';
        button.textContent = '🙈';
    } else {
        input.type = 'password';
        button.textContent = '👁️';
    }
}

function showLogin() {
    authManager.showLogin();
}

function showSignup() {
    authManager.showSignup();
}

// Initialize auth manager when page loads
let authManager;
document.addEventListener('DOMContentLoaded', () => {
    authManager = new AuthManager();

    // Check if user is already logged in
    const currentUser = localStorage.getItem('a2achat_currentUser');
    if (currentUser) {
        window.location.href = 'index.html';
    }
});

// Add CSS for fadeIn animation
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;
document.head.appendChild(style);