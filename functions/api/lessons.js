export async function onRequestGet(context) {
  
    const stmt = context.env.DB.prepare(`
        SELECT * FROM exercises ORDER BY "order"
    `);
  
    const exercises = await stmt.all();
  
    return new Response(JSON.stringify(exercises), {
        headers: { 'Content-Type': 'application/json' },
    });
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
