export async function onRequestGet(context) {
    const url = new URL(context.request.url);
    const lessonId = url.searchParams.get('lesson_id');

    if (lessonId) {
        // Fetch single lesson by id
        const stmt = context.env.DB.prepare(`SELECT * FROM lessons WHERE id = ?`);
        const result = await stmt.bind(lessonId).all();
        const lesson = result.results[0] || null;

        if (!lesson) {
            return new Response(JSON.stringify({ error: "Lesson not found" }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        return new Response(JSON.stringify(lesson), {
            headers: { 'Content-Type': 'application/json' },
        });
    } else {
        // Fetch all lessons
        const stmt = context.env.DB.prepare(`SELECT * FROM lessons ORDER BY title`);
        const lessons = await stmt.all();

        return new Response(JSON.stringify({
            success: true,
            meta: {},
            results: lessons.results || []
        }), {
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

export async function onRequestPost(context) {
    const body = await context.request.json();
    
    // Validate request body
    if (!body.title || !body.description) {
        return new Response(JSON.stringify({ error: "Title and description are required." }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const id = crypto.randomUUID();
    const stmt = context.env.DB.prepare(`INSERT INTO lessons (id, title, description) VALUES (?, ?, ?)`);
    
    await stmt.run([id, body.title, body.description]);

    return new Response(JSON.stringify({ id }), {
        headers: { 'Content-Type': 'application/json' },
    });
}
