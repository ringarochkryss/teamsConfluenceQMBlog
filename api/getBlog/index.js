const axios = require("axios");

module.exports = async function (context, req) {
  const baseUrl = process.env.CONFLUENCE_BASE_URL;
  const email = process.env.CONFLUENCE_EMAIL;
  const apiToken = process.env.CONFLUENCE_API_TOKEN;

  if (!baseUrl || !email || !apiToken) {
    context.res = {
      status: 500,
      body: "Missing Confluence config"
    };
    return;
  }

  const blogId = req.query.id || (req.body && req.body.id);
  if (!blogId) {
    context.res = {
      status: 400,
      body: "Missing blog id"
    };
    return;
  }

  const auth = Buffer.from(`${email}:${apiToken}`).toString("base64");

  try {
    const url = `${baseUrl}/rest/api/content/${blogId}?expand=body.view,title`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json"
      }
    });

    const data = response.data;

    context.res = {
      headers: { "Content-Type": "application/json" },
      body: {
        id: data.id,
        title: data.title,
        html: data.body.view.value
      }
    };
  } catch (err) {
    context.log(err.response?.data || err.message);
    context.res = {
      status: 500,
      body: "Error fetching blog from Confluence"
    };
  }
};
