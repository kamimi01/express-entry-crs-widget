# How it works

## AI route

1. Answer the interview, one question at a time.
2. Review the estimated CRS calculation.
3. Use the generated script in a Scriptable widget.

Attach `data/crs-tables.json` and `script/crs-widget.js` to the AI conversation, or supply accessible raw URLs.

The prompt directs the AI to:

- Use the tables first.
- Check official IRCC sources.
- Use applicable reference-script logic only as a limited fallback.

A generated script should use an accessible table URL when supplied and keep an embedded offline fallback.

## Reference script

Edit the script's `MY` section directly. The reference script:

- Uses built-in calculation logic.
- Assumes no accompanying spouse and CELPIP.
- Requires manual additional and high-wage points.
- Does not fetch the CRS tables or cache draw results.
- Fetches IRCC's official rounds JSON used by the [Rounds of Invitations](https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/rounds-invitations.html) page.

## CRS overview

The older CRS overview described these maximums:

| Section | Maximum points |
| --- | --- |
| A: Core | 500 without an accompanying spouse / 460 with one |
| B: Spouse | 40 |
| C: Transferability | 100 |
| D: Additional points | 600 |
| Total | 1,200 |

The November 3, 2026 Labour Market Integration changes increase the core maxima to 570 without an accompanying spouse / 530 with one. The supplied tables record a total maximum of 1,270. Confirm current rules with [IRCC's criteria](https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/check-score/crs-criteria.html).

The job-offer branch competes with the Canadian work and high-wage work branch; they are not added together.

## Verification and updates

These tables were prepared from official IRCC sources by a non-professional. Readers must verify their score and eligibility with IRCC.

Updating the JSON does not update the reference script's hard-coded rules or an already generated widget's embedded fallback. Changes to scoring logic, schema, or profile inputs can also require code changes.
