import { NextResponse } from "next/server";
import { deleteTask, toggleTask } from "@/lib/task-store";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(_: Request, { params }: RouteContext) {
  const { id } = await params;
  const task = toggleTask(id);

  if (!task) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }

  return NextResponse.json({ task });
}

export async function DELETE(_: Request, { params }: RouteContext) {
  const { id } = await params;
  const removed = deleteTask(id);

  if (!removed) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
