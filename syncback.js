
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


const sync = () => {
    const PATH_GIT_FILTER_REPO = path.join(
      PATH_REPO,
      "git-filter-repo/git-filter-repo.py"
    )

    console.log(PATH_GIT_FILTER_REPO)
    // Create tmp folder in root of repository
    const PATH_TMP = path.join(PATH_REPO, "tmp")
    if (!existsSync(PATH_TMP)) {
      mkdirSync(PATH_TMP)
    }

    let modulesToSync = MODULES_CONFIGRUATION

    if (modulesToSync.length === 0) {
      console.log("\nThe module(s) you have provided don't exist:")
      console.log((modules.join(", ")))
      console.log()
      return
    }

    modulesToSync.forEach(module => {
        // 1. Grab a fresh clone of the public repository.
        const PATH_TMP_MONOREPO = path.join(PATH_TMP, "MONO")
        const PATH_TMP_MODULE = path.join(PATH_TMP, module.name)
        const PATH_MONOREPO_MODULE = path.join(PATH_REPO, module.path)
        const SERVICE_REMOTE_NAME = `${module.name}-sync`
        // Remove the existing tmp module path
        rmSync(PATH_TMP_MODULE, { recursive: true, force: true })
        rmSync(PATH_TMP_MONOREPO, { recursive: true, force: true })
        // Clone public repository of module
        execSync(`git clone ${HERE} MONO`, {
          stdio: [0, 1, 2],
          cwd: PATH_TMP,
        })
 
      // Rewrite the history to the subfolder in the monorepository
      spawnSync(
        "python3",
        [PATH_GIT_FILTER_REPO, `--subdirectory-filter=${module.path}`],
        {
          stdio: [0, 1, 2],
          cwd: PATH_TMP_MONOREPO,
        }
      )
      
      console.log("==> GIT CLONE")
        // Clone public repository of module
      execSync(`git clone ${module.repo} ${module.name}`, {
        stdio: [0, 1, 2],
        cwd: PATH_TMP,
      })
    
      console.log("==> GIT DELETE REMOTE")
      // Add the locally cloned public repository as a remote
      // Make sure remote doesn't exist
      try {
        execSync(`git remote remove ${SERVICE_REMOTE_NAME}`, {
          stdio: [0, 1, 2],
          cwd: PATH_TMP_MODULE,
        })
      } catch (e) {}
      execSync(`git remote add ${SERVICE_REMOTE_NAME} ${PATH_TMP_MONOREPO}`, {
        stdio: [0, 1, 2],
        cwd: PATH_TMP_MODULE,
      })
      console.log("==> GIT FETCH")
      // Fetch latest changes from remote
      execSync(`git fetch ${SERVICE_REMOTE_NAME}`, {
        stdio: [0, 1, 2],
        cwd: PATH_TMP_MODULE,
      })
      // Merge the repositories together
      const BRANCH = module.branch || "main"
      console.log("==> GIT MERGE")
      execSync(
        `git merge --no-commit --no-ff ${SERVICE_REMOTE_NAME}/${BRANCH}`,
        {
          stdio: [0, 1, 2],
          cwd: PATH_TMP_MODULE,
        }
      )
    })
}
sync()
