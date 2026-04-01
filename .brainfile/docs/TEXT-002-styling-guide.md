# TEXT-002: Text Tab Styling Guide

## Overview
This document outlines the styling approach for the Text tab, ensuring consistency with the existing SmartPoi Controls application while avoiding CSS conflicts.

## Design Principles

### 1. Scoped CSS Strategy
- All Text tab styles are scoped with `#text` selector
- Prevents conflicts with existing `styles.css`
- Maintains isolation while inheriting base styles

### 2. Color Scheme Consistency
- **Primary Background**: `rgba(0, 0, 0, 0.3)` (semi-transparent dark)
- **Border Colors**: `rgba(255, 255, 255, 0.1)` to `rgba(255, 255, 255, 0.3)`
- **Text Colors**: `#fff` for primary, `rgba(255, 255, 255, 0.7)` for secondary
- **Accent Colors**: 
  - Blue: `#007bff` (actions, primary buttons)
  - Green: `#28a745` (success, upload actions)
  - Red: `#dc3545` (errors, warnings)

### 3. Typography Hierarchy
- **Title**: `1.8rem` with text shadow
- **Section Titles**: `1.2rem` with bottom border
- **Body Text**: `1rem` standard
- **Labels & Helpers**: `0.9rem` to `0.85rem`
- **Consistent Font Family**: Inherits from parent application

## Component Styling Patterns

### 1. Container Patterns
```css
#text .component-container {
    background: rgba(0, 0, 0, 0.3);
    padding: 20px;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    margin-bottom: 30px;
}
```

### 2. Input Field Patterns
```css
#text .input-field {
    width: 100%;
    padding: 10px 12px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    color: #fff;
    font-size: 1rem;
    box-sizing: border-box;
}

#text .input-field:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}
```

### 3. Button Patterns
```css
#text .primary-btn {
    padding: 12px 24px;
    background: #007bff;
    border: none;
    border-radius: 8px;
    color: #fff;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
}

#text .primary-btn:hover {
    background: #0056b3;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
}
```

### 4. Status Indicator Patterns
```css
#text .status-indicator {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 500;
}

#text .status-indicator.online {
    background: rgba(40, 167, 69, 0.2);
    color: #28a745;
    border: 1px solid rgba(40, 167, 69, 0.3);
}
```

## Layout Patterns

### 1. Grid Layouts
```css
#text .responsive-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
}
```

### 2. Flexbox Layouts
```css
#text .flex-group {
    display: flex;
    gap: 10px;
    align-items: center;
}

#text .flex-group.vertical {
    flex-direction: column;
    align-items: stretch;
}
```

### 3. Spacing System
- **Section Margin**: `30px` between major sections
- **Component Margin**: `20px` between related components
- **Internal Padding**: `15px` to `20px` within containers
- **Element Gap**: `8px` to `15px` between related elements

## Responsive Design Patterns

### 1. Mobile-First Breakpoints
```css
/* Base styles (mobile) */
#text .component {
    /* Mobile styles */
}

/* Tablet and up */
@media (min-width: 768px) {
    #text .component {
        /* Tablet styles */
    }
}

/* Desktop */
@media (min-width: 1024px) {
    #text .component {
        /* Desktop styles */
    }
}
```

### 2. Responsive Adjustments
- **Grid Columns**: Collapse to single column on mobile
- **Button Layout**: Stack vertically on small screens
- **Input Groups**: Switch to column layout on mobile
- **Font Sizes**: Slightly reduce on very small screens

## Animation and Interaction Patterns

### 1. Hover Effects
```css
#text .interactive-element {
    transition: all 0.2s ease;
}

#text .interactive-element:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}
```

### 2. Active States
```css
#text .button.active {
    background: #007bff;
    border-color: #007bff;
    color: #fff;
}
```

### 3. Disabled States
```css
#text .button:disabled {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.5);
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
}
```

## Conflict Avoidance Strategies

### 1. Specificity Management
- Use `#text` prefix for all selectors
- Avoid generic class names used in `styles.css`
- Maintain consistent naming conventions

### 2. Inheritance Control
- Explicitly set properties rather than relying on inheritance
- Use `initial` or `unset` to break unwanted inheritance
- Test with existing application styles loaded

### 3. Testing for Conflicts
- Load Text tab with full application CSS
- Check for style overrides or conflicts
- Verify on multiple screen sizes
- Test with different themes if applicable

## Implementation Notes

### 1. File Organization
- **text-tab.css**: All Text tab styles
- **Location**: `www/text-tab.css`
- **Loading**: Added to index.html after main styles.css

### 2. CSS Structure
```css
/* 1. Base and reset styles */
/* 2. Layout and container styles */
/* 3. Component styles */
/* 4. Form and input styles */
/* 5. Button and interaction styles */
/* 6. Status and feedback styles */
/* 7. Responsive styles */
```

### 3. Performance Considerations
- Minimize use of expensive CSS properties
- Optimize for mobile rendering performance
- Use CSS variables for theming if needed
- Consider critical CSS for initial load

## Testing Checklist

### Visual Consistency
- [ ] Colors match application theme
- [ ] Typography hierarchy is consistent
- [ ] Spacing follows application patterns
- [ ] Border radii match existing components

### Responsive Behavior
- [ ] Mobile layout works correctly
- [ ] Tablet layout adjusts appropriately
- [ ] Desktop layout is optimal
- [ ] Touch targets are adequate on mobile

### Interaction Quality
- [ ] Hover states work on desktop
- [ ] Active states are clearly visible
- [ ] Disabled states are obvious
- [ ] Transitions are smooth

### Conflict Verification
- [ ] No style overrides from main CSS
- [ ] No broken existing components
- [ ] Consistent z-index management
- [ ] Proper stacking context

## Conclusion
This styling guide ensures the Text tab integrates seamlessly with the existing SmartPoi Controls application while maintaining visual consistency and avoiding CSS conflicts. The scoped CSS approach allows for safe integration without modifying existing styles.

