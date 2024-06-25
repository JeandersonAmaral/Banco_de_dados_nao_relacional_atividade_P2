const clientId = Math.random().toString(36).substring(2, 15);
var ws = new WebSocket("ws://localhost:8000/ws");

ws.onmessage = function(event) {
    var messages = document.getElementById('messages');
    var message = document.createElement('li');
    message.classList.add('mensagem');
    var content = JSON.parse(event.data);
    if (content.clientId === clientId) {
        message.classList.add('enviada');
    } else {
        message.classList.add('recebida');
    }
    var messageText = document.createElement('span');
    messageText.classList.add('message-text');
    messageText.textContent = content.message;

    var messageTime = document.createElement('span');
    messageTime.classList.add('timestamp');

    // Ajuste para exibir a hora local correta (Brasília)
    var timestamp = new Date(content.timestamp);
    var timezoneOffset = timestamp.getTimezoneOffset() / 60; // Obtém o offset do fuso horário em horas
    timestamp.setHours(timestamp.getHours() - timezoneOffset - 3); // Ajusta para o fuso horário de Brasília (-3 horas)
    var hours = timestamp.getHours().toString().padStart(2, '0');
    var minutes = timestamp.getMinutes().toString().padStart(2, '0');
    messageTime.textContent = hours + ':' + minutes;

    message.appendChild(messageText);
    message.appendChild(messageTime);
    messages.appendChild(message);
    messages.scrollTop = messages.scrollHeight;
};

// Função para enviar mensagem
function sendMessage(event) {
    var input = document.getElementById("messageText");
    var content = {
        clientId: clientId,
        message: input.value,
        timestamp: new Date().toISOString()
    };
    ws.send(JSON.stringify(content));
    input.value = '';
    event.preventDefault();
}

// Função para limpar todas as mensagens
function clearMessages() {
    fetch('/messages', {
        method: 'DELETE'
    })
    .then(response => {
        if (response.ok) {
            alert('Todas as mensagens foram deletadas!');
            location.reload(); // Recarrega a página para refletir a exclusão das mensagens
        } else {
            alert('Erro ao limpar mensagens. Verifique o console para mais detalhes.');
        }
    })
    .catch(error => {
        console.error('Erro ao limpar mensagens:', error);
        alert('Erro ao limpar mensagens. Verifique o console para mais detalhes.');
    });
}
