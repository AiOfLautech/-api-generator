document.getElementById("apiConfigForm").addEventListener("submit", async function(e) {
  e.preventDefault();
  const config = {
    mongoUrl: document.getElementById("mongoUrl").value.trim(),
    telegramToken: document.getElementById("telegramToken").value.trim(),
    telegramChatId: document.getElementById("telegramChatId").value.trim(),
    emailUser: document.getElementById("emailUser").value.trim(),
    emailPass: document.getElementById("emailPass").value.trim(),
    emailTemplate: document.getElementById("emailTemplate").value.trim()
  };

  try {
    const response = await fetch('/api/generate-config', {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config)
    });
    const result = await response.json();
    if (result.status === true) {
      document.getElementById("subscribeApiLink").textContent = result.subscribeApi;
      document.getElementById("subscribeApiLink").href = result.subscribeApi;
      document.getElementById("updateApiLink").textContent = result.updateApi;
      document.getElementById("updateApiLink").href = result.updateApi;
      document.getElementById("apiResult").classList.remove("hidden");
      showToast("API generated successfully!");
    } else {
      throw new Error("Failed to generate API configuration");
    }
  } catch (error) {
    showToast(`Error: ${error.message}`);
  }
});

document.getElementById("testApiBtn").addEventListener("click", async function() {
  try {
    // Use the sessionId from the configuration (if needed, extract from subscribeApi URL)
    const response = await fetch('/api/test');
    const result = await response.json();
    document.getElementById("testResult").textContent = JSON.stringify(result, null, 2);
  } catch (error) {
    showToast(`Test Error: ${error.message}`);
  }
});

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.style.display = "block";
  setTimeout(() => {
    toast.style.display = "none";
  }, 3000);
}
