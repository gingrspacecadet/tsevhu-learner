document.getElementById('lesson-form').addEventListener('submit', async (e) => {
    e.preventDefault();
  
    const form = e.target;
    const title = form.title.value.trim();
    const description = form.description.value.trim();
  
    const res = await fetch('/api/lessons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description }),
    });
  
    const status = document.getElementById('status');
    if (res.ok) {
      status.textContent = '✅ Lesson created!';
      form.reset();
    } else {
      const data = await res.json();
      status.textContent = `❌ Error: ${data.error || 'Unknown error'}`;
    }
  });
  