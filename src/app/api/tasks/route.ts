import { NextResponse } from "next/server";
import { createTask, listTasks } from "@/lib/task-store";

type CreateTaskPayload = {
  title?: string;
};

export async function GET() {
  return NextResponse.json({ tasks: listTasks() });
}

export async function POST(request: Request) {
  let body: CreateTaskPayload;

  try {
    body = (await request.json()) as CreateTaskPayload;
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const title = body.title?.trim();

  if (!title) {
    return NextResponse.json(
      { error: "Task title is required." },
      { status: 400 },
    );
  }

  if (title.length > 80) {
    return NextResponse.json(
      { error: "Task title must be 80 characters or fewer." },
      { status: 400 },
    );
  }

  const task = createTask(title);
  return NextResponse.json({ task }, { status: 201 });
}
