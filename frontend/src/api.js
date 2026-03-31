const BASE_URL = "http://localhost:4000";

export async function fetchState() {
  const response = await fetch(`${BASE_URL}/state`);
  if (!response.ok) {
    throw new Error("Could not fetch simulation state.");
  }
  return response.json();
}

export async function createTask(start, end) {
  const response = await fetch(`${BASE_URL}/task`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ start, end }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Could not create task.");
  }
  return payload;
}
