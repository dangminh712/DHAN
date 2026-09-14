export function createQuizDraftKey(user, lecture) {
  return `dhan:quiz-draft:${user}:${lecture}`;
}

export function createProgressSaver(send, onError, delay = 2000) {
  let timer, pending, running = false;
  const flush = async () => {
    clearTimeout(timer);
    if (running || !pending) return;
    const value = pending;
    pending = undefined;
    running = true;
    try { await send(value); }
    catch (error) { pending = { ...value, ...pending }; onError(error); }
    finally { running = false; }
    // Retry only on the next user event; do not create a background retry loop.
  };
  return {
    schedule(value) { pending = { ...pending, ...value }; clearTimeout(timer); timer = setTimeout(flush, delay); },
    flush,
  };
}
