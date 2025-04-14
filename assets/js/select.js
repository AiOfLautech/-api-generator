function selectTemplate(templateFile) {
  localStorage.setItem('selectedTemplate', templateFile);
  window.location.href = 'editor.html';
}
