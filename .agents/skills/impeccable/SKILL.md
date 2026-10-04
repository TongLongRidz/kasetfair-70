---
name: impeccable
description: >-
  Impeccable UI/UX Design Audit & Refinement Skill.
  Use when the user wants to audit, polish, or refine UI components according to modern design principles and 61 anti-pattern rules.
---

# Impeccable UI/UX Skill

This skill allows the agent to run UI anti-pattern detection and design quality audits using the `impeccable` package.

## Usage

When auditing frontend design or refining UI code:

1. **Run anti-pattern detection**:
   ```bash
   cd frontend
   npx impeccable detect src
   ```

2. **Common Steering Rules to apply**:
   - **No Bounce Easing**: Replace `cubic-bezier(0.34, 1.56, 0.64, 1)` or elastic keyframes with smooth exponential easing `cubic-bezier(0.16, 1, 0.3, 1)`.
   - **No Layout Thrashing Transitions**: Avoid animating `width`, `height`, `padding`, or `margin`. Use `transform` (scale, translate) and `opacity` instead.
   - **Harmonious Color Palettes**: Use dark glassmorphic or curated HSL theme tokens (`var(--cream)`, `var(--ink)`, `var(--teal)`, `var(--warm)`) rather than raw primary colors.
   - **Modern Typography**: Ensure responsive font hierarchy and line-heights without default browser fallbacks.
