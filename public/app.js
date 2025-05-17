class DeobfuscatorChat {
  constructor() {
    this.chatContainer = document.querySelector('.chat-messages');
    this.initEventListeners();
  }

  initEventListeners() {
    document.getElementById('uploadBtn').addEventListener('click', () => 
      document.getElementById('fileInput').click());
    
    document.getElementById('fileInput').addEventListener('change', e => 
      this.handleFileUpload(e));
    
    document.getElementById('processBtn').addEventListener('click', () => 
      this.processCode());
  }

  async handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      this.addMessage(e.target.result, 'user', file.name);
      document.getElementById('codeInput').value = e.target.result;
    };
    reader.readAsText(file);
  }

  async processCode() {
    const code = document.getElementById('codeInput').value.trim();
    if (!code) return;

    const loadingMsg = this.addMessage('<div class="spinner-border text-primary"></div> Decoding...', 'ai');
    
    try {
      const response = await fetch('/api/v1/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `Decode this obfuscated code:\n\n${code}`
          }]
        })
      });

      const data = await response.json();
      
      if (data.success) {
        loadingMsg.innerHTML = this.createCodeBlock(data.choices[0].message.content);
        Prism.highlightAllUnder(loadingMsg);
      }
    } catch (error) {
      this.addMessage(`Error: ${error.message}`, 'ai');
    }
  }

  createCodeBlock(code) {
    return `
      <div class="code-block">
        <pre><code class="language-javascript">${code}</code></pre>
        <button class="btn btn-sm btn-primary mt-2" onclick="this.parentElement.remove()">
          <i class="fas fa-times"></i> Close
        </button>
      </div>
    `;
  }

  addMessage(content, type) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${type}-message`;
    msgDiv.innerHTML = content;
    this.chatContainer.appendChild(msgDiv);
    this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    return msgDiv;
  }
}

new DeobfuscatorChat();