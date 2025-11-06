// MathJax Configuration for Enhanced Documentation
window.MathJax = {
  tex: {
    inlineMath: [["\\(", "\\)"]],
    displayMath: [["\\[", "\\]"]],
    processEscapes: true,
    processEnvironments: true
  },
  options: {
    ignoreHtmlClass: ".*|",
    processHtmlClass: "arithmatex"
  }
};

document$.subscribe(() => {
  MathJax.typesetPromise()
})

// Enhanced Code Block Functionality
document.addEventListener('DOMContentLoaded', function() {
  // Add copy buttons to code blocks
  const codeBlocks = document.querySelectorAll('pre code');
  
  codeBlocks.forEach(function(codeBlock) {
    const pre = codeBlock.parentElement;
    const button = document.createElement('button');
    button.className = 'copy-button';
    button.textContent = 'Copy';
    button.setAttribute('aria-label', 'Copy code to clipboard');
    
    button.addEventListener('click', function() {
      navigator.clipboard.writeText(codeBlock.textContent).then(function() {
        button.textContent = 'Copied!';
        setTimeout(function() {
          button.textContent = 'Copy';
        }, 2000);
      });
    });
    
    pre.appendChild(button);
  });
  
  // Add language labels to code blocks
  const preElements = document.querySelectorAll('pre code[class*="language-"]');
  preElements.forEach(function(code) {
    const className = code.className;
    const language = className.match(/language-(\w+)/);
    if (language) {
      code.setAttribute('data-lang', language[1].toUpperCase());
    }
  });
  
  // Enhanced table responsiveness
  const tables = document.querySelectorAll('table');
  tables.forEach(function(table) {
    const wrapper = document.createElement('div');
    wrapper.className = 'table-wrapper';
    table.parentNode.insertBefore(wrapper, table);
    wrapper.appendChild(table);
  });
});