# UX Audit - All 12 Lesson Pages

## Summary

All 12 lessons have Learn tabs, loading states, and empty states. The codebase is in good shape overall. Key issues are inline styles that should be in CSS, and minor tab/pattern inconsistencies.

## Per-Lesson Findings

### Lesson 01 - Context Tracker
- **Tabs**: learn, analyze, history
- **Loading**: Yes (analyzing spinner, upload spinner)
- **Empty states**: Yes (no conversations, no patterns, no habits, no gaps, no strengths)
- **Issues**: Inline styles on empty state `<p>` tags (color: var(--text-muted))

### Lesson 02 - Feedback Analyzer
- **Tabs**: learn, analyze, history
- **Loading**: Yes (page load, loading conversations)
- **Empty states**: Yes (no conversations, no feedback entries, no statistics)
- **Issues**: Inline styles on empty-state divs

### Lesson 03 - Template Builder
- **Tabs**: learn, build, templates, suggestions, test, create (6 tabs - most complex)
- **Loading**: Yes (page load, test loading, suggestions loading)
- **Empty states**: Yes (no templates, no L1 data, no gaps, no strengths)
- **Issues**: Inline styles on loading/empty divs, some `style={{ padding: '40px' }}`

### Lesson 04 - Context Docs
- **Tabs**: learn, docs, sessions
- **Loading**: Yes (page load)
- **Empty states**: Yes (no documents, no sessions)
- **Error handling**: Good (useState error, try/catch throughout)
- **Issues**: Inline styles on empty `<p>` tags

### Lesson 05 - Trust Matrix
- **Tabs**: learn, matrix, predictions, calibration
- **Loading**: Yes (spinner with "Loading trust matrix...")
- **Empty states**: Yes (no output types, no predictions, no insights)
- **Issues**: Inline styles on empty state paragraphs

### Lesson 06 - Verification Tools
- **Tabs**: learn, checklists, practice
- **Loading**: Yes (page load, loading trust types)
- **Empty states**: Yes (no output types, no checklists with styled empty-state divs)
- **Issues**: Inline styles on empty-state divs

### Lesson 07 - Task Decomposer
- **Tabs**: learn, decompose
- **Loading**: Yes (page load, analysis loading with spinner)
- **Empty states**: Yes (no decompositions - styled empty-state div)
- **Issues**: Inline styles on empty-state div

### Lesson 08 - Delegation Tracker
- **Tabs**: learn, delegate
- **Loading**: Yes (page load, loading decomps)
- **Empty states**: Yes (no AI review, no decompositions, no delegations)
- **Issues**: Inline styles on empty-state divs

### Lesson 09 - Iteration Passes
- **Tabs**: learn, iterate, history
- **Loading**: Yes (page load, loading conversations)
- **Empty states**: Yes (no conversations)
- **Issues**: Minor - generally clean

### Lesson 10 - Status Reporter
- **Tabs**: learn, design, run
- **Loading**: Yes (page load, loading docs)
- **Empty states**: Yes (no templates, no context docs)
- **Issues**: Inline styles on empty `<p>` tags

### Lesson 11 - Frontier Mapper
- **Tabs**: Learn, Zones, Encounters (capitalized in button text)
- **Loading**: Yes (button loading states, trust loading)
- **Empty states**: Yes (no zones, no encounters, no output types)
- **Issues**: Inline styles on empty state paragraphs

### Lesson 12 - Reference Card
- **Tabs**: Learn, My Card, Challenge (capitalized in button text)
- **Loading**: Yes (generating button state)
- **Empty states**: Yes (no items, no rules, no prompts)
- **Issues**: Inline styles on empty state items

## Cross-Cutting Issues

1. **Inline styles**: Most lessons use inline `style={{ }}` for empty state styling. Should use CSS classes instead.
2. **Tab rendering pattern**: L01-L10 use array.map() for tabs; L11-L12 use hardcoded buttons. Minor inconsistency.
3. **Empty state styling**: Some use `.empty-state` CSS class (L02, L06, L07, L08), others use inline styles on `<p>` tags. Should standardize.
4. **Error display**: L04 has robust error state display. Other lessons mostly just console.error. Could be more consistent.
