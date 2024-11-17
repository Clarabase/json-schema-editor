export function exportToGQL(jsonSchema: any): string {
  const schema = JSON.parse(jsonSchema);
  const typeMappings: { [key: string]: string } = {
    string: "String",
    number: "Float",
    integer: "Int",
    boolean: "Boolean",
    object: "type",
    array: "List",
  };

  function convertType(jsonType: string): string {
    return typeMappings[jsonType] || "String";
  }

  function convertProperties(properties: any): string {
    return Object.entries(properties)
      .map(([key, value]: [string, any]) => {
        const gqlType =
          value.type === "array"
            ? `[${convertType(value.items.type)}]`
            : convertType(value.type);
        return `  ${key}: ${gqlType}`;
      })
      .join("\n");
  }

  const gqlSchema = `
type ${schema.title || "Resource"} {
${convertProperties(schema.properties)}
}
`;

  return gqlSchema;
}
