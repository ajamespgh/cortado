import type { Project } from "@/types/project";

export function getAllProjects(): Project[] {
  return [{ id: "cortado", name: "Cortado" }];
}
