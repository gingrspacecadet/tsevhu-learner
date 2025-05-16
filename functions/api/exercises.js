export async function onRequestGet(context) {
    const url = new URL(context.request.url);
    const lessonId = url.searchParams.get('lesson_id');

    if (!lessonId) {
        return new Response(JSON.stringify({ error: "Missing lesson_id query parameter" }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const stmt = context.env.DB.prepare(`
        SELECT * FROM exercises WHERE lesson_id = ? ORDER BY "order"
    `).bind(lessonId);

    const exercises = await stmt.all();

    return new Response(JSON.stringify(exercises), {
        headers: { 'Content-Type': 'application/json' },
    });
}

export async function onRequestPost(context) {
    const url = new URL(context.request.url);
    const lesson_id = url.searchParams.get('lesson_id');  // Get lesson ID from query param
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
  