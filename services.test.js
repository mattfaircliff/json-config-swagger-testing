import Enzyme from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'

import * as configs from './config'
import https from 'https'

function request(url) {
  return new Promise(resolve => {
    https.get(url, response => {
      let data = ''
      response.on('data', _data => (data += _data))
      response.on('end', () => { return resolve(data) })
    })
  })
}

Enzyme.configure({ adapter: new Adapter() })

const services = [
  { // Include an object per microservice, at the moment there is just users
    model: 'user',
    service: "https://your-microservices-url/swagger/?format=openapi",
    definition: "User"
  }
]

const compareFields = async (group, localprop, remoteprop, version="v1") => {
  const { model, service, definition } = group
  const r = await request(service)
  const swagger = JSON.parse(r)

  if (swagger.definitions[definition] && swagger.info.version === version) {
    const { properties } = swagger.definitions[definition]
    const { fields } = configs[model]
    fields.forEach(field => {
      if (properties[field.name]) {
        expect(field[localprop]).toEqual(properties[field.name][remoteprop])
      }
    })
  }
}

describe('Config', () => {
  beforeAll(() => {
    jest.setTimeout(30000)
  })
  it('passes validation', () => {
    for (const config in configs) {
      if (configs[config]) {
        const { fields } = configs[config]
        if (fields) {
          fields.forEach(field => new FieldValidator({ ...field, config: configs[config] }))
        }
      }
    }
  })

  services.forEach(group => {
    it(`All ${group.model.toUpperCase()} fields with maxlengths have their maxlen defined`, async () => {
      await compareFields(group, 'maxlen', 'maxLength')
    })
  })

})