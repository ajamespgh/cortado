import { getAllProjects } from "@/lib/projects";

export function GET() {
  return Response.json(getAllProjects());
}
