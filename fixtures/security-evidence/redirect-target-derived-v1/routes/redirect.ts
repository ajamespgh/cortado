export function redirectToRequestedTarget (req, res) {
  new URL(req.query.next, 'https://cortado.invalid')
  return res.redirect(req.query.next)
}

export function redirectViaAlias (req, res) {
  const target = req.query.next
  return res.redirect(target)
}
