import { addPath, getInput, group, info, setFailed } from '@actions/core'
import { getOctokit } from '@actions/github'
import { cacheFile, downloadTool, extractTar, find } from '@actions/tool-cache'

async function getLatestVersion(token: string): Promise<string> {
  return group('Get latest version from github release', async () => {
    const octokit = getOctokit(token)

    const { data } = await octokit.repos.getLatestRelease({ owner: 'el7cosmos', repo: 'talenta' })
    info(`Using version: ${data.tag_name}`)
    return data.tag_name
  })
}

async function download(version: string): Promise<string> {
  return group('Cache not found, downloading', async () => {
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
    const path = await downloadTool(`${baseUrl}-${arch}.tar.gz`)
    const folder = await extractTar(path)
    return cacheFile(`${folder}/talenta`, 'talenta', 'talenta', version)
  })
}

async function run() {
  try {
    const version = getInput('version') || (await getLatestVersion(getInput('token')))
    const cache = find('talenta', version) || (await download(version))
    addPath(cache)
  } catch (e) {
    setFailed(e)
  }
}

run()
