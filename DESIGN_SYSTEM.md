# Bridezilla Design System (v3.0 - Optimized for Claude Code)

**Last Updated:** February 24, 2026
**Version:** 3.4

---

## 🎯 CRITICAL RULES

**Workspace Routes (`/planner/*`, `/admin/*`):**
- ✅ ALWAYS use `const theme = useThemeStyles()` hook
- ✅ ALWAYS use theme tokens: `${theme.primaryButton}`, `${theme.textPrimary}`, etc.
- ❌ NEVER hardcode colors: `bg-bridezilla-pink`, `text-gray-600`, `bg-stone-100`
- ❌ NEVER use Tailwind color classes directly in components
- 🎨 Supports TWO themes: Pop (pink) and Heirloom (dark green)

**Wedding Website Routes (`/shared/*`):**
- ✅ ALWAYS use `const theme = useThemeStyles()` hook
- 🔒 Theme locked to Heirloom (cream/dark green)
- Same token usage as workspace routes

**Status Badges:**
- Use fixed colors (emerald/amber/red) - these don't use theme tokens
- Status colors convey semantic meaning across both themes

**Exceptions:**
- Destructive (red) buttons use fixed color
- Status badges use fixed colors
- Everything else uses theme tokens

---

## 📋 Quick Reference (Copy-Paste Patterns)

### Standard Import

```tsx
'use client'

import { useThemeStyles } from '@/hooks/useThemeStyles'

export default function YourComponent() {
  const theme = useThemeStyles()

  // Use theme tokens below...
}
```

### Theme Tokens Cheat Sheet

| Element | Token | Usage |
|---------|-------|-------|
| **Backgrounds** | | |
| Page | `${theme.pageBackground}` | Main page backdrop |
| Card | `${theme.cardBackground}` | Cards, modals, panels |
| **Buttons** | | |
| Primary | `${theme.primaryButton} ${theme.textOnPrimary} ${theme.primaryButtonHover}` | Main CTAs |
| Secondary | `${theme.secondaryButton} ${theme.textSecondary} ${theme.secondaryButtonHover}` | Cancel, Back |
| **Text** | | |
| Primary | `${theme.textPrimary}` | Headings, emphasized |
| Secondary | `${theme.textSecondary}` | Body text |
| Muted | `${theme.textMuted}` | Helper text |
| On Primary | `${theme.textOnPrimary}` | Text on colored backgrounds |
| **Borders** | | |
| Border | `${theme.border} ${theme.borderWidth}` | Card borders, dividers |
| **Navigation** | | |
| Active | `${theme.navActive}` | Active nav item |
| Inactive | `${theme.navInactive}` | Inactive nav item |
| Hover | `${theme.navHover}` | Hover state |

### Complete Component Example

```tsx
'use client'

import { useThemeStyles } from '@/hooks/useThemeStyles'
import { Save, X } from 'lucide-react'

export default function ExampleCard({ title, description }: {
  title: string
  description: string
}) {
  const theme = useThemeStyles()

  return (
    <div className={`${theme.cardBackground} rounded-2xl p-6 border ${theme.border} ${theme.borderWidth}`}>
      {/* Header */}
      <h2 className={`text-xl font-semibold ${theme.textPrimary} mb-2`}>
        {title}
      </h2>
      <p className={`${theme.textSecondary} mb-6`}>
        {description}
      </p>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          className={`flex items-center gap-2 px-4 py-2 ${theme.primaryButton}
                     ${theme.textOnPrimary} ${theme.primaryButtonHover}
                     rounded-lg text-sm font-medium transition-colors`}
        >
          <Save className="w-4 h-4" />
          Save Changes
        </button>

        <button
          className={`flex items-center gap-2 px-4 py-2 ${theme.secondaryButton}
                     ${theme.textSecondary} ${theme.secondaryButtonHover}
                     rounded-lg text-sm font-medium transition-colors`}
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
      </div>
    </div>
  )
}
```

### Common Patterns

**Page Layout:**
```tsx
<div className={`${theme.pageBackground} min-h-screen p-8`}>
  <div className={`${theme.cardBackground} rounded-2xl p-6 border ${theme.border}`}>
    Content
  </div>
</div>
```

**Primary Button:**
```tsx
<button className={`${theme.primaryButton} ${theme.textOnPrimary}
                   ${theme.primaryButtonHover} px-4 py-2 rounded-lg
                   text-sm font-medium transition-colors`}>
  Save
</button>
```

**Secondary Button:**
```tsx
<button className={`${theme.secondaryButton} ${theme.textSecondary}
                   ${theme.secondaryButtonHover} px-4 py-2 rounded-lg
                   text-sm font-medium transition-colors`}>
  Cancel
</button>
```

**Text Hierarchy:**
```tsx
<h2 className={`text-xl font-semibold ${theme.textPrimary}`}>Heading</h2>
<p className={theme.textSecondary}>Body text</p>
<span className={`text-sm ${theme.textMuted}`}>Helper text</span>
```

**Navigation:**
```tsx
<nav>
  <a className={`${isActive ? theme.navActive : theme.navInactive} ${theme.navHover}`}>
    Dashboard
  </a>
</nav>
```

---

## ❌ Anti-Patterns (Wrong → Right)

| Pattern | ❌ Wrong (Hardcoded) | ✅ Right (Theme Tokens) | Impact |
|---------|---------------------|------------------------|---------|
| **Primary Button** | `bg-bridezilla-pink text-white` | `${theme.primaryButton} ${theme.textOnPrimary}` | Breaks theme switching |
| **Secondary Button** | `bg-gray-100 text-gray-600` | `${theme.secondaryButton} ${theme.textSecondary}` | Wrong colors in Heirloom |
| **Card Background** | `bg-white` | `${theme.cardBackground}` | Not theme-aware |
| **Card Border** | `border border-gray-200` | `border ${theme.border}` | Wrong border color |
| **Heading Text** | `text-stone-900` | `${theme.textPrimary}` | Not semantic |
| **Body Text** | `text-gray-600` | `${theme.textSecondary}` | Wrong gray tone |
| **Helper Text** | `text-gray-400` | `${theme.textMuted}` | Not theme-aware |
| **Page Background** | `bg-stone-50` | `${theme.pageBackground}` | Wrong in Heirloom |
| **Active Nav** | `text-bridezilla-orange` | `${theme.navActive}` | Hardcoded color |
| **Inactive Nav** | `text-stone-500` | `${theme.navInactive}` | Not semantic |

### Common Mistake: Missing Import

```tsx
// ❌ WRONG - No theme hook
export default function Card() {
  return <div className="bg-white p-6">Content</div>
}

// ✅ RIGHT - Uses theme hook
'use client'
import { useThemeStyles } from '@/hooks/useThemeStyles'

export default function Card() {
  const theme = useThemeStyles()
  return <div className={`${theme.cardBackground} p-6`}>Content</div>
}
```

### Common Mistake: Mixing Tokens and Hardcoded

```tsx
// ❌ WRONG - Mixed approach
<button className={`${theme.primaryButton} text-white px-4 py-2`}>
  Save
</button>

// ✅ RIGHT - All tokens
<button className={`${theme.primaryButton} ${theme.textOnPrimary} px-4 py-2`}>
  Save
</button>
```

---

## 🎨 Component Patterns

### Buttons

**Primary Button:**
```tsx
const theme = useThemeStyles()

<button className={`${theme.primaryButton} ${theme.textOnPrimary}
                   ${theme.primaryButtonHover} px-4 py-2 rounded-lg
                   text-sm font-medium transition-colors`}>
  Save Changes
</button>
```

**Secondary Button:**
```tsx
<button className={`${theme.secondaryButton} ${theme.textSecondary}
                   ${theme.secondaryButtonHover} px-4 py-2 rounded-lg
                   text-sm font-medium transition-colors`}>
  Cancel
</button>
```

**Destructive Button (Exception - Fixed Color):**
```tsx
<button className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm
                   font-medium hover:bg-red-700 transition-colors">
  Delete
</button>
```

**Icon Button:**
```tsx
import { Edit } from 'lucide-react'

<button className={`p-2 rounded-lg ${theme.textSecondary}
                   hover:bg-stone-100 transition-colors`}
        aria-label="Edit">
  <Edit className="w-4 h-4" />
</button>
```

### Cards

**Standard Card:**
```tsx
const theme = useThemeStyles()

<div className={`${theme.cardBackground} rounded-2xl p-6 border
                ${theme.border} ${theme.borderWidth} hover:shadow-lg
                transition-all`}>
  <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-2`}>
    Card Title
  </h3>
  <p className={theme.textSecondary}>
    Card description text goes here
  </p>
</div>
```

**Stats Card:**
```tsx
const theme = useThemeStyles()

<div className={`${theme.cardBackground} rounded-2xl p-6 border
                ${theme.border} hover:shadow-sm transition-all`}>
  <div className="p-2 rounded-lg bg-emerald-50 inline-block mb-4">
    <CheckCircle className="w-5 h-5 text-emerald-600" />
  </div>
  <p className={`text-xs font-medium ${theme.textMuted} uppercase tracking-widest mb-2`}>
    Metric Name
  </p>
  <p className={`text-3xl font-semibold ${theme.textPrimary}`}>
    42
  </p>
</div>
```

### Modals

All modals use the **adaptive overlay system** via `useModalSize` + `getModalClasses`. This measures the modal's natural content height and classifies it as small or large relative to the viewport, keeping the implementation future-proof.

**Overlay behaviour (both small and large):**
- `fixed inset-0` - covers the full viewport including nav
- `bg-black/60` - semi-transparent dark scrim
- No backdrop blur on either size
- `z-[9999]` - above all page content
- Modal card: `max-h-[95vh]`, scrollable content area

**Required setup:**
- Always use `createPortal(..., document.body)` to escape parent stacking contexts
- Add a `mounted` state and `if (!mounted) return null` guard before the portal
- Declare `mounted` state **before** calling `useModalSize(mounted)`

```tsx
'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import { useModalSize, getModalClasses } from '@/hooks/useModalSize'

interface MyModalProps {
  onClose: () => void
}

export default function MyModal({ onClose }: MyModalProps) {
  const theme = useThemeStyles()
  const [mounted, setMounted] = useState(false)
  const { headerRef, contentRef, footerRef, isLargeModal } = useModalSize(mounted)
  const { overlay: overlayClass, maxH: maxHClass } = getModalClasses(isLargeModal)

  useEffect(() => {
    setMounted(true)
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = 'unset' }
  }, [])

  if (!mounted) return null

  return createPortal(
    <div
      className={`${overlayClass} bg-black/60 z-[9999] flex items-center justify-center p-4`}
      onClick={onClose}
    >
      <div
        className={`${theme.cardBackground} rounded-2xl shadow-2xl max-w-2xl w-full ${maxHClass} border ${theme.border} overflow-hidden flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - measured for size detection */}
        <div ref={headerRef} className={`${theme.cardBackground} border-b ${theme.border} px-8 py-6 flex justify-between items-center flex-shrink-0`}>
          <h3 className={`font-display text-2xl md:text-3xl ${theme.textPrimary}`}>
            Modal Title
          </h3>
          <button onClick={onClose} className={`${theme.textMuted} hover:${theme.textSecondary} transition-colors`}>
            <X size={20} />
          </button>
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto">
          {/* Inner wrapper measured for size detection - NOT the flex-1 outer */}
          <div ref={contentRef} className="px-8 py-8 space-y-4">
            <p className={theme.textSecondary}>Modal content here</p>
          </div>
        </div>

        {/* Footer - measured for size detection */}
        <div ref={footerRef} className={`${theme.cardBackground} border-t ${theme.border} px-8 py-6 flex gap-3 justify-end flex-shrink-0`}>
          <button
            onClick={onClose}
            className={`px-6 py-2.5 ${theme.secondaryButton} ${theme.textSecondary} ${theme.secondaryButtonHover} rounded-xl text-sm font-medium transition-colors`}
          >
            Cancel
          </button>
          <button
            className={`px-6 py-2.5 ${theme.primaryButton} ${theme.textOnPrimary} ${theme.primaryButtonHover} rounded-xl text-sm font-medium transition-colors`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
```

**Key rules:**
- `ref={headerRef}` on the header div (flex-shrink-0)
- `ref={contentRef}` on the **inner** wrapper div inside `flex-1 overflow-y-auto` — not the outer flex-1 div (its clientHeight reflects flex-assigned height, not content height)
- `ref={footerRef}` on the sticky footer div (flex-shrink-0), omit if no separate footer
- If modal has no `isOpen` prop (always rendered when mounted), use `useModalSize(mounted)`
- If modal has an `isOpen` prop, use `useModalSize(isOpen)` instead of the mounted pattern

**Anti-patterns:**
```tsx
// ❌ WRONG - hardcoded overlay, no portal, blur
<div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]">

// ✅ RIGHT - adaptive overlay, portal, no blur
return createPortal(
  <div className={`${overlayClass} bg-black/60 z-[9999] ...`}>,
  document.body
)
```

### Forms

**Input Field:**
```tsx
const theme = useThemeStyles()

<div>
  <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
    Field Label
  </label>
  <input
    type="text"
    className={`w-full px-4 py-2 border ${theme.border} rounded-lg
               ${theme.textPrimary} focus:outline-none focus:ring-2
               focus:ring-offset-0 transition-all`}
    placeholder="Enter value..."
  />
</div>
```

**Select Dropdown:**
```tsx
<select className={`w-full px-4 py-2 border ${theme.border} rounded-lg
                   ${theme.textPrimary} focus:outline-none focus:ring-2`}>
  <option>Option 1</option>
  <option>Option 2</option>
</select>
```

### Tables

```tsx
const theme = useThemeStyles()

<div className={`${theme.cardBackground} rounded-xl shadow-lg overflow-hidden`}>
  <table className="w-full">
    <thead className={`bg-stone-100 border-b ${theme.border}`}>
      <tr>
        <th className={`px-4 py-3 text-left text-xs font-bold
                       ${theme.textSecondary} uppercase tracking-wider`}>
          Name
        </th>
        <th className={`px-4 py-3 text-left text-xs font-bold
                       ${theme.textSecondary} uppercase tracking-wider`}>
          Status
        </th>
      </tr>
    </thead>
    <tbody className={`divide-y ${theme.border}`}>
      <tr className="hover:bg-stone-50 cursor-pointer transition-colors">
        <td className={`px-4 py-3 text-sm ${theme.textPrimary}`}>
          John Doe
        </td>
        <td className={`px-4 py-3 text-sm ${theme.textSecondary}`}>
          Active
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

### Navigation

```tsx
const theme = useThemeStyles()

<nav className="flex gap-6">
  <a
    className={`text-sm font-medium transition-colors ${
      isActive ? theme.navActive : theme.navInactive
    } ${theme.navHover}`}
  >
    Dashboard
  </a>
  <a
    className={`text-sm font-medium transition-colors ${
      isActive ? theme.navActive : theme.navInactive
    } ${theme.navHover}`}
  >
    Vendors
  </a>
</nav>
```

---

## 📱 Mobile & Responsive Design

### Core Principles

**Mobile-First Approach:**
- Base classes apply to mobile (< 768px)
- Use `md:` prefix for tablet/desktop (≥ 768px)
- Use `sm:` prefix for small screens (≥ 640px)
- Desktop layouts should remain unchanged when adding mobile optimizations

**Key Breakpoints:**
- Mobile: `< 640px` (base classes)
- Small: `sm:` (≥ 640px)
- Medium/Desktop: `md:` (≥ 768px)
- Large: `lg:` (≥ 1024px)

### Grid Layouts

**Stat Cards Pattern:**
```tsx
// 2 columns on mobile, 4 on desktop
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
  {/* Stat cards */}
</div>
```

**Content Cards:**
```tsx
// 2 columns on mobile, 3 on desktop, 4 on large screens
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
  {/* Content cards */}
</div>
```

**Even Distribution (3 items):**
```tsx
// 3 columns that fit evenly on mobile
<div className="grid grid-cols-3 gap-4 md:gap-16">
  <div className="text-center">
    <div className={`text-2xl md:text-4xl font-semibold ${theme.textPrimary}`}>42</div>
    <div className={`text-[9px] md:text-[11px] ${theme.textMuted} uppercase`}>Label</div>
  </div>
</div>
```

### Responsive Typography

**Headings:**
```tsx
// Mobile smaller, desktop larger
<h1 className={`text-xl md:text-3xl font-display ${theme.textPrimary}`}>
  Welcome back
</h1>
```

**Body Text:**
```tsx
// Smaller on mobile for better fit
<p className={`text-sm md:text-base ${theme.textSecondary}`}>
  Description text
</p>
```

**Micro Text (Labels):**
```tsx
// Extra small on mobile, still readable
<span className={`text-[9px] md:text-[11px] ${theme.textMuted} uppercase tracking-[0.12em] md:tracking-[0.15em]`}>
  Label Text
</span>
```

### Filter Layouts (Separate Mobile/Desktop)

**Pattern:** Create two separate layouts - one for mobile (stacked), one for desktop (horizontal)

```tsx
const theme = useThemeStyles()

<div className={`${theme.cardBackground} rounded-2xl p-6`}>
  {/* Mobile: Stacked Layout */}
  <div className="md:hidden space-y-3">
    {/* Search - full width */}
    <input
      type="text"
      className={`w-full px-4 py-2 border ${theme.border} rounded-xl`}
      placeholder="Search..."
    />

    {/* Filters Row */}
    <div className="flex gap-2">
      <select className="flex-1">
        <option>All Types</option>
      </select>
      <select className="flex-1">
        <option>All Filters</option>
      </select>
    </div>

    {/* Buttons Row */}
    <div className="flex gap-2">
      <button className={`${theme.secondaryButton} flex-1`}>
        Action 1
      </button>
      <button className={`${theme.primaryButton} ${theme.textOnPrimary} flex-1`}>
        Action 2
      </button>
    </div>
  </div>

  {/* Desktop: Original Horizontal Layout */}
  <div className="hidden md:flex flex-wrap gap-4 items-center justify-between">
    <div className="flex gap-4 flex-1">
      <input
        type="text"
        className={`min-w-[200px] px-4 py-2 border ${theme.border} rounded-xl`}
        placeholder="Search..."
      />
      <select className="min-w-[160px]">
        <option>All Types</option>
      </select>
      <select className="min-w-[160px]">
        <option>All Filters</option>
      </select>
    </div>
    <button className={`${theme.secondaryButton}`}>Action 1</button>
    <button className={`${theme.primaryButton} ${theme.textOnPrimary}`}>Action 2</button>
  </div>
</div>
```

**Key Points:**
- Use `md:hidden` for mobile-only layouts
- Use `hidden md:flex` for desktop-only layouts
- Stack elements vertically on mobile (`space-y-3`)
- Keep desktop layout unchanged
- Use `flex-1` on mobile for equal-width buttons

### Sticky Navigation

**Tab Navigation:**
```tsx
<div className="sticky top-0 z-40 bg-white">
  <div className="flex justify-center space-x-8 border-b border-stone-200">
    <button className={`pb-4 text-sm font-medium border-b-2 ${
      activeTab === 'tab1'
        ? `border-current ${theme.textPrimary}`
        : `border-transparent ${theme.textSecondary}`
    }`}>
      Tab 1
    </button>
  </div>
</div>
```

**Category Pills (Below Tabs):**
```tsx
<div className={`sticky top-[57px] md:top-[65px] z-30 ${theme.pageBackground} border-b border-stone-200`}>
  <div className="flex justify-center space-x-2 overflow-x-auto no-scrollbar pb-1">
    {categories.map((cat) => (
      <button
        key={cat}
        className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
          activeCategory === cat
            ? `${theme.primaryButton} ${theme.textOnPrimary}`
            : `${theme.secondaryButton} ${theme.textSecondary}`
        }`}
      >
        {cat}
      </button>
    ))}
  </div>
</div>
```

**Key Points:**
- Calculate `top` offset based on previous sticky elements
- Use `z-30`/`z-40` hierarchy for stacking
- Use `${theme.pageBackground}` instead of `bg-white` for consistency
- Add `overflow-x-auto` and `no-scrollbar` for horizontal scroll

### Horizontal Scroll (Mobile Cards)

**Pattern:** Horizontal scroll on mobile, grid on desktop

```tsx
<div className="md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6">
  <div className="flex md:contents gap-4 overflow-x-auto snap-x snap-mandatory pb-4 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0">
    {items.map((item) => (
      <div key={item.id} className="flex-shrink-0 w-[85vw] sm:w-[70vw] md:w-auto snap-start">
        <Card {...item} />
      </div>
    ))}
  </div>
</div>
```

**Key Points:**
- `flex md:contents` - flex on mobile, grid child on desktop
- `w-[85vw]` - card width as viewport percentage
- `snap-x snap-mandatory` - smooth scroll snapping
- `flex-shrink-0` - prevent cards from shrinking
- `-mx-4 px-4 md:mx-0 md:px-0` - edge-to-edge scroll on mobile

### Viewport Constrained Content

**Pattern:** Limit content height on mobile with scrolling

```tsx
<div className="max-h-[40vh] md:max-h-none overflow-y-auto">
  {/* Long content like pricing details */}
</div>
```

**Use Cases:**
- Expanded card details
- Pricing information
- Long descriptions
- Table expanded rows

### Welcome Banners (Mobile Compact)

**Pattern:** Hide decorative elements, center text on mobile

```tsx
<div className={`${theme.cardBackground} rounded-2xl p-4 md:p-6`}>
  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
    {/* Text - centered on mobile */}
    <div className="text-center md:text-left">
      <h2 className={`text-xl md:text-3xl font-display ${theme.textPrimary}`}>
        Welcome back
      </h2>
      <p className={`text-sm md:text-base ${theme.textSecondary}`}>
        Description text!
      </p>
    </div>

    {/* Decorative element - hidden on mobile */}
    <div className="hidden md:flex">
      <div className={`px-6 py-3 bg-stone-50 rounded-xl`}>
        <div className={`text-3xl font-semibold ${theme.textPrimary}`}>42</div>
        <div className={`text-xs ${theme.textMuted} uppercase`}>Days</div>
      </div>
    </div>
  </div>
</div>
```

### Navigation Links (Responsive Sizing)

**Pattern:** Very small text on mobile, larger on desktop

```tsx
<div className="flex items-center gap-2 md:gap-4">
  <span className="text-gray-300">|</span>
  <a
    href="/planners"
    className="font-heading text-[10px] sm:text-xs md:text-sm tracking-[0.2em] uppercase text-gray-600 hover:text-bridezilla-pink transition-colors"
  >
    PLANNERS
  </a>
  <span className="text-gray-300">|</span>
  <a
    href="/couples"
    className="font-heading text-[10px] sm:text-xs md:text-sm tracking-[0.2em] uppercase text-gray-600 hover:text-bridezilla-pink transition-colors"
  >
    COUPLES
  </a>
</div>
```

**Key Points:**
- `text-[10px]` for mobile (custom size)
- `sm:text-xs` for small screens
- `md:text-sm` for desktop
- Reduce gaps on mobile (`gap-2 md:gap-4`)

### Responsive Spacing

**Padding:**
```tsx
// Less padding on mobile
className="p-4 md:p-6"
className="px-4 md:px-6"
className="py-2 md:py-3"
```

**Gaps:**
```tsx
// Smaller gaps on mobile
className="gap-2 md:gap-4"
className="gap-4 md:gap-6"
className="space-y-3 md:space-y-6"
```

**Margins:**
```tsx
// Smaller margins on mobile
className="mb-4 md:mb-6"
className="mt-3 md:mt-6"
```

### Anti-Patterns (Mobile)

| ❌ Wrong | ✅ Right | Why |
|---------|---------|-----|
| Changing desktop layouts when fixing mobile | Separate mobile/desktop layouts with `md:hidden` and `hidden md:flex` | Prevents breaking existing desktop UX |
| Using same text size on mobile and desktop | `text-sm md:text-base` | Mobile needs smaller text to fit |
| Stacking 4 stat cards on mobile | `grid-cols-2 lg:grid-cols-4` | Better use of mobile screen space |
| Vertical stack of cards on mobile | Horizontal scroll with `overflow-x-auto` | Better browsing experience |
| Hardcoded `bg-white` on sticky elements | `${theme.pageBackground}` | Theme consistency |
| Single layout for all screen sizes | Separate mobile/desktop layouts | Optimal UX per device |

### Testing Checklist

Mobile responsive changes should:
- [ ] Not affect desktop layouts (verify at 1024px+ width)
- [ ] Use appropriate breakpoint prefixes (`sm:`, `md:`, `lg:`)
- [ ] Maintain theme consistency (use theme tokens)
- [ ] Test on actual mobile device or Chrome DevTools mobile view
- [ ] Check sticky elements don't overlap
- [ ] Verify horizontal scrolls work smoothly
- [ ] Ensure touch targets are large enough (min 44px)
- [ ] Check text remains readable at all sizes

---

## 🖼️ Assets & Logos (Theme-Specific)

### Logo Usage by Theme

Bridezilla uses different logo variations for each theme:

| Theme | Logo File | Usage | Visual Style |
|-------|-----------|-------|--------------|
| **Pop** | `/images/bridezilla-logo-circle.svg` | Ask Bridezilla buttons, Pop theme UI | Pink circular logo with dinosaur |
| **Heirloom** | `/images/bridezilla-logo-simple.svg` | Ask Bridezilla buttons, Heirloom theme UI | Green simple dinosaur logo |

### Implementation Pattern

**Theme-Aware Logo Selection:**
```tsx
import { useTheme } from '@/contexts/ThemeContext'
import Image from 'next/image'

export default function YourComponent() {
  const { theme: currentTheme } = useTheme()

  return (
    <Image
      src={currentTheme === 'pop'
        ? '/images/bridezilla-logo-circle.svg'
        : '/images/bridezilla-logo-simple.svg'}
      alt="Bridezilla"
      width={32}
      height={32}
      className="object-contain"
    />
  )
}
```

### Ask Bridezilla Button Pattern

**Standard Implementation:**
```tsx
import { useTheme } from '@/contexts/ThemeContext'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import Image from 'next/image'

export default function YourComponent() {
  const { theme: currentTheme } = useTheme()
  const theme = useThemeStyles()

  return (
    <button
      className={`flex items-center gap-2 px-6 py-2.5 ${theme.primaryButton} ${theme.primaryButtonHover} ${theme.textOnPrimary} rounded-xl text-sm font-medium transition-colors`}
    >
      <Image
        src={currentTheme === 'pop'
          ? '/images/bridezilla-logo-circle.svg'
          : '/images/bridezilla-logo-simple.svg'}
        alt="Bridezilla"
        width={24}
        height={24}
        className="object-contain"
      />
      <span>Ask Bridezilla</span>
    </button>
  )
}
```

**Why theme-specific logos?**
- Pop theme uses vibrant pink branding with circular logo
- Heirloom theme uses elegant green branding with simple logo
- Maintains visual consistency within each theme's design language

---

## 🎨 Status Badges (Fixed Colors - Don't Use Theme Tokens)

Status badges use **fixed colors** that stay consistent across themes:

| Status | Classes | Usage |
|--------|---------|-------|
| **Success/Complete** | `bg-emerald-50 text-emerald-700` | Signed, Paid, Attending, Booked |
| **Warning/Pending** | `bg-amber-50 text-amber-700` | Unsigned, Pending, Due Soon |
| **Neutral/Inactive** | `bg-stone-100 text-stone-600` | Not Required, Not Attending |
| **Error/Critical** | `bg-red-100 text-red-700` | Overdue, Error |
| **Urgent** | `bg-orange-100 text-orange-700` | Due Today |

**Example:**
```tsx
<span className="px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider
                 bg-emerald-50 text-emerald-700 border border-emerald-200">
  Booked & Confirmed
</span>
```

**Why fixed colors?** Status colors convey semantic meaning (green = good, red = error) that should be consistent across themes.

---

## 🔔 Notifications (Fixed Colors - Don't Use Theme Tokens)

Notifications use **fixed colors** that stay consistent across themes. They appear as toast-style alerts with subtle borders.

| Type | Background | Border | Icon & Text | Usage |
|------|-----------|--------|-------------|-------|
| **Success** | `bg-emerald-50` | `border-emerald-200` | `text-emerald-600/700` | Confirmations, completions |
| **Error** | `bg-red-50` | `border-red-200` | `text-red-600/900` | Errors, failures |
| **Warning** | `bg-yellow-50` | `border-yellow-200` | `text-yellow-600/700` | Warnings, cautions |
| **Info** | `bg-gray-50` | `border-gray-200` | `text-gray-600/700` | Information, tips |

**Styling Standards:**
- **Border width:** `border` (1px) - subtle, not bold
- **Border radius:** `rounded-xl` for soft appearance
- **Shadow:** `shadow-2xl` for elevated feel
- **Position:** `top-24` to clear navigation bar (h-16 mobile, h-20 desktop)
- **Z-index:** `z-[9999]` to appear above all content

**Typography:**
- **Title:** `text-sm font-bold uppercase tracking-widest` (follows helper text pattern, sized for visibility)
- **Message:** `text-sm` (regular weight, normal case)

**Example:**
```tsx
<div className="fixed top-24 right-4 z-[9999] max-w-md">
  <div className="bg-emerald-50 border-emerald-200 border rounded-xl shadow-2xl p-4 flex gap-3">
    <CheckCircle className="w-6 h-6 text-emerald-600" />
    <div className="flex-1">
      <h4 className="text-sm font-bold text-emerald-700 uppercase tracking-widest">Success</h4>
      <p className="text-sm text-emerald-700">Action completed successfully</p>
    </div>
  </div>
</div>
```

**Why fixed colors?** Like status badges, notification colors convey semantic meaning that should be consistent across themes.

---

## 🔍 Token Reference (Theme Mappings)

### Pop Theme (Pink/Orange)

| Token | Resolves To | Hex |
|-------|-------------|-----|
| `theme.pageBackground` | `bg-stone-50` | `#fafaf9` |
| `theme.cardBackground` | `bg-white` | `#ffffff` |
| `theme.primaryButton` | `bg-bridezilla-pink` | `#ec4899` |
| `theme.primaryButtonHover` | `hover:bg-bridezilla-orange` | `#f97316` |
| `theme.secondaryButton` | `bg-white border border-stone-200` | — |
| `theme.secondaryButtonHover` | `hover:bg-stone-50` | — |
| `theme.textPrimary` | `text-stone-900` | `#1c1917` |
| `theme.textSecondary` | `text-stone-600` | `#57534e` |
| `theme.textMuted` | `text-stone-400` | `#a8a29e` |
| `theme.textOnPrimary` | `text-white` | `#ffffff` |
| `theme.border` | `border-stone-200` | `#e7e5e4` |
| `theme.borderWidth` | `border` | 1px |
| `theme.navActive` | `text-bridezilla-orange` | `#f97316` |
| `theme.navInactive` | `text-stone-500` | `#78716c` |
| `theme.navHover` | `hover:text-stone-700` | `#44403c` |

### Heirloom Theme (Dark Green/Cream)

| Token | Resolves To | Hex |
|-------|-------------|-----|
| `theme.pageBackground` | `bg-[#FAF9F6]` | `#FAF9F6` |
| `theme.cardBackground` | `bg-white` | `#ffffff` |
| `theme.primaryButton` | `bg-[#1b3b2b]` | `#1b3b2b` |
| `theme.primaryButtonHover` | `hover:bg-[#2F5249]` | `#2F5249` |
| `theme.secondaryButton` | `bg-white border border-stone-200` | — |
| `theme.secondaryButtonHover` | `hover:bg-stone-50` | — |
| `theme.textPrimary` | `text-stone-900` | `#1c1917` |
| `theme.textSecondary` | `text-stone-600` | `#57534e` |
| `theme.textMuted` | `text-stone-400` | `#a8a29e` |
| `theme.textOnPrimary` | `text-white` | `#ffffff` |
| `theme.border` | `border-stone-200` | `#e7e5e4` |
| `theme.borderWidth` | `border` | 1px |
| `theme.navActive` | `text-[#B76E79]` | `#B76E79` |
| `theme.navInactive` | `text-stone-500` | `#78716c` |
| `theme.navHover` | `hover:text-stone-700` | `#44403c` |

### Route Behavior

| Route Type | Theme Behavior |
|------------|----------------|
| `/planner/*` | Pop OR Heirloom (user selectable) |
| `/admin/*` | Pop OR Heirloom (user selectable) |
| `/shared/*` | Heirloom ONLY (locked) |

**Both use same hook:** `const theme = useThemeStyles()`

---

## 📐 Typography

**Headings:**
- H1: `text-3xl font-display ${theme.textPrimary}`
- H2: `text-2xl font-display ${theme.textPrimary}`
- H3: `text-xl font-semibold ${theme.textPrimary}`
- H4: `text-lg font-semibold ${theme.textPrimary}`

**Body Text:**
- Default: `text-sm ${theme.textSecondary}`
- Large: `text-base ${theme.textSecondary}`

**Helper Text:**
- Small: `text-xs ${theme.textMuted}`
- Uppercase: `text-xs font-bold ${theme.textMuted} uppercase tracking-widest`

---

## 🎨 Theme Context (Implementation Details)

**Files:**
- Context: `contexts/ThemeContext.tsx`
- Hook: `hooks/useThemeStyles.ts`
- Definitions: `lib/themes.ts`

**Theme Switching:**
- Location: Settings tab in workspace
- Storage: localStorage (`bridezilla_planner_theme`)
- Default: Heirloom theme

**useThemeStyles Hook Logic:**
```tsx
export function useThemeStyles() {
  const { plannerTheme } = useTheme()
  const pathname = usePathname()

  // Wedding website always uses Heirloom
  if (pathname?.startsWith('/shared')) {
    return themes.heirloom
  }

  // Workspace uses selected theme
  return themes[plannerTheme]
}
```

---

## ✅ Pre-Commit Checklist

Before committing new components:

- [ ] Imported `useThemeStyles()` hook
- [ ] Added `'use client'` directive
- [ ] All colors use theme tokens (no hardcoded colors)
- [ ] Text uses semantic tokens (textPrimary/Secondary/Muted)
- [ ] Buttons use primary/secondary button tokens
- [ ] Borders use `${theme.border} ${theme.borderWidth}`
- [ ] Tested in both Pop and Heirloom themes
- [ ] Status badges use fixed colors (if applicable)

**Quick test:** Search your file for:
- `bg-bridezilla-pink` ❌
- `text-gray-` ❌
- `bg-stone-` (except status badges) ❌
- `border-gray-` ❌

If found, replace with theme tokens.

---

## 📧 Email Templates

**Component:** `components/planner/VendorInviteEmailTemplate.tsx`

Email templates require special handling since they use inline styles for email client compatibility and cannot rely on Tailwind CSS classes.

### Typography Requirements

**IMPORTANT:** Email templates must use only design system fonts:

- **Headings/Display Text:** `Playfair Display, Georgia, serif`
  - Logo text (BRIDEZILLA)
  - Greeting headings (Hi {coupleName}!)
  - Use `font-display` equivalent

- **Body Text:** `Nunito, -apple-system, BlinkMacSystemFont, sans-serif`
  - All paragraphs
  - List items
  - Button text
  - Helper text
  - Use `font-sans` equivalent

**Never use:**
- ❌ Bebas Neue (not part of documented design system)
- ❌ Inter (not the default body font)
- ❌ Any fonts not loaded in `app/layout.tsx`

### Colour Palette

**Heirloom Theme (Email Default):**
```tsx
backgroundColor: '#1b3b2b'  // Dark green header
backgroundColor: '#fafaf9'  // Light stone boxes
borderColor: '#e7e5e4'      // Stone borders
color: '#111827'            // Primary text
color: '#374151'            // Secondary text
color: '#57534e'            // Muted text
color: 'white'              // Text on dark backgrounds
```

### Email Template Pattern

```tsx
// ✅ CORRECT - Uses design system fonts
<div style={{
  fontFamily: 'Nunito, -apple-system, BlinkMacSystemFont, sans-serif',
  fontSize: '1rem',
  color: '#374151',
  lineHeight: '1.625'
}}>
  Body text content
</div>

<h2 style={{
  fontFamily: '"Playfair Display", Georgia, serif',
  fontSize: '1.875rem',
  fontWeight: '600',
  color: '#111827'
}}>
  Heading Text
</h2>
```

```tsx
// ❌ WRONG - Uses non-design-system fonts
<div style={{
  fontFamily: 'Inter, sans-serif'  // ❌ Wrong font
}}>
  Body text
</div>

<h2 style={{
  fontFamily: '"Bebas Neue", Arial, sans-serif'  // ❌ Not in design system
}}>
  Heading
</h2>
```

### Why Inline Styles?

Email clients don't support:
- External stylesheets
- CSS classes (including Tailwind)
- CSS variables
- Modern CSS features

Therefore:
- Use inline `style` attributes for all styling
- Include complete font stacks with fallbacks
- Use hex colours instead of theme tokens
- Test in multiple email clients (Gmail, Outlook, Apple Mail)

### Testing Email Templates

1. **Preview in browser** (EmailPreviewModal component)
2. **Send test email** to yourself
3. **Check in multiple clients:**
   - Gmail (web + mobile)
   - Apple Mail
   - Outlook
4. **Verify fonts render correctly** with fallbacks

---

## 🎓 DemoControlPanel (Guided Tour)

**Files:**
- Component: `components/shared/DemoControlPanel.tsx`
- Hook: `hooks/useDemoTour.ts`
- Steps: `lib/demo-tour-steps.ts`

### Overview

A floating guided tour panel that auto-shows on first visit, walks users through key navigation areas, and resumes on return visits if the user engaged with at least 2 steps. Rendered via `createPortal` for z-index safety.

### Props

```tsx
interface DemoControlPanelProps {
  steps: DemoStep[]           // { title: string, description: string }
  storageKey: string           // localStorage key for persistence
  onStepActivate?: (stepIndex: number) => void  // parent handles navigation
}
```

### localStorage Schema

Two independent keys:
- `bridezilla_demo_tour_planner` — planner portal
- `bridezilla_demo_tour_couples` — couples portal

```ts
interface TourState {
  completedUpTo: number  // -1 = never started
  allCompleted: boolean
}
```

### Auto-Show Logic

| Condition | Behaviour |
|-----------|-----------|
| No key in localStorage | First visit — show at step 0 |
| `allCompleted === true` | Don't show |
| `completedUpTo >= 1` and `!allCompleted` | Resume at `completedUpTo + 1` |
| `completedUpTo < 1` | Don't show |

### Theme Tokens Used

- `theme.cardBackground` — panel background
- `theme.border` + `theme.borderWidth` — panel border
- `theme.primaryButton` — progress bar fill + "Next Step" button
- `theme.primaryButtonHover` — button hover
- `theme.textOnPrimary` — button text
- `theme.textPrimary` — title
- `theme.textSecondary` — description
- `theme.textMuted` — step badge + "Skip Tour"

Progress bar track: `bg-stone-100` (semantic neutral, consistent across themes).

### Responsive

- Desktop: `fixed bottom-6 right-6 w-96` with `rounded-2xl`
- Mobile: `fixed bottom-0 left-0 right-0 w-full` with `rounded-t-2xl`

### Usage

```tsx
import DemoControlPanel from '@/components/shared/DemoControlPanel'
import { PLANNER_TOUR_STEPS } from '@/lib/demo-tour-steps'

<DemoControlPanel
  steps={PLANNER_TOUR_STEPS}
  storageKey="bridezilla_demo_tour_planner"
  onStepActivate={(stepIndex) => { /* navigate */ }}
/>
```

### Cross-Page Continuity (Planner Tour)

The planner tour spans PlannerDashboard and CoupleDetail. Both mount `DemoControlPanel` with the same `storageKey`. When step 2 navigates to CoupleDetail, the panel on PlannerDashboard unmounts; CoupleDetail reads `completedUpTo` from localStorage and resumes at the correct step.

---

## 📝 Changelog

**v3.4 (Feb 24, 2026)** - Adaptive Modal Overlay System
- Replaced old hardcoded modal pattern with `useModalSize` + `getModalClasses` system
- Documented `createPortal` requirement and `mounted` state ordering
- No blur on any modal size - clean dark scrim only (`bg-black/60`, `z-[9999]`)
- Documented `contentRef` placement rule (inner wrapper, not the flex-1 container)

**v3.3 (Feb 12, 2026)** - DemoControlPanel (Guided Tour)
- Added DemoControlPanel component with portal rendering
- Added useDemoTour hook with localStorage persistence and auto-show logic
- Added tour step definitions for planner (6 steps) and couples (5 steps)
- Documented cross-page continuity for planner tour
- Added slideInFromBottom animation to globals.css

**v3.2 (Feb 11, 2026)** - Mobile & Responsive Design
- Added comprehensive Mobile & Responsive Design section
- Documented grid layout patterns (2-col mobile, 4-col desktop for stat cards)
- Added filter layout patterns (separate mobile/desktop layouts)
- Documented sticky navigation with proper z-index and top offsets
- Added horizontal scroll pattern for mobile card browsing
- Documented responsive typography sizing (text-[10px] to md:text-sm)
- Added viewport-constrained content pattern (max-h-[40vh])
- Added welcome banner mobile optimization patterns
- Documented responsive spacing (padding, gaps, margins)
- Added mobile anti-patterns and testing checklist

**v3.1 (Feb 11, 2026)** - Email Template Documentation
- Added Email Templates section with font requirements
- Documented use of Playfair Display for headings, Nunito for body text
- Added inline styles guidance for email client compatibility
- Clarified fonts NOT to use (Bebas Neue, Inter)

**v3.0 (Feb 11, 2026)** - Optimized for Claude Code
- Reduced from 1,757 to ~600 lines (65% reduction)
- Front-loaded Quick Reference section
- Added Anti-Patterns comparison table
- Removed redundant explanations
- Consolidated examples (one per pattern)
- Optimized for LLM parsing

**v2.9.1 (Feb 11, 2026)** - Theme Token Guidance Restructured
**v2.9 (Feb 10, 2026)** - Google Maps Integration
**v2.8** - Payment & Dropdown Improvements
**v2.6** - Status Pill Redesign

---

**Maintained by:** Bridezilla Design System Team
**For questions:** Reference this document or check `/lib/themes.ts`
