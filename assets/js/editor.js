document.addEventListener('DOMContentLoaded', async () => {
  const codeCanvas = document.getElementById('code-canvas');
  const embedSocialButton = document.getElementById('embed-social');
  const saveTemplateButton = document.getElementById('save-template');

  if (codeCanvas) {
    const selectedTemplate = localStorage.getItem('selectedTemplate');
    if (selectedTemplate) {
      try {
        const response = await fetch(`templates/${selectedTemplate}`);
        if (!response.ok) {
          throw new Error('Failed to load template');
        }
        const templateHtml = await response.text();
        codeCanvas.innerHTML = templateHtml;
      } catch (error) {
        console.error('Error loading template:', error);
        alert('Error loading template');
      }
    }
  }

  if (embedSocialButton) {
    embedSocialButton.addEventListener('click', () => {
      if (codeCanvas) {
        const socialHtml = `
          <div>
            <a href="https://facebook.com">Facebook</a>
            <a href="https://twitter.com">Twitter</a>
            <a href="https://instagram.com">Instagram</a>
          </div>
        `;
        codeCanvas.innerHTML += socialHtml;
      }
    });
  }

  if (saveTemplateButton) {
    saveTemplateButton.addEventListener('click', () => {
      if (codeCanvas) {
        const editedTemplate = codeCanvas.innerHTML;
        localStorage.setItem('editedEmailTemplate', editedTemplate);
        alert('Template saved');
        window.location.href = 'index.html';
      }
    });
  }
});
