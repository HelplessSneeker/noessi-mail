# /improve-ui Command

**Usage:** `/improve-ui [route|component]`

## Workflow
1. **Navigate**: Auto-open localhost:3000, login with test@example.com/password123
2. **Analyze**: Screenshot, identify UI/UX issues  
3. **Improve**: Update Tailwind/Radix components for better design
4. **Validate**: Test responsiveness, accessibility, reload to verify

## Focus Areas
- Visual hierarchy, spacing, contrast
- Accessibility (WCAG 2.1, keyboard nav, screen readers)  
- Mobile responsiveness
- Modern design patterns
- Consistent component styling
- Animation performance and skeleton optimization

## Examples
- `/improve-ui /dashboard` - Improve dashboard layout
- `/improve-ui sidebar` - Enhance sidebar component
- `/improve-ui /settings` - Polish settings page

## Constraints
- Frontend only (no API/DB changes)
- Preserve existing functionality and i18n
- Use existing Tailwind/Radix patterns
- Maintain TypeScript types

## Animation Preferences
- **Transitions**: Prefer `ease-out` over `ease-out-expo`, 200-300ms duration
- **Skeletons**: Static loading states for content switches, avoid during transitions
- **Performance**: Use `opacity`/`transform`, avoid layout shifts and animation conflicts

Auto-accepts all Playwright dialogs/permissions.