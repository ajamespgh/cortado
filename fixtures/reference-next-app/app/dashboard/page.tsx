import { listProjects } from "@/lib/projects";

export default function DashboardPage() {
  return <main>{listProjects().map((project) => <div key={project.id}>{project.name}</div>)}</main>;
}
