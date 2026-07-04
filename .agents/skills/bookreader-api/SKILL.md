---
name: bookreader-api
description: Call the bookreader GraphQL API. Use this skill when you need to query or mutate data in the Bookreader application.
---

# bookreader-api Skill

This skill provides instructions and a script to call the Bookreader GraphQL API. The script automatically uses `BOOKREADER_SERVER_URL` and `BOOKREADER_API_KEY` from the environment (loaded automatically by Bun from `.env` in the workspace root).

## Instructions for the Agent

Follow these steps strictly when you need to interact with the Bookreader API:

### Step 1: Read the GraphQL Schema
Before writing any queries or mutations, you **MUST** read the `schema.graphql` file located at the workspace root (e.g., `./schema.graphql`). 
Use your file viewing tools to inspect the schema so you know the exact operation names, required arguments, and return types.

### Step 2: Execute the Request via Command Line
You do **not** need to create temporary files for the query or variables. You can pass them directly as arguments to the script.

**Important for Windows PowerShell:** Always wrap the query and the JSON variables in single quotes (`'`) to avoid escaping double quotes (`"`).

Run the script using `bun` from the workspace root:
```powershell
bun .agents/skills/bookreader-api/scripts/request.ts 'YOUR_GRAPHQL_QUERY' 'YOUR_VARIABLES_JSON'
```

### Execution Example (Standard)
```powershell
bun .agents/skills/bookreader-api/scripts/request.ts 'query GetBookInfo($id: ID!) { bookInfo(id: $id) { id name } }' '{ "id": "12345" }'
```

### Execution Example (File Upload)
If the mutation requires a `File` upload (such as `addCompressBook`), specify the target file path in the JSON by prefixing it with `file://`. The script handles the multipart request automatically.
```powershell
bun .agents/skills/bookreader-api/scripts/request.ts 'mutation AddCompressBook($id: ID!, $file: File!) { addCompressBook(id: $id, file: $file) { success } }' '{ "id": "12345", "file": "file://C:/path/to/your/book.zip" }'
```

*(Note: If the query or JSON is excessively long, you may still pass file paths instead of raw strings, but direct string arguments are preferred to avoid leaving scratch files behind.)*
