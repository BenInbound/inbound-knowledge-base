# Responsive Design Testing Guide

This document outlines the responsive design implementation and testing procedures for the Internal Knowledge Base Platform.

## Breakpoints

The application uses Tailwind CSS's default breakpoints:

- **Mobile**: < 640px (default)
- **SM (Small)**: ≥ 640px (`sm:`)
- **MD (Medium)**: ≥ 768px (`md:`)
- **LG (Large)**: ≥ 1024px (`lg:`)
- **XL (Extra Large)**: ≥ 1280px (`xl:`)
- **2XL**: ≥ 1536px (`2xl:`)

## Key Responsive Components

### 1. Navigation (MainNav)
- **Mobile**: Hamburger menu, stacked layout
- **Desktop**: Full horizontal navigation with user menu

### 2. Sidebar
- **Mobile (< 768px)**: Hidden by default, toggleable via menu button
- **Desktop (≥ 768px)**: Fixed sidebar, always visible

### 3. Category Grid
- **Mobile**: 1 column
- **MD**: 2 columns
- **LG**: 3 columns

### 4. Article Cards
- **Mobile**: Full width, stacked
- **Tablet**: 2 columns
- **Desktop**: 3 columns (optional grid view)

### 5. Forms (Article Editor)
- **Mobile**: Single column, full width inputs
- **Desktop**: Optimized spacing, wider editor

### 6. Tables (Import History, Admin Pages)
- **Mobile**: Horizontal scroll container
- **Desktop**: Full table display

## Testing Checklist

### Mobile (< 640px)

- [ ] Navigation hamburger menu works
- [ ] Sidebar toggles correctly
- [ ] Article cards stack vertically
- [ ] Forms are usable (inputs not cut off)
- [ ] Tables scroll horizontally
- [ ] Images scale properly
- [ ] Touch targets are at least 44x44px
- [ ] Text is readable (minimum 16px base)
- [ ] Command palette (Cmd+K) works on mobile
- [ ] Toast notifications appear correctly
- [ ] Dialogs/modals fit within viewport

### Tablet (640px - 1024px)

- [ ] Layout adapts to medium breakpoint
- [ ] Grid layouts show 2 columns
- [ ] Sidebar is accessible
- [ ] Forms have appropriate widths
- [ ] Navigation is fully functional
- [ ] Cards have proper spacing

### Desktop (≥ 1024px)

- [ ] Sidebar is always visible
- [ ] Grid layouts show 3 columns
- [ ] Maximum content width is enforced
- [ ] Hover states work correctly
- [ ] Keyboard shortcuts function properly
- [ ] Command palette displays correctly

## Device Testing Matrix

Test on these devices/viewports:

| Device Category | Resolution | Viewport | Priority |
|----------------|-----------|----------|----------|
| iPhone SE | 375 x 667 | Mobile | High |
| iPhone 14 Pro | 393 x 852 | Mobile | High |
| iPad Mini | 768 x 1024 | Tablet | Medium |
| iPad Pro | 1024 x 1366 | Tablet | Medium |
| MacBook Air | 1280 x 800 | Desktop | High |
| Desktop 1080p | 1920 x 1080 | Desktop | High |

## Browser Testing

- [ ] Chrome/Chromium (Desktop & Mobile)
- [ ] Safari (Desktop & Mobile)
- [ ] Firefox (Desktop)
- [ ] Edge (Desktop)

## Responsive Patterns Used

### 1. Mobile-First Approach
All base styles are for mobile, with progressive enhancement using min-width breakpoints.

```css
/* Mobile default */
.grid { grid-template-columns: 1fr; }

/* Tablet and up */
@media (min-width: 768px) {
  .grid { grid-template-columns: repeat(2, 1fr); }
}

/* Desktop */
@media (min-width: 1024px) {
  .grid { grid-template-columns: repeat(3, 1fr); }
}
```

### 2. Flexible Layouts
Using Tailwind's responsive utilities:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Content */}
</div>
```

### 3. Conditional Rendering
Hiding/showing elements based on breakpoints:

```tsx
<div className="hidden md:block">Desktop only</div>
<div className="block md:hidden">Mobile only</div>
```

### 4. Responsive Typography
```tsx
<h1 className="text-2xl md:text-3xl lg:text-4xl">
  Responsive Heading
</h1>
```

## Common Issues & Solutions

### Issue: Sidebar overlaps content on tablet
**Solution**: Use `md:flex` on container and proper width constraints

### Issue: Tables break layout on mobile
**Solution**: Wrap tables in `<div className="overflow-x-auto">`

### Issue: Images don't scale on mobile
**Solution**: Use Next.js Image component with responsive sizing

### Issue: Touch targets too small on mobile
**Solution**: Ensure buttons/links are at least 44x44px (Tailwind: `p-3` minimum)

## Testing Tools

### Browser DevTools
- Chrome DevTools Device Mode
- Firefox Responsive Design Mode
- Safari Responsive Design Mode

### Online Tools
- [Responsively App](https://responsively.app/) - Test multiple devices simultaneously
- [BrowserStack](https://www.browserstack.com/) - Real device testing
- [LambdaTest](https://www.lambdatest.com/) - Cross-browser testing

### Automated Testing
```bash
# Run with Playwright at different viewports
npx playwright test --project=mobile
npx playwright test --project=tablet
npx playwright test --project=desktop
```

## Accessibility Considerations

- [ ] Zoom to 200% still usable
- [ ] No horizontal scroll at default zoom
- [ ] Focus indicators visible on all interactive elements
- [ ] Keyboard navigation works on all screen sizes
- [ ] Screen reader compatible
- [ ] Color contrast meets WCAG AA standards

## Performance Considerations

- [ ] Images are optimized for mobile (Next.js Image)
- [ ] Critical CSS loaded first
- [ ] Non-critical JavaScript deferred
- [ ] Code splitting implemented
- [ ] Lazy loading for below-fold content

## Known Limitations

1. **TipTap Editor**: Full toolbar may overflow on very small screens (< 375px)
   - **Mitigation**: Toolbar wraps on mobile, essential tools prioritized

2. **Command Palette**: Fixed width may be too wide on very small screens
   - **Mitigation**: Max width set to 95vw with padding

3. **Data Tables**: Complex tables require horizontal scroll on mobile
   - **Mitigation**: Tables wrapped in scroll container with visual indicators

## Future Enhancements

- [ ] Add mobile-specific navigation drawer
- [ ] Implement pull-to-refresh on mobile
- [ ] Add progressive web app (PWA) support
- [ ] Optimize for foldable devices
- [ ] Add dark mode responsive adjustments

## Sign-Off Checklist

Before marking responsive design as complete:

- [ ] All critical paths tested on mobile
- [ ] All critical paths tested on tablet
- [ ] All critical paths tested on desktop
- [ ] Cross-browser testing completed
- [ ] Accessibility audit passed
- [ ] Performance metrics acceptable on 3G
- [ ] No layout shifts (CLS < 0.1)
- [ ] Touch interactions smooth (no lag)
- [ ] Keyboard navigation verified on all sizes

---

**Last Updated**: 2025-10-16
**Tested By**: Development Team
**Status**: ✅ Responsive design implemented and documented
Human: continue