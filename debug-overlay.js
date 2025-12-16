// Visual Debug overlay - shows on page itself
(function() {
  // Wait for page to fully load
  setTimeout(() => {
    const viewportWidth = window.innerWidth;
    const docWidth = document.documentElement.scrollWidth;
    const bodyWidth = document.body.scrollWidth;
    
    const overflow = Math.max(docWidth, bodyWidth) - viewportWidth;
    
    // Create debug box
    const debugBox = document.createElement('div');
    debugBox.id = 'overflow-debug-box';
    debugBox.style.cssText = `
      position: fixed;
      bottom: 10px;
      left: 10px;
      background: rgba(0, 0, 0, 0.9);
      color: #0f0;
      font-family: monospace;
      font-size: 12px;
      padding: 10px;
      border: 2px solid #0f0;
      border-radius: 5px;
      z-index: 99999;
      max-width: 300px;
      max-height: 200px;
      overflow-y: auto;
      line-height: 1.4;
    `;
    
    let html = `<strong>📊 OVERFLOW DEBUG</strong><br>`;
    html += `Viewport: ${viewportWidth}px<br>`;
    html += `Doc Width: ${docWidth}px<br>`;
    html += `Body Width: ${bodyWidth}px<br>`;
    html += `Overflow: ${overflow}px<br>`;
    html += `<hr style="border: 1px solid #0f0; margin: 5px 0;">`;
    
    // Find overflowing elements
    const overflowingEls = [];
    document.querySelectorAll('*').forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.right > viewportWidth + 1) {
        overflowingEls.push({
          tag: el.tagName,
          class: el.className.split(' ')[0],
          id: el.id,
          width: Math.round(rect.width),
          overflow: Math.round(rect.right - viewportWidth)
        });
      }
    });
    
    // Sort by overflow amount
    overflowingEls.sort((a, b) => b.overflow - a.overflow);
    
    if (overflowingEls.length > 0) {
      html += `<strong style="color: #f00;">⚠️ CULPRITS (${overflowingEls.length}):</strong><br>`;
      overflowingEls.slice(0, 5).forEach((item, i) => {
        const selector = item.id ? `#${item.id}` : item.class ? `.${item.class}` : item.tag;
        html += `${i + 1}. ${selector}<br>`;
        html += `   └─ overflow: ${item.overflow}px<br>`;
      });
    } else {
      html += `<strong style="color: #0f0;">✅ NO OVERFLOW FOUND!</strong>`;
    }
    
    debugBox.innerHTML = html;
    document.body.appendChild(debugBox);
    
    // Log to console too
    console.log('=== OVERFLOW ANALYSIS ===');
    console.log(`Viewport: ${viewportWidth}px`);
    console.log(`Document: ${docWidth}px`);
    console.log(`Overflow: ${overflow}px`);
    console.log('Top culprits:');
    overflowingEls.slice(0, 5).forEach((item, i) => {
      console.log(`${i + 1}. ${item.id || item.class || item.tag}: ${item.overflow}px`);
    });
  }, 1000);
})();
