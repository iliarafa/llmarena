# LLM Debate Comparison Platform - Design Guidelines

## Design Approach
**System-Based Approach**: Clean, functional design inspired by modern productivity tools (Linear, Notion, VS Code diff view)

**Core Principle**: Clarity and efficiency for comparing lengthy text outputs side-by-side. Minimize visual noise to let content shine.

---

## Typography System

**Font Stack**:
- Primary: Inter or DM Sans via Google Fonts CDN
- Monospace: JetBrains Mono for code snippets within responses

**Hierarchy**:
- Page Title: text-3xl font-bold
- Section Headers: text-xl font-semibold
- Model Names: text-lg font-medium
- Response Text: text-base leading-relaxed (optimized for reading long content)
- Metadata/Labels: text-sm text-gray-600
- Input Prompt: text-lg

---

## Layout System

**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, 16, 24
- Component padding: p-6 or p-8
- Section gaps: gap-6 or gap-8
- Card spacing: space-y-4
- Margins: mb-6, mt-8 for section separation

**Container Strategy**:
- Main wrapper: max-w-7xl mx-auto px-6
- Input section: max-w-4xl mx-auto
- Comparison grid: Full width within container

---

## Component Library

### Input Section (Top of Page)
- Large textarea for prompt input (min-h-32, rounded-lg border)
- Model selector: Checkbox group or toggle buttons for GPT-4o, Claude Sonnet, Gemini Flash, Grok
- Primary CTA button: "Compare Models" (large, prominent)
- Character/token counter below textarea
- Clear/reset functionality

### Comparison Grid
**Layout**: Responsive grid displaying model responses
- Desktop: grid-cols-2 or grid-cols-4 (2x2 for 4 models)
- Tablet: grid-cols-2
- Mobile: grid-cols-1 (stacked)

**Response Cards**:
- Border with subtle shadow (rounded-lg border shadow-sm)
- Header section with:
  - Model name and icon (text-lg font-semibold)
  - Generation time badge (text-sm in muted color)
  - Copy button (top-right corner)
- Response content area:
  - White/light background
  - Ample padding (p-6)
  - Scrollable if content exceeds viewport (max-h-96 overflow-y-auto)
  - Prose-optimized width and line height
- Footer metadata:
  - Token count, response time
  - Small text, muted color

### Loading States
- Skeleton loaders in card format matching final response cards
- Pulsing animation on placeholder text
- Progress indicators for each model independently

### Empty/Error States
- Centered message within card bounds
- Icon + descriptive text
- Retry button if applicable

---

## Navigation & Chrome

**Top Bar**:
- Logo/App name (left)
- Navigation minimal: possibly "About" or "Settings" link
- Height: h-16
- Sticky positioning (sticky top-0)

**No Footer Needed**: Utility-focused app, minimal chrome

---

## Icons
**Library**: Heroicons (via CDN)
- Model icons: Use distinct icons for each provider (beaker, cpu, sparkles, etc.)
- Actions: copy, refresh, settings, check-circle
- States: loading spinner, alert icons

---

## Interactions

**Minimal Animations**:
- Card hover: subtle shadow increase (transition-shadow duration-200)
- Button states: Standard hover/active (handled by button component)
- Copy feedback: Brief checkmark or "Copied!" tooltip

**No Complex Animations**: Focus on speed and clarity

---

## Images

**No Hero Image**: This is a utility app, not marketing. Launch directly into the interface.

**Model Logos/Icons** (if desired):
- Small provider logos next to model names (24x24px)
- Use icon library or simple SVG representations

---

## Responsive Behavior

**Desktop (lg:)**: Side-by-side comparison maximizes screen real estate
**Tablet (md:)**: 2-column grid maintains comparison ability
**Mobile (base)**: Stacked single column, scrollable responses

**Input Section**: Full-width across all breakpoints, adjust padding

---

## Key UX Patterns

1. **Progressive Disclosure**: Show input first, comparison results appear below after generation
2. **Independent Loading**: Each model card loads independently with its own loading state
3. **Persistent Input**: Input prompt remains visible/accessible while viewing results
4. **Quick Actions**: Copy buttons always visible, no hidden menus
5. **Model Selection**: Clear, obvious toggles—user knows exactly which models will run

---

## Content Strategy

- Launch directly into the tool (no marketing fluff)
- Helper text in input: "Enter a prompt to compare responses across models"
- Empty state: "Select models and enter a prompt to begin"
- Focus on functionality and speed