# CSV import guide

Download `/templates/cornerstone-property-import-template.csv` from the Imports page.

1. Retain source name, listing ID, source URL, and collection date.
2. Upload no more than 500 records per file.
3. Review column validation and the five-row preview.
4. Run a dry run first.
5. Download and correct the error CSV.
6. Import only after the counts and duplicate behavior are understood.

Duplicates are matched using source name plus source listing ID. Invalid rows are rejected without stopping valid rows. CSV exports escape spreadsheet formula prefixes to reduce formula-injection risk. Imported values remain source-reported, not verified conclusions.
