import { getProjects } from "@/lib/projects";

export default function DashboardPage() {
  return <main>{getProjects().map((project) => <div key={project.id}>{project.name}</div>)}</main>;
}
