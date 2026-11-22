You are a precise data-extraction specialist. Create a complete, machine-readable JSON file of Canada's Express Entry CRS (Comprehensive Ranking System) point tables. This file will be hosted on GitHub and fetched at runtime by a Scriptable widget, so accuracy matters more than speed.

## Sources (use ONLY these official sources)
- IRCC "CRS criteria" page on canada.ca (the full points tables)
- IRCC pages/ministerial instructions describing the November 3, 2026 CRS changes (Labour Market Integration factor)
- Do NOT use immigration blogs, law-firm summaries, or your memory for point values. If a value cannot be verified from an official source, set it to null and list it under "unverified" at the end — never guess.

## Output: one JSON file named crs-tables.json
Include a metadata block first:
- "version": a version string you assign (e.g. "2026.11-1")
- "effectiveDate": the date these rules take effect
- "sources": the exact official URLs you used

Then include ALL of the following tables. For every factor that differs by marital status, include BOTH variants ("withSpouse" and "withoutSpouse").

### A. Core / human capital factors
- age: points for every age band (17 or under, 18, 19, 20–29, then each year 30–44, 45 or over)
- education: points for every credential level (less than secondary, secondary diploma, 1-year, 2-year, bachelor's/3+ years, two or more credentials, master's/professional degree, PhD)
- firstLanguage: points PER ABILITY for each CLB level (below CLB 4, CLB 4–5, 6, 7, 8, 9, 10+)
- secondLanguage: points PER ABILITY for each CLB level
- canadianWorkExperience: points for each band (none/less than 1 year, 1, 2, 3, 4, 5+ years)

### Language test conversion tables
- Convert raw test scores to CLB/NCLC levels, per ability, for: IELTS (General Training), CELPIP-General, TEF Canada, TCF Canada.
- Format: for each test and ability, the minimum score for each CLB level.

### B. Spouse factors
- spouseEducation, spouseFirstLanguage (per ability), spouseCanadianWorkExperience

### C. Skill transferability factors
Include each combination with its caps:
- education + language (two tiers: all abilities CLB 7+ with one or more below 9 / all abilities CLB 9+)
- education + Canadian work experience (two tiers: 1 year / 2+ years)
- foreignWorkExperience + language (same two language tiers)
- foreignWorkExperience + Canadian work experience (two tiers: 1 year / 2+ years)
- certificateOfQualification + language (two tiers)
- The group caps: education-related combinations max 50, work-experience-related combinations max 50, section total max 100.

### D. Additional points
- provincialNomination: 600
- canadianEducationCredential: 15 (1–2 year credential) / 30 (3+ years, master's, or PhD)
- frenchLanguage: the two tiers (French CLB 7+ with English CLB 4 or below/none, and French CLB 7+ with English CLB 5+)
- siblingInCanada: 15
- jobOffer / Labour Market Integration factor under the November 3, 2026 rules: include the full structure you find in the official source — eligible job offer points by occupation/wage class, and the additional Canadian work experience points by wage classification — exactly as published.

## Validation (do this before outputting, and report the results)
Check these maximums against your tables and confirm each one:
- Section A total max: 500 (without spouse) / 460 (with spouse)
- Section B total max: 40
- Section C total max: 100
- Grand total max: 1,200
If any check fails, fix the tables before outputting.

## Output format
1. First, the validation results and the "unverified" list (anything you set to null and why).
2. Then the complete crs-tables.json in ONE code block, valid JSON, no comments inside the JSON.
3. Keep all keys in English camelCase. Use numbers for points, not strings.
