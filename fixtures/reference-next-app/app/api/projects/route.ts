import { getProjects } from "@/lib/projects";

export function GET() {
  return Response.json(getProjects());
}
