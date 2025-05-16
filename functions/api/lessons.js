export async function onRequestGet(context) {
    const url = new URL(context.request.url);
    const lessonId = url.searchParams.get('lesson_id');

    if (lessonId) {
        // Fetch single lesson by id
        const lesson = await context.env.DB
            .prepare(`SELECT * FROM lessons WHERE id = ?`)
            .get(lessonId);

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
        const lessons = await context.env.DB
            .prepare(`SELECT * FROM lessons ORDER BY title`)
            .all();

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
    const id = crypto.randomUUID();

    await context.env.DB
        .prepare(`INSERT INTO lessons (id, title, description) VALUES (?, ?, ?)`)
        .run(id, body.title, body.description);

    return new Response(JSON.stringify({ id }), {
        headers: { 'Content-Type': 'application/json' },
    });
}
