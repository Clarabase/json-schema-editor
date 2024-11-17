import { faker } from "@faker-js/faker";

export function seedSchema(schema: any, config = { count: 10 }) {
  const numItems = getCount(config.count);
  const items = [];
  for (let i = 0; i < numItems; i++) {
    items.push(generateValue(schema));
  }
  return items;
}

function getCount(c) {
  if (c < 0) {
    return 1;
  }
  if (c > 25) {
    return 25;
  }
  return c;
}

function generateObjectFromSchema(schema: any): any {
  const result: any = {};

  if (schema.type === "object" && schema.properties) {
    for (const [key, value] of Object.entries(schema.properties)) {
      if (schema.required && schema.required.includes(key)) {
        result[key] = generateValue(value as any);
      }
    }
  }

  return result;
}

function generateValue(schema: any): any {
  switch (schema.type) {
    case "string":
      return generateString(schema);
    case "number":
      return faker.number.int({
        min: schema.minimum || 0,
        max: schema.maximum || 100,
      });
    case "integer":
      return faker.number.int({
        min: schema.minimum || 1,
        max: schema.maximum || 1000,
      });
    case "boolean":
      return faker.datatype.boolean();
    case "array":
      return schema.items ? [generateValue(schema.items as any)] : [];
    case "object":
      return generateObjectFromSchema(schema);
    default:
      return null;
  }
}

function generateString(schema: any): string {
  if (schema.enum) {
    return (faker.helpers as any).arrayElement(schema.enum);
  }
  if (schema.format) {
    switch (schema.format) {
      case "email":
        return faker.internet.email();
      case "date-time":
        return faker.date.recent().toISOString();
      case "time":
        return faker.date.recent().toTimeString();
      case "date":
        return faker.date.recent().toDateString();
      case "duration":
        return "P3Y6M4DT12H30M5S";
      case "idn-email":
        return faker.internet.email();
      case "hostname":
        return faker.internet.domainName();
      case "idn-hostname":
        return faker.internet.domainName();
      case "ipv4":
        return faker.internet.ipv4();
      case "ipv6":
        return faker.internet.ipv6();
      case "uri":
        return faker.internet.url();
      case "uri-reference":
        return faker.internet.url();
      case "iri":
        return faker.internet.url();
      case "iri-reference":
        return faker.internet.url();
      case "uuid":
        return faker.string.uuid();
      case "json-pointer":
        return "/example/pointer";
      case "relative-json-pointer":
        return "0/example";
      case "regex":
        return "[a-zA-Z0-9]+";
      default:
        return faker.lorem.word();
    }
  }
  return faker.lorem.word();
}
