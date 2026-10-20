const { createClient } = require('@octokit/rest');

module.exports = async (req, res) => {
  // Only allow POST requests to save data
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const GITHUB_REPO = process.env.GITHUB_REPO; // format: "username/repo"
  const GITHUB_PATH = process.env.GITHUB_PATH || 'todos.json';

  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    return res.status(500).json({ error: 'Server configuration missing (Token/Repo)' });
  }

  try {
    const octokit = createClient({ auth: GITHUB_TOKEN });
    const body = await req.json();
    const tasks = body.tasks;

    // 1. Get the current file to get the SHA
    const { data: fileData } = await octokit.repos.getContent({
      owner: GITHUB_REPO.split('/')[0],
      repo: GITHUB_REPO.split('/')[1],
      path: GITHUB_PATH,
    });

    // 2. Update the file
    await octokit.repos.createOrUpdateFileContents({
      owner: GITHUB_REPO.split('/')[0],
      repo: GITHUB_REPO.split('/')[1],
      path: GITHUB_PATH,
      message: 'Auto-save to-do list via backend',
      content: Buffer.from(JSON.stringify(tasks, null, 2)).toString('base64'),
      sha: fileData.sha,
    });

    return res.status(200).json({ success: true, message: 'Saved to GitHub' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};