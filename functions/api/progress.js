export async function onRequest({ request, env }) {
    if (request.method !== 'POST') {
      return new Response(null, { status: 405 });
    }
  
    // 1. Parse cookies to get userId
    const cookieHeader = request.headers.get('Cookie') || '';
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map(c => {
        const [k, ...v] = c.trim().split('=');
        return [k, decodeURIComponent(v.join('='))];
      })
    );
    const userId = parseInt(cookies.userId, 10);
    if (!userId || isNaN(userId)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
  
    // 2. Parse lessonId and exerciseId from JSON body
    let data;
    try {
      data = await request.json();
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid JSON' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
  
    const { lessonId, exerciseId } = data;
    if (!lessonId || !exerciseId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing lessonId or exerciseId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
  
    // 3. Insert into progress table
    try {
      await env.DB.prepare(`
        INSERT OR IGNORE INTO progress (userId, lessonId, exerciseId)
        VALUES (?, ?, ?)
      `).bind(userId, lessonId, exerciseId).run();
  
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (err) {
      return new Response(
        JSON.stringify({ success: false, error: 'Database error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
  