import * as fs from "fs";
import * as path from "path";

function extractFiles(variables: any, pathPrefix: string = "variables"): { map: Record<string, string[]>, files: Map<string, string>, newVariables: any } {
  const map: Record<string, string[]> = {};
  const files = new Map<string, string>();
  let fileIndex = 0;

  function traverse(obj: any, currentPath: string): any {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === "string" && obj.startsWith("file://")) {
      const filePath = obj.slice("file://".length);
      const partName = fileIndex.toString();
      fileIndex++;
      map[partName] = [currentPath];
      files.set(partName, filePath);
      return null;
    }
    if (Array.isArray(obj)) {
      return obj.map((item, idx) => traverse(item, `${currentPath}.${idx}`));
    }
    if (typeof obj === "object") {
      const newObj: any = {};
      for (const [key, value] of Object.entries(obj)) {
        newObj[key] = traverse(value, `${currentPath}.${key}`);
      }
      return newObj;
    }
    return obj;
  }

  const newVariables = traverse(variables, pathPrefix);
  return { map, files, newVariables };
}

async function main() {
  const queryArg = process.argv[2];
  const varsArg = process.argv[3];

  if (!queryArg) {
    console.error("Usage: bun .agents/skills/bookreader-api/scripts/request.ts <query_string_or_file> [variables_json_string_or_file]");
    process.exit(1);
  }

  const url = process.env.BOOKREADER_SERVER_URL;
  const apiKey = process.env.BOOKREADER_API_KEY;

  if (!url) {
    console.error("Error: BOOKREADER_SERVER_URL is required but not set in the environment.");
    process.exit(1);
  }

  if (!apiKey) {
    console.error("Error: BOOKREADER_API_KEY is required but not set in the environment.");
    process.exit(1);
  }

  let query = queryArg;
  try {
    // Check if it's a file path. Queries usually contain spaces, braces, or newlines, which are not valid paths.
    if (fs.existsSync(queryArg)) {
      const stat = fs.statSync(queryArg);
      if (stat.isFile()) {
        query = fs.readFileSync(queryArg, "utf-8");
      }
    }
  } catch (e) {
    // Ignore, treat as raw string
  }

  let variables = {};
  if (varsArg) {
    try {
      if (fs.existsSync(varsArg)) {
        const stat = fs.statSync(varsArg);
        if (stat.isFile()) {
          variables = JSON.parse(fs.readFileSync(varsArg, "utf-8"));
        } else {
          variables = JSON.parse(varsArg);
        }
      } else {
        variables = JSON.parse(varsArg);
      }
    } catch (e) {
      console.error("Failed to parse variables as JSON or read from file:", e);
      process.exit(1);
    }
  }

  const headers: Record<string, string> = {
    "x-api-key": apiKey
  };

  const { map, files, newVariables } = extractFiles(variables);
  let body: any;

  if (files.size > 0) {
    // Multipart form data upload
    const formData = new FormData();
    formData.append("operations", JSON.stringify({ query, variables: newVariables }));
    formData.append("map", JSON.stringify(map));

    for (const [partName, filePath] of files.entries()) {
      const resolvedPath = path.resolve(process.cwd(), filePath);
      if (!fs.existsSync(resolvedPath)) {
        console.error(`File not found: ${resolvedPath}`);
        process.exit(1);
      }
      const fileBuffer = fs.readFileSync(resolvedPath);
      const fileName = path.basename(resolvedPath);
      const blob = new Blob([fileBuffer]);
      formData.append(partName, blob, fileName);
    }
    body = formData;
    // fetch will automatically set Content-Type to multipart/form-data with the correct boundary.
  } else {
    // Standard JSON request
    headers["Content-Type"] = "application/json";
    body = JSON.stringify({
      query,
      variables,
    });
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body,
    });

    const responseText = await response.text();
    let responseJson;
    try {
      responseJson = JSON.parse(responseText);
      console.log(JSON.stringify(responseJson, null, 2));
    } catch (e) {
      console.error(`Failed to parse JSON response. Status: ${response.status}. Raw response:`);
      console.error(responseText);
      process.exit(1);
    }
  } catch (err) {
    console.error("Request failed:", err);
    process.exit(1);
  }
}

main().catch(console.error);
