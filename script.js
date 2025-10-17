class ClaraChat {
    constructor() {
        this.apiUrl = 'http://localhost:3000/consulta';
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Enviar mensagem ao clicar no botão
        this.sendButton.addEventListener('click', () => this.sendMessage());
        
        // Enviar mensagem ao pressionar Enter
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Focar no input quando a página carrega
        this.messageInput.focus();
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        
        if (!message) return;

        // Adicionar mensagem do usuário
        this.addUserMessage(message);
        
        // Limpar input e desabilitar botão
        this.messageInput.value = '';
        this.setSendButtonState(false);
        
        // Mostrar indicador de digitação
        this.showTypingIndicator();
        
        try {
            // Fazer requisição para a API
            const response = await this.callAPI(message);
            
            // Remover indicador de digitação
            this.hideTypingIndicator();
            
            // Adicionar resposta da Clara
            this.addClaraMessage(response);
            
        } catch (error) {
            console.error('Erro ao chamar API:', error);
            this.hideTypingIndicator();
            this.addClaraMessage({
                titulo: "Erro",
                resumo: "Desculpe, ocorreu um erro ao processar sua pergunta. Tente novamente.",
                recomendacao: "Verifique sua conexão e tente novamente."
            });
        } finally {
            this.setSendButtonState(true);
            this.messageInput.focus();
        }
    }

    async callAPI(message) {
        const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                perguntaUsuario: message
            })
        });

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        return await response.json();
    }

    addUserMessage(message) {
        const messageElement = this.createMessageElement('user', message);
        this.chatMessages.appendChild(messageElement);
        this.scrollToBottom();
    }

    addClaraMessage(response) {
        // Criar mensagem formatada com a resposta da API
        const formattedMessage = this.formatClaraResponse(response);
        const messageElement = this.createMessageElement('clara', formattedMessage);
        this.chatMessages.appendChild(messageElement);
        this.scrollToBottom();
    }

    formatClaraResponse(response) {
        let formatted = '';
        
        if (response.titulo) {
            formatted += `<strong>📋 ${response.titulo}</strong><br><br>`;
        }
        
        if (response.resumo) {
            formatted += `<strong>📝 Resumo:</strong><br>${response.resumo}<br><br>`;
        }
        
        if (response.recomendacao) {
            formatted += `<strong>💡 Recomendação:</strong><br>${response.recomendacao}`;
        }
        
        return formatted || 'Desculpe, não consegui processar sua pergunta.';
    }

    createMessageElement(type, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = type === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        bubble.innerHTML = content;
        
        const time = document.createElement('div');
        time.className = 'message-time';
        time.textContent = this.getCurrentTime();
        
        messageContent.appendChild(bubble);
        messageContent.appendChild(time);
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        
        return messageDiv;
    }

    showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message clara-message typing-message';
        typingDiv.id = 'typingIndicator';
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = '<i class="fas fa-robot"></i>';
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'typing-indicator';
        typingIndicator.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;
        
        messageContent.appendChild(typingIndicator);
        typingDiv.appendChild(avatar);
        typingDiv.appendChild(messageContent);
        
        this.chatMessages.appendChild(typingDiv);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    setSendButtonState(enabled) {
        this.sendButton.disabled = !enabled;
        this.sendButton.style.opacity = enabled ? '1' : '0.5';
    }

    getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    scrollToBottom() {
        setTimeout(() => {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }, 100);
    }

    showLoading() {
        this.loadingOverlay.classList.add('show');
    }

    hideLoading() {
        this.loadingOverlay.classList.remove('show');
    }
}

// Inicializar o chat quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    new ClaraChat();
});

// Adicionar algumas animações e melhorias visuais
document.addEventListener('DOMContentLoaded', () => {
    // Animação de entrada suave
    document.body.style.opacity = '0';
    document.body.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        document.body.style.transition = 'all 0.6s ease-out';
        document.body.style.opacity = '1';
        document.body.style.transform = 'translateY(0)';
    }, 100);

    // Adicionar efeito de hover nos botões
    const sendButton = document.getElementById('sendButton');
    sendButton.addEventListener('mouseenter', () => {
        if (!sendButton.disabled) {
            sendButton.style.transform = 'translateY(-2px) scale(1.05)';
        }
    });
    
    sendButton.addEventListener('mouseleave', () => {
        sendButton.style.transform = 'translateY(0) scale(1)';
    });

    // Adicionar efeito de foco no input
    const messageInput = document.getElementById('messageInput');
    messageInput.addEventListener('focus', () => {
        messageInput.parentElement.style.borderColor = '#667eea';
        messageInput.parentElement.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
    });
    
    messageInput.addEventListener('blur', () => {
        messageInput.parentElement.style.borderColor = '#e2e8f0';
        messageInput.parentElement.style.boxShadow = 'none';
    });
});
