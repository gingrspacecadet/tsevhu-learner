export async function onRequest({ request, env }) {
    if (request.method !== 'POST') {
      return new Response(null, { status: 405 });
    }
  
    // 1. Parse cookies to get session token
    const cookieHeader = request.headers.get('Cookie') || '';
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map(c => {
        const [k, ...v] = c.trim().split('=');
        return [k, decodeURIComponent(v.join('='))];
      })
    );
    const sessionToken = cookies.session;
    if (!sessionToken) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
  
    // 2. Look up user by session token
    const { results } = await env.DB
      .prepare('SELECT id FROM users WHERE sessionToken = ? LIMIT 1')
      .bind(sessionToken)
      .all();
  
    if (!results || results.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid session' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
  
    const userId = results[0].id;
  
    // 3. Parse lessonId and exerciseId from JSON body
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
  
    // 4. Insert into progress table
    try {
      await env.DB.prepare(`
        INSERT OR IGNORE INTO progress (userId, lessonId, exerciseId)
        VALUES (?, ?, ?)
      `).bind(userId, lessonId, exerciseId).run();
  
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: 'Database error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
  