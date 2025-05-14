export async function onRequestGet(context) {
    const { DB } = context.env;
    const result = await DB.prepare('SELECT id, title, description FROM lessons').all();
    return Response.json({ lessons: result.results });
  }
  
  export async function onRequestPost(context) {
    const { DB } = context.env;
    const body = await context.request.json();
  
    if (!body.title || !body.description) {
      return Response.json({ error: "Missing title or description" }, { status: 400 });
    }
  
    const id = crypto.randomUUID();
    await DB.prepare(`
      INSERT INTO lessons (id, title, description)
      VALUES (?1, ?2, ?3)
    `).bind(id, body.title, body.description).run();
  
    return Response.json({ success: true, id });
  }
  