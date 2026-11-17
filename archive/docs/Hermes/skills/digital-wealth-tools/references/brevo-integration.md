# Brevo Email Integration Reference

## API Endpoints

### Add/Update Contact
```
POST https://api.brevo.com/v3/contacts
Content-Type: application/json
api-key: YOUR_API_KEY
```

### Request Body
```json
{
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "listIds": [2],
  "updateEnabled": true,
  "attributes": {
    "SOURCE": "homepage"
  }
}
```

### Response
```json
{
  "id": 12345,
  "email": "user@example.com"
}
```

## Error Handling

| Status | Meaning | Action |
|--------|---------|--------|
| 201 | Created | Success |
| 400 | Bad Request | Check email format |
| 403 | Forbidden | Invalid API key |
| 429 | Rate Limited | Retry with backoff |

## Duplicate Handling

Brevo returns 400 with "already exists" if email is already in list. Handle gracefully:

```jsx
if (res.status === 400 && data.message?.includes('already exists')) {
  setStatus('success'); // Treat as success
  return;
}
```

## List IDs

- List ID `2` = Main DigitallyDefined newsletter list
- Check Brevo dashboard for current list IDs

## Security

- Store API key in Vercel environment variables
- Never commit to git
- Use `vercel env add BREVO_API_KEY` to set