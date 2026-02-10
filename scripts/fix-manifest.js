import fs from 'fs'
import path from 'path'

const manifestPath = path.resolve('dist/manifest.json')

if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))

  if (manifest.background && manifest.background.service_worker) {
    console.log('Fixing manifest for Firefox: converting service_worker to scripts')
    manifest.background.scripts = [manifest.background.service_worker]
    delete manifest.background.service_worker
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
  }
} else {
  console.log('No manifest found at ' + manifestPath)
}
