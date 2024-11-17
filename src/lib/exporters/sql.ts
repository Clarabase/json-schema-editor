export function exportToSQL(jsonSchema: any): string {
  const schema = JSON.parse(jsonSchema);
  const tableName = schema.title || "default_table_name";
  const requiredFields = new Set(schema.required || []);
  const enumStatements: string[] = [];
  const columns = Object.entries(schema.properties).map(
    ([key, value]: [string, any]) => {
      let columnType;
      if (value.enum) {
        const enumTypeName = `${tableName}_${key}_enum`;
        const enumValues = value.enum
          .map((val: string) => `'${val}'`)
          .join(", ");
        enumStatements.push(
          `CREATE TYPE ${enumTypeName} AS ENUM (${enumValues});`
        );
        columnType = enumTypeName;
      } else {
        switch (value.type) {
          case "string":
            columnType = "TEXT";
            break;
          case "integer":
            columnType = "INTEGER";
            break;
          case "number":
            columnType = "NUMERIC";
            break;
          case "boolean":
            columnType = "BOOLEAN";
            break;
          default:
            columnType = "TEXT";
        }
      }
      const notNull = requiredFields.has(key) ? " NOT NULL" : "";
      return `${key} ${columnType}${notNull}`;
    }
  );

  return `${enumStatements.join(
    "\n"
  )}\nCREATE TABLE ${tableName} (\n  ${columns.join(",\n  ")}\n);`;
}
