/**
 * Enhanced Features JavaScript for Manager Product Service Documentation
 * Implements copy-to-clipboard functionality and other interactive features
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize performance optimizations first
    initializePerformanceOptimizations();
    
    // Initialize enhanced features
    initializeAccessibilityFeatures();
    initializeCopyButtons();
    initializeCodeBlockEnhancements();
    initializeProgressIndicators();
    initializeNavigationEnhancements();
    initializeBreadcrumbNavigation();
    initializeScrollProgress();
    
    // Initialize search and discovery features
    initializeSearchAndDiscovery();
});

/**
 * Initialize performance optimizations
 */
function initializePerformanceOptimizations() {
    // Initialize lazy loading
    initializeLazyLoading();
    
    // Initialize progressive content loading
    initializeProgressiveLoading();
    
    // Initialize intersection observer for animations
    initializeIntersectionObserver();
    
    // Optimize large content sections
    optimizeLargeContent();
    
    // Initialize virtual scrolling for large lists
    initializeVirtualScrolling();
    
    // Preload critical resources
    preloadCriticalResources();
}

/**
 * Initialize lazy loading for images and media
 */
function initializeLazyLoading() {
    // Native lazy loading support check
    if ('loading' in HTMLImageElement.prototype) {
        const images = document.querySelectorAll('img:not([loading])');
        images.forEach(function(img) {
            img.loading = 'lazy';
        });
    } else {
        // Fallback for browsers without native lazy loading
        const imageObserver = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src || img.src;
                    img.classList.add('loaded');
                    imageObserver.unobserve(img);
                }
            });
        }, {
            rootMargin: '50px 0px'
        });
        
        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(function(img) {
            imageObserver.observe(img);
        });
    }
    
    // Lazy load background images
    const bgImageObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                const element = entry.target;
                const bgImage = element.dataset.bgSrc;
                if (bgImage) {
                    element.style.backgroundImage = `url(${bgImage})`;
                    element.classList.add('loaded');
                    bgImageObserver.unobserve(element);
                }
            }
        });
    });
    
    const lazyBgElements = document.querySelectorAll('[data-bg-src]');
    lazyBgElements.forEach(function(element) {
        bgImageObserver.observe(element);
    });
}

/**
 * Initialize progressive content loading for large sections
 */
function initializeProgressiveLoading() {
    const largeContentSections = document.querySelectorAll('.large-content-section, .md-typeset > div:nth-child(n+10)');
    
    if (largeContentSections.length === 0) return;
    
    const contentObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                const section = entry.target;
                
                // Add loading skeleton
                showLoadingSkeleton(section);
                
                // Simulate progressive loading (in real implementation, this would load actual content)
                setTimeout(function() {
                    hideLoadingSkeleton(section);
                    section.classList.add('loaded');
                }, 300);
                
                contentObserver.unobserve(section);
            }
        });
    }, {
        rootMargin: '100px 0px'
    });
    
    largeContentSections.forEach(function(section) {
        section.classList.add('large-content-section');
        contentObserver.observe(section);
    });
}

/**
 * Show loading skeleton for content section
 * @param {Element} section - Content section element
 */
function showLoadingSkeleton(section) {
    if (section.querySelector('.loading-skeleton')) return;
    
    const skeleton = document.createElement('div');
    skeleton.className = 'loading-skeleton';
    skeleton.style.height = '20px';
    skeleton.style.marginBottom = '10px';
    skeleton.style.borderRadius = '4px';
    
    // Create multiple skeleton lines
    for (let i = 0; i < 3; i++) {
        const line = skeleton.cloneNode();
        line.style.width = `${Math.random() * 40 + 60}%`;
        section.appendChild(line);
    }
}

/**
 * Hide loading skeleton for content section
 * @param {Element} section - Content section element
 */
function hideLoadingSkeleton(section) {
    const skeletons = section.querySelectorAll('.loading-skeleton');
    skeletons.forEach(function(skeleton) {
        skeleton.remove();
    });
}

/**
 * Initialize intersection observer for fade-in animations
 */
function initializeIntersectionObserver() {
    const animationObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                animationObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    // Add fade-in animation to sections
    const sections = document.querySelectorAll('.md-typeset > div, .md-typeset > section, .admonition');
    sections.forEach(function(section, index) {
        // Stagger animations
        section.style.transitionDelay = `${index * 0.1}s`;
        section.classList.add('fade-in-section');
        animationObserver.observe(section);
    });
}

/**
 * Optimize large content sections
 */
function optimizeLargeContent() {
    // Optimize large tables
    const largeTables = document.querySelectorAll('table');
    largeTables.forEach(function(table) {
        const rows = table.querySelectorAll('tr');
        if (rows.length > 20) {
            table.classList.add('large-table');
            
            // Add virtual scrolling for very large tables
            if (rows.length > 100) {
                implementTableVirtualScrolling(table);
            }
        }
    });
    
    // Optimize large code blocks
    const codeBlocks = document.querySelectorAll('.highlight');
    codeBlocks.forEach(function(block) {
        const code = block.querySelector('code');
        if (code && code.textContent.split('\n').length > 50) {
            block.classList.add('large-code-block');
        }
    });
}

/**
 * Initialize virtual scrolling for large lists
 */
function initializeVirtualScrolling() {
    const virtualContainers = document.querySelectorAll('.virtual-scroll-container');
    
    virtualContainers.forEach(function(container) {
        implementVirtualScrolling(container);
    });
}

/**
 * Implement virtual scrolling for a container
 * @param {Element} container - Container element
 */
function implementVirtualScrolling(container) {
    const items = Array.from(container.children);
    const itemHeight = 50; // Assume fixed item height
    const containerHeight = container.clientHeight;
    const visibleItems = Math.ceil(containerHeight / itemHeight) + 2; // Buffer items
    
    let scrollTop = 0;
    let startIndex = 0;
    
    function updateVisibleItems() {
        const newStartIndex = Math.floor(scrollTop / itemHeight);
        const endIndex = Math.min(newStartIndex + visibleItems, items.length);
        
        if (newStartIndex !== startIndex) {
            startIndex = newStartIndex;
            
            // Hide all items
            items.forEach(function(item) {
                item.style.display = 'none';
            });
            
            // Show visible items
            for (let i = startIndex; i < endIndex; i++) {
                if (items[i]) {
                    items[i].style.display = 'block';
                    items[i].style.transform = `translateY(${i * itemHeight}px)`;
                }
            }
        }
    }
    
    container.addEventListener('scroll', function() {
        scrollTop = container.scrollTop;
        requestAnimationFrame(updateVisibleItems);
    });
    
    // Initial render
    updateVisibleItems();
}

/**
 * Implement virtual scrolling for large tables
 * @param {Element} table - Table element
 */
function implementTableVirtualScrolling(table) {
    const tbody = table.querySelector('tbody');
    if (!tbody) return;
    
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const rowHeight = 40; // Assume fixed row height
    const visibleRows = 20;
    
    // Create virtual scrolling wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'virtual-scroll-container';
    wrapper.style.height = `${visibleRows * rowHeight}px`;
    wrapper.style.overflowY = 'auto';
    
    table.parentNode.insertBefore(wrapper, table);
    wrapper.appendChild(table);
    
    let scrollTop = 0;
    let startIndex = 0;
    
    function updateVisibleRows() {
        const newStartIndex = Math.floor(scrollTop / rowHeight);
        const endIndex = Math.min(newStartIndex + visibleRows, rows.length);
        
        if (newStartIndex !== startIndex) {
            startIndex = newStartIndex;
            
            // Hide all rows
            rows.forEach(function(row) {
                row.style.display = 'none';
            });
            
            // Show visible rows
            for (let i = startIndex; i < endIndex; i++) {
                if (rows[i]) {
                    rows[i].style.display = 'table-row';
                }
            }
        }
    }
    
    wrapper.addEventListener('scroll', function() {
        scrollTop = wrapper.scrollTop;
        requestAnimationFrame(updateVisibleRows);
    });
    
    // Initial render
    updateVisibleRows();
}

/**
 * Preload critical resources
 */
function preloadCriticalResources() {
    // Preload critical CSS
    const criticalCSS = [
        '/stylesheets/extra.css'
    ];
    
    criticalCSS.forEach(function(href) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'style';
        link.href = href;
        document.head.appendChild(link);
    });
    
    // Preload critical JavaScript
    const criticalJS = [
        '/javascripts/enhanced-features.js'
    ];
    
    criticalJS.forEach(function(src) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'script';
        link.href = src;
        document.head.appendChild(link);
    });
    
    // Preload fonts
    const fonts = [
        'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap'
    ];
    
    fonts.forEach(function(href) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'style';
        link.href = href;
        document.head.appendChild(link);
    });
}

/**
 * Debounce function for performance optimization
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @param {boolean} immediate - Execute immediately
 * @returns {Function} Debounced function
 */
function debounce(func, wait, immediate) {
    let timeout;
    return function executedFunction() {
        const context = this;
        const args = arguments;
        const later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}

/**
 * Throttle function for performance optimization
 * @param {Function} func - Function to throttle
 * @param {number} limit - Limit in milliseconds
 * @returns {Function} Throttled function
 */
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Initialize accessibility features and ARIA labels
 */
function initializeAccessibilityFeatures() {
    // Add skip to main content link
    addSkipToMainLink();
    
    // Enhance semantic markup
    enhanceSemanticMarkup();
    
    // Add ARIA labels to interactive elements
    addARIALabels();
    
    // Initialize focus management
    initializeFocusManagement();
    
    // Add live regions for dynamic content
    addLiveRegions();
}

/**
 * Add skip to main content link for keyboard users
 */
function addSkipToMainLink() {
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.className = 'skip-to-main';
    skipLink.textContent = 'Skip to main content';
    skipLink.setAttribute('aria-label', 'Skip to main content');
    
    // Insert at the beginning of the body
    document.body.insertBefore(skipLink, document.body.firstChild);
    
    // Ensure main content has proper ID
    const mainContent = document.querySelector('.md-content') || document.querySelector('main');
    if (mainContent && !mainContent.id) {
        mainContent.id = 'main-content';
        mainContent.setAttribute('tabindex', '-1'); // Allow programmatic focus
    }
}

/**
 * Enhance semantic markup with proper roles and landmarks
 */
function enhanceSemanticMarkup() {
    // Add main landmark if not present
    const content = document.querySelector('.md-content');
    if (content && !content.closest('main')) {
        content.setAttribute('role', 'main');
    }
    
    // Add navigation landmarks
    const navElements = document.querySelectorAll('.md-nav');
    navElements.forEach(function(nav) {
        if (!nav.getAttribute('role')) {
            nav.setAttribute('role', 'navigation');
        }
        
        // Add aria-label based on nav type
        if (nav.classList.contains('md-nav--primary')) {
            nav.setAttribute('aria-label', 'Primary navigation');
        } else if (nav.classList.contains('md-nav--secondary')) {
            nav.setAttribute('aria-label', 'Table of contents');
        }
    });
    
    // Enhance callout boxes with proper roles
    const admonitions = document.querySelectorAll('.admonition');
    admonitions.forEach(function(admonition) {
        if (admonition.classList.contains('danger') || admonition.classList.contains('warning')) {
            admonition.setAttribute('role', 'alert');
        } else {
            admonition.setAttribute('role', 'note');
        }
        
        // Add aria-labelledby for title
        const title = admonition.querySelector('.admonition-title');
        if (title) {
            const titleId = 'admonition-title-' + Math.random().toString(36).substr(2, 9);
            title.id = titleId;
            admonition.setAttribute('aria-labelledby', titleId);
        }
    });
    
    // Enhance tables with proper headers
    const tables = document.querySelectorAll('table');
    tables.forEach(function(table) {
        table.setAttribute('role', 'table');
        
        const headers = table.querySelectorAll('th');
        headers.forEach(function(header) {
            if (!header.getAttribute('scope')) {
                header.setAttribute('scope', 'col');
            }
        });
        
        // Add table caption if missing
        if (!table.querySelector('caption')) {
            const firstHeading = table.previousElementSibling;
            if (firstHeading && /^h[1-6]$/i.test(firstHeading.tagName)) {
                const caption = document.createElement('caption');
                caption.textContent = firstHeading.textContent;
                caption.className = 'sr-only';
                table.insertBefore(caption, table.firstChild);
            }
        }
    });
}

/**
 * Add comprehensive ARIA labels to interactive elements
 */
function addARIALabels() {
    // Enhance copy buttons
    const copyButtons = document.querySelectorAll('.copy-button');
    copyButtons.forEach(function(button) {
        button.setAttribute('aria-label', 'Copy code to clipboard');
        button.setAttribute('aria-describedby', 'copy-button-help');
    });
    
    // Add help text for copy buttons (screen reader only)
    if (copyButtons.length > 0 && !document.getElementById('copy-button-help')) {
        const helpText = document.createElement('div');
        helpText.id = 'copy-button-help';
        helpText.className = 'sr-only';
        helpText.textContent = 'Press Enter or Space to copy the code block to your clipboard';
        document.body.appendChild(helpText);
    }
    
    // Enhance cross-reference links
    const crossRefLinks = document.querySelectorAll('.cross-reference-link');
    crossRefLinks.forEach(function(link) {
        const originalText = link.textContent;
        link.setAttribute('aria-label', 'Go to related topic: ' + originalText);
    });
    
    // Enhance breadcrumb navigation
    const breadcrumbNav = document.querySelector('.breadcrumb-nav');
    if (breadcrumbNav) {
        breadcrumbNav.setAttribute('aria-label', 'Breadcrumb navigation');
        
        const links = breadcrumbNav.querySelectorAll('a');
        links.forEach(function(link, index) {
            link.setAttribute('aria-label', 'Go to ' + link.textContent);
        });
        
        const current = breadcrumbNav.querySelector('.breadcrumb-current');
        if (current) {
            current.setAttribute('aria-current', 'page');
        }
    }
    
    // Enhance progress indicators
    const progressSteps = document.querySelectorAll('.progress-step');
    progressSteps.forEach(function(step, index) {
        const stepNumber = index + 1;
        let status = 'pending';
        
        if (step.classList.contains('completed')) {
            status = 'completed';
        } else if (step.classList.contains('active')) {
            status = 'current';
        }
        
        step.setAttribute('aria-label', `Step ${stepNumber}: ${status}`);
        step.setAttribute('role', 'img');
    });
}

/**
 * Initialize focus management for better keyboard navigation
 */
function initializeFocusManagement() {
    // Focus management for skip link
    const skipLink = document.querySelector('.skip-to-main');
    if (skipLink) {
        skipLink.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.focus();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }
    
    // Trap focus in modal-like elements (if any)
    const modalElements = document.querySelectorAll('[role="dialog"], [role="alertdialog"]');
    modalElements.forEach(function(modal) {
        trapFocusInModal(modal);
    });
    
    // Restore focus after dynamic content changes
    document.addEventListener('DOMNodeInserted', function(e) {
        if (e.target.nodeType === Node.ELEMENT_NODE) {
            // Re-initialize accessibility features for new content
            setTimeout(function() {
                addARIALabels();
            }, 100);
        }
    });
}

/**
 * Add live regions for dynamic content announcements
 */
function addLiveRegions() {
    // Create live region for copy notifications
    const liveRegion = document.createElement('div');
    liveRegion.id = 'live-region';
    liveRegion.className = 'sr-only';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    document.body.appendChild(liveRegion);
    
    // Create assertive live region for important announcements
    const assertiveLiveRegion = document.createElement('div');
    assertiveLiveRegion.id = 'assertive-live-region';
    assertiveLiveRegion.className = 'sr-only';
    assertiveLiveRegion.setAttribute('aria-live', 'assertive');
    assertiveLiveRegion.setAttribute('aria-atomic', 'true');
    document.body.appendChild(assertiveLiveRegion);
}

/**
 * Announce message to screen readers
 * @param {string} message - Message to announce
 * @param {boolean} assertive - Whether to use assertive live region
 */
function announceToScreenReader(message, assertive = false) {
    const liveRegionId = assertive ? 'assertive-live-region' : 'live-region';
    const liveRegion = document.getElementById(liveRegionId);
    
    if (liveRegion) {
        liveRegion.textContent = message;
        
        // Clear the message after a short delay to allow for re-announcements
        setTimeout(function() {
            liveRegion.textContent = '';
        }, 1000);
    }
}

/**
 * Trap focus within a modal element
 * @param {Element} modal - Modal element to trap focus in
 */
function trapFocusInModal(modal) {
    const focusableElements = modal.querySelectorAll(
        'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select'
    );
    
    if (focusableElements.length === 0) return;
    
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];
    
    modal.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            if (e.shiftKey) {
                if (document.activeElement === firstFocusable) {
                    e.preventDefault();
                    lastFocusable.focus();
                }
            } else {
                if (document.activeElement === lastFocusable) {
                    e.preventDefault();
                    firstFocusable.focus();
                }
            }
        }
    });
}

/**
 * Initialize copy-to-clipboard buttons for code blocks
 */
function initializeCopyButtons() {
    // Add copy buttons to all code blocks
    const codeBlocks = document.querySelectorAll('.highlight, pre');
    
    codeBlocks.forEach(function(block) {
        // Skip if copy button already exists
        if (block.querySelector('.copy-button')) {
            return;
        }
        
        // Create copy button
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-button';
        copyButton.setAttribute('aria-label', 'Copy code to clipboard');
        copyButton.innerHTML = '<span>Copy</span>';
        
        // Add click event listener
        copyButton.addEventListener('click', function() {
            copyCodeToClipboard(block, copyButton);
        });
        
        // Add button to code block
        block.style.position = 'relative';
        block.appendChild(copyButton);
    });
}

/**
 * Copy code content to clipboard
 * @param {Element} codeBlock - The code block element
 * @param {Element} button - The copy button element
 */
function copyCodeToClipboard(codeBlock, button) {
    let codeText = '';
    
    // Extract text from code element
    const codeElement = codeBlock.querySelector('code');
    if (codeElement) {
        codeText = codeElement.textContent || codeElement.innerText;
    } else {
        codeText = codeBlock.textContent || codeBlock.innerText;
    }
    
    // Clean up the text (remove line numbers if present)
    codeText = codeText.replace(/^\s*\d+\s*/gm, '').trim();
    
    // Copy to clipboard
    if (navigator.clipboard && window.isSecureContext) {
        // Use modern clipboard API
        navigator.clipboard.writeText(codeText).then(function() {
            showCopySuccess(button);
        }).catch(function(err) {
            console.error('Failed to copy text: ', err);
            fallbackCopyToClipboard(codeText, button);
        });
    } else {
        // Fallback for older browsers
        fallbackCopyToClipboard(codeText, button);
    }
}

/**
 * Fallback copy method for older browsers
 * @param {string} text - Text to copy
 * @param {Element} button - The copy button element
 */
function fallbackCopyToClipboard(text, button) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showCopySuccess(button);
        } else {
            showCopyError(button);
        }
    } catch (err) {
        console.error('Fallback copy failed: ', err);
        showCopyError(button);
    }
    
    document.body.removeChild(textArea);
}

/**
 * Show copy success feedback
 * @param {Element} button - The copy button element
 */
function showCopySuccess(button) {
    const originalText = button.innerHTML;
    button.classList.add('copied');
    button.innerHTML = '<span>Copied!</span>';
    button.setAttribute('aria-label', 'Code copied to clipboard');
    
    // Announce to screen readers
    announceToScreenReader('Code copied to clipboard');
    
    setTimeout(function() {
        button.classList.remove('copied');
        button.innerHTML = originalText;
        button.setAttribute('aria-label', 'Copy code to clipboard');
    }, 2000);
}

/**
 * Show copy error feedback
 * @param {Element} button - The copy button element
 */
function showCopyError(button) {
    const originalText = button.innerHTML;
    button.style.background = 'var(--md-error-color)';
    button.innerHTML = '<span>Error</span>';
    
    setTimeout(function() {
        button.style.background = '';
        button.innerHTML = originalText;
    }, 2000);
}

/**
 * Initialize code block enhancements
 */
function initializeCodeBlockEnhancements() {
    // Add language labels to code blocks
    const highlights = document.querySelectorAll('.highlight');
    
    highlights.forEach(function(highlight) {
        // Get language from class name
        const classes = highlight.className.split(' ');
        let language = '';
        
        for (let className of classes) {
            if (className.startsWith('language-')) {
                language = className.replace('language-', '');
                break;
            }
        }
        
        if (language) {
            highlight.setAttribute('data-lang', language.toUpperCase());
        }
    });
    
    // Add file path headers where specified
    addFilePathHeaders();
}

/**
 * Add file path headers to code blocks
 */
function addFilePathHeaders() {
    // Look for code blocks with file path comments
    const codeBlocks = document.querySelectorAll('pre code');
    
    codeBlocks.forEach(function(code) {
        const text = code.textContent || code.innerText;
        const filePathMatch = text.match(/^#\s*File:\s*(.+)$/m);
        
        if (filePathMatch) {
            const filePath = filePathMatch[1].trim();
            const header = document.createElement('div');
            header.className = 'code-file-header';
            header.textContent = filePath;
            
            const pre = code.parentElement;
            pre.parentElement.insertBefore(header, pre);
            
            // Remove the file path comment from code
            code.textContent = text.replace(filePathMatch[0], '').trim();
        }
    });
}

/**
 * Initialize progress indicators
 */
function initializeProgressIndicators() {
    const progressIndicators = document.querySelectorAll('.progress-indicator');
    
    progressIndicators.forEach(function(indicator) {
        const steps = indicator.querySelectorAll('.progress-step');
        let activeIndex = -1;
        
        // Find active step
        steps.forEach(function(step, index) {
            if (step.classList.contains('active')) {
                activeIndex = index;
            }
        });
        
        // Mark previous steps as completed
        if (activeIndex > 0) {
            for (let i = 0; i < activeIndex; i++) {
                steps[i].classList.add('completed');
            }
        }
    });
}

/**
 * Utility function to add smooth scrolling to anchor links
 */
function initializeSmoothScrolling() {
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    
    anchorLinks.forEach(function(link) {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

/**
 * Initialize comprehensive keyboard navigation for interactive elements
 */
function initializeKeyboardNavigation() {
    // Add keyboard support for copy buttons
    const copyButtons = document.querySelectorAll('.copy-button');
    
    copyButtons.forEach(function(button) {
        // Ensure button is focusable
        button.setAttribute('tabindex', '0');
        button.setAttribute('role', 'button');
        
        button.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                button.click();
            }
        });
    });
    
    // Add keyboard support for cross-reference links
    const crossRefLinks = document.querySelectorAll('.cross-reference-link');
    crossRefLinks.forEach(function(link) {
        link.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                link.click();
            }
        });
    });
    
    // Add keyboard support for code tabs
    const codeTabs = document.querySelectorAll('.code-tab');
    codeTabs.forEach(function(tab, index) {
        tab.setAttribute('tabindex', '0');
        tab.setAttribute('role', 'tab');
        tab.setAttribute('aria-selected', tab.classList.contains('active') ? 'true' : 'false');
        
        tab.addEventListener('keydown', function(e) {
            const tabs = Array.from(tab.parentElement.children);
            let newIndex = index;
            
            switch(e.key) {
                case 'Enter':
                case ' ':
                    e.preventDefault();
                    tab.click();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    newIndex = index > 0 ? index - 1 : tabs.length - 1;
                    tabs[newIndex].focus();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    newIndex = index < tabs.length - 1 ? index + 1 : 0;
                    tabs[newIndex].focus();
                    break;
                case 'Home':
                    e.preventDefault();
                    tabs[0].focus();
                    break;
                case 'End':
                    e.preventDefault();
                    tabs[tabs.length - 1].focus();
                    break;
            }
        });
    });
    
    // Add keyboard navigation for table of contents
    initializeTOCKeyboardNavigation();
    
    // Add escape key handler for dismissible elements
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            // Close any open modals or dropdowns
            const activeElements = document.querySelectorAll('.active, .open, .expanded');
            activeElements.forEach(function(element) {
                if (element.classList.contains('dismissible')) {
                    element.classList.remove('active', 'open', 'expanded');
                }
            });
        }
    });
}

/**
 * Initialize keyboard navigation for table of contents
 */
function initializeTOCKeyboardNavigation() {
    const tocLinks = document.querySelectorAll('.md-nav--secondary .md-nav__link');
    
    tocLinks.forEach(function(link, index) {
        link.addEventListener('keydown', function(e) {
            const links = Array.from(document.querySelectorAll('.md-nav--secondary .md-nav__link'));
            let newIndex = index;
            
            switch(e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    newIndex = index > 0 ? index - 1 : links.length - 1;
                    links[newIndex].focus();
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    newIndex = index < links.length - 1 ? index + 1 : 0;
                    links[newIndex].focus();
                    break;
                case 'Home':
                    e.preventDefault();
                    links[0].focus();
                    break;
                case 'End':
                    e.preventDefault();
                    links[links.length - 1].focus();
                    break;
            }
        });
    });
}

// Initialize additional features when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initializeSmoothScrolling();
    initializeKeyboardNavigation();
});

// Export functions for potential external use
window.EnhancedFeatures = {
    initializeCopyButtons,
    initializeCodeBlockEnhancements,
    initializeProgressIndicators,
    copyCodeToClipboard
};
/*
*
 * Initialize navigation enhancements
 */
function initializeNavigationEnhancements() {
    // Add scroll spy for table of contents
    initializeScrollSpy();
    
    // Add smooth scrolling for TOC links
    const tocLinks = document.querySelectorAll('.md-nav--secondary a[href^="#"]');
    tocLinks.forEach(function(link) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // Update URL without triggering scroll
                history.pushState(null, null, '#' + targetId);
            }
        });
    });
}

/**
 * Initialize scroll spy for table of contents
 */
function initializeScrollSpy() {
    const headings = document.querySelectorAll('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]');
    const tocLinks = document.querySelectorAll('.md-nav--secondary a[href^="#"]');
    
    if (headings.length === 0 || tocLinks.length === 0) return;
    
    // Use throttled intersection observer for better performance
    const updateActiveLink = throttle(function(entries) {
        entries.forEach(function(entry) {
            const id = entry.target.getAttribute('id');
            const tocLink = document.querySelector('.md-nav--secondary a[href="#' + id + '"]');
            
            if (tocLink) {
                if (entry.isIntersecting) {
                    // Remove active class from all TOC links
                    tocLinks.forEach(function(link) {
                        link.classList.remove('md-nav__link--active');
                    });
                    
                    // Add active class to current link
                    tocLink.classList.add('md-nav__link--active');
                }
            }
        });
    }, 100);
    
    const observer = new IntersectionObserver(updateActiveLink, {
        rootMargin: '-20% 0px -70% 0px',
        threshold: 0
    });
    
    headings.forEach(function(heading) {
        observer.observe(heading);
    });
}

/**
 * Initialize breadcrumb navigation
 */
function initializeBreadcrumbNavigation() {
    // Auto-generate breadcrumbs based on navigation structure
    const currentPath = window.location.pathname;
    const navItems = document.querySelectorAll('.md-nav--primary .md-nav__item');
    
    // Find current page in navigation
    let breadcrumbs = [];
    let currentPage = '';
    
    // Get page title
    const pageTitle = document.querySelector('h1');
    if (pageTitle) {
        currentPage = pageTitle.textContent.trim();
    }
    
    // Build breadcrumb trail
    breadcrumbs.push({ text: 'Home', url: '/' });
    
    // Add intermediate breadcrumbs based on URL structure
    const pathParts = currentPath.split('/').filter(part => part && part !== 'index.html');
    let currentUrl = '';
    
    pathParts.forEach(function(part, index) {
        currentUrl += '/' + part;
        if (index < pathParts.length - 1) {
            const formattedText = part.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            breadcrumbs.push({ text: formattedText, url: currentUrl });
        }
    });
    
    // Add current page
    if (currentPage) {
        breadcrumbs.push({ text: currentPage, url: null });
    }
    
    // Create breadcrumb HTML
    if (breadcrumbs.length > 1) {
        createBreadcrumbHTML(breadcrumbs);
    }
}

/**
 * Create breadcrumb HTML and insert into page
 * @param {Array} breadcrumbs - Array of breadcrumb objects
 */
function createBreadcrumbHTML(breadcrumbs) {
    const breadcrumbNav = document.createElement('nav');
    breadcrumbNav.className = 'breadcrumb-nav';
    breadcrumbNav.setAttribute('aria-label', 'Breadcrumb navigation');
    
    let breadcrumbHTML = '';
    
    breadcrumbs.forEach(function(crumb, index) {
        if (index > 0) {
            breadcrumbHTML += '<span class="breadcrumb-separator" aria-hidden="true">›</span>';
        }
        
        if (crumb.url && index < breadcrumbs.length - 1) {
            breadcrumbHTML += '<a href="' + crumb.url + '">' + crumb.text + '</a>';
        } else {
            breadcrumbHTML += '<span class="breadcrumb-current">' + crumb.text + '</span>';
        }
    });
    
    breadcrumbNav.innerHTML = breadcrumbHTML;
    
    // Insert breadcrumb after the main heading
    const mainHeading = document.querySelector('.md-content h1');
    if (mainHeading) {
        mainHeading.parentNode.insertBefore(breadcrumbNav, mainHeading.nextSibling);
    }
}

/**
 * Initialize scroll progress indicator
 */
function initializeScrollProgress() {
    const tocNav = document.querySelector('.md-nav--secondary');
    if (!tocNav) return;
    
    // Add progress class to TOC
    tocNav.classList.add('toc-progress');
    
    // Update progress on scroll (throttled for performance)
    const updateScrollProgress = throttle(function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = (scrollTop / scrollHeight) * 100;
        
        tocNav.style.setProperty('--progress', Math.min(progress, 100) + '%');
    }, 16); // ~60fps
    
    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    updateScrollProgress(); // Initial call
}

/**
 * Initialize cross-reference system
 */
function initializeCrossReferences() {
    // Auto-generate cross-references based on content
    const headings = document.querySelectorAll('h2[id], h3[id]');
    const crossRefs = new Map();
    
    headings.forEach(function(heading) {
        const id = heading.getAttribute('id');
        const text = heading.textContent.trim();
        const section = heading.closest('section') || heading.parentElement;
        
        // Find related sections based on keywords
        const keywords = extractKeywords(text);
        crossRefs.set(id, {
            title: text,
            keywords: keywords,
            element: heading
        });
    });
    
    // Add cross-reference boxes to relevant sections
    crossRefs.forEach(function(ref, id) {
        const relatedRefs = findRelatedReferences(ref, crossRefs, id);
        if (relatedRefs.length > 0) {
            createCrossReferenceBox(ref.element, relatedRefs);
        }
    });
}

/**
 * Extract keywords from heading text
 * @param {string} text - Heading text
 * @returns {Array} Array of keywords
 */
function extractKeywords(text) {
    const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    return text.toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 3 && !commonWords.includes(word))
        .map(word => word.replace(/[^\w]/g, ''));
}

/**
 * Find related references based on keywords
 * @param {Object} currentRef - Current reference object
 * @param {Map} allRefs - All references map
 * @param {string} currentId - Current reference ID
 * @returns {Array} Array of related references
 */
function findRelatedReferences(currentRef, allRefs, currentId) {
    const related = [];
    
    allRefs.forEach(function(ref, id) {
        if (id === currentId) return;
        
        const commonKeywords = currentRef.keywords.filter(keyword => 
            ref.keywords.includes(keyword)
        );
        
        if (commonKeywords.length > 0) {
            related.push({
                id: id,
                title: ref.title,
                score: commonKeywords.length
            });
        }
    });
    
    return related.sort((a, b) => b.score - a.score).slice(0, 3);
}

/**
 * Create cross-reference box
 * @param {Element} element - Element to insert cross-reference after
 * @param {Array} references - Array of related references
 */
function createCrossReferenceBox(element, references) {
    const crossRefBox = document.createElement('div');
    crossRefBox.className = 'cross-reference';
    
    let html = '<div class="cross-reference-title">Related Topics</div>';
    html += '<div class="cross-reference-links">';
    
    references.forEach(function(ref) {
        html += '<a href="#' + ref.id + '" class="cross-reference-link">' + ref.title + '</a>';
    });
    
    html += '</div>';
    crossRefBox.innerHTML = html;
    
    // Insert after the next paragraph or section
    const nextElement = element.nextElementSibling;
    if (nextElement) {
        nextElement.parentNode.insertBefore(crossRefBox, nextElement.nextSibling);
    }
}

// Update the export object
window.EnhancedFeatures = {
    initializePerformanceOptimizations,
    initializeAccessibilityFeatures,
    initializeSearchAndDiscovery,
    initializeCopyButtons,
    initializeCodeBlockEnhancements,
    initializeProgressIndicators,
    initializeNavigationEnhancements,
    initializeBreadcrumbNavigation,
    initializeScrollProgress,
    initializeCrossReferences,
    initializeKeyboardNavigation,
    initializeLazyLoading,
    initializeProgressiveLoading,
    initializeEnhancedSearch,
    initializeContentFiltering,
    announceToScreenReader,
    debounce,
    throttle,
    copyCodeToClipboard
};
/*
*
 * Initialize search and discovery features
 */
function initializeSearchAndDiscovery() {
    // Initialize enhanced search
    initializeEnhancedSearch();
    
    // Initialize content tagging and filtering
    initializeContentFiltering();
    
    // Initialize recently updated indicators
    initializeRecentlyUpdatedIndicators();
    
    // Initialize content categorization
    initializeContentCategorization();
    
    // Initialize change tracking
    initializeChangeTracking();
}

/**
 * Initialize enhanced search functionality
 */
function initializeEnhancedSearch() {
    // Create enhanced search interface
    createEnhancedSearchInterface();
    
    // Initialize search index
    buildSearchIndex();
    
    // Initialize search functionality
    setupSearchFunctionality();
}

/**
 * Create enhanced search interface
 */
function createEnhancedSearchInterface() {
    // Find existing search input or create new one
    let searchContainer = document.querySelector('.md-search');
    
    if (!searchContainer) {
        // Create search container if it doesn't exist
        searchContainer = document.createElement('div');
        searchContainer.className = 'enhanced-search-container';
        
        const mainContent = document.querySelector('.md-content');
        if (mainContent) {
            mainContent.insertBefore(searchContainer, mainContent.firstChild);
        }
    }
    
    // Create enhanced search input
    const searchHTML = `
        <div class="enhanced-search-container">
            <div class="enhanced-search-icon">🔍</div>
            <input type="text" 
                   class="enhanced-search-input" 
                   placeholder="Search documentation..." 
                   aria-label="Search documentation"
                   autocomplete="off">
            <div class="search-results-container" role="listbox" aria-label="Search results">
                <div class="search-suggestions">
                    <div class="search-suggestions-title">Popular topics:</div>
                    <div class="search-suggestion-tags">
                        <span class="search-suggestion-tag" data-query="configuration">Configuration</span>
                        <span class="search-suggestion-tag" data-query="database">Database</span>
                        <span class="search-suggestion-tag" data-query="docker">Docker</span>
                        <span class="search-suggestion-tag" data-query="troubleshooting">Troubleshooting</span>
                        <span class="search-suggestion-tag" data-query="environment">Environment</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Insert enhanced search
    const contentArea = document.querySelector('.md-content__inner');
    if (contentArea) {
        contentArea.insertAdjacentHTML('afterbegin', searchHTML);
    }
}

/**
 * Build search index from page content
 */
function buildSearchIndex() {
    const searchIndex = [];
    
    // Index headings
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach(function(heading) {
        const id = heading.getAttribute('id');
        const text = heading.textContent.trim();
        const level = parseInt(heading.tagName.charAt(1));
        
        if (text && id) {
            searchIndex.push({
                type: 'heading',
                title: text,
                content: text,
                url: '#' + id,
                level: level,
                element: heading
            });
        }
    });
    
    // Index paragraphs and content
    const paragraphs = document.querySelectorAll('p, li, td');
    paragraphs.forEach(function(paragraph) {
        const text = paragraph.textContent.trim();
        if (text.length > 20) {
            const nearestHeading = findNearestHeading(paragraph);
            searchIndex.push({
                type: 'content',
                title: nearestHeading ? nearestHeading.textContent.trim() : 'Content',
                content: text,
                url: nearestHeading ? '#' + nearestHeading.getAttribute('id') : '#',
                element: paragraph
            });
        }
    });
    
    // Index code blocks
    const codeBlocks = document.querySelectorAll('pre code');
    codeBlocks.forEach(function(code) {
        const text = code.textContent.trim();
        if (text) {
            const nearestHeading = findNearestHeading(code);
            searchIndex.push({
                type: 'code',
                title: nearestHeading ? nearestHeading.textContent.trim() : 'Code Example',
                content: text,
                url: nearestHeading ? '#' + nearestHeading.getAttribute('id') : '#',
                element: code
            });
        }
    });
    
    // Store search index globally
    window.searchIndex = searchIndex;
}

/**
 * Find nearest heading for an element
 * @param {Element} element - Element to find heading for
 * @returns {Element|null} Nearest heading element
 */
function findNearestHeading(element) {
    let current = element;
    
    while (current && current !== document.body) {
        const heading = current.querySelector('h1, h2, h3, h4, h5, h6');
        if (heading) {
            return heading;
        }
        
        // Check previous siblings
        let sibling = current.previousElementSibling;
        while (sibling) {
            if (/^h[1-6]$/i.test(sibling.tagName)) {
                return sibling;
            }
            sibling = sibling.previousElementSibling;
        }
        
        current = current.parentElement;
    }
    
    return null;
}

/**
 * Setup search functionality
 */
function setupSearchFunctionality() {
    const searchInput = document.querySelector('.enhanced-search-input');
    const resultsContainer = document.querySelector('.search-results-container');
    const suggestionTags = document.querySelectorAll('.search-suggestion-tag');
    
    if (!searchInput || !resultsContainer) return;
    
    let currentQuery = '';
    let selectedIndex = -1;
    
    // Debounced search function
    const performSearch = debounce(function(query) {
        if (query.length < 2) {
            hideSearchResults();
            return;
        }
        
        const results = searchContent(query);
        displaySearchResults(results, query);
    }, 300);
    
    // Search input event listeners
    searchInput.addEventListener('input', function(e) {
        currentQuery = e.target.value.trim();
        selectedIndex = -1;
        performSearch(currentQuery);
    });
    
    searchInput.addEventListener('keydown', function(e) {
        const resultItems = resultsContainer.querySelectorAll('.search-result-item');
        
        switch(e.key) {
            case 'ArrowDown':
                e.preventDefault();
                selectedIndex = Math.min(selectedIndex + 1, resultItems.length - 1);
                updateSelectedResult(resultItems);
                break;
            case 'ArrowUp':
                e.preventDefault();
                selectedIndex = Math.max(selectedIndex - 1, -1);
                updateSelectedResult(resultItems);
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && resultItems[selectedIndex]) {
                    resultItems[selectedIndex].click();
                }
                break;
            case 'Escape':
                hideSearchResults();
                searchInput.blur();
                break;
        }
    });
    
    searchInput.addEventListener('focus', function() {
        if (currentQuery.length >= 2) {
            resultsContainer.classList.add('active');
        }
    });
    
    // Suggestion tag event listeners
    suggestionTags.forEach(function(tag) {
        tag.addEventListener('click', function() {
            const query = this.getAttribute('data-query');
            searchInput.value = query;
            currentQuery = query;
            performSearch(query);
            searchInput.focus();
        });
    });
    
    // Click outside to close
    document.addEventListener('click', function(e) {
        if (!searchInput.contains(e.target) && !resultsContainer.contains(e.target)) {
            hideSearchResults();
        }
    });
}

/**
 * Search content based on query
 * @param {string} query - Search query
 * @returns {Array} Search results
 */
function searchContent(query) {
    if (!window.searchIndex) return [];
    
    const queryLower = query.toLowerCase();
    const results = [];
    
    window.searchIndex.forEach(function(item) {
        const titleMatch = item.title.toLowerCase().includes(queryLower);
        const contentMatch = item.content.toLowerCase().includes(queryLower);
        
        if (titleMatch || contentMatch) {
            let score = 0;
            
            // Higher score for title matches
            if (titleMatch) score += 10;
            if (contentMatch) score += 5;
            
            // Higher score for exact matches
            if (item.title.toLowerCase() === queryLower) score += 20;
            
            // Higher score for headings
            if (item.type === 'heading') score += 5;
            
            results.push({
                ...item,
                score: score
            });
        }
    });
    
    // Sort by score and limit results
    return results.sort((a, b) => b.score - a.score).slice(0, 10);
}

/**
 * Display search results
 * @param {Array} results - Search results
 * @param {string} query - Search query
 */
function displaySearchResults(results, query) {
    const resultsContainer = document.querySelector('.search-results-container');
    if (!resultsContainer) return;
    
    // Clear existing results (except suggestions)
    const existingResults = resultsContainer.querySelectorAll('.search-result-item');
    existingResults.forEach(function(item) {
        item.remove();
    });
    
    if (results.length === 0) {
        showNoResults(query);
        return;
    }
    
    // Create result items
    results.forEach(function(result, index) {
        const resultItem = createSearchResultItem(result, query, index);
        resultsContainer.insertBefore(resultItem, resultsContainer.firstChild);
    });
    
    resultsContainer.classList.add('active');
}

/**
 * Create search result item
 * @param {Object} result - Search result
 * @param {string} query - Search query
 * @param {number} index - Result index
 * @returns {Element} Result item element
 */
function createSearchResultItem(result, query, index) {
    const item = document.createElement('div');
    item.className = 'search-result-item';
    item.setAttribute('role', 'option');
    item.setAttribute('aria-selected', 'false');
    
    const title = highlightSearchTerm(result.title, query);
    const excerpt = createExcerpt(result.content, query);
    const path = getResultPath(result);
    
    item.innerHTML = `
        <div class="search-result-title">${title}</div>
        <div class="search-result-excerpt">${excerpt}</div>
        <div class="search-result-path">${path}</div>
    `;
    
    item.addEventListener('click', function() {
        navigateToResult(result);
        hideSearchResults();
    });
    
    return item;
}

/**
 * Highlight search term in text
 * @param {string} text - Text to highlight
 * @param {string} query - Search query
 * @returns {string} Highlighted text
 */
function highlightSearchTerm(text, query) {
    const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
    return text.replace(regex, '<span class="search-highlight">$1</span>');
}

/**
 * Create excerpt from content
 * @param {string} content - Full content
 * @param {string} query - Search query
 * @returns {string} Content excerpt
 */
function createExcerpt(content, query) {
    const queryIndex = content.toLowerCase().indexOf(query.toLowerCase());
    const excerptLength = 150;
    
    if (queryIndex === -1) {
        return content.substring(0, excerptLength) + (content.length > excerptLength ? '...' : '');
    }
    
    const start = Math.max(0, queryIndex - 50);
    const end = Math.min(content.length, start + excerptLength);
    
    let excerpt = content.substring(start, end);
    if (start > 0) excerpt = '...' + excerpt;
    if (end < content.length) excerpt = excerpt + '...';
    
    return highlightSearchTerm(excerpt, query);
}

/**
 * Get result path for display
 * @param {Object} result - Search result
 * @returns {string} Result path
 */
function getResultPath(result) {
    const currentPath = window.location.pathname;
    const pathParts = currentPath.split('/').filter(part => part);
    
    if (pathParts.length > 0) {
        return pathParts.join(' › ');
    }
    
    return 'Documentation';
}

/**
 * Navigate to search result
 * @param {Object} result - Search result
 */
function navigateToResult(result) {
    if (result.url.startsWith('#')) {
        // Internal anchor link
        const target = document.querySelector(result.url);
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
            // Highlight the target briefly
            target.style.backgroundColor = 'rgba(255, 235, 59, 0.3)';
            setTimeout(function() {
                target.style.backgroundColor = '';
            }, 2000);
        }
    } else {
        // External link
        window.location.href = result.url;
    }
}

/**
 * Show no results message
 * @param {string} query - Search query
 */
function showNoResults(query) {
    const resultsContainer = document.querySelector('.search-results-container');
    if (!resultsContainer) return;
    
    const noResults = document.createElement('div');
    noResults.className = 'no-results';
    noResults.innerHTML = `
        <div class="no-results-icon">🔍</div>
        <div class="no-results-title">No results found</div>
        <div class="no-results-message">
            No results found for "<strong>${escapeHtml(query)}</strong>".<br>
            Try different keywords or check the suggestions below.
        </div>
    `;
    
    resultsContainer.insertBefore(noResults, resultsContainer.firstChild);
    resultsContainer.classList.add('active');
}

/**
 * Hide search results
 */
function hideSearchResults() {
    const resultsContainer = document.querySelector('.search-results-container');
    if (resultsContainer) {
        resultsContainer.classList.remove('active');
    }
}

/**
 * Update selected search result
 * @param {NodeList} resultItems - Result item elements
 */
function updateSelectedResult(resultItems) {
    resultItems.forEach(function(item, index) {
        if (index === selectedIndex) {
            item.classList.add('highlighted');
            item.setAttribute('aria-selected', 'true');
            item.scrollIntoView({ block: 'nearest' });
        } else {
            item.classList.remove('highlighted');
            item.setAttribute('aria-selected', 'false');
        }
    });
}

/**
 * Initialize content filtering and tagging
 */
function initializeContentFiltering() {
    // Add content tags to sections
    addContentTags();
    
    // Create filter controls
    createFilterControls();
    
    // Setup filtering functionality
    setupFilterFunctionality();
}

/**
 * Add content tags to sections
 */
function addContentTags() {
    const sections = document.querySelectorAll('.md-typeset > div, .md-typeset > section');
    
    sections.forEach(function(section) {
        const heading = section.querySelector('h1, h2, h3, h4, h5, h6');
        if (!heading) return;
        
        const tags = extractTagsFromContent(section);
        if (tags.length > 0) {
            const tagContainer = document.createElement('div');
            tagContainer.className = 'content-tags';
            
            tags.forEach(function(tag) {
                const tagElement = document.createElement('span');
                tagElement.className = 'content-tag';
                tagElement.textContent = tag;
                tagElement.setAttribute('data-tag', tag);
                tagContainer.appendChild(tagElement);
            });
            
            heading.parentNode.insertBefore(tagContainer, heading.nextSibling);
        }
    });
}

/**
 * Extract tags from content
 * @param {Element} section - Content section
 * @returns {Array} Array of tags
 */
function extractTagsFromContent(section) {
    const text = section.textContent.toLowerCase();
    const tags = [];
    
    // Define tag mappings
    const tagMappings = {
        'configuration': ['config', 'setup', 'settings', 'properties'],
        'database': ['postgresql', 'sql', 'migration', 'connection'],
        'docker': ['container', 'compose', 'dockerfile', 'image'],
        'troubleshooting': ['error', 'problem', 'issue', 'debug', 'fix'],
        'environment': ['dev', 'staging', 'production', 'env'],
        'security': ['auth', 'authentication', 'authorization', 'ssl', 'tls'],
        'performance': ['optimization', 'cache', 'speed', 'memory'],
        'api': ['endpoint', 'rest', 'json', 'request', 'response']
    };
    
    Object.keys(tagMappings).forEach(function(tag) {
        const keywords = [tag, ...tagMappings[tag]];
        if (keywords.some(keyword => text.includes(keyword))) {
            tags.push(tag);
        }
    });
    
    return tags;
}

/**
 * Create filter controls
 */
function createFilterControls() {
    const filterHTML = `
        <div class="filter-controls">
            <div class="filter-group">
                <label class="filter-label" for="category-filter">Category:</label>
                <select id="category-filter" class="filter-select">
                    <option value="">All Categories</option>
                    <option value="configuration">Configuration</option>
                    <option value="database">Database</option>
                    <option value="docker">Docker</option>
                    <option value="troubleshooting">Troubleshooting</option>
                    <option value="environment">Environment</option>
                    <option value="security">Security</option>
                    <option value="performance">Performance</option>
                    <option value="api">API</option>
                </select>
            </div>
            <div class="filter-group">
                <label class="filter-label" for="difficulty-filter">Difficulty:</label>
                <select id="difficulty-filter" class="filter-select">
                    <option value="">All Levels</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                </select>
            </div>
            <button class="clear-filters" type="button">Clear Filters</button>
        </div>
    `;
    
    const contentArea = document.querySelector('.md-content__inner');
    if (contentArea) {
        const searchContainer = contentArea.querySelector('.enhanced-search-container');
        if (searchContainer) {
            searchContainer.insertAdjacentHTML('afterend', filterHTML);
        }
    }
}

/**
 * Setup filtering functionality
 */
function setupFilterFunctionality() {
    const categoryFilter = document.getElementById('category-filter');
    const difficultyFilter = document.getElementById('difficulty-filter');
    const clearFiltersBtn = document.querySelector('.clear-filters');
    const contentTags = document.querySelectorAll('.content-tag');
    
    // Filter change handlers
    if (categoryFilter) {
        categoryFilter.addEventListener('change', applyFilters);
    }
    
    if (difficultyFilter) {
        difficultyFilter.addEventListener('change', applyFilters);
    }
    
    // Clear filters handler
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', function() {
            if (categoryFilter) categoryFilter.value = '';
            if (difficultyFilter) difficultyFilter.value = '';
            
            contentTags.forEach(function(tag) {
                tag.classList.remove('active');
            });
            
            applyFilters();
        });
    }
    
    // Tag click handlers
    contentTags.forEach(function(tag) {
        tag.addEventListener('click', function() {
            const tagValue = this.getAttribute('data-tag');
            
            // Toggle tag active state
            this.classList.toggle('active');
            
            // Update category filter if tag is selected
            if (this.classList.contains('active') && categoryFilter) {
                categoryFilter.value = tagValue;
            }
            
            applyFilters();
        });
    });
}

/**
 * Apply content filters
 */
function applyFilters() {
    const categoryFilter = document.getElementById('category-filter');
    const difficultyFilter = document.getElementById('difficulty-filter');
    
    const selectedCategory = categoryFilter ? categoryFilter.value : '';
    const selectedDifficulty = difficultyFilter ? difficultyFilter.value : '';
    
    const sections = document.querySelectorAll('.md-typeset > div, .md-typeset > section');
    
    sections.forEach(function(section) {
        let visible = true;
        
        // Category filter
        if (selectedCategory) {
            const sectionTags = section.querySelectorAll('.content-tag');
            const hasCategory = Array.from(sectionTags).some(tag => 
                tag.getAttribute('data-tag') === selectedCategory
            );
            if (!hasCategory) visible = false;
        }
        
        // Difficulty filter
        if (selectedDifficulty) {
            const difficultyIndicator = section.querySelector('.content-category.' + selectedDifficulty);
            if (!difficultyIndicator) visible = false;
        }
        
        // Apply visibility
        section.style.display = visible ? '' : 'none';
    });
    
    // Announce filter results to screen readers
    const visibleSections = Array.from(sections).filter(section => 
        section.style.display !== 'none'
    ).length;
    
    announceToScreenReader(`Showing ${visibleSections} sections after filtering`);
}

/**
 * Initialize recently updated indicators
 */
function initializeRecentlyUpdatedIndicators() {
    // This would typically integrate with a CMS or git history
    // For demo purposes, we'll mark some content as recently updated
    
    const headings = document.querySelectorAll('h2, h3');
    const recentlyUpdatedCount = Math.min(3, headings.length);
    
    for (let i = 0; i < recentlyUpdatedCount; i++) {
        const heading = headings[i];
        const indicator = document.createElement('span');
        indicator.className = 'updated-indicator';
        indicator.textContent = 'Updated';
        indicator.setAttribute('title', 'Recently updated content');
        
        heading.appendChild(indicator);
        heading.classList.add('recently-updated');
    }
}

/**
 * Initialize content categorization
 */
function initializeContentCategorization() {
    const sections = document.querySelectorAll('.md-typeset > div, .md-typeset > section');
    
    sections.forEach(function(section, index) {
        const heading = section.querySelector('h1, h2, h3, h4, h5, h6');
        if (!heading) return;
        
        // Assign difficulty based on content complexity (simplified logic)
        const text = section.textContent.toLowerCase();
        let difficulty = 'beginner';
        
        if (text.includes('advanced') || text.includes('complex') || text.includes('production')) {
            difficulty = 'advanced';
        } else if (text.includes('configuration') || text.includes('setup') || text.includes('docker')) {
            difficulty = 'intermediate';
        }
        
        const categoryBadge = document.createElement('span');
        categoryBadge.className = `content-category ${difficulty}`;
        categoryBadge.textContent = difficulty;
        categoryBadge.setAttribute('title', `Difficulty level: ${difficulty}`);
        
        heading.insertBefore(categoryBadge, heading.firstChild);
    });
}

/**
 * Initialize change tracking
 */
function initializeChangeTracking() {
    // This would typically integrate with version control
    // For demo purposes, we'll add some change indicators
    
    const sections = document.querySelectorAll('.md-typeset > div, .md-typeset > section');
    const changeTypes = ['added', 'modified'];
    
    sections.forEach(function(section, index) {
        if (index < 2) { // Mark first two sections as changed
            const heading = section.querySelector('h1, h2, h3, h4, h5, h6');
            if (!heading) return;
            
            const changeType = changeTypes[index % changeTypes.length];
            const changeIndicator = document.createElement('span');
            changeIndicator.className = `change-indicator ${changeType}`;
            changeIndicator.textContent = changeType.charAt(0).toUpperCase() + changeType.slice(1);
            changeIndicator.setAttribute('title', `Content ${changeType} recently`);
            
            heading.appendChild(changeIndicator);
        }
    });
}

/**
 * Utility function to escape regular expression characters
 * @param {string} string - String to escape
 * @returns {string} Escaped string
 */
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Utility function to escape HTML
 * @param {string} text - Text to escape
 * @returns {string} Escaped HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}