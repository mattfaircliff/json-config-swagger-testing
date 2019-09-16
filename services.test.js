import Enzyme from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
import https from 'https'

import * as configs from './config'

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
    name: 'Users',
    endpoint: "https://your-microservices-url/swagger/?format=openapi",
  }
]

const compareFields = async (localprop, remoteprop, service, swagger) => {
  if (swagger.definitions[service.name]) {
    const { properties } = swagger.definitions[service.name]
    const { fields } = configs[service.model]
    fields.forEach(field => {
      if (properties[field.name]) {
        expect(field[localprop]).toEqual(properties[field.name][remoteprop])
      }
    })
  }
}

const isRequired = async (service, swagger) => {
  if (swagger[service.name].required) {
    const { fields } = configs[service.model]
    fields.forEach(field => {
      if (field.required) {
        expect(swagger[service.name].required.includes(field.required)).toBe(true)
      }
    })
    swagger[service.name].required.forEach(field => {
      expect(fields[field.name].required).toBe(true)
    })
  }
}

const isPresent = async (service, swagger) => {
  if (swagger.definitions[definition]) {
    configs[service.model].forEach(field => {
      expect(swagger[service.name].properties.includes(field.name)).toBe(true)
    })
  }
}

describe('Config', () => {
  beforeAll(() => {
    jest.setTimeout(30000)
  })

  services.forEach(service => {
    const r = await request(service.endpoint)
    const swagger = JSON.parse(r)
    it(`fields types are equal`, async () => {
      await compareFields('type', 'type', service, swagger)
    })
    it(`fields with maxlengths have their maxlen defined`, async () => {
      await compareFields('maxlen', 'maxLength', service, swagger)
    })
    it(`fields are actually required`, async () => {
      await isRequired(service, swagger)
    })
    it(`fields exist in services`, async () => {
      await isPresent(service, swagger)
    })
  })

})