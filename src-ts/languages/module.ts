import { exit } from '../utils/exit.js';
import { Path } from '../utils/fs.js';
import { Import, ImportAst } from './import.js';
import { LocalPackageId, PackageId, PackageJson, PublishedPackageId } from './package.js';
import { SyntaxTreeNode as makeSyntaxTreeNode } from 'lr-parser-typescript';


/*/
  A package reference is a modified form of a published package
  ID that uses a version alias instead of a version, and might
  omit the registry in case a default registry is specified in
  `project.json`
/*/
export type ParsedPath = {
  registry: string | null,
  scope: string | null,
  name: string,
  versionAlias: string,
  rest: string,
}

export type LocalModulePath = ModulePath<LocalPackageId>
export type PublishedModulePath = ModulePath<PublishedPackageId>
export type ModulePathAny = ModulePath<PackageId>;

/*/
  A ModulePath uniquely identifies a module (local or library)
  in a workspace. Paths must be in snake-case.
  
  A file must have an extension, a folder must not.
  
  A path can either be local (`project-name/package-name/foo/bar.hyloa`),
  or qualified (`[package-id]/foo/bar.js`), depending on the
  package ID.
/*/
export class ModulePath<Pid extends PackageId> {
  folderArr: string[];
  file: string | null;
  
  extension(): string | null {
    return this.file?.substring(this.file.lastIndexOf('.') + 1) ?? null;
  }
  
  constructor(packageId: Pid, path: string); // Path is expected to start with a slash.
  constructor(packageId: Pid, folderArr: string[], file: string | null);
  
  constructor(
    public packageId: Pid,
    folderArr: string[] | string,
    file?: string | null,
  ) {
    if (Array.isArray(folderArr)) {
      this.folderArr = folderArr;
      this.file = file!;
    } else {
      const [ empty, ...pathParts ] = folderArr.split('/');
      
      if (empty !== '') exit('Programmer error -- path must start with a slash.');
      
      if (pathParts.length === 0) {
        this.folderArr = pathParts;
        this.file = null;
      } else {
        this.folderArr = pathParts;
        
        // Not undefined bc pathParts.length !== 0.
        const last = pathParts[pathParts.length - 1]!;
        
        this.file = last.includes('.')
          ? pathParts.pop()! : null;
      }
    }
  }
  
  toString(): string {
    return this.packageId.toString() + '/'
      + this.folderArr.map(folder => folder + '/').join()
      + (this.file ? this.file : '') + '.hyloa';
  }
  
  // The returned path assumes the workspace is the root folder.
  toFsPath(): Path {
    return this.packageId.toFsPath(this.folderArr, this.file);
  }
  
  // Returns true iff `this` and `p` represent the same module.
  equals(p: ModulePathAny): boolean {
    return this.packageId.equals(p.packageId)
      && this.folderArr.every((folder, i) => p.folderArr[i] === folder)
      && this.file === p.file;
  }
  
  copy(): ModulePathAny {
    return new ModulePath(this.packageId, [ ...this.folderArr ], this.file);
  }
}

export function mainPath(packageId: PackageId) {
  return new ModulePath(packageId, [], null);
}


export abstract class ModuleAst extends makeSyntaxTreeNode {
  abstract imports: ImportAst[];
}

export class Module {
  imports: Import[];
  
  constructor(
    public ast: ModuleAst,
    public path: ModulePathAny,
    packageJson: PackageJson,
  ) {
    this.imports = ast.imports.map(impr => new Import(impr, path, packageJson))
  }
}
