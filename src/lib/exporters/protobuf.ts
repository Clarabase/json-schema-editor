export function exportToProtobuf(jsonSchema: any): string {
  const schema = JSON.parse(jsonSchema);
  const messageName = schema.title || "MyMessage";
  let proto = `syntax = "proto3";\n\n`;

  proto += `message ${messageName} {\n`;
  let fieldNumber = 1;
  for (const [key, value] of Object.entries(schema.properties)) {
    const type = mapJsonTypeToProtoType((value as any).type);
    proto += `  ${type} ${key} = ${fieldNumber++};\n`;
  }
  proto += `}\n\n`;

  proto += `service ${messageName}Service {\n`;
  proto += `  rpc Get${messageName} (${messageName}) returns (${messageName});\n`;
  proto += `}\n`;

  return proto;
}

function mapJsonTypeToProtoType(jsonType: string): string {
  switch (jsonType) {
    case "string":
      return "string";
    case "number":
      return "double";
    case "integer":
      return "int32";
    case "boolean":
      return "bool";
    case "array":
      return "repeated";
    case "object":
      return "message";
    default:
      return "string";
  }
}
