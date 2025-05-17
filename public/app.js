class DeobfuscatorApp {
  constructor() {
    this.chatMessages = document.querySelector('.chat-messages');
    this.initEventListeners();
    this.setupDragDrop();
  }

  initEventListeners() {
    document.getElementById('uploadBtn').addEventListener('click', () => 
      document.getElementById('fileInput').click());
    
    document.getElementById('fileInput').addEventListener('change', e => 
      this.handleFile(e.target.files[0]));
    
    document.getElementById('processBtn').addEventListener('click', () => 
      this.processCode());
    
    document.getElementById('confirmDownload').addEventListener('click', () => 
      this.downloadCode());
  }

  setupDragDrop() {
    document.body.addEventListener('dragover', e => e.preventDefault());
    document.body.addEventListener('drop', e => {
      e.preventDefault();
      this.handleFile(e.dataTransfer.files[0]);
    });
  }

  handleFile(file) {
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

    const loadingMsg = this.addMessage(
      '<div class="spinner-border text-primary"></div> Processing...', 
      'system'
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
        loadingMsg.innerHTML = this.createCodeBlock(data.result, data.metadata.detected_language);
        Prism.highlightAllUnder(loadingMsg);
        this.showDownloadModal(data.metadata.detected_language);
      }
    } catch (error) {
      this.addMessage(`Error: ${error.message}`, 'system');
    }
  }

  createCodeBlock(code, language) {
    return `
      <div class="code-block">
        <div class="code-header">
          <span>${language.toUpperCase()}</span>
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
}

new DeobfuscatorApp();