 src/worker.js 
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return Response.json({
        success: true,
        project: "INDIAN MINERALS MARKET",
        status: "running"
      });
    }

    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response(
      "INDIAN MINERALS MARKET",
      { headers: { "content-type": "text/plain" } }
    );
  }
};
