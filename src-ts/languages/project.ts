import { JsonValidationError } from "../utils/json-validation-error";
import { LocalPackage } from "./package";

/*/
  A reprezentation of `project.json.`
  
  The schema of the file (for more details, see the docs of
  `package.json`):
  
  ```
    ProjectSettings = {
      registries: Record<KebabCase | '', string>,
      defaultRegistry: KebabCase | null,
    }
  ```
/*/
export class ProjectJson {
  constructor(
    public defaultRegistry: string | null = null,
    public registries: Map<string, string>,
  ) {}
  
  static fromJson(json: string): ProjectJson | JsonValidationError<never> {
    const parsed = JSON.parse(json);
    
    return new ProjectJson(
      parsed.defaultRegistry,
      new Map(Object.entries(parsed.registries)),
    );
  }
}

/*/
  Folder name must be kebab-case.
/*/
export class Project {
  // Contains the local packages of the project, indexed by their (folder) name.
  packages = new Map<string, LocalPackage>();
  
  constructor(
    // Name of the folder the project is in.
    public name: string,
    public projectJson: ProjectJson,
  ) {}
}
