export async function onRequestGet(context) {
    const url = new URL(context.request.url);
    const lessonId = url.searchParams.get('lesson_id');
  
    if (!lessonId) {
      return new Response(
        JSON.stringify({ error: 'Missing lesson_id query parameter' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  
    // 1. Get session token from cookies
    const cookieHeader = context.request.headers.get('cookie') || '';
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map(c => {
        const [key, ...vals] = c.trim().split('=');
        return [key, vals.join('=')];
      })
    );
    const sessionToken = cookies['session'];
  
    if (!sessionToken) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
  
    // 2. Lookup user id by session token
    const userRes = await context.env.DB.prepare(
      `SELECT id FROM users WHERE sessionToken = ?`
    )
      .bind(sessionToken)
      .first();
  
    if (!userRes) {
      return new Response(
        JSON.stringify({ error: 'Invalid session' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    const userId = userRes.id;
  
    // 3. Fetch exercises with completed flag
    const query = `
      SELECT
        e.*,
        EXISTS(
          SELECT 1 FROM progress p
          WHERE p.userId = ?
            AND p.lessoId = e.lesson_id
            AND p.exerciseId = e.id
        ) AS completed
      FROM exercises e
      WHERE e.lesson_id = ?
      ORDER BY e."order"
    `;
  
    const exercisesRes = await context.env.DB.prepare(query)
      .bind(userId, lessonId)
      .all();
  
    // 4. Parse metadata and shape response
    const parsedExercises = exercisesRes.results.map(ex => {
      let metadata = {};
      try {
        metadata = JSON.parse(ex.metadata);
      } catch (e) {}
      return {
        id: ex.id,
        lesson_id: ex.lesson_id,
        title: ex.title,
        content: ex.content,
        correct_answer: metadata.correct_answer || null,
        completed: Boolean(ex.completed),
      };
    });
  
    return new Response(JSON.stringify(parsedExercises), {
      status: 200,
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
