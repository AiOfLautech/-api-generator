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
    // Show processing status
    showToast("Processing: Connecting to MongoDB and generating API...");
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
      document.getElementById("testApiLink").textContent = result.testApi;
      document.getElementById("testApiLink").href = result.testApi;
      document.getElementById("apiResult").classList.remove("hidden");
      showToast(result.info); // Show info message from backend (e.g., connected to MongoDB)
    } else {
      throw new Error("Failed to generate API configuration");
    }
  } catch (error) {
    showToast(`Error: ${error.message}`);
  }
});

document.getElementById("testApiBtn").addEventListener("click", async function() {
  try {
    const response = await fetch(document.getElementById("testApiLink").href);
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
