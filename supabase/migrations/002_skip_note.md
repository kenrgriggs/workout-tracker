# Skip Day Implementation Note

Skipped days are stored as workout rows with `notes = 'SKIPPED'` and zero associated sets.
No schema change is required — this works with the existing `001_initial_schema.sql`.

To distinguish skipped sessions in queries:
```sql
select * from workouts where notes = 'SKIPPED';
```
