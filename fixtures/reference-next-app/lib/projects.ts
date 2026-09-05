import type { Project } from "@/types/project";

export function listProjects(): Project[] {
  return [{ id: "cortado", name: "Cortado" }];
}
