export type Task = {
  id: string;
  title: string;
  done: boolean;
  createdAt: string;
};

const tasks: Task[] = [
  {
    id: crypto.randomUUID(),
    title: "Connect frontend to backend",
    done: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
  },
  {
    id: crypto.randomUUID(),
    title: "Ship your first feature",
    done: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
  },
];

export function listTasks() {
  return [...tasks].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function createTask(title: string) {
  const task: Task = {
    id: crypto.randomUUID(),
    title,
    done: false,
    createdAt: new Date().toISOString(),
  };

  tasks.push(task);
  return task;
}

export function toggleTask(id: string) {
  const task = tasks.find((item) => item.id === id);

  if (!task) {
    return null;
  }

  task.done = !task.done;
  return task;
}

export function deleteTask(id: string) {
  const index = tasks.findIndex((item) => item.id === id);

  if (index === -1) {
    return false;
  }

  tasks.splice(index, 1);
  return true;
}
