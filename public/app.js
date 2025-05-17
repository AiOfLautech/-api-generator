class DeobfuscatorApp {
  constructor() {
    this.chatMessages = document.querySelector('.chat-messages');
    this.initEventListeners();
    this.checkAPIStatus();
    this.setupDragDrop();
  }

  initEventListeners() {
    document.getElementById('uploadBtn').addEventListener('click', () => 
      document.getElementById('fileInput').click());
    
    document.getElementById('fileInput').addEventListener('change', e => 
      this.handleFiles(e.target.files));
    
    document.getElementById('processBtn').addEventListener('click', () => 
      this.processCode());
    
    document.getElementById('confirmDownload').addEventListener('click', () => 
      this.downloadCode());
  }

  setupDragDrop() {
    const dropZone = document.body;
    
    dropZone.addEventListener('dragover', e => {
      e.preventDefault();
      dropZone.style.backgroundColor = 'rgba(0, 255, 204, 0.1)';
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.style.backgroundColor = '';
    });

    dropZone.addEventListener('drop', e => {
      e.preventDefault();
      dropZone.style.backgroundColor = '';
      this.handleFiles(e.dataTransfer.files);
    });
  }

  async handleFiles(files) {
    for (const file of files) {
      const reader = new FileReader();
      reader.onload = e => {
        this.addMessage(e.target.result, 'user', file.name);
        document.getElementById('codeInput').value = e.target.result;
      };
      reader.readAsText(file);
    }
  }

  async processCode() {
    const code = document.getElementById('codeInput').value.trim();
    if (!code) return;

    const loadingMsg = this.addMessage(
      '<div class="spinner-border text-primary"></div> Processing...', 
      'assistant'
    );

    try {
      const response = await fetch('/api/v1/deobfuscate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          filename: document.getElementById('fileInput').files[0]?.name || ''
        })
      });

      const data = await response.json();
      
      if (data.success) {
        loadingMsg.innerHTML = this.createCodeBlock(data.result, data.detected_language);
        Prism.highlightAllUnder(loadingMsg);
        this.showDownloadModal(data.detected_language);
      }
    } catch (error) {
      this.addMessage(`Error: ${error.message}`, 'assistant');
    }
  }

  createCodeBlock(code, language) {
    return `
      <div class="code-block">
        <div class="code-header">
          <span class="code-language">${language.toUpperCase()}</span>
          <button class="btn btn-sm btn-primary" data-bs-toggle="modal" 
                  data-bs-target="#downloadModal">
            <i class="fas fa-download"></i>
          </button>
        </div>
        <pre><code class="language-${language}">${code}</code></pre>
      </div>
    `;
  }

  showDownloadModal(language) {
    const typeSelect = document.getElementById('fileType');
    typeSelect.innerHTML = `
      <option value="${language}">.${language}</option>
      <option value="js">.js</option>
      <option value="py">.py</option>
      <option value="html">.html</option>
      <option value="css">.css</option>
      <option value="txt">.txt</option>
    `;
    new bootstrap.Modal('#downloadModal').show();
  }

  downloadCode() {
    const fileName = document.getElementById('fileName').value;
    const fileType = document.getElementById('fileType').value;
    const code = document.querySelector('.code-block code').textContent;
    
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.${fileType}`;
    a.click();
  }

  addMessage(content, type, filename) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${type}`;
    msgDiv.innerHTML = `
      ${filename ? `<div class="text-muted small mb-2">${filename}</div>` : ''}
      ${content}
    `;
    
    this.chatMessages.appendChild(msgDiv);
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    return msgDiv;
  }

  async checkAPIStatus() {
    try {
      const response = await fetch('/api/v1/status');
      const data = await response.json();
      document.getElementById('apiStatus').textContent = data.status;
    } catch (error) {
      document.getElementById('apiStatus').className = 'badge bg-danger';
      document.getElementById('apiStatus').textContent = 'API Offline';
    }
  }
}

new DeobfuscatorApp();