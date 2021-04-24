import * as core from '@actions/core'
import * as github from '@actions/github'
import * as tc from '@actions/tool-cache'

async function getLatestVersion(token: string): Promise<string> {
  return core.group('Get latest version from github release', async () => {
    const octokit = github.getOctokit(token)

    const { data } = await octokit.repos.getLatestRelease({ owner: 'el7cosmos', repo: 'talenta' })
    core.info(`Using version: ${data.tag_name}`)
    return data.tag_name
  })
}

async function download(version: string): Promise<string> {
  return core.group('Cache not found, downloading', async () => {
    const baseUrl = `https://github.com/el7cosmos/talenta/releases/download/${version}/talenta-${version}`
    let arch: string
    switch (process.platform) {
      case 'win32':
        arch = 'x86_64-pc-windows-msvc'
        break
      case 'darwin':
        arch = 'x86_64-apple-darwin'
        break
      default:
        arch = 'x86_64-unknown-linux-gnu'
    }
    const tool = await tc.downloadTool(`${baseUrl}-${arch}.tar.gz`)
    const path = await tc.extractTar(tool)
    return tc.cacheFile(`${path}/talenta`, 'talenta', 'talenta', version)
  })
}

async function run() {
  try {
    const version = core.getInput('version') || (await getLatestVersion(core.getInput('token')))
    const cache = tc.find('talenta', version) || (await download(version))
    core.addPath(cache)
  } catch (e) {
    core.setFailed(e)
  }
}

run()
