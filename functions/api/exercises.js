export async function onRequestGet(context) {
    const url = new URL(context.request.url);
    const lessonId = url.searchParams.get('lesson_id');

    if (!lessonId) {
        return new Response(JSON.stringify({ error: "Missing lesson_id query parameter" }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const exercises = await context.env.DB.prepare(`
        SELECT * FROM exercises WHERE lesson_id = ? ORDER BY "order"
    `).bind(lessonId).all();

    // Parse metadata and add correct_answer to top-level object
    const parsedExercises = exercises.results.map(ex => {
        let metadata = {};
        try {
            metadata = JSON.parse(ex.metadata);
        } catch (e) {}
        return {
            ...ex,
            correct_answer: metadata.correct_answer || null
        };
    });

    return new Response(JSON.stringify(parsedExercises), {
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

    // Store correct_answer inside metadata
    const metadata = {
        correct_answer: body.correct_answer || null
    };
  
    const stmt = context.env.DB.prepare(`
      INSERT INTO exercises (id, lesson_id, type, prompt, options, metadata, "order")
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(id, lesson_id, body.type, body.prompt, JSON.stringify(options), JSON.stringify(metadata), 0);
  
    await stmt.run();
  
    return new Response(JSON.stringify({ id }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
