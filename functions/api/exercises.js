export async function onRequestPost(context) {
    const { lesson_id } = context.request.url.searchParams;  // Get lesson ID from query param
    const body = await context.request.json();
    const id = crypto.randomUUID();
    
    // Parse options as JSON if it's provided
    let options = [];
    if (body.options) {
      options = JSON.parse(body.options);
    }
  
    const stmt = context.env.DB.prepare(`
      INSERT INTO exercises (id, lesson_id, type, prompt, correct_answer, options, metadata, "order")
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, lesson_id, body.type, body.prompt, body.correct_answer, JSON.stringify(options), JSON.stringify({}), 0);
  
    await stmt.run();
  
    return new Response(JSON.stringify({ id }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
  