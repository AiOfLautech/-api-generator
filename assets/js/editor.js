// When the editor loads, retrieve the selected template and load its content
document.addEventListener("DOMContentLoaded", async () => {
  const template = localStorage.getItem("selectedTemplate");
  const codeCanvas = document.getElementById("codeCanvas");
  if (template) {
    try {
      const response = await fetch("templates/" + template);
      const templateHTML = await response.text();
      // Set the content of the code canvas for editing (plain text)
      codeCanvas.innerText = templateHTML;
    } catch (error) {
      alert("Error loading template: " + error.message);
    }
  } else {
    alert("No template selected. Redirecting to template selection page.");
    window.location.href = "select.html";
  }
});

// Function to embed social media links into the template
function embedSocialLinks() {
  const codeCanvas = document.getElementById("codeCanvas");
  let htmlContent = codeCanvas.textContent;
  
  const socialMarkup = `
<!-- Social Links Section -->
<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="20">
  <tr>
    <td align="center" style="padding: 20px 0;">
      <a href="[FACEBOOK_URL]" style="color: #ffffff; text-decoration: none; margin: 0 10px;">Facebook</a> | 
      <a href="[TWITTER_URL]" style="color: #ffffff; text-decoration: none; margin: 0 10px;">Twitter</a> | 
      <a href="[INSTAGRAM_URL]" style="color: #ffffff; text-decoration: none; margin: 0 10px;">Instagram</a>
    </td>
  </tr>
</table>`;
  
  if (/<\/body>/i.test(htmlContent)) {
    htmlContent = htmlContent.replace(/<\/body>/i, socialMarkup + '\n</body>');
  } else {
    htmlContent += socialMarkup;
  }
  
  codeCanvas.textContent = htmlContent;
  applySyntaxHighlighting();
  updateLineNumbers();
}


// Save the edited template so that it can be reused in the API configuration
function saveTemplate() {
  const codeCanvas = document.getElementById("codeCanvas");
  const editedHTML = codeCanvas.innerText;
  // Save in localStorage (or send to backend for persistent storage)
  localStorage.setItem("editedEmailTemplate", editedHTML);
  alert("Template saved successfully!");
  // Optionally, redirect back to the main API configuration page
  window.location.href = "index.html";
}