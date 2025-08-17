const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');

function appendMessage(sender, text) {
  const msgWrapper = document.createElement('div');
  msgWrapper.classList.add('d-flex', 'mb-2', 'w-100');

  const msg = document.createElement('div');
  msg.classList.add('message', sender);

  if (sender === 'user') {
    msgWrapper.classList.add('justify-content-end');
  } else {
    msgWrapper.classList.add('justify-content-start');
  }

  msg.textContent = text;
  msgWrapper.appendChild(msg);
  chatBox.appendChild(msgWrapper);
  chatBox.scrollTop = chatBox.scrollHeight;

  return msg;
}

form.addEventListener('submit', async function (e) {
  e.preventDefault();

  const userMessage = input.value.trim();
  if (!userMessage) return;

  appendMessage('user', userMessage);
  input.value = '';

  // Create and show the thinking indicator
  const botMessageElement = appendMessage('bot', '');
  botMessageElement.classList.add('thinking');
  botMessageElement.innerHTML = '<span></span><span></span><span></span>';
  chatBox.scrollTop = chatBox.scrollHeight;

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!response.ok) {
      botMessageElement.classList.remove('thinking');
      botMessageElement.innerHTML = '';
      botMessageElement.textContent = '⚠ Failed to get response from server.';
      return;
    }

    const data = await response.json();
    botMessageElement.classList.remove('thinking');
    botMessageElement.innerHTML = '';
    botMessageElement.textContent = data.result || 'Sorry, no response received.';
  } catch (error) {
    console.error('Error fetching chat response:', error);
    botMessageElement.classList.remove('thinking');
    botMessageElement.innerHTML = '';
    botMessageElement.textContent = '⚠ Connection error.';
  } finally {
    chatBox.scrollTop = chatBox.scrollHeight;
  }
});