import * as security from './lib/insecurity'
import * as twoFactorAuth from './routes/2fa'
import * as delivery from './routes/delivery'

app.get('/rest/2fa/status', security.isAuthorized(), twoFactorAuth.status)
app.get('/api/Deliverys', delivery.getDeliveryMethods())

const wrappedDelivery = compose(security.isAuthorized(), delivery.getDeliveryMethods())
app.get('/wrapped-delivery', wrappedDelivery)

app[method]('/dynamic-delivery', delivery.getDeliveryMethods())
