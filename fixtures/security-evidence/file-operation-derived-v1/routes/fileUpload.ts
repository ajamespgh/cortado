import fs from 'node:fs'
import path from 'node:path'

export function writeUploadedFile (req) {
  path.normalize(req.body.filename)
  return fs.createWriteStream(req.body.filename)
}

export function writeViaAlias (req) {
  const filename = req.body.filename
  return fs.createWriteStream(filename)
}
