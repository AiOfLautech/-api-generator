document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('config-form');
  const apiInfo = document.getElementById('api-info');
  const subscribeUrl = document.getElementById('subscribe-url');
  const sendUpdateUrl = document.getElementById('send-update-url');
  const testUrl = document.getElementById('test-url');
  const testApiButton = document.getElementById('test-api');
  const testResponse = document.getElementById('test-response');
  const processingMessages = document.getElementById('processing-messages');
  const emailTemplateTextarea = document.getElementById('email-template');

  if (emailTemplateTextarea) {
    const savedTemplate = localStorage.getItem('editedEmailTemplate');
    if (savedTemplate) {
      emailTemplateTextarea.value = savedTemplate;
    }
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      try {
        const response = await fetch('/api/generate-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (!response.ok) {
          throw new Error('Failed to generate API');
        }
        const result = await response.json();
        if (subscribeUrl) subscribeUrl.textContent = result.apiUrls.subscribe;
        if (sendUpdateUrl) sendUpdateUrl.textContent = result.apiUrls.sendUpdate;
        if (testUrl) testUrl.textContent = result.apiUrls.test;
        if (apiInfo) apiInfo.style.display = 'block';
        if (processingMessages) {
          processingMessages.innerHTML = result.info.map(msg => `<p>${msg}</p>`).join('');
        }
        if (testApiButton) {
          testApiButton.onclick = async () => {
            try {
              const testResponseData = await fetch(result.apiUrls.test);
              const testData = await testResponseData.json();
              if (testResponse) {
                testResponse.textContent = JSON.stringify(testData, null, 2);
              }
            } catch (error) {
              console.error('Error testing API:', error);
              if (testResponse) testResponse.textContent = 'Error testing API';
            }
          };
        }
      } catch (error) {
        console.error('Error generating API:', error);
        alert('Error generating API');
      }
    });
  }
});
