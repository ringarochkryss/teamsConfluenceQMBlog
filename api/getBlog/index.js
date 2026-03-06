const axios = require("axios");

module.exports = async function (context, req) {
  const baseUrl = process.env.CONFLUENCE_BASE_URL;
  const email = process.env.CONFLUENCE_EMAIL;
  const apiToken = process.env.CONFLUENCE_API_TOKEN;
  const spaceKey = process.env.CONFLUENCE_SPACE_KEY;

  if (!baseUrl || !email || !apiToken || !spaceKey) {
    context.res = {
      status: 500,
      body: "Missing Confluence config"
    };
    return;
  }

  const auth = Buffer.from(`${email}:${apiToken}`).toString("base64");

  try {
    const url = `${baseUrl}/rest/api/content?type=blogpost&spaceKey=${spaceKey}&expand=body.view,version&limit=10`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json"
      }
    });

    const posts = response.data.results
      .sort((a, b) => new Date(b.version.when) - new Date(a.version.when))
      .map(post => ({
        id: post.id,
        title: post.title,
        created: post.version.when,
        html: post.body.view.value
      }));

    context.res = {
      headers: { "Content-Type": "application/json" },
      body: posts
    };
  } catch (err) {
    context.log(err.response?.data || err.message);
    context.res = {
      status: 500,
      body: "Error fetching blog list"
    };
  }
};
