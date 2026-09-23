export function getDeliveryMethods () {
  return async (req, res) => {
    const methods = await DeliveryModel.findAll()
    res.json({ data: methods })
  }
}
