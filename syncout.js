
const path = require("path")
const child = require("child_process")
const fs = require("fs");
const { spawn, execSync, spawnSync } = child
const { existsSync, mkdirSync, rmSync } = fs

const PATH_REPO = __dirname

const HERE = "git@github.com:maerzhase/monorepo-test.git"

const MODULES_CONFIGRUATION = [
  {
    name: "module-a",
    path: "packages/public/module-a",
    repo: "git@github.com:maerzhase/monorepo-test-module-a.git",
  },
]

const PATH_GIT_FILTER_REPO = path.join(
  PATH_REPO,
  "git-filter-repo/git-filter-repo.py"
)

const PATH_TMP = path.join(PATH_REPO, "tmp")

const main = () => {

    if (!existsSync(PATH_TMP)) {
      console.log(`${PATH_TMP} not found. Creating.`)
      mkdirSync(PATH_TMP)
    }

    const moduleName = 0 

    const module = MODULES_CONFIGRUATION[moduleName]

    if (!module) {
      console.log("\nThe module you have provided don't exist:")
      console.log(moduleName)
      console.log("\nExisting module names are:")
      console.log(MODULES_CONFIGRUATION.map(m => m.name).join(", "))
      return
    }

      console.log(`\nStarting sync from monorepo into ${module.name}`)

      const PATH_TMP_MONOREPO = path.join(PATH_TMP, "MONO")
      const PATH_TMP_MODULE = path.join(PATH_TMP, module.name)
      const PATH_MONOREPO_MODULE = path.join(PATH_REPO, module.path)
      const SERVICE_REMOTE_NAME = `${module.name}-sync`
      // Remove the existing tmp module path
      rmSync(PATH_TMP_MODULE, { recursive: true, force: true })
      rmSync(PATH_TMP_MONOREPO, { recursive: true, force: true })
      console.log("\nDeleting temporary folders:")
      console.log(PATH_TMP_MODULE)
      console.log(PATH_TMP_MONOREPO)

      console.log(`\nCloning latest main branch of the monorepo into:`)
      console.log(`${PATH_TMP_MONOREPO}\n`)
      // 1. Grab a fresh clone of the monorepository
      execSync(`git clone ${HERE} MONO`, {
        stdio: [0, 1, 2],
        cwd: PATH_TMP,
      })

    // Rewrite the history to the subfolder in the monorepository
    console.log(`\nRewriting history of the monorepo to only include history relevant to ${module.path}\n`)
    spawnSync(
      "python3",
      [PATH_GIT_FILTER_REPO, `--subdirectory-filter=${module.path}`],
      {
        stdio: [0, 1, 2],
        cwd: PATH_TMP_MONOREPO,
      }
    )
    
    console.log(`\nCloning latest main branch of the public repository into:`)
    console.log(`${PATH_TMP_MODULE}\n`)
    // Clone public repository of module
    execSync(`git clone ${module.repo} ${module.name}`, {
      stdio: [0, 1, 2],
      cwd: PATH_TMP,
    })
     
    execSync(`git remote add ${SERVICE_REMOTE_NAME} ${PATH_TMP_MONOREPO}`, {
      stdio: [0, 1, 2],
      cwd: PATH_TMP_MODULE,
    })
   
    // Fetch latest changes from remote
    execSync(`git fetch ${SERVICE_REMOTE_NAME}`, {
      stdio: [0, 1, 2],
      cwd: PATH_TMP_MODULE,
    })
    // Merge the repositories together
    const BRANCH = module.branch || "main"
    console.log(`\nMerging ${SERVICE_REMOTE_NAME}/${BRANCH} into ${module.name}`)
    execSync(
      `git merge --no-commit --no-ff ${SERVICE_REMOTE_NAME}/${BRANCH}`,
      {
        stdio: [0, 1, 2],
        cwd: PATH_TMP_MODULE,
      }
    )

    console.log(`\nSync from monorepo into ${SERVICE_REMOTE_NAME}/${BRANCH}\n`)
    console.log("To finish the sync")
    console.log("Solve merge conflicts if there are any")
    console.log("Commit the merge and push:\n")
    console.log(`cd ${PATH_TMP_MODULE}\n`)
}
main()
