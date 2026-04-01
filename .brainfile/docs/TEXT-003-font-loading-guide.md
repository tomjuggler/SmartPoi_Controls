# TEXT-003: Font Loading Guide for Text Tab

## Overview
This document describes the font loading implementation for the Text tab, including the FontFace API usage, error handling, and fallback strategies.

## Font Loading Architecture

### 1. Font Source
- **File**: `www/font.otf`
- **Path**: Relative path `./font.otf`
- **Format**: OpenType Font (OTF)
- **Loading Method**: FontFace API with Promise-based loading

### 2. Loading Sequence
```javascript
// 1. Check if already loading or loaded
if (state.fontLoading || state.fontLoaded) return;

// 2. Set loading state and update UI
state.fontLoading = true;
updateFontStatus('Loading font...');

// 3. Create FontFace object
const font = new FontFace('CustomFont', 'url(./font.otf)');

// 4. Load font
font.load()
    .then(function(loadedFont) {
        // 5. Add to document fonts
        document.fonts.add(loadedFont);
        
        // 6. Update state
        state.fontLoaded = true;
        state.fontLoading = false;
        updateFontStatus('Font loaded ✓');
        
        // 7. Redraw text if needed
        if (state.currentText) {
            renderText();
        }
    })
    .catch(function(error) {
        // 8. Handle loading failure
        console.error('Font loading error:', error);
        state.fontLoaded = false;
        state.fontLoading = false;
        updateFontStatus('Using system font');
        
        // 9. Fallback to system font
        state.fontName = 'Arial, sans-serif';
        
        // 10. Redraw with fallback font
        if (state.currentText) {
            renderText();
        }
    });
```

### 3. State Management
```javascript
const state = {
    fontLoaded: false,      // Whether font is successfully loaded
    fontLoading: false,     // Whether font is currently loading
    fontName: 'CustomFont'  // Current font name (custom or fallback)
};
```

### 4. UI Feedback
- **Loading**: "Loading font..."
- **Success**: "Font loaded ✓"
- **Failure**: "Using system font"
- **Display**: Updated in real-time via `updateFontStatus()`

## Error Handling Strategies

### 1. Font Loading Failures
**Causes**:
- Font file not found or inaccessible
- Network issues in Cordova environment
- Font format incompatibility
- CORS restrictions (in browser context)

**Handling**:
```javascript
.catch(function(error) {
    console.error('Font loading error:', error);
    state.fontLoaded = false;
    state.fontLoading = false;
    updateFontStatus('Using system font');
    state.fontName = 'Arial, sans-serif';
    
    // Continue with fallback font
    if (state.currentText) {
        renderText();
    }
});
```

### 2. Font Rendering Failures
**Causes**:
- Font loaded but rendering fails
- Canvas context issues
- Memory constraints

**Handling**:
- Fallback to system font during rendering
- Graceful degradation of text quality
- User notification of rendering issues

### 3. Performance Considerations
- **Caching**: Font is cached by browser after first load
- **Lazy Loading**: Font loads only when Text tab is active
- **Memory**: Single font instance shared across application

## Cordova-Specific Considerations

### 1. File System Access
- **Cordova File Path**: Use `cordova.file.applicationDirectory + 'www/font.otf'`
- **Current Approach**: Relative path `./font.otf` (works in Cordova WebView)
- **Testing**: Verify font loads on actual Android device

### 2. WebView Compatibility
- **Android WebView**: Supports FontFace API (Android 5.0+)
- **iOS UIWebView/WKWebView**: Supports FontFace API
- **Testing**: Test on target Cordova platforms

### 3. Performance on Mobile
- **Font Size**: OTF file should be optimized for mobile
- **Loading Time**: Measure font loading time on target devices
- **Memory Usage**: Monitor memory impact of font loading

## Fallback Font Strategy

### 1. Primary Fallback Chain
```javascript
const fallbackFonts = [
    'CustomFont',           // Primary custom font
    'Arial, sans-serif',    // Primary fallback
    'Helvetica, sans-serif', // Secondary fallback
    'sans-serif'           // Generic fallback
];
```

### 2. Dynamic Font Selection
```javascript
function getCurrentFont() {
    if (state.fontLoaded) {
        return state.fontName;
    } else {
        return 'Arial, sans-serif';
    }
}

// Usage in rendering
ctx.font = `${fontSize}px ${getCurrentFont()}`;
```

### 3. Visual Consistency
- **Font Metrics**: System fonts may have different metrics
- **Text Wrapping**: Adjust wrapping algorithm for different fonts
- **Size Calibration**: Test with both custom and fallback fonts

## Testing Procedures

### 1. Font Loading Tests
```javascript
// Test 1: Successful font loading
test('Font loads successfully', async () => {
    await TextTab.loadFont();
    expect(TextTab.state.fontLoaded).toBe(true);
});

// Test 2: Font loading failure
test('Font loading falls back gracefully', async () => {
    // Mock font loading failure
    jest.spyOn(FontFace.prototype, 'load').mockRejectedValue(new Error('Font load failed'));
    
    await TextTab.loadFont();
    expect(TextTab.state.fontLoaded).toBe(false);
    expect(TextTab.state.fontName).toBe('Arial, sans-serif');
});
```

### 2. Rendering Tests
```javascript
// Test: Text renders with fallback font
test('Text renders with fallback font', () => {
    TextTab.state.fontLoaded = false;
    TextTab.state.fontName = 'Arial, sans-serif';
    TextTab.state.currentText = 'Test';
    
    TextTab.renderText();
    
    // Verify canvas has content
    const canvas = document.getElementById('textCanvas');
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    expect(hasNonBlackPixels(imageData)).toBe(true);
});
```

### 3. Performance Tests
- **Load Time**: Measure font loading time on target devices
- **Memory Usage**: Monitor memory before/after font loading
- **Rendering Speed**: Measure text rendering performance

## Integration with Text Rendering

### 1. Font-Dependent Calculations
```javascript
function calculateOptimalFontSize(text, maxWidth, maxHeight) {
    const ctx = state.ctx;
    
    // Use current font (custom or fallback)
    for (let size = maxFontSize; size >= minFontSize; size--) {
        ctx.font = `${size}px ${state.fontName}`;
        // ... size calculation logic
    }
}
```

### 2. Real-time Updates
- Font loading triggers automatic re-rendering
- Font failure triggers fallback and re-rendering
- UI updates reflect font loading state

### 3. User Experience
- **Transparent**: Users may not notice font loading
- **Informative**: Status messages explain what's happening
- **Resilient**: System font ensures functionality even if custom font fails

## Troubleshooting Guide

### Common Issues and Solutions

#### 1. Font Not Loading
**Symptoms**:
- "Using system font" status persists
- Text renders in default font
- Console shows font loading errors

**Solutions**:
- Verify `font.otf` exists in `www/` directory
- Check file permissions in Cordova build
- Test with absolute file path in Cordova
- Verify font file is not corrupted

#### 2. Slow Font Loading
**Symptoms**:
- Long delay before text renders
- "Loading font..." status for several seconds

**Solutions**:
- Optimize OTF file size
- Consider pre-loading font on app startup
- Implement loading indicator
- Cache font after first load

#### 3. Rendering Issues
**Symptoms**:
- Text appears blurry or pixelated
- Text wrapping incorrect
- Font metrics seem off

**Solutions**:
- Test with different font sizes
- Adjust text wrapping algorithm
- Verify canvas resolution
- Test on target device screen densities

## Conclusion
The font loading implementation provides a robust solution for custom font rendering in the Text tab, with comprehensive error handling and fallback strategies. The system ensures text rendering works reliably even if the custom font fails to load, maintaining functionality while providing the best possible user experience.

