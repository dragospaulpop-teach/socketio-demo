const fs = require("fs").promises;
const path = require("path");

const MESSAGE_FILE_PATH = path.join(process.cwd(), "data", "messages.json");

async function ensureDirectoryExists() {
  const dir = path.dirname(MESSAGE_FILE_PATH);
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

async function saveMessages(messages) {
  await ensureDirectoryExists();
  await fs.writeFile(MESSAGE_FILE_PATH, JSON.stringify(messages, null, 2));
}

async function loadMessages() {
  try {
    await ensureDirectoryExists();
    const data = await fs.readFile(MESSAGE_FILE_PATH, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

module.exports = { saveMessages, loadMessages };
