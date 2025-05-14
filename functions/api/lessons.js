export async function onRequestGet(context) {
    const { DB } = context.env;
    const result = await DB.prepare('SELECT id, title, description FROM lessons').all();
    return Response.json({ lessons: result.results });
  }
  
  export async function onRequestPost(context) {
    const body = await context.request.json();
    const id = crypto.randomUUID();
  
    const stmt = context.env.DB.prepare(`
      INSERT INTO lessons (id, title, description) VALUES (?, ?, ?)
    `).bind(id, body.title, body.description);
  
    await stmt.run();
  
    return new Response(JSON.stringify({ id }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }  
