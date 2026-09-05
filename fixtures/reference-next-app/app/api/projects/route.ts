import { listProjects } from "@/lib/projects";

export function GET() {
  return Response.json(listProjects());
}
