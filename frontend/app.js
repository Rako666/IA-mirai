const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');


const conversationHistory = [];

//ici la fonction a adpaté au front end du site
function appendMessage(text, sender) {
  const msgDiv = document.createElement('div');
  msgDiv.classList.add('message', sender);
  msgDiv.textContent = text;
  chatBox.appendChild(msgDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = userInput.value.trim();
  if (!text) return;

  // Afficher le message utilisateur (modifier selon le frontend)
  appendMessage(text, 'user');
  userInput.value = '';

  conversationHistory.push({ role: 'user', parts: [{ text: text }] });

  try {
    // Appeler le serveur backend local a modifier quand on vas le déployer
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ history: conversationHistory })
    });

    const data = await response.json();
    if (data.reply) {
      //modifier le ai selon le frontend
      appendMessage(data.reply, 'ai');
      conversationHistory.push({ role: 'model', parts: [{ text: data.reply }] });
    } else {
      appendMessage('Erreur dans la réponse du serveur.', 'ai');
    }
  } catch (error) {
    console.error(error);
    appendMessage('Impossible de contacter le serveur backend.', 'ai');
  }
});