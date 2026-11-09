# Code review / bugfix report format

## Scope

- Base and target revisions / changed files:
- User-visible scenario or change intent:
- Environment and reproduction status:

## Findings (highest severity first)

### [P1/P2/P3] Concise issue title

- **Location:** file path and line(s)
- **Evidence:** exact input/action that triggers the issue
- **Impact:** concrete user-visible or engineering consequence
- **Recommendation:** smallest safe correction; include test needed

## Verification

- Commands executed and exit status:
- Browser/theme/keyboard checks executed:
- Unverified surfaces, environment limitations:

For bug fixes, also state root cause and the new regression test. For code review with no findings, report that fact without claiming the code is fully verified.
