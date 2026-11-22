# Setup

## AI-generated widget

1. Copy [the interview prompt](../prompt/crs-widget-prompt.md) into your AI assistant.
2. Attach [the CRS tables](../data/crs-tables.json) and [the reference script](../script/crs-widget.js), or provide accessible raw URLs. Optionally attach a screenshot as a design reference.
3. Answer the interview and confirm the summary. Check the estimated score and assumptions against IRCC.
4. Install the free Scriptable app from the App Store. Create a script and paste the complete generated code into it.
5. Run the script once in the app. Add a Scriptable widget to your home screen, then long-press it, choose Edit Widget, and select the script.

## Reference script

1. Copy [the reference script](../script/crs-widget.js) into a new Scriptable script.
2. Edit its `MY` section directly.
3. Confirm applicability and eligibility with IRCC.

The reference script:

- Does not have an in-app profile editor, fetch the CRS tables, or cache draw data.
- Assumes no accompanying spouse and CELPIP for its calculation.
- Requires additional and high-wage points to be entered manually.

### Edit the improvement scenarios

In the script's `MY` section, set `LANGUAGE_TARGET_CLB` to the language goal you want. Enter your current `CELPIP` levels, `CANADIAN_WORK_YEARS`, `CANADIAN_EDUCATION_POINTS`, and `OTHER_ADDITIONAL_POINTS` in the same section. Include a nomination in `OTHER_ADDITIONAL_POINTS` only if it already applies to you.

The widget independently estimates three scenarios: reaching the language goal in all four abilities, gaining one more year of qualifying Canadian work, and receiving a provincial or territorial nomination. The nomination scenario respects the 600-point additional-points cap. Each is hypothetical; confirm eligibility and qualifying experience with IRCC and the relevant province or territory.

If you set `CRS_OVERRIDE`, the displayed score uses that number, but scenario gains still use the calculated profile score. Set `CRS_OVERRIDE` to `null` to use the calculated score for both.

The reference script requests a refresh after four hours. iOS determines the actual refresh schedule, so results are not real time.
