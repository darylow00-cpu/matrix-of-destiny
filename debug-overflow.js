// Debug script to find overflow elements
(function() {
  console.log('=== OVERFLOW DEBUG START ===');
  console.log('Window width:', window.innerWidth);
  console.log('Document width:', document.documentElement.scrollWidth);
  console.log('Body width:', document.body.scrollWidth);
  
  const viewportWidth = window.innerWidth;
  const overflowElements = [];
  
  // Check all elements
  const allElements = document.querySelectorAll('*');
  
  allElements.forEach((el, index) => {
    const rect = el.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(el);
    
    // Check if element extends beyond viewport
    if (rect.right > viewportWidth + 1 || rect.left < -1) {
      const overflow = {
        element: el.tagName,
        className: el.className,
        id: el.id,
        width: rect.width,
        left: rect.left,
        right: rect.right,
        overflowAmount: Math.max(0, rect.right - viewportWidth),
        position: computedStyle.position,
        overflow: computedStyle.overflow,
        overflowX: computedStyle.overflowX,
      };
      
      if (overflow.overflowAmount > 5) { // Only show significant overflows
        overflowElements.push(overflow);
        console.error(`⚠️ OVERFLOW: ${el.tagName}.${el.className}#${el.id}`, overflow);
      }
    }
  });
  
  // Sort by overflow amount
  overflowElements.sort((a, b) => b.overflowAmount - a.overflowAmount);
  
  console.log('\n=== TOP OVERFLOW CULPRITS ===');
  overflowElements.slice(0, 10).forEach((item, i) => {
    console.log(`${i + 1}. ${item.element} | Class: ${item.className} | Overflow: ${item.overflowAmount.toFixed(2)}px | Width: ${item.width.toFixed(2)}px`);
  });
  
  // Highlight first overflow element visually
  if (overflowElements.length > 0) {
    const firstOverflow = document.querySelector(
      overflowElements[0].id 
        ? `#${overflowElements[0].id}` 
        : `.${overflowElements[0].className.split(' ')[0]}`
    );
    
    if (firstOverflow) {
      firstOverflow.style.outline = '3px solid red';
      firstOverflow.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
      console.log('\n✅ Red outline added to first overflow element');
    }
  }
  
  console.log('\n=== VIEWPORT INFO ===');
  console.log('HTML width:', document.documentElement.offsetWidth);
  console.log('Body offset width:', document.body.offsetWidth);
  console.log('Window inner width:', window.innerWidth);
  console.log('Document scroll width:', document.documentElement.scrollWidth);
  console.log('Body scroll width:', document.body.scrollWidth);
  
  console.log('=== OVERFLOW DEBUG END ===\n');
  
  // Return summary
  return {
    totalOverflowElements: overflowElements.length,
    maxOverflow: overflowElements[0]?.overflowAmount || 0,
    topCulprits: overflowElements.slice(0, 5)
  };
})();
