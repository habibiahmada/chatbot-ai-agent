const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');
const imageInput = document.getElementById('image-input');
const audioInput = document.getElementById('audio-input');
const documentInput = document.getElementById('document-input');
const previewGroup = document.getElementById('preview-group');

function appendMessage(sender, text, file) {
  const row = document.createElement('div');
  row.classList.add('message-row', sender);

  const avatar = document.createElement('div');
  avatar.classList.add('avatar');
  avatar.textContent = sender === 'user' ? '👤' : '🤖';

  const bubble = document.createElement('div');
  bubble.classList.add('message-bubble');
  if (file) bubble.classList.add('file');

  // handle file preview in chat
  if (file) {
    if (file.type.startsWith('image/')) {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      bubble.appendChild(img);
    } else if (file.type.startsWith('audio/')) {
      const audio = document.createElement('audio');
      audio.src = URL.createObjectURL(file);
      audio.controls = true;
      bubble.appendChild(audio);
    } else if (file.type === 'application/pdf') {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(file);
      link.textContent = "📄 Open PDF";
      link.target = "_blank";
      link.classList.add('pdf-label');
      bubble.appendChild(link);
    }
  }

  if (text) {
    const label = document.createElement('div');
    label.textContent = text;
    bubble.appendChild(label);
  }

  if (sender === 'user') {
    row.appendChild(bubble);
    row.appendChild(avatar);
  } else {
    row.appendChild(avatar);
    row.appendChild(bubble);
  }

  chatBox.appendChild(row);
  chatBox.scrollTop = chatBox.scrollHeight;
  return bubble;
}

function showPreview(file) {
  previewGroup.innerHTML = '';
  previewGroup.style.display = 'flex';

  const wrapper = document.createElement('div');
  wrapper.classList.add('preview-item');

  if (file.type.startsWith('image/')) {
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    img.alt = 'Preview';
    wrapper.appendChild(img);
  } else if (file.type.startsWith('audio/')) {
    const audio = document.createElement('audio');
    audio.src = URL.createObjectURL(file);
    audio.controls = true;
    wrapper.appendChild(audio);
  } else if (file.type === 'application/pdf') {
    const span = document.createElement('span');
    span.textContent = '📄 PDF Selected';
    span.classList.add('pdf-label');
    wrapper.appendChild(span);
  }

  // tombol X untuk hapus
  const removeBtn = document.createElement('button');
  removeBtn.textContent = "×";
  removeBtn.title = "Remove file";
  removeBtn.onclick = () => {
    previewGroup.innerHTML = '';
    previewGroup.style.display = 'none';
    imageInput.value = '';
    audioInput.value = '';
    documentInput.value = '';
  };
  wrapper.appendChild(removeBtn);

  previewGroup.appendChild(wrapper);
}

// Event untuk preview file
imageInput.addEventListener('change', function () {
  const file = imageInput.files[0];
  if (file) showPreview(file);
  else previewGroup.style.display = 'none';
});
audioInput.addEventListener('change', function () {
  const file = audioInput.files[0];
  if (file) showPreview(file);
  else previewGroup.style.display = 'none';
});
documentInput.addEventListener('change', function () {
  const file = documentInput.files[0];
  if (file) showPreview(file);
  else previewGroup.style.display = 'none';
});

form.addEventListener('submit', async function (e) {
  e.preventDefault();

  const userMessage = input.value.trim();
  const imageFile = imageInput.files[0];
  const audioFile = audioInput.files[0];
  const documentFile = documentInput.files[0];

  if (!userMessage && !imageFile && !audioFile && !documentFile) return;

  // tampilkan pesan user beserta file jika ada
  appendMessage(
    'user',
    userMessage || (imageFile ? 'Describe image' : audioFile ? 'Transcribe audio' : 'Describe document'),
    imageFile || audioFile || documentFile
  );
  input.value = '';
  imageInput.value = '';
  audioInput.value = '';
  documentInput.value = '';
  previewGroup.innerHTML = '';
  previewGroup.style.display = 'none';

  // thinking indicator
  const botMessageElement = appendMessage('bot', '');
  botMessageElement.classList.add('thinking');
  botMessageElement.innerHTML = '<span></span><span></span><span></span>';
  chatBox.scrollTop = chatBox.scrollHeight;

  let endpoint = '/api/chat';
  let body;
  let headers = {};

  if (imageFile) {
    endpoint = '/api/image';
    body = new FormData();
    body.append('image', imageFile);
    body.append('prompt', userMessage || '');
  } else if (audioFile) {
    endpoint = '/api/audio';
    body = new FormData();
    body.append('audio', audioFile);
  } else if (documentFile) {
    endpoint = '/api/document';
    body = new FormData();
    body.append('document', documentFile);
  } else {
    body = JSON.stringify({
      messages: [{ role: 'user', content: userMessage }],
    });
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body,
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