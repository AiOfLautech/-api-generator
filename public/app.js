class DeobfuscatorApp {
  constructor() {
    this.chatMessages = document.getElementById('chatMessages');
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

  async handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const content = await this.readFile(file);
      this.addMessage(content, 'user', file.name);
      document.getElementById('codeInput').value = content;
    } catch (error) {
      this.showError(`File error: ${error.message}`);
    }
  }

  readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = e => reject(new Error('File reading failed'));
      reader.readAsText(file);
    });
  }

  async processCode() {
    const code = document.getElementById('codeInput').value.trim();
    if (!code) return this.showError('Please input code to process');

    const loadingId = this.addMessage(
      '<div class="spinner-border text-primary"></div> Analyzing code...', 
      'ai'
    );

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
      
      if (!response.ok) throw new Error(data.error || 'API request failed');
      
      this.updateMessage(loadingId, this.createCodeBlock(data.result));
      Prism.highlightAll();
    } catch (error) {
      this.updateMessage(loadingId, `Error: ${error.message}`);
    }
  }

  createCodeBlock(code) {
    return `
      <div class="code-block">
        <pre><code class="language-javascript">${code}</code></pre>
        <button class="btn btn-sm btn-primary mt-2" onclick="navigator.clipboard.writeText(this.previousElementSibling.textContent)">
          <i class="fas fa-copy"></i> Copy
        </button>
      </div>
    `;
  }

  addMessage(content, type) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${type}-message`;
    msgDiv.innerHTML = content;
    this.chatMessages.appendChild(msgDiv);
    msgDiv.scrollIntoView({ behavior: 'smooth' });
    return msgDiv.id = Date.now();
  }

  updateMessage(id, newContent) {
    const message = document.getElementById(id);
    if (message) message.innerHTML = newContent;
  }

  showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger';
    errorDiv.textContent = message;
    this.chatMessages.appendChild(errorDiv);
    errorDiv.scrollIntoView({ behavior: 'smooth' });
  }
}

new DeobfuscatorApp();