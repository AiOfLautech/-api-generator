class DeobfuscatorApp {
  constructor() {
    this.initEventListeners();
    this.checkAPIStatus();
    this.currentFile = null;
  }

  initEventListeners() {
    document.getElementById('fileInput').addEventListener('change', e => this.handleFileUpload(e));
    document.querySelector('.upload-btn').addEventListener('click', () => document.getElementById('fileInput').click());
    document.getElementById('processBtn').addEventListener('click', () => this.processCode());
    document.getElementById('darkModeSwitch').addEventListener('change', e => this.toggleDarkMode(e));
    document.getElementById('confirmDownload').addEventListener('click', () => this.downloadCode());
  }

  async handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    this.currentFile = {
      name: file.name,
      type: file.type,
      size: file.size
    };

    const reader = new FileReader();
    reader.onload = e => {
      document.getElementById('codeInput').value = e.target.result;
      this.addMessage(e.target.result, 'user', file.name);
    };
    reader.readAsText(file);
  }

  async processCode() {
    const code = document.getElementById('codeInput').value.trim();
    if (!code) return;

    const loadingMsg = this.addMessage('Deobfuscating code<span class="loading-dots"></span>', 'ai');
    
    try {
      const response = await fetch('/api/v1/deobfuscate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          filename: this.currentFile?.name || ''
        })
      });

      const { success, code: resultCode, detectedLanguage } = await response.json();
      
      if (success) {
        loadingMsg.innerHTML = this.createCodeMessage(resultCode, detectedLanguage);
        Prism.highlightAllUnder(loadingMsg);
        this.showDownloadModal(detectedLanguage);
      }
    } catch (error) {
      this.addMessage(`Error: ${error.message}`, 'ai');
    }
  }

  createCodeMessage(code, language) {
    return `
      <div class="code-editor">
        <div class="d-flex justify-content-between mb-2">
          <span class="text-muted">${language.toUpperCase()}</span>
          <button class="btn btn-sm btn-outline-primary download-trigger">
            <i class="fas fa-download"></i>
          </button>
        </div>
        <pre><code class="language-${language}">${code}</code></pre>
      </div>
    `;
  }

  showDownloadModal(defaultType) {
    const typeSelect = document.getElementById('fileType');
    typeSelect.innerHTML = `
      <option value="${defaultType}">.${defaultType}</option>
      <option value="js">.js</option>
      <option value="html">.html</option>
      <option value="css">.css</option>
      <option value="txt">.txt</option>
    `;

    const modal = new bootstrap.Modal('#downloadModal');
    modal.show();
  }

  downloadCode() {
    const fileName = document.getElementById('fileName').value;
    const fileType = document.getElementById('fileType').value;
    const code = document.querySelector('.code-editor code').textContent;
    
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.${fileType}`;
    a.click();
    
    bootstrap.Modal.getInstance('#downloadModal').hide();
  }

  addMessage(content, type, filename) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${type}-message`;
    msgDiv.innerHTML = `
      <div class="avatar">${type === 'user' ? '👤' : '🤖'}</div>
      <div class="content p-3">
        ${filename ? `<div class="text-muted small mb-2">${filename}</div>` : ''}
        ${content}
      </div>
    `;

    document.querySelector('.chat-container').appendChild(msgDiv);
    return msgDiv.querySelector('.content');
  }

  toggleDarkMode(e) {
    document.body.classList.toggle('dark-mode');
    document.body.classList.toggle('light-mode');
  }

  async checkAPIStatus() {
    try {
      await fetch('/api/v1/deobfuscate', { method: 'OPTIONS' });
      document.getElementById('statusIndicator').className = 'badge bg-success';
    } catch {
      document.getElementById('statusIndicator').className = 'badge bg-danger';
    }
  }
}

// Initialize App
new DeobfuscatorApp();