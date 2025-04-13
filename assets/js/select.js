function selectTemplate(templateName) {
  localStorage.setItem("selectedTemplate", templateName);
  window.location.href = "editor.html";
}