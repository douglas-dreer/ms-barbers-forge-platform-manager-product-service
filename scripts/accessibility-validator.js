/**
 * Accessibility Validation Script for Documentation
 * Tests WCAG 2.1 AA compliance and accessibility best practices
 */

// Accessibility test results
const accessibilityResults = {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    warnings: 0,
    errors: [],
    warnings: []
};

// Color contrast ratios (WCAG 2.1 AA requirements)
const CONTRAST_RATIOS = {
    NORMAL_TEXT: 4.5,
    LARGE_TEXT: 3.0,
    UI_COMPONENTS: 3.0
};

/**
 * Calculate color contrast ratio between two colors
 */
function calculateContrastRatio(color1, color2) {
    // Simplified contrast calculation
    // In a real implementation, this would use proper color space calculations
    const getLuminance = (color) => {
        // Convert hex to RGB and calculate relative luminance
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16) / 255;
        const g = parseInt(hex.substr(2, 2), 16) / 255;
        const b = parseInt(hex.substr(4, 2), 16) / 255;
        
        const sRGB = [r, g, b].map(c => {
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        
        return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
    };
    
    const lum1 = getLuminance(color1);
    const lum2 = getLuminance(color2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    
    return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Test semantic HTML structure
 */
function testSemanticStructure() {
    console.log('🔍 Testing Semantic HTML Structure...');
    
    const tests = [
        {
            name: 'Proper heading hierarchy',
            test: () => {
                const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
                let previousLevel = 0;
                let valid = true;
                
                headings.forEach(heading => {
                    const currentLevel = parseInt(heading.tagName.charAt(1));
                    if (currentLevel > previousLevel + 1) {
                        valid = false;
                    }
                    previousLevel = currentLevel;
                });
                
                return valid;
            }
        },
        {
            name: 'Main landmark present',
            test: () => document.querySelector('main') !== null
        },
        {
            name: 'Navigation landmarks',
            test: () => document.querySelector('nav') !== null
        },
        {
            name: 'Proper list structure',
            test: () => {
                const lists = document.querySelectorAll('ul, ol');
                return Array.from(lists).every(list => 
                    list.children.length > 0 && 
                    Array.from(list.children).every(child => child.tagName === 'LI')
                );
            }
        }
    ];
    
    tests.forEach(test => {
        accessibilityResults.totalTests++;
        if (test.test()) {
            console.log(`✅ ${test.name}`);
            accessibilityResults.passedTests++;
        } else {
            console.log(`❌ ${test.name}`);
            accessibilityResults.failedTests++;
            accessibilityResults.errors.push(`Semantic structure: ${test.name}`);
        }
    });
}

/**
 * Test color contrast compliance
 */
function testColorContrast() {
    console.log('🎨 Testing Color Contrast...');
    
    // Test predefined color combinations from Material Design
    const colorTests = [
        { name: 'Primary text on background', fg: '#1976D2', bg: '#FFFFFF', type: 'normal' },
        { name: 'Secondary text on background', fg: '#388E3C', bg: '#FFFFFF', type: 'normal' },
        { name: 'Error text on background', fg: '#D32F2F', bg: '#FFFFFF', type: 'normal' },
        { name: 'Warning text on background', fg: '#F57C00', bg: '#FFFFFF', type: 'normal' },
        { name: 'Code text on surface', fg: '#000000', bg: '#FAFAFA', type: 'normal' },
        { name: 'Link text on background', fg: '#1976D2', bg: '#FFFFFF', type: 'normal' }
    ];
    
    colorTests.forEach(colorTest => {
        accessibilityResults.totalTests++;
        const ratio = calculateContrastRatio(colorTest.fg, colorTest.bg);
        const required = colorTest.type === 'large' ? CONTRAST_RATIOS.LARGE_TEXT : CONTRAST_RATIOS.NORMAL_TEXT;
        
        if (ratio >= required) {
            console.log(`✅ ${colorTest.name} (${ratio.toFixed(2)}:1)`);
            accessibilityResults.passedTests++;
        } else {
            console.log(`❌ ${colorTest.name} (${ratio.toFixed(2)}:1, required: ${required}:1)`);
            accessibilityResults.failedTests++;
            accessibilityResults.errors.push(`Color contrast: ${colorTest.name} - ${ratio.toFixed(2)}:1`);
        }
    });
}

/**
 * Test keyboard navigation
 */
function testKeyboardNavigation() {
    console.log('⌨️ Testing Keyboard Navigation...');
    
    const tests = [
        {
            name: 'All interactive elements are focusable',
            test: () => {
                const interactive = document.querySelectorAll('a, button, input, select, textarea, [tabindex]');
                return Array.from(interactive).every(el => {
                    const tabIndex = el.getAttribute('tabindex');
                    return tabIndex !== '-1' && !el.disabled;
                });
            }
        },
        {
            name: 'Focus indicators present',
            test: () => {
                // Check if CSS focus styles are defined
                const styles = Array.from(document.styleSheets);
                return styles.some(sheet => {
                    try {
                        const rules = Array.from(sheet.cssRules || sheet.rules || []);
                        return rules.some(rule => 
                            rule.selectorText && rule.selectorText.includes(':focus')
                        );
                    } catch (e) {
                        return false; // Cross-origin stylesheets
                    }
                });
            }
        },
        {
            name: 'Skip links available',
            test: () => {
                const skipLinks = document.querySelectorAll('a[href^="#"]');
                return skipLinks.length > 0;
            }
        }
    ];
    
    tests.forEach(test => {
        accessibilityResults.totalTests++;
        if (test.test()) {
            console.log(`✅ ${test.name}`);
            accessibilityResults.passedTests++;
        } else {
            console.log(`⚠️ ${test.name}`);
            accessibilityResults.warnings++;
            accessibilityResults.warnings.push(`Keyboard navigation: ${test.name}`);
        }
    });
}

/**
 * Test ARIA labels and descriptions
 */
function testARIALabels() {
    console.log('🏷️ Testing ARIA Labels...');
    
    const tests = [
        {
            name: 'Images have alt text or ARIA labels',
            test: () => {
                const images = document.querySelectorAll('img');
                return Array.from(images).every(img => 
                    img.alt || img.getAttribute('aria-label') || img.getAttribute('aria-labelledby')
                );
            }
        },
        {
            name: 'Form inputs have labels',
            test: () => {
                const inputs = document.querySelectorAll('input, select, textarea');
                return Array.from(inputs).every(input => {
                    const id = input.id;
                    return id && document.querySelector(`label[for="${id}"]`) ||
                           input.getAttribute('aria-label') ||
                           input.getAttribute('aria-labelledby');
                });
            }
        },
        {
            name: 'Interactive elements have accessible names',
            test: () => {
                const interactive = document.querySelectorAll('button, a');
                return Array.from(interactive).every(el => 
                    el.textContent.trim() ||
                    el.getAttribute('aria-label') ||
                    el.getAttribute('aria-labelledby') ||
                    el.querySelector('img[alt]')
                );
            }
        }
    ];
    
    tests.forEach(test => {
        accessibilityResults.totalTests++;
        if (test.test()) {
            console.log(`✅ ${test.name}`);
            accessibilityResults.passedTests++;
        } else {
            console.log(`❌ ${test.name}`);
            accessibilityResults.failedTests++;
            accessibilityResults.errors.push(`ARIA labels: ${test.name}`);
        }
    });
}

/**
 * Test responsive design
 */
function testResponsiveDesign() {
    console.log('📱 Testing Responsive Design...');
    
    const tests = [
        {
            name: 'Viewport meta tag present',
            test: () => document.querySelector('meta[name="viewport"]') !== null
        },
        {
            name: 'No horizontal scrolling at mobile widths',
            test: () => {
                // Simulate mobile width
                const originalWidth = window.innerWidth;
                // This is a simplified test - in practice, you'd use browser dev tools
                return document.body.scrollWidth <= 375; // iPhone width
            }
        },
        {
            name: 'Touch targets are adequate size',
            test: () => {
                const interactive = document.querySelectorAll('button, a, input');
                return Array.from(interactive).every(el => {
                    const rect = el.getBoundingClientRect();
                    return rect.width >= 44 && rect.height >= 44; // WCAG recommendation
                });
            }
        }
    ];
    
    tests.forEach(test => {
        accessibilityResults.totalTests++;
        if (test.test()) {
            console.log(`✅ ${test.name}`);
            accessibilityResults.passedTests++;
        } else {
            console.log(`⚠️ ${test.name}`);
            accessibilityResults.warnings++;
            accessibilityResults.warnings.push(`Responsive design: ${test.name}`);
        }
    });
}

/**
 * Test content readability
 */
function testContentReadability() {
    console.log('📖 Testing Content Readability...');
    
    const tests = [
        {
            name: 'Adequate line height',
            test: () => {
                const paragraphs = document.querySelectorAll('p');
                return Array.from(paragraphs).every(p => {
                    const lineHeight = window.getComputedStyle(p).lineHeight;
                    const fontSize = window.getComputedStyle(p).fontSize;
                    const ratio = parseFloat(lineHeight) / parseFloat(fontSize);
                    return ratio >= 1.4; // WCAG recommendation
                });
            }
        },
        {
            name: 'Readable font sizes',
            test: () => {
                const textElements = document.querySelectorAll('p, li, td, th, span');
                return Array.from(textElements).every(el => {
                    const fontSize = window.getComputedStyle(el).fontSize;
                    return parseFloat(fontSize) >= 14; // Minimum readable size
                });
            }
        },
        {
            name: 'Proper text spacing',
            test: () => {
                const paragraphs = document.querySelectorAll('p');
                return Array.from(paragraphs).every(p => {
                    const marginBottom = window.getComputedStyle(p).marginBottom;
                    return parseFloat(marginBottom) > 0;
                });
            }
        }
    ];
    
    tests.forEach(test => {
        accessibilityResults.totalTests++;
        if (test.test()) {
            console.log(`✅ ${test.name}`);
            accessibilityResults.passedTests++;
        } else {
            console.log(`⚠️ ${test.name}`);
            accessibilityResults.warnings++;
            accessibilityResults.warnings.push(`Content readability: ${test.name}`);
        }
    });
}

/**
 * Run all accessibility tests
 */
function runAccessibilityTests() {
    console.log('🧪 Starting Accessibility Validation Tests');
    console.log('==========================================');
    
    testSemanticStructure();
    console.log('');
    
    testColorContrast();
    console.log('');
    
    testKeyboardNavigation();
    console.log('');
    
    testARIALabels();
    console.log('');
    
    testResponsiveDesign();
    console.log('');
    
    testContentReadability();
    console.log('');
    
    // Print summary
    console.log('📊 Accessibility Test Results');
    console.log('============================');
    console.log(`Total Tests: ${accessibilityResults.totalTests}`);
    console.log(`Passed: ${accessibilityResults.passedTests}`);
    console.log(`Failed: ${accessibilityResults.failedTests}`);
    console.log(`Warnings: ${accessibilityResults.warnings}`);
    
    if (accessibilityResults.errors.length > 0) {
        console.log('\n❌ Errors:');
        accessibilityResults.errors.forEach(error => console.log(`  • ${error}`));
    }
    
    if (accessibilityResults.warnings.length > 0) {
        console.log('\n⚠️ Warnings:');
        accessibilityResults.warnings.forEach(warning => console.log(`  • ${warning}`));
    }
    
    const successRate = Math.round((accessibilityResults.passedTests / accessibilityResults.totalTests) * 100);
    console.log(`\nSuccess Rate: ${successRate}%`);
    
    if (successRate >= 90) {
        console.log('🎉 Excellent accessibility compliance!');
    } else if (successRate >= 75) {
        console.log('⚠️ Good accessibility, but improvements needed.');
    } else {
        console.log('❌ Significant accessibility issues found.');
    }
    
    return accessibilityResults;
}

// Export for use in testing environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        runAccessibilityTests,
        calculateContrastRatio,
        CONTRAST_RATIOS
    };
}

// Auto-run if in browser environment
if (typeof window !== 'undefined' && document.readyState === 'complete') {
    runAccessibilityTests();
} else if (typeof window !== 'undefined') {
    window.addEventListener('load', runAccessibilityTests);
}