import { getAllProjects } from "@/lib/projects";

export default function DashboardPage() {
  return <main>{getAllProjects().map((project) => <div key={project.id}>{project.name}</div>)}</main>;
}
